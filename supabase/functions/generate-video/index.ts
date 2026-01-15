import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface RequestBody {
  shareLink: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let userId: string | null = null;

    // Check for API key auth first
    const apiKey = req.headers.get('x-api-key');
    
    if (apiKey) {
      // API key authentication
      console.log('Authenticating with API key');
      
      const { data: userIdData, error: apiKeyError } = await supabase.rpc(
        'get_user_by_api_key',
        { _api_key: apiKey }
      );

      if (apiKeyError || !userIdData) {
        console.error('Invalid API key:', apiKeyError);
        return new Response(
          JSON.stringify({ status: 'error', message: 'Invalid API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = userIdData;
    } else {
      // JWT authentication
      const authHeader = req.headers.get('Authorization');
      
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ status: 'error', message: 'Unauthorized - No valid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: claimsData, error: claimsError } = await userSupabase.auth.getUser(token);
      
      if (claimsError || !claimsData?.user) {
        console.error('JWT validation failed:', claimsError);
        return new Response(
          JSON.stringify({ status: 'error', message: 'Unauthorized - Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = claimsData.user.id;
    }

    console.log('Authenticated user:', userId);

    // Parse request body
    const body: RequestBody = await req.json();
    const { shareLink } = body;

    if (!shareLink || typeof shareLink !== 'string') {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Invalid or missing shareLink' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL format
    try {
      const url = new URL(shareLink);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Invalid URL format. Please enter a valid Sora video link.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile and check coins
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('coins, total_processed')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ status: 'error', message: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profile.coins < 2) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Insufficient coins. You need at least 2 coins.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit (100 requests per day)
    const today = new Date().toISOString().split('T')[0];
    
    const { data: usageData } = await supabase
      .from('api_usage')
      .select('request_count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (usageData && usageData.request_count >= 100) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Daily rate limit exceeded (100 requests)' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling external API for video processing');

    // Call the scraping API
    const apiResponse = await fetch('https://online.fliflik.com/get-video-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: shareLink }),
    });

    const apiData = await apiResponse.json();
    console.log('API Response:', JSON.stringify(apiData));

    const videoLink = apiData.data || apiData.video_link;
    const errorMessage = apiData.msg || apiData.message || 'Failed to process video';
    const isClientError = errorMessage.toLowerCase().includes('invalid') || 
                          errorMessage.toLowerCase().includes('not found') ||
                          apiData.code === 400;
    
    if (!apiResponse.ok || apiData.code !== 200 || !videoLink) {
      // Insert failed history entry
      await supabase.from('video_history').insert({
        user_id: userId,
        original_url: shareLink,
        status: 'error',
      });

      return new Response(
        JSON.stringify({ 
          status: 'error', 
          message: errorMessage
        }),
        { status: isClientError ? 400 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduct coins and update processed count
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        coins: profile.coins - 2,
        total_processed: (profile.total_processed || 0) + 1,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update profile:', updateError);
    }

    // Insert history entry
    const { data: historyEntry, error: historyError } = await supabase
      .from('video_history')
      .insert({
        user_id: userId,
        original_url: shareLink,
        processed_url: videoLink,
        status: 'success',
      })
      .select('id')
      .single();

    if (historyError) {
      console.error('Failed to insert history:', historyError);
    }

    // Update API usage
    if (usageData) {
      await supabase
        .from('api_usage')
        .update({ request_count: usageData.request_count + 1 })
        .eq('user_id', userId)
        .eq('date', today);
    } else {
      await supabase
        .from('api_usage')
        .insert({ user_id: userId, date: today, request_count: 1 });
    }

    console.log('Video processed successfully');

    return new Response(
      JSON.stringify({
        status: 'success',
        video_link: videoLink,
        coins_remaining: profile.coins - 2,
        history_id: historyEntry?.id || null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ status: 'error', message: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

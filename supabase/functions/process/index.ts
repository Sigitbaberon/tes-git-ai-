import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface RequestBody {
  action: string;
  data: Record<string, any>;
}

interface EndpointConfig {
  external_api: string;
  method?: string;
  request_body_mapping?: Record<string, string>; // maps our field names to external API field names
  response_path?: string; // dot notation path to extract result (e.g., "data" or "transcript")
  is_array_mapping?: boolean; // if true, result is array and needs joining
  mapping_key?: string; // field to extract from each array item (e.g., "text")
  join_separator?: string; // separator for joining array items (default: " ")
}

interface ActionConfig {
  action_key: string;
  name: string;
  coin_cost: number;
  endpoint_config: EndpointConfig;
}

// Helper: Get nested value from object using dot notation
function getNestedValue(obj: any, path: string): any {
  if (!path) return obj;
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

// Helper: Build request body from mapping
function buildRequestBody(data: Record<string, any>, mapping?: Record<string, string>): Record<string, any> {
  if (!mapping) {
    // Default: pass data as-is
    return data;
  }
  
  const result: Record<string, any> = {};
  for (const [externalKey, ourKey] of Object.entries(mapping)) {
    if (data[ourKey] !== undefined) {
      result[externalKey] = data[ourKey];
    }
  }
  return result;
}

// Helper: Parse response based on config
function parseResponse(apiData: any, config: EndpointConfig): any {
  // Extract data from response_path
  let extracted = config.response_path 
    ? getNestedValue(apiData, config.response_path) 
    : apiData;
  
  // If array mapping is enabled, join the array items
  if (config.is_array_mapping && Array.isArray(extracted)) {
    const key = config.mapping_key || 'text';
    const separator = config.join_separator ?? ' ';
    return extracted.map((item: any) => item[key] ?? '').join(separator);
  }
  
  return extracted;
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
    const { action, data } = body;

    if (!action || typeof action !== 'string') {
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          message: 'Missing or invalid "action" parameter. Please specify which action to perform.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get action configuration from database
    const { data: actionConfig, error: actionError } = await supabase
      .from('api_actions')
      .select('action_key, name, coin_cost, endpoint_config')
      .eq('action_key', action)
      .eq('is_active', true)
      .maybeSingle();

    if (actionError || !actionConfig) {
      console.error('Action not found or inactive:', action, actionError);
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          message: `Action "${action}" not found or is currently disabled.` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = actionConfig as ActionConfig;
    console.log('Processing action:', config.action_key, 'Cost:', config.coin_cost);

    // Validate endpoint_config exists
    if (!config.endpoint_config?.external_api) {
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          message: `Action "${action}" is missing endpoint configuration.` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    if (profile.coins < config.coin_cost) {
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          message: `Insufficient coins. You need at least ${config.coin_cost} coins for this action.`,
          coins_required: config.coin_cost,
          coins_available: profile.coins
        }),
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

    // ========== UNIVERSAL API CALL ==========
    
    // Build request body using mapping config
    const requestBody = buildRequestBody(data || {}, config.endpoint_config.request_body_mapping);
    
    console.log('Calling external API:', config.endpoint_config.external_api);
    console.log('Request body:', JSON.stringify(requestBody));

    // Call the external API
    const apiResponse = await fetch(config.endpoint_config.external_api, {
      method: config.endpoint_config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const apiData = await apiResponse.json();
    console.log('API Response status:', apiResponse.status);
    console.log('API Response:', JSON.stringify(apiData));

    // Check for API errors
    if (!apiResponse.ok) {
      const errorMessage = apiData.message || apiData.msg || apiData.error || 'External API request failed';
      console.error('External API error:', errorMessage);
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          action: config.action_key,
          message: errorMessage 
        }),
        { status: apiResponse.status >= 400 && apiResponse.status < 500 ? 400 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse response using config
    const parsedResult = parseResponse(apiData, config.endpoint_config);

    // Check if result is valid
    if (parsedResult === null || parsedResult === undefined) {
      console.error('Failed to parse result from API response');
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          action: config.action_key,
          message: 'Failed to parse result from external API response.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== SUCCESS: Update user data ==========

    // Deduct coins and update processed count
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        coins: profile.coins - config.coin_cost,
        total_processed: (profile.total_processed || 0) + 1,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update profile:', updateError);
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

    console.log('Action processed successfully:', config.action_key);

    // ========== STANDARDIZED RESPONSE ==========
    return new Response(
      JSON.stringify({
        status: 'success',
        action: config.action_key,
        coins_used: config.coin_cost,
        result: parsedResult,
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

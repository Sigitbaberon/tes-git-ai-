import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate user token
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email as string;

    // Parse request body
    const { package_id } = await req.json();
    
    if (!package_id) {
      return new Response(
        JSON.stringify({ error: 'package_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get package details
    const { data: packageData, error: packageError } = await supabase
      .from('coin_packages')
      .select('*')
      .eq('id', package_id)
      .eq('is_active', true)
      .maybeSingle();

    if (packageError || !packageData) {
      return new Response(
        JSON.stringify({ error: 'Package not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Midtrans server key from database (use service role for admin-only settings)
    const supabaseServiceRole = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: settingsData, error: settingsError } = await supabaseServiceRole
      .from('payment_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['midtrans_server_key', 'midtrans_mode']);

    if (settingsError || !settingsData || settingsData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Payment settings not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const settingsMap: Record<string, string> = {};
    settingsData.forEach((s) => {
      settingsMap[s.setting_key] = s.setting_value;
    });

    const serverKey = settingsMap['midtrans_server_key'];
    const mode = settingsMap['midtrans_mode'] || 'sandbox';

    if (!serverKey) {
      return new Response(
        JSON.stringify({ error: 'Midtrans server key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique order ID
    const orderId = `COIN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create transaction record
    const { error: txError } = await supabase
      .from('coin_transactions')
      .insert({
        user_id: userId,
        package_id: package_id,
        order_id: orderId,
        amount: packageData.price,
        coin_amount: packageData.coin_amount,
        status: 'pending',
      });

    if (txError) {
      console.error('Failed to create transaction record:', txError);
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare Midtrans API request
    const midtransUrl = mode === 'production'
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const midtransPayload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: packageData.price,
      },
      customer_details: {
        email: userEmail,
      },
      item_details: [
        {
          id: packageData.id,
          price: packageData.price,
          quantity: 1,
          name: packageData.name,
        },
      ],
      callbacks: {
        finish: `${req.headers.get('origin') || ''}/buy-coins?status=finish`,
        error: `${req.headers.get('origin') || ''}/buy-coins?status=error`,
        pending: `${req.headers.get('origin') || ''}/buy-coins?status=pending`,
      },
    };

    // Create Snap token
    const authString = btoa(serverKey + ':');
    const midtransResponse = await fetch(midtransUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
      body: JSON.stringify(midtransPayload),
    });

    const midtransResult = await midtransResponse.json();

    if (!midtransResponse.ok || !midtransResult.token) {
      console.error('Midtrans error:', midtransResult);
      
      // Update transaction status to failed
      await supabase
        .from('coin_transactions')
        .update({ status: 'failed' })
        .eq('order_id', orderId);

      return new Response(
        JSON.stringify({ 
          error: 'Failed to create payment', 
          details: midtransResult.error_messages || midtransResult 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        token: midtransResult.token,
        redirect_url: midtransResult.redirect_url,
        order_id: orderId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

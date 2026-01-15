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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get server key from database
    const { data: settingsData } = await supabase
      .from('payment_settings')
      .select('setting_value')
      .eq('setting_key', 'midtrans_server_key')
      .maybeSingle();

    const serverKey = settingsData?.setting_value;
    if (!serverKey) {
      console.error('Server key not configured');
      return new Response(
        JSON.stringify({ error: 'Server key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify signature from Midtrans
    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body));

    const {
      order_id,
      transaction_status,
      fraud_status,
      transaction_id,
      payment_type,
      signature_key,
      status_code,
      gross_amount,
    } = body;

    // Verify signature
    const crypto = await import("https://deno.land/std@0.168.0/crypto/mod.ts");
    const encoder = new TextEncoder();
    const data = encoder.encode(order_id + status_code + gross_amount + serverKey);
    const hashBuffer = await crypto.crypto.subtle.digest("SHA-512", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (signature_key !== expectedSignature) {
      console.error('Invalid signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get transaction from database
    const { data: transaction, error: txError } = await supabase
      .from('coin_transactions')
      .select('*, coin_packages(*)')
      .eq('order_id', order_id)
      .maybeSingle();

    if (txError || !transaction) {
      console.error('Transaction not found:', order_id);
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine transaction status
    let newStatus = 'pending';
    let shouldAddCoins = false;

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'accept' || !fraud_status) {
        newStatus = 'success';
        shouldAddCoins = transaction.status !== 'success'; // Only add if not already added
      } else {
        newStatus = 'fraud';
      }
    } else if (transaction_status === 'pending') {
      newStatus = 'pending';
    } else if (['deny', 'cancel', 'expire', 'failure'].includes(transaction_status)) {
      newStatus = 'failed';
    }

    // Update transaction
    const { error: updateError } = await supabase
      .from('coin_transactions')
      .update({
        status: newStatus,
        midtrans_transaction_id: transaction_id,
        payment_type: payment_type,
      })
      .eq('order_id', order_id);

    if (updateError) {
      console.error('Failed to update transaction:', updateError);
    }

    // Add coins to user if payment successful
    if (shouldAddCoins) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', transaction.user_id)
        .maybeSingle();

      if (profile) {
        const newCoins = (profile.coins || 0) + transaction.coin_amount;
        await supabase
          .from('profiles')
          .update({ coins: newCoins })
          .eq('id', transaction.user_id);
        
        console.log(`Added ${transaction.coin_amount} coins to user ${transaction.user_id}. New balance: ${newCoins}`);
      }
    }

    return new Response(
      JSON.stringify({ status: 'ok' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

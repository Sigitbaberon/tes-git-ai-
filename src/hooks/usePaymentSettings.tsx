import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentSettings {
  serverKey: string;
  clientKey: string;
  mode: 'sandbox' | 'production';
}

export function usePaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_settings')
      .select('setting_key, setting_value');
    
    if (error || !data) {
      setLoading(false);
      return;
    }

    const settingsMap: Record<string, string> = {};
    data.forEach((item) => {
      settingsMap[item.setting_key] = item.setting_value;
    });

    setSettings({
      serverKey: settingsMap['midtrans_server_key'] || '',
      clientKey: settingsMap['midtrans_client_key'] || '',
      mode: (settingsMap['midtrans_mode'] as 'sandbox' | 'production') || 'sandbox',
    });
    setLoading(false);
  };

  const getSnapUrl = () => {
    if (!settings) return '';
    return settings.mode === 'production'
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
  };

  return {
    settings,
    loading,
    refetch: fetchSettings,
    getSnapUrl,
  };
}

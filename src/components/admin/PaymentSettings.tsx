import { useState, useEffect } from 'react';
import { 
  Save, 
  Loader2,
  Eye,
  EyeOff,
  CreditCard,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PaymentSetting {
  id: string;
  setting_key: string;
  setting_value: string;
}

export function PaymentSettings() {
  const [settings, setSettings] = useState<PaymentSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showServerKey, setShowServerKey] = useState(false);
  const [showClientKey, setShowClientKey] = useState(false);
  
  const [serverKey, setServerKey] = useState('');
  const [clientKey, setClientKey] = useState('');
  const [mode, setMode] = useState('sandbox');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_settings')
      .select('*');
    
    if (error) {
      toast.error('Failed to load settings');
      setLoading(false);
      return;
    }

    if (data) {
      setSettings(data);
      data.forEach((setting) => {
        if (setting.setting_key === 'midtrans_server_key') {
          setServerKey(setting.setting_value);
        } else if (setting.setting_key === 'midtrans_client_key') {
          setClientKey(setting.setting_value);
        } else if (setting.setting_key === 'midtrans_mode') {
          setMode(setting.setting_value);
        }
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = [
        { key: 'midtrans_server_key', value: serverKey },
        { key: 'midtrans_client_key', value: clientKey },
        { key: 'midtrans_mode', value: mode },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('payment_settings')
          .update({ setting_value: update.value })
          .eq('setting_key', update.key);
        
        if (error) throw error;
      }

      toast.success('Payment settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Midtrans Payment Settings
        </CardTitle>
        <CardDescription>
          Configure your Midtrans API keys and payment mode
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="server_key">Server Key</Label>
          <div className="relative">
            <Input
              id="server_key"
              type={showServerKey ? 'text' : 'password'}
              placeholder="SB-Mid-server-xxxxx atau Mid-server-xxxxx"
              value={serverKey}
              onChange={(e) => setServerKey(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setShowServerKey(!showServerKey)}
            >
              {showServerKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Server key digunakan untuk membuat transaksi di backend
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_key">Client Key</Label>
          <div className="relative">
            <Input
              id="client_key"
              type={showClientKey ? 'text' : 'password'}
              placeholder="SB-Mid-client-xxxxx atau Mid-client-xxxxx"
              value={clientKey}
              onChange={(e) => setClientKey(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setShowClientKey(!showClientKey)}
            >
              {showClientKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Client key digunakan untuk Snap.js di frontend
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mode">Mode</Label>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
              <SelectItem value="production">Production (Live)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Gunakan Sandbox untuk testing, Production untuk transaksi nyata
          </p>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

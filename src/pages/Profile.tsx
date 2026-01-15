import { useState } from 'react';
import { User, Mail, Calendar, Coins, Video, Save, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!username.trim() || username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', profile?.id);

      if (error) {
        if (error.message.includes('duplicate')) {
          toast.error('Username already taken');
        } else {
          throw error;
        }
      } else {
        await refreshProfile();
        toast.success('Profile updated successfully');
      }
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-3xl animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings
          </p>
        </div>

        {/* Profile Card */}
        <div className="card-elevated p-6">
          <div className="flex items-center gap-5 mb-6 pb-6 border-b border-border">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {profile?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{profile?.username}</h2>
              <p className="text-muted-foreground">{profile?.email}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Username
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email
              </label>
              <Input
                value={profile?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card text-center">
            <div className="stat-icon bg-warning/10 mx-auto mb-3">
              <Coins className="w-5 h-5 text-warning" />
            </div>
            <p className="text-2xl font-bold">{profile?.coins || 0}</p>
            <p className="text-sm text-muted-foreground">Coins Balance</p>
          </div>

          <div className="stat-card text-center">
            <div className="stat-icon bg-primary/10 mx-auto mb-3">
              <Video className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{profile?.total_processed || 0}</p>
            <p className="text-sm text-muted-foreground">Videos Processed</p>
          </div>

          <div className="stat-card text-center">
            <div className="stat-icon bg-success/10 mx-auto mb-3">
              <Calendar className="w-5 h-5 text-success" />
            </div>
            <p className="text-2xl font-bold">
              {profile?.created_at 
                ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : '-'}
            </p>
            <p className="text-sm text-muted-foreground">Member Since</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

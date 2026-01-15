import { useState, useEffect } from 'react';
import { 
  Users, 
  Video, 
  Coins, 
  RefreshCw, 
  Loader2,
  Search,
  ChevronDown,
  Save,
  Settings,
  CreditCard
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActionManagement } from '@/components/admin/ActionManagement';
import { PaymentSettings } from '@/components/admin/PaymentSettings';
import { CoinPackageManagement } from '@/components/admin/CoinPackageManagement';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  coins: number;
  total_processed: number;
  created_at: string;
}

interface VideoHistory {
  id: string;
  user_id: string;
  original_url: string;
  processed_url: string | null;
  status: string;
  created_at: string;
  profiles?: { username: string; email: string } | null;
}

export default function Admin() {
  const { isAdmin, loading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [history, setHistory] = useState<VideoHistory[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editCoins, setEditCoins] = useState<number>(0);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoadingData(true);
    
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersData) {
      setUsers(usersData as UserProfile[]);
    }

    const { data: historyData } = await supabase
      .from('video_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (historyData) {
      const historyWithProfiles = await Promise.all(
        historyData.map(async (item) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, email')
            .eq('id', item.user_id)
            .maybeSingle();
          return { ...item, profiles: profileData };
        })
      );
      setHistory(historyWithProfiles as VideoHistory[]);
    }

    setLoadingData(false);
  };

  const updateUserCoins = async (userId: string, coins: number) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ coins })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, coins } : u));
      setEditingUser(null);
      toast.success('Coins updated');
    } catch (err) {
      toast.error('Failed to update coins');
    }
  };

  const resetProcessedCount = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ total_processed: 0 })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, total_processed: 0 } : u));
      toast.success('Processed count reset');
    } catch (err) {
      toast.error('Failed to reset count');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCoins = users.reduce((acc, u) => acc + u.coins, 0);
  const totalProcessed = users.reduce((acc, u) => acc + u.total_processed, 0);

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground mt-1">
              Manage users, actions, and monitor activity
            </p>
          </div>
          <Button onClick={fetchData} variant="outline" disabled={loadingData}>
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-icon bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-icon bg-warning/10">
                <Coins className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Coins</p>
                <p className="text-2xl font-bold">{totalCoins}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-icon bg-success/10">
                <Video className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Videos Processed</p>
                <p className="text-2xl font-bold">{totalProcessed}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-icon bg-muted">
                <Video className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">History Items</p>
                <p className="text-2xl font-bold">{history.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              API Actions
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="section-header mb-0">
                  <div className="section-icon bg-primary/10">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Users</h2>
                    <p className="text-sm text-muted-foreground">Manage user accounts</p>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-60"
                  />
                </div>
              </div>

              {loadingData ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Coins</TableHead>
                      <TableHead>Processed</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          {editingUser === user.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={editCoins}
                                onChange={(e) => setEditCoins(parseInt(e.target.value) || 0)}
                                className="w-20 h-8"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateUserCoins(user.id, editCoins)}
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="coin-badge">{user.coins}</span>
                          )}
                        </TableCell>
                        <TableCell>{user.total_processed}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions <ChevronDown className="w-4 h-4 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingUser(user.id);
                                  setEditCoins(user.coins);
                                }}
                              >
                                Edit Coins
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => resetProcessedCount(user.id)}
                              >
                                Reset Processed Count
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* API Actions Tab */}
          <TabsContent value="actions">
            <div className="card-elevated p-6">
              <ActionManagement />
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <div className="space-y-6">
              <PaymentSettings />
              <CoinPackageManagement />
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <div className="card-elevated p-6">
              <div className="section-header">
                <div className="section-icon bg-success/10">
                  <Video className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Recent Activity</h2>
                  <p className="text-sm text-muted-foreground">Latest video processing activity</p>
                </div>
              </div>

              {loadingData ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Original URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.slice(0, 20).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.profiles?.username || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {item.original_url}
                        </TableCell>
                        <TableCell>
                          <span className={`status-${item.status}`}>
                            {item.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(item.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

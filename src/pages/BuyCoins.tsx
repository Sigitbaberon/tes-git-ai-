import { useState, useEffect, useCallback } from 'react';
import { Coins, Loader2, Package, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useCoinPackages, CoinPackage } from '@/hooks/useCoinPackages';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

declare global {
  interface Window {
    snap: {
      pay: (token: string, options: {
        onSuccess: (result: any) => void;
        onPending: (result: any) => void;
        onError: (result: any) => void;
        onClose: () => void;
      }) => void;
    };
  }
}

interface Transaction {
  id: string;
  order_id: string;
  amount: number;
  coin_amount: number;
  status: string;
  created_at: string;
  coin_packages: {
    name: string;
  } | null;
}

export default function BuyCoins() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { packages, loading: packagesLoading } = useCoinPackages();
  const { settings, loading: settingsLoading, getSnapUrl } = usePaymentSettings();
  const [searchParams] = useSearchParams();
  
  const [processingPackage, setProcessingPackage] = useState<string | null>(null);
  const [snapLoaded, setSnapLoaded] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  // Load Snap.js dynamically based on mode
  useEffect(() => {
    if (!settings || !settings.clientKey) return;

    const snapUrl = getSnapUrl();
    const existingScript = document.querySelector(`script[src*="snap.js"]`);
    
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.src = snapUrl;
    script.setAttribute('data-client-key', settings.clientKey);
    script.onload = () => {
      setSnapLoaded(true);
    };
    script.onerror = () => {
      toast.error('Failed to load payment system');
    };
    document.body.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector(`script[src*="snap.js"]`);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [settings, getSnapUrl]);

  // Handle payment status from URL
  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'finish') {
      toast.success('Pembayaran berhasil! Koin akan ditambahkan ke akun Anda.');
      refreshProfile();
    } else if (status === 'pending') {
      toast.info('Pembayaran masih pending. Silakan selesaikan pembayaran.');
    } else if (status === 'error') {
      toast.error('Pembayaran gagal. Silakan coba lagi.');
    }
  }, [searchParams, refreshProfile]);

  // Fetch transaction history
  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    
    setLoadingTransactions(true);
    const { data, error } = await supabase
      .from('coin_transactions')
      .select('*, coin_packages(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setTransactions(data as Transaction[]);
    }
    setLoadingTransactions(false);
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleBuyPackage = async (pkg: CoinPackage) => {
    if (!user || !snapLoaded) {
      toast.error('Payment system not ready');
      return;
    }

    setProcessingPackage(pkg.id);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        toast.error('Please login to continue');
        return;
      }

      const response = await supabase.functions.invoke('create-midtrans-transaction', {
        body: { package_id: pkg.id },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create transaction');
      }

      const { token: snapToken, order_id } = response.data;

      if (!snapToken) {
        throw new Error('No payment token received');
      }

      // Open Snap popup
      window.snap.pay(snapToken, {
        onSuccess: (result) => {
          console.log('Payment success:', result);
          toast.success('Pembayaran berhasil!');
          refreshProfile();
          fetchTransactions();
        },
        onPending: (result) => {
          console.log('Payment pending:', result);
          toast.info('Pembayaran pending. Silakan selesaikan pembayaran.');
          fetchTransactions();
        },
        onError: (result) => {
          console.log('Payment error:', result);
          toast.error('Pembayaran gagal');
          fetchTransactions();
        },
        onClose: () => {
          console.log('Snap popup closed');
          fetchTransactions();
        },
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setProcessingPackage(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Success</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'failed':
      case 'fraud':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || packagesLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isPaymentConfigured = settings?.clientKey && settings?.serverKey;

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Buy Coins</h1>
            <p className="text-muted-foreground mt-1">
              Purchase coins to use our API services
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="coin-badge text-lg">
              <Coins className="w-5 h-5 mr-1" />
              {profile?.coins || 0} Coins
            </div>
          </div>
        </div>

        {/* Warning if not configured */}
        {!isPaymentConfigured && (
          <Card className="border-warning bg-warning/10">
            <CardContent className="py-4">
              <p className="text-warning-foreground">
                Payment system is not configured. Please contact administrator.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Coin Packages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  {pkg.name}
                </CardTitle>
                {pkg.description && (
                  <CardDescription>{pkg.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="coin-badge text-2xl inline-flex">
                    <Coins className="w-6 h-6 mr-2" />
                    {pkg.coin_amount}
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(pkg.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(Math.round(pkg.price / pkg.coin_amount))} per coin
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleBuyPackage(pkg)}
                  disabled={!isPaymentConfigured || !snapLoaded || processingPackage === pkg.id}
                >
                  {processingPackage === pkg.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Buy Now'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {packages.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No coin packages available at the moment.
            </CardContent>
          </Card>
        )}

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Your recent coin purchases</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchTransactions}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingTransactions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No transactions yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Coins</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-xs">{tx.order_id}</TableCell>
                      <TableCell>{tx.coin_packages?.name || '-'}</TableCell>
                      <TableCell>
                        <span className="coin-badge">{tx.coin_amount}</span>
                      </TableCell>
                      <TableCell>{formatPrice(tx.amount)}</TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

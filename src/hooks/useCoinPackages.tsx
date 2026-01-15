import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CoinPackage {
  id: string;
  name: string;
  coin_amount: number;
  price: number;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

export function useCoinPackages() {
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coin_packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (error) {
      setLoading(false);
      return;
    }

    setPackages(data || []);
    setLoading(false);
  };

  return {
    packages,
    loading,
    refetch: fetchPackages,
  };
}

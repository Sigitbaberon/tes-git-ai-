import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface InputField {
  name: string;
  label: string;
  type: 'text' | 'url' | 'textarea' | 'number' | 'email';
  placeholder?: string;
  required?: boolean;
}

export interface ApiAction {
  id: string;
  action_key: string;
  name: string;
  description: string | null;
  coin_cost: number;
  is_active: boolean;
  category: string | null;
  endpoint_config: Record<string, any>;
  input_schema: InputField[] | null;
  created_at: string;
  updated_at: string;
}

export function useApiActions(includeInactive = false) {
  const [actions, setActions] = useState<ApiAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('api_actions')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      // Transform the data to match ApiAction type
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        input_schema: Array.isArray(item.input_schema) ? item.input_schema : null,
      }));
      setActions(transformedData as ApiAction[]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [includeInactive]);

  return { actions, loading, error, refetch: fetchActions };
}

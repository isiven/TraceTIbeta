import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface PlatformAdmin {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: 'super_admin' | 'support_admin' | 'billing_admin' | 'readonly_admin';
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  invited_by: string | null;
}

export const usePlatformAdmins = () => {
  const [admins, setAdmins] = useState<PlatformAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdmins = async () => {
    try {
      setLoading(true);

      const { data, error: adminsError } = await supabase
        .from('platform_admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (adminsError) throw adminsError;

      setAdmins(data || []);
    } catch (err) {
      console.error('Error fetching platform admins:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  return { admins, loading, error, refetch: fetchAdmins };
};

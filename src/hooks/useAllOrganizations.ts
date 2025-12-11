import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Organization {
  id: string;
  name: string;
  account_type: 'integrator' | 'end_user';
  subscription_plan: string;
  subscription_status: string;
  max_users: number;
  max_assets: number;
  created_at: string;
  updated_at: string;
  owner_id: string;
  owner?: {
    id: string;
    email: string;
    full_name: string | null;
  };
  users_count?: number;
  assets_count?: number;
}

export const useAllOrganizations = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);

      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select(`
          *,
          owner:profiles!organizations_owner_id_fkey(id, email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      const orgsWithCounts = await Promise.all(
        (orgsData || []).map(async (org) => {
          const { count: usersCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id);

          const { count: licensesCount } = await supabase
            .from('licenses')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id);

          const { count: hardwareCount } = await supabase
            .from('hardware')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id);

          const { count: contractsCount } = await supabase
            .from('contracts')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id);

          return {
            ...org,
            users_count: usersCount || 0,
            assets_count: (licensesCount || 0) + (hardwareCount || 0) + (contractsCount || 0)
          };
        })
      );

      setOrganizations(orgsWithCounts);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  return { organizations, loading, error, refetch: fetchOrganizations };
};

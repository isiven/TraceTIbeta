import { useState, useEffect } from 'react';
import { superAdminApi } from '../lib/superAdminApi';

interface Organization {
  id: string;
  name: string;
  account_type?: 'integrator' | 'end_user';
  subscription_plan: string;
  subscription_status: string;
  max_users: number;
  max_assets?: number;
  max_items?: number;
  current_users?: number;
  current_items?: number;
  mrr?: number;
  health_score?: number;
  last_activity_at?: string;
  created_at: string;
  updated_at: string;
  owner_id?: string;
  owner_email?: string;
  billing_email?: string;
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

      const result = await superAdminApi.listOrganizations({ limit: 100 });

      const mappedOrgs = result.organizations.map(org => ({
        ...org,
        users_count: org.current_users || 0,
        assets_count: org.current_items || 0,
        max_assets: org.max_items || 0,
      }));

      setOrganizations(mappedOrgs);
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

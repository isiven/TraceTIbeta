import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  scope: string;
  department: string | null;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  organization_id: string;
  organization?: {
    id: string;
    name: string;
    account_type: string;
    subscription_plan: string;
  };
}

export const useAllUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          *,
          organization:organizations(id, name, account_type, subscription_plan)
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      setUsers(usersData || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, refetch: fetchUsers };
};

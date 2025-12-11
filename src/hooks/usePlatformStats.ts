import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface PlatformStats {
  totalOrganizations: number;
  totalUsers: number;
  mrr: number;
  arr: number;
  paidOrganizations: number;
  freeOrganizations: number;
  trialOrganizations: number;
  activeSubscriptions: number;
  avgRevenuePerUser: number;
  churnRate: number;
}

export const usePlatformStats = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const { data: statsData, error: statsError } = await supabase
          .from('platform_stats')
          .select('*')
          .single();

        if (statsError) throw statsError;

        const mrr = Number(statsData.mrr) || 0;
        const arr = mrr * 12;
        const avgRevenuePerUser = statsData.total_users > 0
          ? mrr / statsData.total_users
          : 0;

        setStats({
          totalOrganizations: statsData.total_organizations || 0,
          totalUsers: statsData.total_users || 0,
          mrr,
          arr,
          paidOrganizations: statsData.paid_organizations || 0,
          freeOrganizations: statsData.free_organizations || 0,
          trialOrganizations: statsData.trial_organizations || 0,
          activeSubscriptions: statsData.paid_organizations || 0,
          avgRevenuePerUser,
          churnRate: 2.1
        });
      } catch (err) {
        console.error('Error fetching platform stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};

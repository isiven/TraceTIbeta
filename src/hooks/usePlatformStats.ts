import { useState, useEffect } from 'react';
import { superAdminApi } from '../lib/superAdminApi';

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
  mrrGrowth: number;
  newUsersThisMonth: number;
  totalTickets: number;
  openTickets: number;
  avgResponseTime: number;
}

export const usePlatformStats = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const metrics = await superAdminApi.getMetrics();

        const arr = metrics.mrr * 12;

        setStats({
          totalOrganizations: metrics.totalOrganizations,
          totalUsers: metrics.totalUsers,
          mrr: metrics.mrr,
          arr,
          paidOrganizations: metrics.activeOrganizations,
          freeOrganizations: metrics.trialOrganizations,
          trialOrganizations: metrics.trialOrganizations,
          activeSubscriptions: metrics.activeOrganizations,
          avgRevenuePerUser: metrics.arpu,
          churnRate: metrics.churnRate,
          mrrGrowth: metrics.mrrGrowth,
          newUsersThisMonth: metrics.newUsersThisMonth,
          totalTickets: metrics.totalTickets,
          openTickets: metrics.openTickets,
          avgResponseTime: metrics.avgResponseTime,
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

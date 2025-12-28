import React from 'react';
import { Building2, Users, DollarSign, CreditCard, MessageCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { AdminMetricCard } from '../../components/admin/AdminMetricCard';
import { AdminCard } from '../../components/admin/AdminCard';
import { PlanBadge } from '../../components/admin/PlanBadge';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { usePlatformStats } from '../../hooks/usePlatformStats';
import { useAllOrganizations } from '../../hooks/useAllOrganizations';
import { usePlatformActivity } from '../../hooks/usePlatformActivity';
import { format } from 'date-fns';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy');
  } catch {
    return dateString;
  }
};

const formatDateTime = (dateString: string) => {
  try {
    return format(new Date(dateString), 'MMM dd, HH:mm');
  } catch {
    return dateString;
  }
};

export const AdminDashboardPage: React.FC = () => {
  const { stats, loading: statsLoading } = usePlatformStats();
  const { organizations, loading: orgsLoading } = useAllOrganizations();
  const { activities, loading: activityLoading } = usePlatformActivity(20);

  const recentOrgs = organizations.slice(0, 5);

  const planDistribution = React.useMemo(() => {
    const counts = { free: 0, pro: 0, enterprise: 0 };
    organizations.forEach(org => {
      if (org.subscription_plan in counts) {
        counts[org.subscription_plan as keyof typeof counts]++;
      }
    });
    return counts;
  }, [organizations]);

  const accountTypeDistribution = React.useMemo(() => {
    const counts = { integrator: 0, end_user: 0 };
    organizations.forEach(org => {
      counts[org.account_type]++;
    });
    return counts;
  }, [organizations]);

  if (statsLoading || orgsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your TraceTI SaaS platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminMetricCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(stats?.mrr || 0)}
          change="+15% vs last month"
          icon={DollarSign}
          iconColor="bg-emerald-500"
          trend="up"
        />
        <AdminMetricCard
          title="Active Organizations"
          value={stats?.activeSubscriptions || 0}
          subtitle={`${stats?.trialOrganizations || 0} trials`}
          icon={Building2}
          iconColor="bg-blue-500"
        />
        <AdminMetricCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          subtitle={`${stats?.newUsersThisMonth || 0} new this month`}
          icon={Users}
          iconColor="bg-purple-500"
        />
        <AdminMetricCard
          title="Open Support Tickets"
          value={stats?.openTickets || 0}
          subtitle={`${stats?.totalTickets || 0} total tickets`}
          icon={MessageCircle}
          iconColor="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AdminCard title="By Plan" className="lg:col-span-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-sm font-medium">Free</span>
              </div>
              <span className="text-lg font-bold">{planDistribution.free}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium">Pro</span>
              </div>
              <span className="text-lg font-bold">{planDistribution.pro}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-sm font-medium">Enterprise</span>
              </div>
              <span className="text-lg font-bold">{planDistribution.enterprise}</span>
            </div>
          </div>
        </AdminCard>

        <AdminCard title="By Account Type" className="lg:col-span-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium">Integrators</span>
              </div>
              <span className="text-lg font-bold">{accountTypeDistribution.integrator}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm font-medium">End Users</span>
              </div>
              <span className="text-lg font-bold">{accountTypeDistribution.end_user}</span>
            </div>
          </div>
        </AdminCard>

        <AdminCard title="Revenue Metrics" className="lg:col-span-1">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Monthly Recurring Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.mrr || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Annual Recurring Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.arr || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Revenue per User</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.avgRevenuePerUser || 0)}</p>
            </div>
          </div>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminCard title="Recent Signups">
          <div className="space-y-4">
            {recentOrgs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No organizations yet</p>
            ) : (
              recentOrgs.map((org) => (
                <div key={org.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{org.name}</p>
                    <p className="text-sm text-gray-500">{org.owner?.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <PlanBadge plan={org.subscription_plan as any} />
                    <span className="text-sm text-gray-500">{formatDate(org.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </AdminCard>

        <AdminCard title="Recent Activity">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activityLoading ? (
              <p className="text-sm text-gray-500 text-center py-4">Loading activity...</p>
            ) : activities.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.actor_email}</span> {activity.action}
                      {activity.target_name && <span className="font-medium"> {activity.target_name}</span>}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formatDateTime(activity.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </AdminCard>
      </div>
    </div>
  );
};

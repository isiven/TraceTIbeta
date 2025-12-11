import React from 'react';
import { DollarSign, TrendingUp, Users, Percent } from 'lucide-react';
import { AdminMetricCard } from '../../components/admin/AdminMetricCard';
import { AdminCard } from '../../components/admin/AdminCard';
import { PlanBadge } from '../../components/admin/PlanBadge';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { useAllOrganizations } from '../../hooks/useAllOrganizations';
import { usePlatformStats } from '../../hooks/usePlatformStats';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const SubscriptionsPage: React.FC = () => {
  const { organizations, loading } = useAllOrganizations();
  const { stats } = usePlatformStats();

  const paidOrgs = organizations.filter(org => org.subscription_plan !== 'free');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscriptions & Billing</h1>
        <p className="text-gray-600 mt-1">Manage subscriptions and revenue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminMetricCard
          title="MRR"
          value={formatCurrency(stats?.mrr || 0)}
          change="+15% vs last month"
          icon={DollarSign}
          iconColor="bg-green-500"
          trend="up"
        />
        <AdminMetricCard
          title="ARR"
          value={formatCurrency(stats?.arr || 0)}
          icon={TrendingUp}
          iconColor="bg-blue-500"
        />
        <AdminMetricCard
          title="Avg Revenue/User"
          value={formatCurrency(stats?.avgRevenuePerUser || 0)}
          icon={Users}
          iconColor="bg-purple-500"
        />
        <AdminMetricCard
          title="Churn Rate"
          value="2.1%"
          change="-0.3% vs last month"
          icon={Percent}
          iconColor="bg-red-500"
          trend="down"
        />
      </div>

      <AdminCard title="Active Subscriptions">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Organization</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Plan</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Billing</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Users</th>
              </tr>
            </thead>
            <tbody>
              {paidOrgs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No paid subscriptions yet
                  </td>
                </tr>
              ) : (
                paidOrgs.map((org) => {
                  const amount = org.subscription_plan === 'pro' ? 29 : org.subscription_plan === 'enterprise' ? 99 : 0;
                  return (
                    <tr key={org.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <p className="font-medium text-gray-900">{org.name}</p>
                        <p className="text-sm text-gray-500">{org.owner?.email}</p>
                      </td>
                      <td className="py-4 px-4">
                        <PlanBadge plan={org.subscription_plan as any} />
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm">Monthly</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-semibold">{formatCurrency(amount)}/mo</span>
                      </td>
                      <td className="py-4 px-4">
                        <AdminStatusBadge status={org.subscription_status as any} />
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm">{org.users_count} / {org.max_users}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
};

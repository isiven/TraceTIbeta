
import React from 'react';
import { Users, CreditCard, TrendingUp, Activity, DollarSign } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { MOCK_SAAS_USERS, MOCK_SUBSCRIPTIONS } from '../constants';

export const AdminDashboard: React.FC = () => {
  // Calculate SaaS Metrics
  const totalUsers = MOCK_SAAS_USERS.length;
  const activeSubs = MOCK_SUBSCRIPTIONS.filter(s => s.status === 'Active').length;
  const mrr = MOCK_SUBSCRIPTIONS.filter(s => s.status === 'Active').reduce((acc, curr) => acc + curr.amount, 0);
  const totalRevenue = mrr * 12; // annualized estimation

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-darkGray">Admin Overview</h1>
        <p className="text-mediumGray mt-1">Platform performance and system health</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Monthly Recurring Revenue" 
          value={formatCurrency(mrr)}
          subValue="+12% from last month"
          icon={<DollarSign size={24} />} 
          variant="active"
        />
        <MetricCard 
          title="Total Users" 
          value={totalUsers}
          subValue="5 new this week"
          icon={<Users size={24} />} 
          variant="info"
        />
        <MetricCard 
          title="Active Subscriptions" 
          value={activeSubs}
          subValue="95% retention rate"
          icon={<CreditCard size={24} />} 
          variant="active"
        />
        <MetricCard 
          title="Churn Rate" 
          value="2.4%"
          subValue="Below industry average"
          icon={<Activity size={24} />} 
          variant="warning"
        />
      </div>

      {/* Recent Signups Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-darkGray">Recent User Signups</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_SAAS_USERS.slice(0, 5).map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                            {user.name.charAt(0)}
                        </div>
                        <div className="text-sm font-medium text-darkGray">{user.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-darkGray">{user.company}</td>
                  <td className="px-6 py-4 text-sm text-mediumGray capitalize">{user.role.replace('_', ' ').toLowerCase()}</td>
                  <td className="px-6 py-4 text-sm text-mediumGray">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${user.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                        {user.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-mediumGray font-mono">{user.joinedDate}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                        {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

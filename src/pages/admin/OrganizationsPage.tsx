import React, { useState } from 'react';
import { Eye, Ban, CreditCard, Search } from 'lucide-react';
import { AdminCard } from '../../components/admin/AdminCard';
import { PlanBadge } from '../../components/admin/PlanBadge';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { useAllOrganizations } from '../../hooks/useAllOrganizations';
import { Button } from '../../components/Button';

export const OrganizationsPage: React.FC = () => {
  const { organizations, loading } = useAllOrganizations();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.owner?.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'all' || org.subscription_plan === filterPlan;
    const matchesStatus = filterStatus === 'all' || org.subscription_status === filterStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-600 mt-1">Manage all organizations on the platform</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trialing">Trial</option>
          <option value="past_due">Past Due</option>
        </select>
      </div>

      <AdminCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Organization</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Owner</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Plan</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Users</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Assets</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No organizations found
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => (
                  <tr key={org.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900">{org.name}</p>
                      <p className="text-sm text-gray-500">{org.id.substring(0, 8)}...</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-900">{org.owner?.full_name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{org.owner?.email}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm capitalize">{org.account_type.replace('_', ' ')}</span>
                    </td>
                    <td className="py-4 px-4">
                      <PlanBadge plan={org.subscription_plan as any} />
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm">{org.users_count} / {org.max_users}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm">{org.assets_count || 0} / {org.max_assets}</span>
                    </td>
                    <td className="py-4 px-4">
                      <AdminStatusBadge status={org.subscription_status as any} />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                          title="Manage Subscription"
                        >
                          <CreditCard size={18} />
                        </button>
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Suspend"
                        >
                          <Ban size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
};

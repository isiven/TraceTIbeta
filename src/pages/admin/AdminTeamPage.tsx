import React from 'react';
import { Shield, UserPlus } from 'lucide-react';
import { AdminCard } from '../../components/admin/AdminCard';
import { RoleBadge } from '../../components/admin/RoleBadge';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { usePlatformAdmins } from '../../hooks/usePlatformAdmins';
import { Button } from '../../components/Button';

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Never';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return 'Invalid date';
  }
};

export const AdminTeamPage: React.FC = () => {
  const { admins, loading } = usePlatformAdmins();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Admin Team</h1>
          <p className="text-gray-600 mt-1">Manage platform administrators</p>
        </div>
        <Button className="flex items-center gap-2">
          <UserPlus size={20} />
          Invite Admin
        </Button>
      </div>

      <AdminCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Admin</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Login</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No admins found
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                          <Shield size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{admin.full_name || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <RoleBadge role={admin.role} />
                    </td>
                    <td className="py-4 px-4">
                      <AdminStatusBadge status={admin.is_active ? 'active' : 'inactive'} />
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">{formatDate(admin.last_login)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">{formatDate(admin.created_at)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <AdminCard title="Admin Role Descriptions">
        <div className="space-y-4">
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold text-gray-900">Super Admin</h3>
            <p className="text-sm text-gray-600">Full access to everything including user management, billing, and platform settings</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900">Support Admin</h3>
            <p className="text-sm text-gray-600">Can view all data and impersonate users, cannot delete or change billing</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-gray-900">Billing Admin</h3>
            <p className="text-sm text-gray-600">Can only manage subscriptions and billing</p>
          </div>
          <div className="border-l-4 border-gray-500 pl-4">
            <h3 className="font-semibold text-gray-900">Read-only Admin</h3>
            <p className="text-sm text-gray-600">Can view all data but cannot make changes</p>
          </div>
        </div>
      </AdminCard>
    </div>
  );
};

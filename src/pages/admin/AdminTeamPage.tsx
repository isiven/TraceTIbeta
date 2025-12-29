import React, { useState } from 'react';
import { Shield, UserPlus, X, AlertCircle } from 'lucide-react';
import { AdminCard } from '../../components/admin/AdminCard';
import { RoleBadge } from '../../components/admin/RoleBadge';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { usePlatformAdmins } from '../../hooks/usePlatformAdmins';
import { Button } from '../../components/Button';
import { supabase } from '../../lib/supabase';

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

interface InviteFormData {
  email: string;
  role: 'support_admin' | 'billing_admin' | 'readonly_admin';
  full_name: string;
}

export const AdminTeamPage: React.FC = () => {
  const { admins, loading, refetch } = usePlatformAdmins();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [formData, setFormData] = useState<InviteFormData>({
    email: '',
    role: 'support_admin',
    full_name: '',
  });

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError(null);

    try {
      // First, create the user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        email_confirm: true,
        user_metadata: {
          full_name: formData.full_name,
        },
      });

      if (authError) throw authError;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
        });

      if (profileError) throw profileError;

      // Add to platform_admins
      const { error: adminError } = await supabase
        .from('platform_admins')
        .insert({
          user_id: authData.user.id,
          role: formData.role,
          is_active: true,
        });

      if (adminError) throw adminError;

      // Success - reset form and close modal
      setFormData({
        email: '',
        role: 'support_admin',
        full_name: '',
      });
      setShowInviteModal(false);
      refetch();
    } catch (error: any) {
      console.error('Error inviting admin:', error);
      setInviteError(error.message || 'Failed to invite admin');
    } finally {
      setInviteLoading(false);
    }
  };

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
        <Button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2"
        >
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
          <div className="border-l-4 border-red-500 pl-4 bg-red-50 py-3 pr-3 rounded-r">
            <h3 className="font-semibold text-gray-900">Super Admin (Isaac only - cannot be changed)</h3>
            <p className="text-sm text-gray-600">Full access to everything. Manages all organizations, users, and settings. Only one Super Admin exists - this is the platform owner.</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900">Support Admin</h3>
            <p className="text-sm text-gray-600">Can view all data and manage support tickets. Cannot delete organizations or change billing.</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-gray-900">Billing Admin</h3>
            <p className="text-sm text-gray-600">Can only manage subscriptions and billing. Cannot view support tickets or user data.</p>
          </div>
          <div className="border-l-4 border-gray-500 pl-4">
            <h3 className="font-semibold text-gray-900">Read-only Admin</h3>
            <p className="text-sm text-gray-600">Can view all data but cannot make changes. Good for observers or stakeholders.</p>
          </div>
        </div>
      </AdminCard>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Invite Platform Admin</h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleInviteAdmin} className="p-6 space-y-4">
              {inviteError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 text-sm">Error</h4>
                    <p className="text-sm text-red-700">{inviteError}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Role *
                </label>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                    <input
                      type="radio"
                      name="role"
                      value="support_admin"
                      checked={formData.role === 'support_admin'}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Support Admin</div>
                      <div className="text-sm text-gray-600">
                        Can view all data and manage support tickets
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                    <input
                      type="radio"
                      name="role"
                      value="billing_admin"
                      checked={formData.role === 'billing_admin'}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Billing Admin</div>
                      <div className="text-sm text-gray-600">
                        Can only manage subscriptions and billing
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                    <input
                      type="radio"
                      name="role"
                      value="readonly_admin"
                      checked={formData.role === 'readonly_admin'}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Read-only Admin</div>
                      <div className="text-sm text-gray-600">
                        Can view all data but cannot make changes
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900">
                    Note: Super Admin role cannot be assigned. Only Isaac Villasmil can be Super Admin.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteError(null);
                  }}
                  className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                  disabled={inviteLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteLoading}>
                  {inviteLoading ? 'Inviting...' : 'Invite Admin'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

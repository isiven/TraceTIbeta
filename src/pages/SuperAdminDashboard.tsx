import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  MoreVertical,
  Eye,
  Ban,
  Mail,
  Download,
  DollarSign,
  Activity,
  UserPlus,
  Calendar,
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  account_type: string;
  subscription_plan: string;
  subscription_status: string;
  max_users: number;
  created_at: string;
  owner_id?: string;
  profiles?: Array<{
    id: string;
    email: string;
    full_name: string;
    role: string;
  }>;
}

interface PlatformStats {
  totalOrganizations: number;
  totalUsers: number;
  activeSubscriptions: number;
  trialAccounts: number;
  monthlyRevenue: number;
  newThisMonth: number;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  organization_id: string | null;
  last_login: string | null;
  created_at: string;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats>({
    totalOrganizations: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    trialAccounts: 0,
    monthlyRevenue: 0,
    newThisMonth: 0,
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'organizations' | 'users' | 'subscriptions'>(
    'overview'
  );
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { data: orgsData, count: orgsCount } = await supabase
        .from('organizations')
        .select('*, profiles!profiles_organization_id_fkey(id, email, full_name, role)', { count: 'exact' })
        .order('created_at', { ascending: false });

      const { data: usersData, count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(10);

      const proOrgs = orgsData?.filter((o) => o.subscription_plan === 'pro') || [];
      const enterpriseOrgs = orgsData?.filter((o) => o.subscription_plan === 'enterprise') || [];
      const trialOrgs = orgsData?.filter((o) => o.subscription_plan === 'free') || [];

      const thisMonth = new Date();
      thisMonth.setDate(1);
      const newOrgs = orgsData?.filter((o) => new Date(o.created_at) >= thisMonth) || [];

      const monthlyRevenue = proOrgs.length * 29 + enterpriseOrgs.length * 99;

      setStats({
        totalOrganizations: orgsCount || 0,
        totalUsers: usersCount || 0,
        activeSubscriptions: proOrgs.length + enterpriseOrgs.length,
        trialAccounts: trialOrgs.length,
        monthlyRevenue,
        newThisMonth: newOrgs.length,
      });

      setOrganizations(orgsData || []);
      setRecentUsers(usersData || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
    setLoading(false);
  };

  const handleSuspendOrg = async (orgId: string) => {
    if (!confirm('¿Suspender esta organización?')) return;

    await supabase.from('organizations').update({ subscription_status: 'suspended' }).eq('id', orgId);

    loadDashboardData();
  };

  const handleActivateOrg = async (orgId: string) => {
    await supabase.from('organizations').update({ subscription_status: 'active' }).eq('id', orgId);

    loadDashboardData();
  };

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.profiles?.some((p) => p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      case 'pro':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a651]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600">Gestión global de la plataforma TraceTI</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-[#00a651] text-white rounded-lg hover:bg-[#008f45] transition-colors"
        >
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Organizaciones</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrganizations}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Building2 className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">+{stats.newThisMonth} este mes</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuarios Totales</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <Users className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Suscripciones Activas</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <CreditCard className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{stats.trialAccounts} en trial</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">MRR Estimado</p>
              <p className="text-3xl font-bold text-gray-900">${stats.monthlyRevenue}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
              <DollarSign className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {(['overview', 'organizations', 'users', 'subscriptions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-[#00a651] text-[#00a651]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'overview'
                ? 'Resumen'
                : tab === 'organizations'
                ? 'Organizaciones'
                : tab === 'users'
                ? 'Usuarios'
                : 'Suscripciones'}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Organizaciones Recientes</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {organizations.slice(0, 5).map((org) => (
                <div key={org.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{org.name}</p>
                      <p className="text-sm text-gray-600">{org.profiles?.length || 0} usuarios</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanBadge(
                        org.subscription_plan
                      )}`}
                    >
                      {org.subscription_plan}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Usuarios Recientes</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {recentUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#e6f7ed] text-[#00a651] flex items-center justify-center font-medium">
                      {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.full_name || 'Sin nombre'}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'organizations' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar organizaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00a651] focus:border-[#00a651] outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">
                    Organización
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Plan</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Estado</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Usuarios</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Creado</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrgs.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{org.name}</p>
                        <p className="text-sm text-gray-600">{org.profiles?.[0]?.email || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 capitalize">
                        {org.account_type === 'integrator' ? 'Integrador' : 'Usuario Final'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanBadge(
                          org.subscription_plan
                        )}`}
                      >
                        {org.subscription_plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                          org.subscription_status
                        )}`}
                      >
                        {org.subscription_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{org.profiles?.length || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(org.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {org.subscription_status === 'active' ? (
                          <button
                            onClick={() => handleSuspendOrg(org.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Suspender"
                          >
                            <Ban size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateOrg(org.id)}
                            className="p-1 text-green-500 hover:bg-green-50 rounded"
                            title="Activar"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">
                    Organización
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Rol</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Estado</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">
                    Último Login
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#e6f7ed] text-[#00a651] flex items-center justify-center font-medium">
                          {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.full_name || 'Sin nombre'}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.organization_id || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 capitalize">{user.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Nunca'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Por Plan</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Free</span>
                  <span className="font-medium">
                    {organizations.filter((o) => o.subscription_plan === 'free').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pro ($29/mes)</span>
                  <span className="font-medium">
                    {organizations.filter((o) => o.subscription_plan === 'pro').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Enterprise ($99/mes)</span>
                  <span className="font-medium">
                    {organizations.filter((o) => o.subscription_plan === 'enterprise').length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Por Tipo</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Integradores</span>
                  <span className="font-medium">
                    {organizations.filter((o) => o.account_type === 'integrator').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Usuarios Finales</span>
                  <span className="font-medium">
                    {organizations.filter((o) => o.account_type === 'end_user').length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">MRR</span>
                  <span className="font-bold text-2xl text-[#00a651]">${stats.monthlyRevenue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ARR Proyectado</span>
                  <span className="font-medium">${stats.monthlyRevenue * 12}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

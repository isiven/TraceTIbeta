import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

// Public pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { TeamManagement } from './pages/TeamManagement';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

// Admin pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { OrganizationsPage } from './pages/admin/OrganizationsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { SubscriptionsPage } from './pages/admin/SubscriptionsPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';
import { PlatformSettingsPage } from './pages/admin/PlatformSettingsPage';
import { AdminTeamPage } from './pages/admin/AdminTeamPage';

// ZIP Components - Main App
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { LicenseList } from './components/LicenseList';
import { HardwareList } from './components/HardwareList';
import { SupportContractList } from './components/SupportContractList';
import { ClientList } from './components/ClientList';
import { ClientDetail } from './components/ClientDetail';
import { Settings } from './components/Settings';
import { SubscriptionList } from './components/SubscriptionList';
import HelpCenter from './pages/HelpCenter';
import SupportTickets from './pages/admin/SupportTickets';

// Catalog Management Pages
import Vendors from './pages/Vendors';
import Providers from './pages/Providers';
import Products from './pages/Products';
import Contacts from './pages/Contacts';

// Budget & Analysis Pages
import BudgetPlanning from './pages/BudgetPlanning';
import BudgetPlanDetail from './pages/BudgetPlanDetail';
import SpendAnalysis from './pages/SpendAnalysis';
import ExpirationForecast from './pages/ExpirationForecast';

import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { useData } from './context/DataContext';
import type { Client } from './types';
import { Menu, Bell, Search } from 'lucide-react';

// Main App Layout (authenticated users)
const AppLayout: React.FC = () => {
  const { traceTIUser, profile, organization, signOut } = useAuth();
  const { clients } = useData();
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [actionItem, setActionItem] = useState<{ view: string; id: string } | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const userRole = traceTIUser?.role || 'INTEGRATOR';

  // DEBUG: Mostrar estado del usuario en consola
  React.useEffect(() => {
    console.log('🎯 [AppLayout] Estado del usuario actual:', {
      email: profile?.email,
      full_name: profile?.full_name,
      profile_role: profile?.role,
      profile_scope: profile?.scope,
      profile_account_type: profile?.account_type,
      organization_name: organization?.name,
      organization_account_type: organization?.account_type,
      traceTIUser_role: traceTIUser?.role,
      computed_userRole: userRole,
      is_super_admin: profile?.role === 'super_admin',
    });
  }, [profile, organization, traceTIUser, userRole]);

  const handleNavigateToItem = (view: string, id: string) => {
    setCurrentView(view);
    setActionItem({ view, id });
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setCurrentView('client-detail');
  };

  const handleEditClientFromDetail = (client: Client) => {
    setSelectedClient(client);
    setCurrentView('clients');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return userRole === 'SUPER_ADMIN'
          ? <SuperAdminDashboard />
          : <Dashboard userRole={userRole} setCurrentPage={setCurrentView} onNavigateToItem={handleNavigateToItem} />;
      case 'licenses':
        return <LicenseList userRole={userRole} actionItem={actionItem} onActionComplete={() => setActionItem(null)} />;
      case 'hardware':
        return <HardwareList userRole={userRole} actionItem={actionItem} onActionComplete={() => setActionItem(null)} />;
      case 'support-contracts':
        return <SupportContractList userRole={userRole} actionItem={actionItem} onActionComplete={() => setActionItem(null)} />;
      case 'vendors':
        return <Vendors />;
      case 'providers':
        return <Providers />;
      case 'products':
        return <Products />;
      case 'contacts':
        return <Contacts />;
      case 'budgets':
        return <BudgetPlanning />;
      case 'budget-detail':
        return <BudgetPlanDetail />;
      case 'spend-analysis':
        return <SpendAnalysis />;
      case 'expiration-forecast':
        return <ExpirationForecast />;
      case 'clients':
        return userRole === 'INTEGRATOR' ? <ClientList onSelectClient={handleSelectClient} /> : <Dashboard userRole={userRole} setCurrentPage={setCurrentView} onNavigateToItem={handleNavigateToItem} />;
      case 'client-detail':
        return selectedClient ? (
          <ClientDetail
            client={selectedClient}
            onBack={() => setCurrentView('clients')}
            onNavigateToItem={handleNavigateToItem}
            onEditClient={handleEditClientFromDetail}
          />
        ) : <ClientList onSelectClient={handleSelectClient} />;
      case 'settings':
        return <Settings />;
      case 'team':
        return <TeamManagement />;
      case 'admin-subscriptions':
        return <SubscriptionList />;
      case 'super-admin':
        return <SuperAdminDashboard />;
      case 'help':
        return <HelpCenter />;
      default:
        return userRole === 'SUPER_ADMIN' ? <SuperAdminDashboard /> : <Dashboard userRole={userRole} setCurrentPage={setCurrentView} onNavigateToItem={handleNavigateToItem} />;
    }
  };

  const getPageTitle = () => {
    const titles: { [key: string]: string } = {
      dashboard: 'Overview',
      licenses: 'License Management',
      hardware: 'Hardware Management',
      'support-contracts': 'Support Contracts',
      vendors: 'Vendor Management',
      providers: 'Provider Management',
      products: 'Product Catalog',
      contacts: 'Contact Management',
      budgets: 'Budget Planning',
      'budget-detail': 'Budget Plan Detail',
      'spend-analysis': 'Spend Analysis',
      'expiration-forecast': 'Expiration Forecast',
      clients: 'Client Management',
      'client-detail': selectedClient ? selectedClient.name : 'Client Details',
      team: 'Team Management',
      settings: 'Settings',
      'admin-dashboard': 'Admin Overview',
      'admin-users': 'User Management',
      'admin-subscriptions': 'Subscriptions',
      'super-admin': 'Super Admin Dashboard',
      'help': 'Help & Support',
      'admin-tickets': 'All Support Tickets',
      'admin-organizations': 'Organizations Management',
    };
    return titles[currentView] || 'TraceTI';
  };

  const isImage = (str: string) => str && (str.startsWith('data:image') || str.startsWith('http'));

  return (
    <div className="flex h-screen bg-bgGray overflow-hidden font-sans">
      <Sidebar
        currentView={currentView}
        onChangeView={(view) => {
          setCurrentView(view);
          setIsMobileMenuOpen(false);
        }}
        userRole={userRole}
        onLogout={signOut}
        isOpen={isMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 z-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 text-darkGray hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-darkGray tracking-tight">{getPageTitle()}</h2>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="relative hidden md:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
              <input
                type="text"
                placeholder="Global search..."
                className="pl-9 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-full text-sm w-64 transition-all outline-none"
              />
            </div>

            <button className="relative p-2 text-mediumGray hover:text-darkGray hover:bg-gray-50 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-danger rounded-full border border-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-darkGray">
                  {userRole === 'SUPER_ADMIN' ? 'Admin' : traceTIUser?.name}
                </div>
                <div className="text-xs text-mediumGray capitalize">{userRole.replace('_', ' ').toLowerCase()}</div>
              </div>
              <div className="w-9 h-9 bg-gray-100 text-mediumGray rounded-full flex items-center justify-center font-medium text-sm cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-primary transition-all border border-gray-200 overflow-hidden shadow-sm">
                {traceTIUser?.avatar && isImage(traceTIUser.avatar) ? (
                  <img src={traceTIUser.avatar} alt={traceTIUser.name} className="w-full h-full object-cover" />
                ) : (
                  traceTIUser?.avatar || 'U'
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
          <div className="max-w-[1440px] mx-auto animate-in fade-in duration-300">{renderContent()}</div>
        </main>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

// Main App Component
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes - Main App */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/budgets/:id"
              element={
                <ProtectedRoute>
                  <div className="flex h-screen bg-bgGray overflow-hidden font-sans">
                    <Sidebar
                      currentView="budgets"
                      onChangeView={(view) => window.location.href = '/app'}
                      userRole="INTEGRATOR"
                      onLogout={() => {}}
                      isOpen={false}
                    />
                    <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
                      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
                        <div className="max-w-[1440px] mx-auto">
                          <BudgetPlanDetail />
                        </div>
                      </main>
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={<Navigate to="/app" replace />}
            />

            {/* Protected Routes - Admin Panel */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="organizations" element={<OrganizationsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="tickets" element={<SupportTickets />} />
              <Route path="settings" element={<PlatformSettingsPage />} />
              <Route path="team" element={<AdminTeamPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

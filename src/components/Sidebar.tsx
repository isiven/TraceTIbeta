import React from 'react';
import { LayoutDashboard, FileText, Users, Settings, LogOut, Radar, CreditCard, Shield, Server, ShieldCheck, Activity, Building2, HelpCircle, MessageSquare, Truck, Package, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { UserRole } from '../types';
import { useData } from '../context/DataContext';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  userRole: UserRole;
  onLogout: () => void;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, userRole, onLogout, isOpen }) => {
  const { user, companySettings } = useData();
  
  const getMenuItems = () => {
    if (userRole === 'SUPER_ADMIN') {
      return [
        { id: 'super-admin', label: 'Platform Dashboard', icon: Activity },
        { id: 'admin-organizations', label: 'Organizations', icon: Building2 },
        { id: 'admin-users', label: 'User Management', icon: Users },
        { id: 'admin-tickets', label: 'All Tickets', icon: MessageSquare },
        { id: 'admin-subscriptions', label: 'Subscriptions', icon: CreditCard },
        { id: 'help', label: 'Help & Support', icon: HelpCircle },
        { id: 'settings', label: 'Settings', icon: Settings },
      ];
    }

    // Default items for Integrator/End User
    const items = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'licenses', label: 'Licenses', icon: FileText },
      { id: 'hardware', label: 'Hardware', icon: Server },
      { id: 'support-contracts', label: 'Support Contracts', icon: ShieldCheck },
      { id: 'vendors', label: 'Vendors', icon: Building2 },
      { id: 'providers', label: 'Providers', icon: Truck },
      { id: 'products', label: 'Products', icon: Package },
      { id: 'contacts', label: 'Contacts', icon: Users },
      { id: 'budgets', label: 'Budget Plans', icon: DollarSign },
      { id: 'spend-analysis', label: 'Spend Analysis', icon: TrendingUp },
      { id: 'expiration-forecast', label: 'Expiration Forecast', icon: Calendar },
    ];

    // Explicitly add Clients for Integrators
    if (userRole === 'INTEGRATOR') {
      items.push({ id: 'clients', label: 'Clients', icon: Users });
    }

    // Add Team management for admins
    if (userRole === 'INTEGRATOR' || userRole === 'MANAGER') {
      items.push({ id: 'team', label: 'Team', icon: Users });
    }

    items.push({ id: 'help', label: 'Help & Support', icon: HelpCircle });
    items.push({ id: 'settings', label: 'Settings', icon: Settings });

    return items;
  };

  const menuItems = getMenuItems();
  
  // Helper to check for image string
  const isImage = (str: string) => str && (str.startsWith('data:image') || str.startsWith('http'));

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-white border-r border-gray-200 text-mediumGray transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static flex flex-col h-full shadow-sm`}>
      <div className="h-20 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="text-primary">
            {companySettings.logo && isImage(companySettings.logo) ? (
                <img src={companySettings.logo} alt="Logo" className="h-8 object-contain max-w-[40px]" />
            ) : (
                userRole === 'SUPER_ADMIN' ? <Shield size={32} /> : <Radar size={32} />
            )}
          </div>
          <span className="text-xl font-bold tracking-tight text-darkGray truncate">
            {userRole === 'SUPER_ADMIN' ? 'TraceTI Admin' : companySettings.name || 'TraceTI'}
          </span>
        </div>
      </div>

      <nav className="flex-1 py-6 space-y-1 px-3 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all rounded-lg relative group ${
                isActive 
                  ? 'text-primary bg-green-50 font-semibold' 
                  : 'text-mediumGray hover:bg-gray-50 hover:text-darkGray'
              }`}
            >
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />} 
              <Icon size={20} className={`transition-colors ${isActive ? 'text-primary' : 'group-hover:text-darkGray'}`} />
              <span className="text-[15px]">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-gray-100 bg-white">
         <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 border border-gray-200 overflow-hidden">
                {isImage(user.avatar) ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                    user.avatar
                )}
            </div>
            <div className="overflow-hidden">
                <div className="text-sm font-bold text-darkGray truncate">{user.name}</div>
                <div className="text-xs text-mediumGray truncate">{user.email}</div>
            </div>
         </div>
         <button 
           onClick={onLogout}
           className="flex items-center gap-3 text-mediumGray hover:text-danger transition-colors w-full px-4 py-2 hover:bg-red-50 rounded-lg group"
         >
           <LogOut size={20} className="group-hover:text-danger" />
           <span className="font-medium group-hover:text-danger">Sign Out</span>
         </button>
      </div>
    </div>
  );
};
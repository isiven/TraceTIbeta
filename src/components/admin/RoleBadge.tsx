import React from 'react';
import { Shield, Star, Users, Eye, DollarSign } from 'lucide-react';

interface RoleBadgeProps {
  role: 'super_admin' | 'support_admin' | 'billing_admin' | 'readonly_admin' | 'admin' | 'manager' | 'user' | 'viewer';
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className = '' }) => {
  const config = {
    super_admin: {
      label: 'Super Admin',
      icon: Star,
      className: 'bg-red-100 text-red-700 border-red-200'
    },
    support_admin: {
      label: 'Support Admin',
      icon: Shield,
      className: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    billing_admin: {
      label: 'Billing Admin',
      icon: DollarSign,
      className: 'bg-green-100 text-green-700 border-green-200'
    },
    readonly_admin: {
      label: 'Read-only Admin',
      icon: Eye,
      className: 'bg-gray-100 text-gray-700 border-gray-200'
    },
    admin: {
      label: 'Admin',
      icon: Shield,
      className: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    manager: {
      label: 'Manager',
      icon: Users,
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    },
    user: {
      label: 'User',
      icon: Users,
      className: 'bg-gray-100 text-gray-700 border-gray-200'
    },
    viewer: {
      label: 'Viewer',
      icon: Eye,
      className: 'bg-gray-100 text-gray-600 border-gray-200'
    }
  };

  const { label, icon: Icon, className: roleClass } = config[role];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${roleClass} ${className}`}>
      <Icon size={12} />
      {label}
    </span>
  );
};

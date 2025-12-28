import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface AdminStatusBadgeProps {
  status: 'active' | 'inactive' | 'suspended' | 'trialing' | 'past_due' | 'pending';
  className?: string;
}

export const AdminStatusBadge: React.FC<AdminStatusBadgeProps> = ({ status, className = '' }) => {
  const config = {
    active: {
      label: 'Active',
      icon: CheckCircle,
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    },
    inactive: {
      label: 'Inactive',
      icon: XCircle,
      className: 'bg-red-100 text-red-700 border-red-200'
    },
    suspended: {
      label: 'Suspended',
      icon: XCircle,
      className: 'bg-red-100 text-red-700 border-red-200'
    },
    trialing: {
      label: 'Trial',
      icon: Clock,
      className: 'bg-amber-100 text-amber-700 border-amber-200'
    },
    past_due: {
      label: 'Past Due',
      icon: AlertCircle,
      className: 'bg-amber-100 text-amber-700 border-amber-200'
    },
    pending: {
      label: 'Pending',
      icon: Clock,
      className: 'bg-amber-100 text-amber-700 border-amber-200'
    }
  };

  const { label, icon: Icon, className: statusClass } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusClass} ${className}`}>
      <Icon size={12} />
      {label}
    </span>
  );
};

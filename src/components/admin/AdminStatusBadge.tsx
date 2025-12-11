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
      className: 'bg-green-100 text-green-700 border-green-200'
    },
    inactive: {
      label: 'Inactive',
      icon: XCircle,
      className: 'bg-gray-100 text-gray-700 border-gray-200'
    },
    suspended: {
      label: 'Suspended',
      icon: XCircle,
      className: 'bg-red-100 text-red-700 border-red-200'
    },
    trialing: {
      label: 'Trial',
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    },
    past_due: {
      label: 'Past Due',
      icon: AlertCircle,
      className: 'bg-orange-100 text-orange-700 border-orange-200'
    },
    pending: {
      label: 'Pending',
      icon: Clock,
      className: 'bg-blue-100 text-blue-700 border-blue-200'
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

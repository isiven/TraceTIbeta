import React from 'react';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import type { ItemStatus } from '../utils/statusCalculator';

interface StatusBadgeProps {
  status: ItemStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'sm'
}) => {
  const config = {
    Active: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
      icon: CheckCircle2,
      label: 'Active'
    },
    Expiring: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      icon: Clock,
      label: 'Expiring'
    },
    Expired: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      icon: AlertTriangle,
      label: 'Expired'
    }
  };

  const { bg, text, border, icon: Icon, label } = config[status] || config.Active;

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1 ${sizeClasses} rounded-full font-medium border ${bg} ${text} ${border}`}>
      {showIcon && <Icon size={size === 'sm' ? 12 : 14} />}
      {label}
    </span>
  );
};
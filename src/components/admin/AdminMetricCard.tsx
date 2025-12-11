import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminMetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export const AdminMetricCard: React.FC<AdminMetricCardProps> = ({
  title,
  value,
  change,
  subtitle,
  icon: Icon,
  iconColor = 'bg-blue-500',
  trend = 'neutral'
}) => {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
          {change && (
            <p className={`text-sm font-medium ${trendColors[trend]}`}>
              {change}
            </p>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`${iconColor} rounded-lg p-3 text-white`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

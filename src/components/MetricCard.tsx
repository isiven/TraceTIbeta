
import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  variant?: 'active' | 'warning' | 'danger' | 'info';
  className?: string; // New prop for styling
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, subValue, icon, variant = 'info', className = '' }) => {
  const colors = {
    active: "bg-green-100 text-green-600",
    warning: "bg-yellow-100 text-yellow-600",
    danger: "bg-red-100 text-red-600",
    info: "bg-blue-100 text-blue-600",
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-start transition-all hover:scale-[1.02] hover:shadow-md ${className}`}>
      <div className={`p-3 rounded-full mb-4 ${colors[variant]}`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-darkGray mb-1">{value}</div>
      <div className="text-sm font-semibold text-mediumGray mb-1">{title}</div>
      {subValue && (
        <div className="text-xs text-gray-400 mt-1">{subValue}</div>
      )}
    </div>
  );
};

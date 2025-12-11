import React from 'react';

interface AdminCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const AdminCard: React.FC<AdminCardProps> = ({ title, children, className = '', action }) => {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

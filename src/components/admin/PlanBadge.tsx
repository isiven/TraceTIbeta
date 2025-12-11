import React from 'react';

interface PlanBadgeProps {
  plan: 'free' | 'pro' | 'enterprise';
  className?: string;
}

export const PlanBadge: React.FC<PlanBadgeProps> = ({ plan, className = '' }) => {
  const styles = {
    free: 'bg-gray-100 text-gray-700 border-gray-200',
    pro: 'bg-blue-100 text-blue-700 border-blue-200',
    enterprise: 'bg-purple-100 text-purple-700 border-purple-200'
  };

  const labels = {
    free: 'Free',
    pro: 'Pro',
    enterprise: 'Enterprise'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${styles[plan]} ${className}`}>
      {labels[plan]}
    </span>
  );
};

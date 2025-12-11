import React from 'react';
import { AdminCard } from '../../components/admin/AdminCard';

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Platform analytics and reports</p>
      </div>

      <AdminCard>
        <div className="text-center py-12">
          <p className="text-gray-500">Analytics coming soon...</p>
          <p className="text-sm text-gray-400 mt-2">
            This section will include charts, graphs, and detailed reports
          </p>
        </div>
      </AdminCard>
    </div>
  );
};

import React from 'react';
import { AdminCard } from '../../components/admin/AdminCard';

export const PlatformSettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-600 mt-1">Configure platform-wide settings</p>
      </div>

      <AdminCard title="Plan Configuration">
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">Free Plan</h3>
                <p className="text-sm text-gray-500">$0/month</p>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg">
                Edit
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Max Users:</span> <span className="font-medium">5</span>
              </div>
              <div>
                <span className="text-gray-600">Max Assets:</span> <span className="font-medium">50</span>
              </div>
              <div>
                <span className="text-gray-600">Support:</span> <span className="font-medium">Community</span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 border-blue-200 bg-blue-50">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">Pro Plan</h3>
                <p className="text-sm text-gray-500">$29/month</p>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 rounded-lg">
                Edit
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Max Users:</span> <span className="font-medium">50</span>
              </div>
              <div>
                <span className="text-gray-600">Max Assets:</span> <span className="font-medium">1000</span>
              </div>
              <div>
                <span className="text-gray-600">Support:</span> <span className="font-medium">Email</span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 border-purple-200 bg-purple-50">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">Enterprise Plan</h3>
                <p className="text-sm text-gray-500">$99/month</p>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-100 rounded-lg">
                Edit
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Max Users:</span> <span className="font-medium">Unlimited</span>
              </div>
              <div>
                <span className="text-gray-600">Max Assets:</span> <span className="font-medium">Unlimited</span>
              </div>
              <div>
                <span className="text-gray-600">Support:</span> <span className="font-medium">Priority</span>
              </div>
            </div>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Feature Flags">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">New Dashboard Design</h3>
              <p className="text-sm text-gray-500">Enable the redesigned dashboard for all users</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">AI Insights (Beta)</h3>
              <p className="text-sm text-gray-500">Show AI-powered insights on dashboard</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </AdminCard>
    </div>
  );
};

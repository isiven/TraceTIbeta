
import React from 'react';
import { MOCK_SUBSCRIPTIONS } from '../constants';
import { Button } from './Button';
import { Download } from 'lucide-react';

export const SubscriptionList: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-darkGray">Subscriptions</h1>
           <p className="text-mediumGray mt-1">Monitor billing and revenue</p>
        </div>
        <Button variant="secondary" icon={<Download size={16} />}>Export Report</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
         <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Plan Name</th>
                <th className="px-6 py-4">Billing Interval</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Next Billing Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {MOCK_SUBSCRIPTIONS.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-darkGray">{sub.company}</td>
                        <td className="px-6 py-4 text-sm text-mediumGray">{sub.plan}</td>
                        <td className="px-6 py-4 text-sm text-mediumGray">{sub.interval}</td>
                        <td className="px-6 py-4 text-sm font-mono font-medium text-darkGray">${sub.amount.toFixed(2)}</td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                sub.status === 'Active' 
                                ? 'bg-green-50 text-green-700 border-green-100' 
                                : sub.status === 'Past Due'
                                ? 'bg-red-50 text-red-700 border-red-100'
                                : 'bg-gray-50 text-gray-700 border-gray-100'
                            }`}>
                                {sub.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-mediumGray">{sub.nextBilling}</td>
                        <td className="px-6 py-4 text-right">
                             <button className="text-primary hover:underline text-sm font-medium">Manage</button>
                        </td>
                    </tr>
                ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

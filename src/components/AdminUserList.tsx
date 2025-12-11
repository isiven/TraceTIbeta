
import React, { useState } from 'react';
import { Search, MoreVertical, Shield, User, Filter } from 'lucide-react';
import { Button } from './Button';
import { MOCK_SAAS_USERS } from '../constants';

export const AdminUserList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = MOCK_SAAS_USERS.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-darkGray">User Management</h1>
           <p className="text-mediumGray mt-1">Manage all accounts on the platform</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
         <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Search users, companies, emails..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
         </div>
         <div className="flex gap-2">
            <Button variant="secondary" icon={<Filter size={16} />}>Filter</Button>
            <Button variant="secondary">Export Users</Button>
         </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Current Plan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                                    {user.name.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-darkGray">{user.name}</div>
                                    <div className="text-xs text-mediumGray">{user.email}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                user.role === 'INTEGRATOR' 
                                ? 'bg-blue-50 text-blue-700 border-blue-100' 
                                : user.role === 'SUPER_ADMIN'
                                ? 'bg-purple-50 text-purple-700 border-purple-100'
                                : 'bg-gray-50 text-gray-700 border-gray-100'
                            }`}>
                                {user.role === 'SUPER_ADMIN' && <Shield size={10} />}
                                {user.role === 'INTEGRATOR' && <User size={10} />}
                                {user.role.replace('_', ' ')}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-darkGray font-medium">{user.company}</td>
                        <td className="px-6 py-4 text-sm text-mediumGray">{user.plan}</td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                                {user.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-darkGray transition-colors">
                                <MoreVertical size={18} />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};


import React, { useState, useMemo } from 'react';
import { Search, Plus, X, MoreVertical, Mail, Phone, Edit2, Trash2, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from './Button';
import { useData } from '../context/DataContext';
import { Client } from '../types';

interface ClientListProps {
  onSelectClient?: (client: Client) => void;
}

export const ClientList: React.FC<ClientListProps> = ({ onSelectClient }) => {
  const { clients, addClient, updateClient, deleteClient, licenses, hardware, contracts } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'health'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const initialFormState = {
    name: '',
    email: '',
    phone: '',
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // Helper functions for logic
  const calculateClientStats = (clientName: string) => {
    const clientLicenses = licenses.filter(l => l.client === clientName);
    const clientHardware = hardware.filter(h => h.client === clientName);
    const clientContracts = contracts.filter(c => c.client === clientName);

    const totalValue = 
      clientLicenses.reduce((sum, i) => sum + (i.annualCost || 0), 0) +
      clientHardware.reduce((sum, i) => sum + (i.purchaseCost || 0), 0) +
      clientContracts.reduce((sum, i) => sum + (i.annualCost || 0), 0);

    const allItems = [...clientLicenses, ...clientHardware, ...clientContracts];
    const expiredCount = allItems.filter(i => i.status === 'Expired').length;
    const expiringCount = allItems.filter(i => i.status === 'Expiring').length;
    const activeCount = allItems.length;

    let healthScore = 0; // Lower is better (0=Good, 1=Warning, 2=Critical)
    if (expiredCount > 0) healthScore = 2;
    else if (expiringCount > 0) healthScore = 1;

    return { totalValue, activeCount, expiredCount, expiringCount, healthScore };
  };

  const processedClients = useMemo(() => {
    let result = clients.map(client => ({
        ...client,
        ...calculateClientStats(client.name)
    }));

    // Filter
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        result = result.filter(c => c.name.toLowerCase().includes(lower) || c.email.toLowerCase().includes(lower));
    }

    // Sort
    result.sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
        else if (sortBy === 'value') cmp = a.totalValue - b.totalValue;
        else if (sortBy === 'health') cmp = b.healthScore - a.healthScore; // Highest issues first

        return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [clients, licenses, hardware, contracts, searchTerm, sortBy, sortOrder]);

  const handleEdit = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        notes: client.notes || ''
    });
    setEditingId(client.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm("Delete this client? This won't delete their assets, but they will be unlinked.")) {
          deleteClient(id);
      }
  };

  const handleSaveClient = () => {
    if (!formData.name || !formData.email) return;

    const clientData: Client = {
        id: editingId || `c-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        notes: formData.notes,
        activeLicenses: 0
    };

    if (editingId) {
        updateClient(clientData);
    } else {
        addClient(clientData);
    }
    
    setIsModalOpen(false);
    setFormData(initialFormState);
    setEditingId(null);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const toggleSort = (key: 'name' | 'value' | 'health') => {
      if (sortBy === key) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
      else {
          setSortBy(key);
          setSortOrder('desc'); // Default to desc for value/health usually better
      }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1 relative max-w-md">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
           <input 
             type="text" 
             placeholder="Search clients..." 
             className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
        <div className="flex gap-2">
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2">
                <span className="text-xs font-semibold text-gray-500 px-2">Sort by:</span>
                <button onClick={() => toggleSort('name')} className={`px-2 py-1.5 text-sm rounded ${sortBy==='name' ? 'bg-gray-100 font-bold' : 'text-gray-600'}`}>Name</button>
                <button onClick={() => toggleSort('value')} className={`px-2 py-1.5 text-sm rounded ${sortBy==='value' ? 'bg-gray-100 font-bold' : 'text-gray-600'}`}>Value</button>
                <button onClick={() => toggleSort('health')} className={`px-2 py-1.5 text-sm rounded ${sortBy==='health' ? 'bg-gray-100 font-bold' : 'text-gray-600'}`}>Health</button>
            </div>
            <Button icon={<Plus size={18}/>} onClick={() => { setEditingId(null); setFormData(initialFormState); setIsModalOpen(true); }}>Add Client</Button>
        </div>
      </div>

      {/* Client Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleSort('name')}>Client Name {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUp size={12} className="inline"/> : <ArrowDown size={12} className="inline"/>)}</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleSort('health')}>Health {sortBy === 'health' && (sortOrder === 'asc' ? <ArrowUp size={12} className="inline"/> : <ArrowDown size={12} className="inline"/>)}</th>
                <th className="px-6 py-4 text-center">Active Items</th>
                <th className="px-6 py-4 text-right cursor-pointer hover:bg-gray-50" onClick={() => toggleSort('value')}>Total Value {sortBy === 'value' && (sortOrder === 'asc' ? <ArrowUp size={12} className="inline"/> : <ArrowDown size={12} className="inline"/>)}</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {processedClients.map((client) => (
                  <tr 
                    key={client.id} 
                    className="hover:bg-gray-50 transition-colors group cursor-pointer"
                    onClick={() => onSelectClient && onSelectClient(client)}
                  >
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                             {client.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-bold text-darkGray group-hover:text-primary transition-colors">{client.name}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm text-darkGray">
                             <Mail size={14} className="text-mediumGray" />
                             {client.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-mediumGray">
                             <Phone size={14} />
                             {client.phone}
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                        {client.healthScore === 2 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> {client.expiredCount} Expired
                            </span>
                        ) : client.healthScore === 1 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-600"></span> {client.expiringCount} Expiring
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span> All Good
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className="text-sm font-medium text-darkGray">
                          {client.activeCount}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <span className="text-sm font-mono font-medium text-darkGray">{formatCurrency(client.totalValue)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => handleEdit(client, e)} className="p-2 hover:bg-gray-100 rounded text-mediumGray hover:text-primary transition-colors">
                             <Edit2 size={16} />
                          </button>
                          <button 
                             className="p-2 hover:bg-red-50 rounded text-mediumGray hover:text-danger transition-colors"
                             onClick={(e) => handleDelete(client.id, e)}
                          >
                             <Trash2 size={16} />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded text-mediumGray hover:text-primary transition-colors">
                             <ArrowRight size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              {processedClients.length === 0 && (
                 <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-mediumGray">
                       No clients found. Add your first client to get started.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-[500px] bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
             <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-darkGray">{editingId ? 'Edit Client' : 'Add New Client'}</h2>
                <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400" /></button>
             </div>
             
             <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveClient(); }}>
                <div className="space-y-2">
                   <label className="block text-sm font-semibold text-darkGray">Client Name *</label>
                   <input 
                     type="text" 
                     required
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                     placeholder="e.g. Acme Corp"
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <label className="block text-sm font-semibold text-darkGray">Contact Email *</label>
                   <input 
                     type="email" 
                     required
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                     placeholder="contact@company.com"
                     value={formData.email}
                     onChange={e => setFormData({...formData, email: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <label className="block text-sm font-semibold text-darkGray">Phone Number</label>
                   <input 
                     type="tel" 
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                     placeholder="+1 555-0000"
                     value={formData.phone}
                     onChange={e => setFormData({...formData, phone: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <label className="block text-sm font-semibold text-darkGray">Notes</label>
                   <textarea 
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                     rows={4}
                     placeholder="Additional details..."
                     value={formData.notes}
                     onChange={e => setFormData({...formData, notes: e.target.value})}
                   />
                </div>

                <div className="flex gap-3 pt-4">
                   <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                   <Button type="submit" className="flex-1">{editingId ? 'Save Changes' : 'Save Client'}</Button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

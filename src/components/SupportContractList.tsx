
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, Edit2, Trash2, Paperclip, Server, FileText, User as UserIcon, Columns, Check, Download, ChevronDown, FileSpreadsheet, File as FileIcon, Printer } from 'lucide-react';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';
import { SupportContract, UserRole, Client } from '../types';
import { useData } from '../context/DataContext';
import { PROVIDERS, CONTRACT_TYPES, TEAM_MEMBERS, STATUS_FILTERS, MOCK_USER } from '../constants';
import { CreatableSelect } from './CreatableSelect';

interface SupportContractListProps {
  userRole?: UserRole;
  actionItem?: { view: string; id: string } | null;
  onActionComplete?: () => void;
}

export const SupportContractList: React.FC<SupportContractListProps> = ({ userRole, actionItem, onActionComplete }) => {
  const { contracts, addContract, updateContract, deleteContract, clients, addClient } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('All Providers');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [showMyContractsOnly, setShowMyContractsOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Column Visibility State
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  // Export Menu State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [visibleColumns, setVisibleColumns] = useState({
    client: userRole === 'INTEGRATOR',
    responsible: true,
    contractId: true,
    vendorRef: true,
    provider: true,
    type: true,
    assets: true,
    expiration: true,
    file: true,
    status: true,
    cost: true,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
        setShowColumnMenu(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [columnMenuRef, exportMenuRef]);

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const initialFormState = {
     name: '',
     provider: '',
     vendorContractNumber: '',
     client: '',
     clientContact: '',
     type: '',
     startDate: '',
     expiration: '',
     cost: '',
     billingFreq: 'Annual',
     autoRenewal: false,
     responsibleName: '',
     assetsDesc: 'No assets linked'
  };

  const [formData, setFormData] = useState(initialFormState);
  
  // Asset counters for the description helper
  const [softwareCount, setSoftwareCount] = useState(0);
  const [hardwareCount, setHardwareCount] = useState(0);

  // Client names for dropdown
  const clientOptions = clients.map(c => c.name);

  const nextId = `CT-${new Date().getFullYear()}-${String(contracts.length + 1).padStart(3, '0')}`;

  // Handle incoming actions
  useEffect(() => {
    if (actionItem && actionItem.view === 'support-contracts' && actionItem.id) {
        const itemToEdit = contracts.find(c => c.id === actionItem.id);
        if (itemToEdit) {
            handleEdit(itemToEdit);
        }
        if (onActionComplete) onActionComplete();
    }
  }, [actionItem, contracts]);

  // NEW: Handler to create a client on the fly
  const handleCreateClient = (newValue: string) => {
    const newClient: Client = {
      id: `c-${Date.now()}`,
      name: newValue,
      email: '', 
      phone: '',
      activeLicenses: 0
    };
    addClient(newClient); 
    setFormData(prev => ({ ...prev, client: newValue })); 
  };

  const handleEdit = (contract: SupportContract) => {
    setFormData({
        name: contract.contractName,
        provider: contract.provider,
        vendorContractNumber: contract.vendorContractNumber || '',
        client: contract.client || '',
        clientContact: contract.clientContact || '',
        type: contract.type,
        startDate: contract.startDate,
        expiration: contract.expirationDate,
        cost: contract.annualCost.toString(),
        billingFreq: contract.billingFrequency,
        autoRenewal: contract.autoRenewal,
        responsibleName: contract.responsibleName || '',
        assetsDesc: contract.assetsDescription
    });
    setEditingId(contract.id);
    setIsModalOpen(true);
  };

  // Helper to update asset description string
  const incrementAssets = (type: 'software' | 'hardware') => {
      let s = softwareCount;
      let h = hardwareCount;
      
      // Reset counters if description looks new or empty
      if (formData.assetsDesc === 'No assets linked') {
          s = 0; h = 0;
      }

      if (type === 'software') s++;
      if (type === 'hardware') h++;
      
      setSoftwareCount(s);
      setHardwareCount(h);
      
      const parts = [];
      if (s > 0) parts.push(`${s} Software`);
      if (h > 0) parts.push(`${h} Hardware`);
      
      setFormData({ ...formData, assetsDesc: parts.join(', ') });
  };

  const handleSaveContract = () => {
    // Status Logic
    const now = new Date();
    const exp = new Date(formData.expiration);
    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let status: 'Active' | 'Expiring' | 'Expired' = 'Active';
    if (diffDays < 0) status = 'Expired';
    else if (diffDays <= 30) status = 'Expiring';

    const newContract: SupportContract = {
        id: editingId || `sc-${Date.now()}`,
        contractId: editingId ? contracts.find(c => c.id === editingId)?.contractId || nextId : nextId,
        vendorContractNumber: formData.vendorContractNumber,
        contractName: formData.name,
        provider: formData.provider,
        client: formData.client,
        clientContact: formData.clientContact,
        type: formData.type,
        assetsDescription: formData.assetsDesc,
        startDate: formData.startDate,
        expirationDate: formData.expiration,
        status: status,
        annualCost: parseFloat(formData.cost) || 0,
        billingFrequency: formData.billingFreq as any,
        autoRenewal: formData.autoRenewal,
        responsibleName: formData.responsibleName
    };

    if (editingId) {
        updateContract(newContract);
    } else {
        addContract(newContract);
    }
    setIsModalOpen(false);
    setFormData(initialFormState);
    setSoftwareCount(0);
    setHardwareCount(0);
    setEditingId(null);
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.contractName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.contractId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.vendorContractNumber && c.vendorContractNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesProvider = providerFilter === 'All Providers' || c.provider === providerFilter;
    const matchesStatus = statusFilter === 'All Status' || c.status === statusFilter;
    const matchesResponsibility = !showMyContractsOnly || c.responsibleName === MOCK_USER.name;

    return matchesSearch && matchesProvider && matchesStatus && matchesResponsibility;
  });

  // Export Function
  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (format === 'pdf') {
      window.print();
      return;
    }

    const headers = ['Contract Name', 'Provider', 'Type', 'Expiration', 'Status', 'Annual Cost'];
    const csvContent = [
      headers.join(','),
      ...filteredContracts.map(c => 
        [`"${c.contractName}"`, `"${c.provider}"`, `"${c.type}"`, c.expirationDate, c.status, c.annualCost].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SupportContracts_Export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setShowExportMenu(false);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  const getInitials = (name: string) => name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
       {/* Controls */}
       <div className="flex flex-col xl:flex-row justify-between gap-4">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Search contracts..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <button 
                onClick={() => setShowMyContractsOnly(!showMyContractsOnly)}
                className={`px-3 py-2 border rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    showMyContractsOnly ? 'bg-primary text-white border-primary' : 'bg-white text-mediumGray border-gray-200 hover:bg-gray-50'
                }`}
            >
                <UserIcon size={16} />
                <span className="hidden sm:inline">My Contracts</span>
            </button>
            <div className="h-6 w-px bg-gray-200 mx-1"></div>
            <select 
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}
            >
                <option value="All Providers">All Providers</option>
                {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select 
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            >
                {STATUS_FILTERS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Columns Selector */}
            <div className="relative" ref={columnMenuRef}>
                <button 
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 text-darkGray flex items-center gap-2"
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                >
                    <Columns size={16} />
                    <span className="hidden sm:inline">Columns</span>
                </button>
                {showColumnMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-3 border-b border-gray-100 bg-gray-50"><h4 className="text-xs font-bold text-gray-500 uppercase">Visible Columns</h4></div>
                        <div className="p-2 max-h-60 overflow-y-auto">
                            {Object.keys(visibleColumns).map(key => (
                                <label key={key} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer capitalize">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${visibleColumns[key as keyof typeof visibleColumns] ? 'bg-primary border-primary text-white' : 'border-gray-300'}`}>
                                        {visibleColumns[key as keyof typeof visibleColumns] && <Check size={10} />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={visibleColumns[key as keyof typeof visibleColumns]} onChange={() => toggleColumn(key as keyof typeof visibleColumns)} />
                                    <span className="text-sm text-darkGray">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Export Dropdown */}
            <div className="relative" ref={exportMenuRef}>
                <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                >
                <Download size={18} />
                Export
                <ChevronDown size={14} className={`transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-2 space-y-1">
                            <button onClick={() => handleExport('csv')} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                <FileIcon size={16} className="text-blue-500" />
                                <span>Export as CSV</span>
                            </button>
                            <button onClick={() => handleExport('excel')} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                <FileSpreadsheet size={16} className="text-green-600" />
                                <span>Export for Excel</span>
                            </button>
                            <button onClick={() => handleExport('pdf')} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                <Printer size={16} className="text-gray-500" />
                                <span>Print / PDF</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Button icon={<Plus size={18}/>} onClick={() => { setEditingId(null); setFormData(initialFormState); setIsModalOpen(true); setSoftwareCount(0); setHardwareCount(0); }}>Add Contract</Button>
          </div>
       </div>
       
       <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                    {visibleColumns.responsible && <th className="px-6 py-4">Responsible</th>}
                    {userRole === 'INTEGRATOR' && visibleColumns.client && <th className="px-6 py-4">Client</th>}
                    {visibleColumns.contractId && <th className="px-6 py-4">Contract ID</th>}
                    {visibleColumns.vendorRef && <th className="px-6 py-4">Vendor Ref #</th>}
                    {visibleColumns.provider && <th className="px-6 py-4">Provider</th>}
                    {visibleColumns.type && <th className="px-6 py-4">Type</th>}
                    {visibleColumns.assets && <th className="px-6 py-4">Assets Covered</th>}
                    {visibleColumns.expiration && <th className="px-6 py-4">Expiration</th>}
                    {visibleColumns.file && <th className="px-6 py-4 text-center">File</th>}
                    {visibleColumns.status && <th className="px-6 py-4">Status</th>}
                    {visibleColumns.cost && <th className="px-6 py-4 text-right">Annual Cost</th>}
                    <th className="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {filteredContracts.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                        {visibleColumns.responsible && <td className="px-6 py-4 text-sm text-darkGray">{c.responsibleName ? <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-bold border border-gray-200">{getInitials(c.responsibleName)}</div><span className="truncate max-w-[120px]">{c.responsibleName}</span></div> : <span className="text-gray-300 text-xs italic">Unassigned</span>}</td>}
                        {userRole === 'INTEGRATOR' && visibleColumns.client && <td className="px-6 py-4 text-sm font-medium text-darkGray">{c.client || '-'}</td>}
                        {visibleColumns.contractId && <td className="px-6 py-4 font-bold text-darkGray text-sm">{c.contractId}</td>}
                        {visibleColumns.vendorRef && <td className="px-6 py-4 text-sm font-mono text-mediumGray">{c.vendorContractNumber || '-'}</td>}
                        {visibleColumns.provider && <td className="px-6 py-4 text-sm text-mediumGray">{c.provider}</td>}
                        {visibleColumns.type && <td className="px-6 py-4 text-sm text-mediumGray">{c.type}</td>}
                        {visibleColumns.assets && <td className="px-6 py-4 text-sm text-primary hover:underline cursor-pointer">{c.assetsDescription}</td>}
                        {visibleColumns.expiration && <td className="px-6 py-4 text-sm font-mono text-mediumGray">{c.expirationDate}</td>}
                        {visibleColumns.file && <td className="px-6 py-4 text-center">{c.hasAttachment ? <Paperclip size={16} className="text-primary" /> : '-'}</td>}
                        {visibleColumns.status && <td className="px-6 py-4"><StatusBadge status={c.status} /></td>}
                        {visibleColumns.cost && <td className="px-6 py-4 text-sm text-right font-medium text-darkGray">{formatCurrency(c.annualCost)}</td>}
                        <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(c)} className="p-1.5 hover:bg-gray-100 rounded text-mediumGray hover:text-primary transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => deleteContract(c.id)} className="p-1.5 hover:bg-red-50 rounded text-mediumGray hover:text-danger transition-colors"><Trash2 size={16}/></button>
                           </div>
                        </td>
                    </tr>
                ))}
                {filteredContracts.length === 0 && <tr><td colSpan={12} className="px-6 py-12 text-center text-mediumGray">No contracts found.</td></tr>}
            </tbody>
        </table>
        </div>
       </div>

       {isModalOpen && (
           <div className="fixed inset-0 z-50 flex justify-end">
               <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
               <div className="relative w-full max-w-[600px] bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
                   <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold text-darkGray">{editingId ? 'Edit Contract' : 'Add Support Contract'}</h2>
                      <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400" /></button>
                   </div>
                   <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveContract(); }}>
                       
                       <div className="bg-gray-50 p-3 rounded border border-gray-200">
                          <label className="text-xs font-bold text-gray-500 uppercase">Contract ID (Internal)</label>
                          <div className="text-lg font-mono font-bold text-darkGray">{editingId ? contracts.find(c => c.id === editingId)?.contractId : nextId}</div>
                       </div>

                       {/* Client Dropdown for Integrators */}
                       {userRole === 'INTEGRATOR' && (
                            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        {/* REPLACED: Native Select with CreatableSelect for Clients */}
                                        <CreatableSelect 
                                            label="Client"
                                            options={clientOptions}
                                            value={formData.client}
                                            onChange={(val) => setFormData({...formData, client: val})}
                                            onCreateOption={handleCreateClient}
                                            placeholder="Select or create client"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                         <label className="block text-sm font-semibold text-darkGray">Client Contact</label>
                                         <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. John Doe" value={formData.clientContact} onChange={(e) => setFormData({...formData, clientContact: e.target.value})} />
                                     </div>
                                </div>
                            </div>
                       )}

                       <div className="space-y-2">
                           <label className="block text-sm font-semibold text-darkGray">Vendor Contract #</label>
                           <input className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="e.g. CISCO-12345-X" value={formData.vendorContractNumber} onChange={e => setFormData({...formData, vendorContractNumber: e.target.value})} />
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                           <CreatableSelect label="Provider" options={PROVIDERS} value={formData.provider} onChange={(val) => setFormData({...formData, provider: val})} onCreateOption={() => {}} required />
                           <CreatableSelect label="Contract Type" options={CONTRACT_TYPES} value={formData.type} onChange={(val) => setFormData({...formData, type: val})} onCreateOption={() => {}} required />
                       </div>

                       <input className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Contract Name / Description" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />

                       {/* Assets Section */}
                       <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-bold text-darkGray mb-3">Covered Assets (Optional)</h4>
                          <div className="flex gap-3 mb-4">
                             <button type="button" onClick={() => incrementAssets('software')} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded text-sm text-mediumGray hover:border-primary hover:text-primary transition"><Plus size={14}/> Add Software</button>
                             <button type="button" onClick={() => incrementAssets('hardware')} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded text-sm text-mediumGray hover:border-primary hover:text-primary transition"><Plus size={14}/> Add Hardware</button>
                          </div>
                          <div className="flex items-center gap-2">
                             <input 
                                className="text-sm text-darkGray bg-transparent border-none focus:ring-0 w-full"
                                value={formData.assetsDesc}
                                readOnly
                             />
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                           <div><label className="text-sm font-semibold">Start Date</label><input type="date" className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} /></div>
                           <div><label className="text-sm font-semibold text-danger">Expiration *</label><input type="date" className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={formData.expiration} onChange={e => setFormData({...formData, expiration: e.target.value})} required /></div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                           <div><label className="text-sm font-semibold">Annual Cost</label><input type="number" className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} /></div>
                           <div>
                               <label className="text-sm font-semibold">Billing Frequency</label>
                               <select className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white" value={formData.billingFreq} onChange={e => setFormData({...formData, billingFreq: e.target.value})}>
                                   <option>Annual</option><option>Quarterly</option><option>Monthly</option><option>One-time</option>
                               </select>
                           </div>
                       </div>

                       <div className="flex items-center justify-between pt-2">
                            <label className="text-sm font-semibold text-darkGray">Auto-Renewal</label>
                            <div className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition ${formData.autoRenewal ? 'bg-primary' : 'bg-gray-200'}`} onClick={() => setFormData({...formData, autoRenewal: !formData.autoRenewal})}>
                                <span className={`block w-6 h-6 bg-white rounded-full shadow transform transition ${formData.autoRenewal ? 'translate-x-6' : 'translate-x-0'}`}></span>
                            </div>
                       </div>

                       <CreatableSelect label="Assigned To" options={TEAM_MEMBERS} value={formData.responsibleName} onChange={(val) => setFormData({...formData, responsibleName: val})} onCreateOption={() => {}} />

                       <div className="flex gap-3 pt-4">
                          <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                          <Button type="submit" className="flex-1">{editingId ? 'Save Changes' : 'Save Contract'}</Button>
                       </div>
                   </form>
               </div>
           </div>
       )}
    </div>
  );
};

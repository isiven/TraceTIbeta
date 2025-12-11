
import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, X, Edit2, Trash2, Columns, Check, Paperclip, FileText as NoteIcon, User as UserIcon, Server, Download, ChevronDown, FileSpreadsheet, File as FileIcon, Printer } from 'lucide-react';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';
import { MANUFACTURERS, PROVIDERS, STATUS_FILTERS, HARDWARE_TYPES, MOCK_USER, TEAM_MEMBERS } from '../constants';
import { Hardware, UserRole, Client } from '../types';
import { CreatableSelect } from './CreatableSelect';
import { useData } from '../context/DataContext';

interface HardwareListProps {
  userRole?: UserRole;
  actionItem?: { view: string; id: string } | null;
  onActionComplete?: () => void;
}

export const HardwareList: React.FC<HardwareListProps> = ({ userRole, actionItem, onActionComplete }) => {
  const { hardware, addHardware, updateHardware, deleteHardware, clients, addClient } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('All Manufacturers');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [showMyHardwareOnly, setShowMyHardwareOnly] = useState(false);
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
    type: true,
    manufacturer: true,
    model: true,
    serial: true,
    warranty: true,
    location: true,
    status: true,
    cost: true,
    file: true,
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

  // Lists for Creatable Selects
  const [availableTypes, setAvailableTypes] = useState(HARDWARE_TYPES);
  const [availableManufacturers, setAvailableManufacturers] = useState(MANUFACTURERS.filter(m => m !== 'All Manufacturers'));
  const [availableProviders, setAvailableProviders] = useState(PROVIDERS);
  const [availableTeamMembers, setAvailableTeamMembers] = useState(TEAM_MEMBERS);

  // Client names for dropdown
  const clientOptions = clients.map(c => c.name);

  // Form State
  const initialFormState = {
    hardwareType: '',
    manufacturer: '',
    provider: '',
    client: '',
    clientContact: '',
    model: '',
    serialNumber: '',
    quantity: 1,
    purchaseDate: '',
    warrantyExpiration: '',
    location: '',
    purchaseCost: '',
    supportIncluded: false,
    supportProvider: '',
    supportExpiration: '',
    supportCost: '',
    notes: '',
    responsibleName: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [attachment, setAttachment] = useState<File | null>(null);

  // Handle incoming actions
  useEffect(() => {
    if (actionItem && actionItem.view === 'hardware' && actionItem.id) {
        const itemToEdit = hardware.find(h => h.id === actionItem.id);
        if (itemToEdit) {
            handleEdit(itemToEdit);
        }
        if (onActionComplete) onActionComplete();
    }
  }, [actionItem, hardware]);

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

  const handleEdit = (item: Hardware) => {
    setFormData({
        hardwareType: item.hardwareType,
        manufacturer: item.manufacturer,
        provider: item.provider || '',
        client: item.client || '',
        clientContact: item.clientContact || '',
        model: item.model,
        serialNumber: item.serialNumber,
        quantity: item.quantity,
        purchaseDate: item.purchaseDate || '',
        warrantyExpiration: item.warrantyExpiration,
        location: item.location,
        purchaseCost: item.purchaseCost.toString(),
        supportIncluded: item.supportIncluded,
        supportProvider: item.supportProvider || '',
        supportExpiration: item.supportExpiration || '',
        supportCost: item.supportCost?.toString() || '',
        notes: item.notes || '',
        responsibleName: item.responsibleName || ''
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleSaveHardware = () => {
    const now = new Date();
    const exp = new Date(formData.warrantyExpiration);
    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let status: 'Active' | 'Expiring' | 'Expired' = 'Active';
    if (diffDays < 0) status = 'Expired';
    else if (diffDays <= 30) status = 'Expiring';

    const itemData: Hardware = {
        id: editingId || `h-${Date.now()}`,
        hardwareType: formData.hardwareType,
        manufacturer: formData.manufacturer,
        model: formData.model,
        serialNumber: formData.serialNumber,
        provider: formData.provider,
        client: formData.client,
        clientContact: formData.clientContact,
        quantity: formData.quantity,
        purchaseDate: formData.purchaseDate,
        warrantyExpiration: formData.warrantyExpiration,
        location: formData.location,
        purchaseCost: parseFloat(formData.purchaseCost.toString()) || 0,
        status: status,
        supportIncluded: formData.supportIncluded,
        supportProvider: formData.supportProvider,
        supportExpiration: formData.supportExpiration,
        supportCost: parseFloat(formData.supportCost.toString()) || 0,
        notes: formData.notes,
        hasAttachment: !!attachment,
        responsibleName: formData.responsibleName
    };

    if (editingId) {
        updateHardware(itemData);
    } else {
        addHardware(itemData);
    }
    setIsModalOpen(false);
    setFormData(initialFormState);
    setEditingId(null);
  };

  const filteredHardware = hardware.filter(h => {
    const matchesSearch = h.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          h.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesManufacturer = manufacturerFilter === 'All Manufacturers' || h.manufacturer === manufacturerFilter;
    const matchesStatus = statusFilter === 'All Status' || h.status === statusFilter;
    const matchesResponsibility = !showMyHardwareOnly || h.responsibleName === MOCK_USER.name;
    return matchesSearch && matchesManufacturer && matchesStatus && matchesResponsibility;
  });

  // Export Function
  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (format === 'pdf') {
      window.print();
      return;
    }

    const headers = ['Type', 'Manufacturer', 'Model', 'Serial #', 'Location', 'Warranty Expiration', 'Status', 'Purchase Cost'];
    const csvContent = [
      headers.join(','),
      ...filteredHardware.map(h => 
        [`"${h.hardwareType}"`, `"${h.manufacturer}"`, `"${h.model}"`, `"${h.serialNumber}"`, `"${h.location || ''}"`, h.warrantyExpiration, h.status, h.purchaseCost].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hardware_Export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setShowExportMenu(false);
  };

  const getInitials = (name: string) => name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
       {/* Controls */}
       <div className="flex flex-col xl:flex-row justify-between gap-4">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search hardware..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button 
             onClick={() => setShowMyHardwareOnly(!showMyHardwareOnly)}
             className={`px-3 py-2 border rounded-lg text-sm flex items-center gap-2 transition-colors ${
                 showMyHardwareOnly ? 'bg-primary text-white border-primary' : 'bg-white text-mediumGray border-gray-200 hover:bg-gray-50'
             }`}
          >
             <UserIcon size={16} />
             <span className="hidden sm:inline">My Hardware</span>
          </button>
          <div className="h-6 w-px bg-gray-200 mx-1"></div>
          <select 
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            value={manufacturerFilter} onChange={(e) => setManufacturerFilter(e.target.value)}
          >
            {MANUFACTURERS.map(m => <option key={m} value={m}>{m}</option>)}
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
                                <span className="text-sm text-darkGray">{key}</span>
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

          <Button icon={<Plus size={18} />} onClick={() => { setEditingId(null); setFormData(initialFormState); setIsModalOpen(true); }}>Add Hardware</Button>
        </div>
      </div>

       {/* Table */}
       <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                    {userRole === 'INTEGRATOR' && visibleColumns.client && <th className="px-6 py-4">Client</th>}
                    {visibleColumns.responsible && <th className="px-6 py-4">Responsible</th>}
                    {visibleColumns.type && <th className="px-6 py-4">Type</th>}
                    {visibleColumns.manufacturer && <th className="px-6 py-4">Manufacturer</th>}
                    {visibleColumns.model && <th className="px-6 py-4">Model</th>}
                    {visibleColumns.serial && <th className="px-6 py-4">Serial #</th>}
                    {visibleColumns.warranty && <th className="px-6 py-4">Warranty</th>}
                    {visibleColumns.file && <th className="px-6 py-4 text-center">File</th>}
                    {visibleColumns.status && <th className="px-6 py-4">Status</th>}
                    {visibleColumns.location && <th className="px-6 py-4">Location</th>}
                    {visibleColumns.cost && <th className="px-6 py-4 text-right">Cost</th>}
                    <th className="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {filteredHardware.map(h => (
                    <tr key={h.id} className="hover:bg-gray-50 transition-colors group">
                        {userRole === 'INTEGRATOR' && visibleColumns.client && <td className="px-6 py-4 text-sm font-medium text-darkGray">{h.client || '-'}</td>}
                        {visibleColumns.responsible && <td className="px-6 py-4 text-sm text-darkGray">{h.responsibleName ? <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-bold border border-gray-200">{getInitials(h.responsibleName)}</div><span className="truncate max-w-[120px]">{h.responsibleName}</span></div> : <span className="text-gray-300 text-xs italic">Unassigned</span>}</td>}
                        {visibleColumns.type && <td className="px-6 py-4 text-sm text-darkGray font-medium">{h.hardwareType}</td>}
                        {visibleColumns.manufacturer && <td className="px-6 py-4 text-sm text-mediumGray">{h.manufacturer}</td>}
                        {visibleColumns.model && <td className="px-6 py-4 text-sm text-darkGray font-medium">{h.model}</td>}
                        {visibleColumns.serial && <td className="px-6 py-4 text-sm text-mediumGray font-mono">{h.serialNumber}</td>}
                        {visibleColumns.warranty && <td className="px-6 py-4 text-sm text-mediumGray font-mono">{h.warrantyExpiration}</td>}
                        {visibleColumns.file && <td className="px-6 py-4 text-center">{h.hasAttachment ? <Paperclip size={16} className="text-primary" /> : '-'}</td>}
                        {visibleColumns.status && <td className="px-6 py-4"><StatusBadge status={h.status} /></td>}
                        {visibleColumns.location && <td className="px-6 py-4 text-sm text-mediumGray">{h.location}</td>}
                        {visibleColumns.cost && <td className="px-6 py-4 text-sm text-darkGray text-right font-medium">{formatCurrency(h.purchaseCost)}</td>}
                        <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(h)} className="p-1.5 hover:bg-gray-100 rounded text-mediumGray hover:text-primary transition-colors"><Edit2 size={16} /></button>
                                <button className="p-1.5 hover:bg-red-50 rounded text-mediumGray hover:text-danger transition-colors" onClick={() => deleteHardware(h.id)}><Trash2 size={16} /></button>
                            </div>
                        </td>
                    </tr>
                ))}
                {filteredHardware.length === 0 && <tr><td colSpan={12} className="px-6 py-12 text-center text-mediumGray">No hardware found.</td></tr>}
            </tbody>
        </table>
        </div>
       </div>

       {/* Add Hardware Modal */}
       {isModalOpen && (
           <div className="fixed inset-0 z-50 flex justify-end">
               <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
               <div className="relative w-full max-w-[500px] bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
                   <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold text-darkGray">{editingId ? 'Edit Hardware' : 'Add New Hardware'}</h2>
                      <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400" /></button>
                   </div>
                   <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveHardware(); }}>
                       <CreatableSelect label="Hardware Type" options={availableTypes} value={formData.hardwareType} onChange={(val) => setFormData({...formData, hardwareType: val})} onCreateOption={(v) => setAvailableTypes([...availableTypes, v])} required />
                       <div className="grid grid-cols-2 gap-4">
                           <CreatableSelect label="Manufacturer" options={availableManufacturers} value={formData.manufacturer} onChange={(val) => setFormData({...formData, manufacturer: val})} onCreateOption={(v) => setAvailableManufacturers([...availableManufacturers, v])} required />
                           <CreatableSelect label="Provider" options={availableProviders} value={formData.provider} onChange={(val) => setFormData({...formData, provider: val})} onCreateOption={(v) => setAvailableProviders([...availableProviders, v])} />
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

                       <input className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Model (e.g. PowerEdge R740)" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} required />
                       <input className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Serial Number" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} required />
                       
                       <CreatableSelect label="Assigned To" options={availableTeamMembers} value={formData.responsibleName} onChange={(val) => setFormData({...formData, responsibleName: val})} onCreateOption={(v) => setAvailableTeamMembers([...availableTeamMembers, v])} />
                       
                       <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-sm font-semibold">Quantity</label><input type="number" className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} /></div>
                            <div><label className="text-sm font-semibold">Purchase Date</label><input type="date" className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={formData.purchaseDate} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} /></div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-sm font-semibold text-danger">Warranty Expiration *</label><input type="date" className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={formData.warrantyExpiration} onChange={e => setFormData({...formData, warrantyExpiration: e.target.value})} required /></div>
                            <div><label className="text-sm font-semibold">Location</label><input className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="e.g. Data Center A" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></div>
                       </div>

                       {/* Support Toggle */}
                       <div className="space-y-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                              <label className="text-sm font-semibold text-darkGray">Support Included?</label>
                              <div className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition ${formData.supportIncluded ? 'bg-primary' : 'bg-gray-200'}`} onClick={() => setFormData({...formData, supportIncluded: !formData.supportIncluded})}>
                                  <span className={`block w-6 h-6 bg-white rounded-full shadow transform transition ${formData.supportIncluded ? 'translate-x-6' : 'translate-x-0'}`}></span>
                              </div>
                          </div>
                          {formData.supportIncluded && (
                             <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4 animate-in slide-in-from-top-2">
                                 <input className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Support Provider" value={formData.supportProvider} onChange={e => setFormData({...formData, supportProvider: e.target.value})} />
                                 <div className="grid grid-cols-2 gap-4">
                                     <input type="date" className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={formData.supportExpiration} onChange={e => setFormData({...formData, supportExpiration: e.target.value})} />
                                     <input type="number" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Cost" value={formData.supportCost} onChange={e => setFormData({...formData, supportCost: e.target.value})} />
                                 </div>
                             </div>
                          )}
                       </div>

                       <div className="space-y-2"><label className="text-sm font-semibold">Purchase Cost</label><input type="number" className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={formData.purchaseCost} onChange={e => setFormData({...formData, purchaseCost: e.target.value})} /></div>

                       <div className="flex gap-3 pt-4">
                          <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                          <Button type="submit" className="flex-1">{editingId ? 'Save Changes' : 'Add Hardware'}</Button>
                       </div>
                   </form>
               </div>
           </div>
       )}
    </div>
  );
};

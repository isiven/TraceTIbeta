
import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, X, Calendar, Edit2, Trash2, UploadCloud, FileText, Columns, Check, Paperclip, FileText as NoteIcon, User as UserIcon, Download, ChevronDown, FileSpreadsheet, File as FileIcon, Printer } from 'lucide-react';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';
import { VENDORS, PROVIDERS, STATUS_FILTERS, SOFTWARE_NAMES, SUPPORT_NAMES, MOCK_USER, TEAM_MEMBERS } from '../constants';
import { License, UserRole, Client } from '../types';
import { CreatableSelect } from './CreatableSelect';
import { useData } from '../context/DataContext';

interface LicenseListProps {
  userRole: UserRole;
  actionItem?: { view: string; id: string } | null;
  onActionComplete?: () => void;
}

export const LicenseList: React.FC<LicenseListProps> = ({ userRole, actionItem, onActionComplete }) => {
  const { licenses, addLicense, deleteLicense, updateLicense, clients, addClient } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('All Vendors');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [showMyLicensesOnly, setShowMyLicensesOnly] = useState(false);
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
    clientContact: false,
    contractNumber: true,
    responsible: true,
    software: true,
    vendor: true,
    provider: true, 
    quantity: true,
    expiration: true,
    status: true,
    cost: true,
    support: false,
    notes: false,
    attachment: true,
  });

  // Close menus when clicking outside
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
  const [availableSoftwares, setAvailableSoftwares] = useState(SOFTWARE_NAMES);
  const [availableVendors, setAvailableVendors] = useState(VENDORS.filter(v => v !== 'All Vendors'));
  const [availableProviders, setAvailableProviders] = useState(PROVIDERS);
  const [availableSupportNames, setAvailableSupportNames] = useState(SUPPORT_NAMES);
  const [availableTeamMembers, setAvailableTeamMembers] = useState(TEAM_MEMBERS);

  // Client names for dropdown
  const clientOptions = clients.map(c => c.name);

  // Form State
  const initialFormState = {
    softwareName: '',
    vendor: '',
    provider: '',
    client: '',
    clientContact: '',
    contractNumber: '',
    quantity: 1,
    expirationDate: '',
    supportIncluded: false,
    supportName: '',
    supportExpiration: '',
    supportCost: '',
    annualCost: '',
    notes: '',
    responsibleName: '' 
  };
  const [formData, setFormData] = useState(initialFormState);

  // File Upload State
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle incoming actions (e.g. from Dashboard)
  useEffect(() => {
    if (actionItem && actionItem.view === 'licenses' && actionItem.id) {
        const itemToEdit = licenses.find(l => l.id === actionItem.id);
        if (itemToEdit) {
            handleEdit(itemToEdit);
        }
        if (onActionComplete) onActionComplete();
    }
  }, [actionItem, licenses]);

  // Filter Logic
  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = license.softwareName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (license.client && license.client.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (license.contractNumber && license.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesVendor = vendorFilter === 'All Vendors' || license.vendor === vendorFilter;
    const matchesStatus = statusFilter === 'All Status' || license.status === statusFilter;
    const matchesResponsibility = !showMyLicensesOnly || license.responsibleName === MOCK_USER.name;

    return matchesSearch && matchesVendor && matchesStatus && matchesResponsibility;
  });

  // Export Function
  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (format === 'pdf') {
      window.print();
      return;
    }

    const headers = ['Software Name', 'Vendor', 'Provider', 'Client', 'Contract #', 'Quantity', 'Expiration', 'Status', 'Annual Cost'];
    const csvContent = [
      headers.join(','),
      ...filteredLicenses.map(l => 
        [`"${l.softwareName}"`, `"${l.vendor}"`, `"${l.provider || ''}"`, `"${l.client || ''}"`, `"${l.contractNumber || ''}"`, l.quantity, l.expirationDate, l.status, l.annualCost].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Licenses_Export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setShowExportMenu(false);
  };

  // Handlers for creating new options locally
  const handleCreateSoftware = (newValue: string) => {
    setAvailableSoftwares(prev => [...prev, newValue].sort());
    setFormData(prev => ({ ...prev, softwareName: newValue }));
  };
  const handleCreateVendor = (newValue: string) => {
    setAvailableVendors(prev => [...prev, newValue].sort());
    setFormData(prev => ({ ...prev, vendor: newValue }));
  };
  const handleCreateProvider = (newValue: string) => {
    setAvailableProviders(prev => [...prev, newValue].sort());
    setFormData(prev => ({ ...prev, provider: newValue }));
  };
  const handleCreateSupport = (newValue: string) => {
    setAvailableSupportNames(prev => [...prev, newValue].sort());
    setFormData(prev => ({ ...prev, supportName: newValue }));
  };
  const handleCreateResponsible = (newValue: string) => {
    setAvailableTeamMembers(prev => [...prev, newValue].sort());
    setFormData(prev => ({ ...prev, responsibleName: newValue }));
  };

  // NEW: Handler to create a client on the fly from the modal
  const handleCreateClient = (newValue: string) => {
    const newClient: Client = {
      id: `c-${Date.now()}`,
      name: newValue,
      email: '', // User can edit this later in Client module
      phone: '',
      activeLicenses: 0
    };
    addClient(newClient); // Add to global DB
    setFormData(prev => ({ ...prev, client: newValue })); // Select it
  };

  const handleEdit = (license: License) => {
    setFormData({
        softwareName: license.softwareName,
        vendor: license.vendor,
        provider: license.provider || '',
        client: license.client || '',
        clientContact: license.clientContact || '',
        contractNumber: license.contractNumber || '',
        quantity: license.quantity,
        expirationDate: license.expirationDate,
        supportIncluded: license.supportIncluded,
        supportName: license.supportName || '',
        supportExpiration: license.supportExpiration || '',
        supportCost: license.supportCost?.toString() || '',
        annualCost: license.annualCost.toString(),
        notes: license.notes || '',
        responsibleName: license.responsibleName || ''
    });
    setEditingId(license.id);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveLicense = () => {
    const now = new Date();
    const exp = new Date(formData.expirationDate);
    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let status: 'Active' | 'Expiring' | 'Expired' = 'Active';
    if (diffDays < 0) status = 'Expired';
    else if (diffDays <= 30) status = 'Expiring';

    const newLicense: License = {
        id: editingId || `l-${Date.now()}`,
        softwareName: formData.softwareName,
        vendor: formData.vendor,
        provider: formData.provider,
        client: formData.client,
        clientContact: formData.clientContact,
        contractNumber: formData.contractNumber,
        quantity: formData.quantity,
        expirationDate: formData.expirationDate,
        status: status,
        annualCost: parseFloat(formData.annualCost.toString()) || 0,
        supportIncluded: formData.supportIncluded,
        supportName: formData.supportName,
        supportExpiration: formData.supportExpiration,
        supportCost: parseFloat(formData.supportCost.toString()) || 0,
        notes: formData.notes,
        hasAttachment: !!attachment,
        responsibleName: formData.responsibleName
    };

    if (editingId) {
        updateLicense(newLicense);
    } else {
        addLicense(newLicense);
    }
    
    setIsModalOpen(false);
    setFormData(initialFormState);
    setEditingId(null);
    setAttachment(null);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const getInitials = (name: string) => name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6 relative min-h-[calc(100vh-140px)]">
      {/* Controls */}
      <div className="flex flex-col xl:flex-row justify-between gap-4">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search licenses, contracts..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button 
             onClick={() => setShowMyLicensesOnly(!showMyLicensesOnly)}
             className={`px-3 py-2 border rounded-lg text-sm flex items-center gap-2 transition-colors ${
                 showMyLicensesOnly ? 'bg-primary text-white border-primary' : 'bg-white text-mediumGray border-gray-200 hover:bg-gray-50'
             }`}
          >
             <UserIcon size={16} />
             <span className="hidden sm:inline">My Licenses</span>
          </button>
          <div className="h-6 w-px bg-gray-200 mx-1"></div>
          <select 
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)}
          >
            {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
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

          <Button icon={<Plus size={18} />} onClick={() => { setEditingId(null); setFormData(initialFormState); setIsModalOpen(true); }}>Add License</Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                {userRole === 'INTEGRATOR' && visibleColumns.client && <th className="px-6 py-4">Client</th>}
                {userRole === 'INTEGRATOR' && visibleColumns.clientContact && <th className="px-6 py-4">Client Contact</th>}
                {visibleColumns.responsible && <th className="px-6 py-4">Responsible</th>}
                {visibleColumns.software && <th className="px-6 py-4">Software</th>}
                {visibleColumns.contractNumber && <th className="px-6 py-4">Contract #</th>}
                {visibleColumns.vendor && <th className="px-6 py-4">Vendor</th>}
                {visibleColumns.provider && <th className="px-6 py-4">Provider</th>}
                {visibleColumns.quantity && <th className="px-6 py-4 text-center">Qty</th>}
                {visibleColumns.expiration && <th className="px-6 py-4">Expiration</th>}
                {visibleColumns.support && <th className="px-6 py-4">Support</th>}
                {visibleColumns.notes && <th className="px-6 py-4 text-center">Notes</th>}
                {visibleColumns.attachment && <th className="px-6 py-4 text-center">File</th>}
                {visibleColumns.status && <th className="px-6 py-4">Status</th>}
                {visibleColumns.cost && <th className="px-6 py-4 text-right">Cost</th>}
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLicenses.map((license) => (
                  <tr key={license.id} className="hover:bg-gray-50 transition-colors group">
                    {userRole === 'INTEGRATOR' && visibleColumns.client && <td className="px-6 py-4 text-sm font-medium text-darkGray">{license.client}</td>}
                    {userRole === 'INTEGRATOR' && visibleColumns.clientContact && <td className="px-6 py-4 text-sm text-mediumGray">{license.clientContact || '-'}</td>}
                    {visibleColumns.responsible && <td className="px-6 py-4 text-sm text-darkGray">{license.responsibleName ? <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-bold border border-gray-200">{getInitials(license.responsibleName)}</div><span className="truncate max-w-[120px]">{license.responsibleName}</span></div> : <span className="text-gray-300 text-xs italic">Unassigned</span>}</td>}
                    {visibleColumns.software && <td className="px-6 py-4 text-sm text-darkGray font-medium">{license.softwareName}</td>}
                    {visibleColumns.contractNumber && <td className="px-6 py-4 text-sm text-mediumGray font-mono">{license.contractNumber || '-'}</td>}
                    {visibleColumns.vendor && <td className="px-6 py-4 text-sm text-mediumGray">{license.vendor}</td>}
                    {visibleColumns.provider && <td className="px-6 py-4 text-sm text-mediumGray">{license.provider || '-'}</td>}
                    {visibleColumns.quantity && <td className="px-6 py-4 text-sm text-mediumGray text-center">{license.quantity}</td>}
                    {visibleColumns.expiration && <td className="px-6 py-4 text-sm text-mediumGray font-mono">{license.expirationDate}</td>}
                    {visibleColumns.support && <td className="px-6 py-4 text-sm text-mediumGray">{license.supportIncluded ? <div className="flex flex-col"><span className="text-darkGray font-medium text-xs">{license.supportName || 'Included'}</span>{license.supportExpiration && <span className="text-[10px] text-gray-400">Exp: {license.supportExpiration}</span>}</div> : <span className="text-gray-300 text-xs italic">None</span>}</td>}
                    {visibleColumns.notes && <td className="px-6 py-4 text-center">{license.notes ? <NoteIcon size={16} className="text-mediumGray" /> : '-'}</td>}
                    {visibleColumns.attachment && <td className="px-6 py-4 text-center">{license.hasAttachment ? <Paperclip size={16} className="text-primary" /> : '-'}</td>}
                    {visibleColumns.status && <td className="px-6 py-4"><StatusBadge status={license.status} /></td>}
                    {visibleColumns.cost && <td className="px-6 py-4 text-sm text-darkGray text-right font-medium">{formatCurrency(license.annualCost)}</td>}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(license)} className="p-1.5 hover:bg-gray-100 rounded text-mediumGray hover:text-primary transition-colors"><Edit2 size={16} /></button>
                        <button className="p-1.5 hover:bg-red-50 rounded text-mediumGray hover:text-danger transition-colors" onClick={() => deleteLicense(license.id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
              ))}
              {filteredLicenses.length === 0 && <tr><td colSpan={15} className="px-6 py-12 text-center text-mediumGray">No licenses found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add License Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-[500px] bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-darkGray">{editingId ? 'Edit License' : 'Add New License'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400" /></button>
            </div>
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveLicense(); }}>
              <CreatableSelect label="Software Name" options={availableSoftwares} value={formData.softwareName} onChange={(val) => setFormData({...formData, softwareName: val})} onCreateOption={handleCreateSoftware} required />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CreatableSelect label="Vendor" options={availableVendors} value={formData.vendor} onChange={(val) => setFormData({...formData, vendor: val})} onCreateOption={handleCreateVendor} required />
                <CreatableSelect label="Provider" options={availableProviders} value={formData.provider} onChange={(val) => setFormData({...formData, provider: val})} onCreateOption={handleCreateProvider} />
              </div>
              
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

              <CreatableSelect label="Assigned To" options={availableTeamMembers} value={formData.responsibleName} onChange={(val) => setFormData({...formData, responsibleName: val})} onCreateOption={handleCreateResponsible} />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="block text-sm font-semibold text-darkGray">Quantity *</label><input type="number" min="1" className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})} /></div>
                <div className="space-y-2"><label className="block text-sm font-semibold text-darkGray">Contract Number</label><input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Optional" value={formData.contractNumber} onChange={(e) => setFormData({...formData, contractNumber: e.target.value})} /></div>
              </div>
              
              <div className="space-y-2"><label className="block text-sm font-semibold text-darkGray">Expiration *</label><input type="date" className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={formData.expirationDate} onChange={(e) => setFormData({...formData, expirationDate: e.target.value})} /></div>
              <div className="space-y-2"><label className="block text-sm font-semibold text-darkGray">Annual Cost</label><input type="number" className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={formData.annualCost} onChange={(e) => setFormData({...formData, annualCost: e.target.value})} /></div>
              
               {/* Support Section */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-darkGray">Support Included?</label>
                      <div 
                        className={`relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer ${formData.supportIncluded ? 'bg-primary' : 'bg-gray-200'}`}
                        onClick={() => setFormData({...formData, supportIncluded: !formData.supportIncluded})}
                      >
                          <span className={`block w-6 h-6 bg-white rounded-full shadow border transform transition-transform duration-200 ease-in-out ${formData.supportIncluded ? 'translate-x-6' : 'translate-x-0'}`}></span>
                      </div>
                  </div>
                  {formData.supportIncluded && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
                        <CreatableSelect label="Support Type" options={availableSupportNames} value={formData.supportName} onChange={(val) => setFormData({...formData, supportName: val})} onCreateOption={handleCreateSupport} />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><label className="block text-sm font-semibold text-darkGray">Expiration</label><input type="date" className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={formData.supportExpiration} onChange={(e) => setFormData({...formData, supportExpiration: e.target.value})} /></div>
                            <div className="space-y-2"><label className="block text-sm font-semibold text-darkGray">Cost</label><input type="number" className="w-full px-4 py-3 border border-gray-300 rounded-lg" value={formData.supportCost} onChange={(e) => setFormData({...formData, supportCost: e.target.value})} /></div>
                        </div>
                    </div>
                  )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                 <label className="block text-sm font-semibold text-darkGray">Notes</label>
                 <textarea className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none" rows={3} placeholder="Renewal contact info, contract ID, etc." value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
              </div>

              {/* Attachment */}
              <div className="space-y-2">
                 <label className="block text-sm font-semibold text-darkGray">Attachment</label>
                 {!attachment ? (
                     <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 hover:border-primary transition-all group" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2 text-mediumGray group-hover:text-primary transition-colors">
                            <UploadCloud size={20} />
                        </div>
                        <p className="text-sm font-medium text-darkGray">Click to upload document</p>
                        <p className="text-xs text-mediumGray">PDF, PNG, JPG up to 10MB</p>
                     </div>
                 ) : (
                     <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white border border-gray-200 rounded flex items-center justify-center text-primary"><FileText size={16}/></div>
                            <span className="text-sm font-medium text-darkGray truncate max-w-[200px]">{attachment.name}</span>
                        </div>
                        <button type="button" onClick={handleRemoveFile} className="text-gray-400 hover:text-danger"><X size={18}/></button>
                     </div>
                 )}
                 <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              </div>

              <div className="flex gap-3 pt-4">
                 <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                 <Button type="submit" className="flex-1">{editingId ? 'Save Changes' : 'Save License'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

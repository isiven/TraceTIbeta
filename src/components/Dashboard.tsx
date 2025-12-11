
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileText,
  Server,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Download,
  Search,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
  FileSpreadsheet,
  File as FileIcon,
  Printer
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { UserRole, LicenseStatus } from '../types';
import { getDaysUntilExpiration } from '../utils/statusCalculator';

interface DashboardProps {
  userRole: UserRole;
  setCurrentPage: (page: string) => void;
  onNavigateToItem?: (view: string, id: string) => void;
}

// --- Helper Functions ---

const getDaysUntil = (dateString: string): number => {
  if (!dateString) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(dateString);
  expDate.setHours(0, 0, 0, 0);
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getStatusColor = (status: LicenseStatus): string => {
  switch(status) {
    case 'Active': return 'bg-green-100 text-green-800 border-green-200';
    case 'Expiring': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Expired': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const Dashboard: React.FC<DashboardProps> = ({ userRole, setCurrentPage, onNavigateToItem }) => {
  const { licenses, hardware, contracts, clients } = useData();
  
  // State for filters & export
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [clientFilter, setClientFilter] = useState('All');
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [exportMenuRef]);

  // --- Statistics Calculation ---

  const licenseStats = useMemo(() => ({
    count: licenses.length,
    value: licenses.reduce((sum, l) => sum + (l.annualCost || 0), 0),
    expiring: licenses.filter(l => l.status === 'Expiring').length,
    expired: licenses.filter(l => l.status === 'Expired').length
  }), [licenses]);

  const hardwareStats = useMemo(() => ({
    count: hardware.length,
    value: hardware.reduce((sum, h) => sum + (h.purchaseCost || 0), 0),
    expiring: hardware.filter(h => h.status === 'Expiring').length,
    expired: hardware.filter(h => h.status === 'Expired').length
  }), [hardware]);

  const contractStats = useMemo(() => ({
    count: contracts.length,
    value: contracts.reduce((sum, c) => sum + (c.annualCost || 0), 0),
    expiring: contracts.filter(c => c.status === 'Expiring').length,
    expired: contracts.filter(c => c.status === 'Expired').length
  }), [contracts]);

  // --- Urgent Items Logic ---
  
  const urgentItems = useMemo(() => {
    const allItems = [
      ...licenses.map(l => ({ ...l, type: 'License', name: l.softwareName, date: l.expirationDate, value: l.annualCost, id: l.id })),
      ...hardware.map(h => ({ ...h, type: 'Hardware', name: `${h.manufacturer} ${h.model}`, date: h.warrantyExpiration, value: h.purchaseCost, id: h.id })),
      ...contracts.map(c => ({ ...c, type: 'Contract', name: c.contractName, date: c.expirationDate, value: c.annualCost, id: c.id }))
    ];

    const issues = allItems.filter(item => item.status === 'Expired' || item.status === 'Expiring');
    
    return issues.sort((a, b) => {
      if (a.status === 'Expired' && b.status !== 'Expired') return -1;
      if (b.status === 'Expired' && a.status !== 'Expired') return 1;
      const daysA = getDaysUntil(a.date);
      const daysB = getDaysUntil(b.date);
      if (a.status === 'Expired' && b.status === 'Expired') return daysA - daysB;
      return daysA - daysB; 
    }).slice(0, 5); 
  }, [licenses, hardware, contracts]);

  // --- Client Analysis Logic (Integrator Only) ---

  const clientAnalysis = useMemo(() => {
    if (userRole !== 'INTEGRATOR') return [];

    return clients.map(client => {
      const clientLicenses = licenses.filter(l => l.client === client.name);
      const clientHardware = hardware.filter(h => h.client === client.name);
      const clientContracts = contracts.filter(c => c.client === client.name);

      const totalItems = clientLicenses.length + clientHardware.length + clientContracts.length;
      const totalValue = 
        clientLicenses.reduce((sum, i) => sum + (i.annualCost || 0), 0) +
        clientHardware.reduce((sum, i) => sum + (i.purchaseCost || 0), 0) +
        clientContracts.reduce((sum, i) => sum + (i.annualCost || 0), 0);
      
      const issues = 
        [...clientLicenses, ...clientHardware, ...clientContracts].filter(i => i.status !== 'Active').length;

      return {
        ...client,
        totalItems,
        totalValue,
        issues
      };
    })
    .sort((a, b) => b.totalValue - a.totalValue) 
    .slice(0, 5);
  }, [clients, licenses, hardware, contracts, userRole]);

  // --- Activity Table Data ---

  const tableData = useMemo(() => {
    let items = [
      ...licenses.map(l => ({ 
        id: l.id, type: 'License', name: l.softwareName, vendor: l.vendor, 
        client: l.client, date: l.expirationDate, status: l.status, value: l.annualCost 
      })),
      ...hardware.map(h => ({ 
        id: h.id, type: 'Hardware', name: `${h.manufacturer} ${h.model}`, vendor: h.manufacturer, 
        client: h.client, date: h.warrantyExpiration, status: h.status, value: h.purchaseCost 
      })),
      ...contracts.map(c => ({ 
        id: c.id, type: 'Contract', name: c.contractName, vendor: c.provider, 
        client: c.client, date: c.expirationDate, status: c.status, value: c.annualCost 
      }))
    ];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(lower) || i.vendor.toLowerCase().includes(lower));
    }
    if (typeFilter !== 'All') {
      items = items.filter(i => i.type === typeFilter);
    }
    if (statusFilter !== 'All') {
      items = items.filter(i => i.status === statusFilter);
    }
    if (clientFilter !== 'All') {
      items = items.filter(i => i.client === clientFilter);
    }

    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 10);
  }, [licenses, hardware, contracts, searchTerm, typeFilter, statusFilter, clientFilter]);

  // --- Export Logic ---

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (format === 'pdf') {
      window.print();
      return;
    }

    // Combine data for CSV/Excel export
    const allItems = [
      ...licenses.map(l => ({ type: 'License', name: l.softwareName, vendor: l.vendor, client: l.client, expiration: l.expirationDate, status: l.status, value: l.annualCost })),
      ...hardware.map(h => ({ type: 'Hardware', name: `${h.manufacturer} ${h.model}`, vendor: h.manufacturer, client: h.client, expiration: h.warrantyExpiration, status: h.status, value: h.purchaseCost })),
      ...contracts.map(c => ({ type: 'Contract', name: c.contractName, vendor: c.provider, client: c.client, expiration: c.expirationDate, status: c.status, value: c.annualCost }))
    ];

    const headers = ['Type', 'Name', 'Vendor', 'Client', 'Expiration', 'Status', 'Value'];
    const csvContent = [
      headers.join(','),
      ...allItems.map(item => 
        [item.type, `"${item.name}"`, item.vendor, `"${item.client || ''}"`, item.expiration, item.status, item.value].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TraceTI_Dashboard_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setShowExportMenu(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your IT landscape</p>
        </div>
        
        {/* Export Dropdown */}
        <div className="relative" ref={exportMenuRef}>
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
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
      </div>

      {/* 1. Type Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cards remain same as previous version - omitted for brevity but preserved in output */}
        {/* Licenses Card */}
        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-all hover:border-blue-200 group"
          onClick={() => setCurrentPage('licenses')}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Licenses</h3>
                <p className="text-sm text-gray-500 font-medium">{licenseStats.count} items</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
               <ArrowRight size={16} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="text-sm text-gray-500 font-medium">Total Value</span>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(licenseStats.value)}</span>
            </div>
            <div className="flex gap-2">
                {licenseStats.expiring > 0 && (
                    <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-md font-medium border border-yellow-100 flex items-center gap-1">
                        <Clock size={12}/> {licenseStats.expiring} Expiring
                    </span>
                )}
                {licenseStats.expired > 0 && (
                    <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md font-medium border border-red-100 flex items-center gap-1">
                        <AlertTriangle size={12}/> {licenseStats.expired} Expired
                    </span>
                )}
                {licenseStats.expiring === 0 && licenseStats.expired === 0 && (
                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md font-medium border border-green-100 flex items-center gap-1">
                        <CheckCircle2 size={12}/> All Good
                    </span>
                )}
            </div>
          </div>
        </div>

        {/* Hardware Card */}
        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-all hover:border-purple-200 group"
          onClick={() => setCurrentPage('hardware')}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <Server className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Hardware</h3>
                <p className="text-sm text-gray-500 font-medium">{hardwareStats.count} items</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-purple-600 group-hover:bg-purple-50 transition-all">
               <ArrowRight size={16} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="text-sm text-gray-500 font-medium">Total Value</span>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(hardwareStats.value)}</span>
            </div>
            <div className="flex gap-2">
                {hardwareStats.expiring > 0 && (
                    <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-md font-medium border border-yellow-100 flex items-center gap-1">
                        <Clock size={12}/> {hardwareStats.expiring} Expiring
                    </span>
                )}
                {hardwareStats.expired > 0 && (
                    <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md font-medium border border-red-100 flex items-center gap-1">
                        <AlertTriangle size={12}/> {hardwareStats.expired} Expired
                    </span>
                )}
                {hardwareStats.expiring === 0 && hardwareStats.expired === 0 && (
                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md font-medium border border-green-100 flex items-center gap-1">
                        <CheckCircle2 size={12}/> All Good
                    </span>
                )}
            </div>
          </div>
        </div>

        {/* Contracts Card */}
        <div 
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-all hover:border-orange-200 group"
          onClick={() => setCurrentPage('support-contracts')}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <ShieldCheck className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Contracts</h3>
                <p className="text-sm text-gray-500 font-medium">{contractStats.count} items</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-orange-600 group-hover:bg-orange-50 transition-all">
               <ArrowRight size={16} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="text-sm text-gray-500 font-medium">Total Value</span>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(contractStats.value)}</span>
            </div>
            <div className="flex gap-2">
                {contractStats.expiring > 0 && (
                    <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-md font-medium border border-yellow-100 flex items-center gap-1">
                        <Clock size={12}/> {contractStats.expiring} Expiring
                    </span>
                )}
                {contractStats.expired > 0 && (
                    <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md font-medium border border-red-100 flex items-center gap-1">
                        <AlertTriangle size={12}/> {contractStats.expired} Expired
                    </span>
                )}
                {contractStats.expiring === 0 && contractStats.expired === 0 && (
                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md font-medium border border-green-100 flex items-center gap-1">
                        <CheckCircle2 size={12}/> All Good
                    </span>
                )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Urgent Actions Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} />
              Urgent Attention Needed
            </h2>
            <span className="text-sm text-gray-500">{urgentItems.length} critical items</span>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
            {urgentItems.length > 0 ? (
              urgentItems.map((item, index) => {
                const isExpired = item.status === 'Expired';
                const daysDiff = Math.abs(getDaysUntil(item.date));
                const Icon = item.type === 'License' ? FileText : item.type === 'Hardware' ? Server : ShieldCheck;
                
                return (
                  <div key={`${item.type}-${index}`} className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-lg shrink-0 ${isExpired ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border ${
                            isExpired ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }`}>
                            {item.status}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">{item.type}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                        {userRole === 'INTEGRATOR' && item.client && (
                          <p className="text-xs text-gray-500 mt-0.5 font-medium">{item.client}</p>
                        )}
                        <p className={`text-xs mt-1 font-medium ${isExpired ? 'text-red-600' : 'text-yellow-600'}`}>
                          {isExpired ? `Expired ${daysDiff} days ago` : `Expiring in ${daysDiff} days`} · {formatDate(item.date)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pl-14 sm:pl-0">
                      <span className="text-sm font-bold text-gray-700">{formatCurrency(item.value)}</span>
                      <button 
                        onClick={() => {
                            if (onNavigateToItem) {
                                const targetView = item.type === 'License' ? 'licenses' : item.type === 'Hardware' ? 'hardware' : 'support-contracts';
                                onNavigateToItem(targetView, item.id);
                            }
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors ${
                        isExpired 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-white border border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                      }`}>
                        {isExpired ? 'Renew Now' : 'Prepare Renewal'}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-gray-900 font-medium">All Clear!</h3>
                <p className="text-gray-500 text-sm mt-1">No urgent issues found requiring immediate attention.</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. By Client Section (Integrator Only) OR Quick Stats (End User) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            {userRole === 'INTEGRATOR' ? 'Top Clients' : 'Portfolio Health'}
          </h2>
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-1">
            {userRole === 'INTEGRATOR' ? (
              <div className="space-y-1">
                {clientAnalysis.length > 0 ? clientAnalysis.map(client => (
                  <div key={client.id} className="p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                          {client.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">{client.name}</span>
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full ${client.issues > 2 ? 'bg-red-500' : client.issues > 0 ? 'bg-yellow-500' : 'bg-green-500'}`} title={`${client.issues} issues`}></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 pl-10">
                      <span>{client.totalItems} items</span>
                      <span className="font-mono font-medium">{formatCurrency(client.totalValue)}</span>
                    </div>
                  </div>
                )) : (
                  <div className="p-6 text-center text-sm text-gray-500">No clients found.</div>
                )}
                <div className="p-2 border-t border-gray-50">
                  <button onClick={() => setCurrentPage('clients')} className="w-full py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    View All Clients
                  </button>
                </div>
              </div>
            ) : (
              // End User Quick Stats View
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 text-green-600 mb-3 ring-4 ring-green-50/50">
                    <span className="text-2xl font-bold">{Math.round((licenseStats.count + hardwareStats.count) > 0 ? (licenseStats.count + hardwareStats.count - urgentItems.length) / (licenseStats.count + hardwareStats.count) * 100 : 100)}%</span>
                  </div>
                  <h3 className="font-bold text-gray-900">Health Score</h3>
                  <p className="text-xs text-gray-500">Based on active vs expired items</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Assets Managed</span>
                    <span className="font-bold text-gray-900">{licenseStats.count + hardwareStats.count + contractStats.count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active Contracts</span>
                    <span className="font-bold text-gray-900">{contractStats.count - contractStats.expired}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex justify-between text-sm">
                    <span className="font-bold text-gray-900">Total Portfolio Value</span>
                    <span className="font-bold text-blue-600">{formatCurrency(licenseStats.value + hardwareStats.value + contractStats.value)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Unified Activity Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between bg-gray-50/50">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search items..." 
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <select 
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="License">Licenses</option>
                <option value="Hardware">Hardware</option>
                <option value="Contract">Contracts</option>
              </select>
              
              <select 
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Expiring">Expiring</option>
                <option value="Expired">Expired</option>
              </select>

              {userRole === 'INTEGRATOR' && (
                <select 
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}
                >
                  <option value="All">All Clients</option>
                  {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Vendor</th>
                  {userRole === 'INTEGRATOR' && <th className="px-6 py-4">Client</th>}
                  <th className="px-6 py-4">Expiration</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableData.length > 0 ? (
                  tableData.map((item, index) => {
                    const Icon = item.type === 'License' ? FileText : item.type === 'Hardware' ? Server : ShieldCheck;
                    return (
                      <tr key={`${item.type}-${item.id}-${index}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-md ${
                              item.type === 'License' ? 'bg-blue-50 text-blue-600' :
                              item.type === 'Hardware' ? 'bg-purple-50 text-purple-600' :
                              'bg-orange-50 text-orange-600'
                            }`}>
                              <Icon size={14} />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{item.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.vendor}</td>
                        {userRole === 'INTEGRATOR' && (
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.client || '-'}</td>
                        )}
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">{formatDate(item.date)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-mono text-gray-900">
                          {formatCurrency(item.value)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      No items found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

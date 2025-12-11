
import React, { useMemo } from 'react';
import { ArrowLeft, Mail, Phone, Edit2, Trash2, FileText, Server, ShieldCheck, Plus, ExternalLink } from 'lucide-react';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';
import { useData } from '../context/DataContext';
import { Client, License, Hardware, SupportContract } from '../types';

interface ClientDetailProps {
  client: Client;
  onBack: () => void;
  onNavigateToItem: (view: string, id: string) => void;
  onEditClient: (client: Client) => void;
}

export const ClientDetail: React.FC<ClientDetailProps> = ({ client, onBack, onNavigateToItem, onEditClient }) => {
  const { licenses, hardware, contracts, deleteClient } = useData();

  // Filter items for this client
  const clientLicenses = useMemo(() => licenses.filter(l => l.client === client.name), [licenses, client.name]);
  const clientHardware = useMemo(() => hardware.filter(h => h.client === client.name), [hardware, client.name]);
  const clientContracts = useMemo(() => contracts.filter(c => c.client === client.name), [contracts, client.name]);

  // Calculate Stats
  const stats = useMemo(() => {
    const totalLicensesVal = clientLicenses.reduce((sum, i) => sum + (i.annualCost || 0), 0);
    const totalHardwareVal = clientHardware.reduce((sum, i) => sum + (i.purchaseCost || 0), 0);
    const totalContractsVal = clientContracts.reduce((sum, i) => sum + (i.annualCost || 0), 0);
    
    const allItems = [...clientLicenses, ...clientHardware, ...clientContracts];
    const expiredCount = allItems.filter(i => i.status === 'Expired').length;
    const expiringCount = allItems.filter(i => i.status === 'Expiring').length;

    let healthStatus: 'Good' | 'Warning' | 'Critical' = 'Good';
    if (expiredCount > 0) healthStatus = 'Critical';
    else if (expiringCount > 0) healthStatus = 'Warning';

    return {
      totalItems: allItems.length,
      totalValue: totalLicensesVal + totalHardwareVal + totalContractsVal,
      health: healthStatus,
      expiredCount,
      expiringCount
    };
  }, [clientLicenses, clientHardware, clientContracts]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${client.name}? This cannot be undone.`)) {
        deleteClient(client.id);
        onBack();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-mediumGray">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-darkGray">{client.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-mediumGray">
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Mail size={14} /> {client.email}
                </a>
              )}
              {client.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone size={14} /> {client.phone}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => onEditClient(client)} icon={<Edit2 size={16} />}>Edit Client</Button>
          <Button variant="danger" onClick={handleDelete} className="px-3"><Trash2 size={16} /></Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-mediumGray">Total Portfolio Value</p>
          <p className="text-3xl font-bold text-darkGray mt-2">{formatCurrency(stats.totalValue)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-mediumGray">Total Assets Managed</p>
          <p className="text-3xl font-bold text-darkGray mt-2">{stats.totalItems}</p>
          <p className="text-xs text-mediumGray mt-1">across 3 categories</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-mediumGray">Overall Health</p>
          <div className="flex items-center gap-3 mt-2">
            <div className={`text-2xl font-bold ${
                stats.health === 'Critical' ? 'text-danger' : 
                stats.health === 'Warning' ? 'text-warning' : 'text-primary'
            }`}>
                {stats.health}
            </div>
            {(stats.expiredCount > 0 || stats.expiringCount > 0) && (
                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-darkGray">
                    {stats.expiredCount} Expired · {stats.expiringCount} Expiring
                </span>
            )}
          </div>
        </div>
      </div>

      {/* Licenses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-darkGray flex items-center gap-2">
                <FileText className="text-blue-500" size={20}/> Software Licenses ({clientLicenses.length})
            </h3>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {clientLicenses.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-3">Software Name</th>
                                <th className="px-6 py-3">Vendor</th>
                                <th className="px-6 py-3">Expiration</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Cost</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {clientLicenses.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onNavigateToItem('licenses', item.id)}>
                                    <td className="px-6 py-3 text-sm font-medium text-darkGray">{item.softwareName}</td>
                                    <td className="px-6 py-3 text-sm text-mediumGray">{item.vendor}</td>
                                    <td className="px-6 py-3 text-sm text-mediumGray font-mono">{item.expirationDate}</td>
                                    <td className="px-6 py-3"><StatusBadge status={item.status} /></td>
                                    <td className="px-6 py-3 text-sm text-right font-medium">{formatCurrency(item.annualCost)}</td>
                                    <td className="px-6 py-3 text-right"><ExternalLink size={14} className="text-gray-400 ml-auto"/></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-8 text-center text-mediumGray">No licenses linked to this client.</div>
            )}
        </div>
      </div>

      {/* Hardware Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-darkGray flex items-center gap-2">
                <Server className="text-purple-500" size={20}/> Hardware Assets ({clientHardware.length})
            </h3>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {clientHardware.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-3">Model</th>
                                <th className="px-6 py-3">Manufacturer</th>
                                <th className="px-6 py-3">Warranty</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Cost</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {clientHardware.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onNavigateToItem('hardware', item.id)}>
                                    <td className="px-6 py-3 text-sm font-medium text-darkGray">{item.model}</td>
                                    <td className="px-6 py-3 text-sm text-mediumGray">{item.manufacturer}</td>
                                    <td className="px-6 py-3 text-sm text-mediumGray font-mono">{item.warrantyExpiration}</td>
                                    <td className="px-6 py-3"><StatusBadge status={item.status} /></td>
                                    <td className="px-6 py-3 text-sm text-right font-medium">{formatCurrency(item.purchaseCost)}</td>
                                    <td className="px-6 py-3 text-right"><ExternalLink size={14} className="text-gray-400 ml-auto"/></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-8 text-center text-mediumGray">No hardware linked to this client.</div>
            )}
        </div>
      </div>

      {/* Contracts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-darkGray flex items-center gap-2">
                <ShieldCheck className="text-orange-500" size={20}/> Support Contracts ({clientContracts.length})
            </h3>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {clientContracts.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-3">Contract Name</th>
                                <th className="px-6 py-3">Provider</th>
                                <th className="px-6 py-3">Expiration</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Cost</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {clientContracts.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onNavigateToItem('support-contracts', item.id)}>
                                    <td className="px-6 py-3 text-sm font-medium text-darkGray">{item.contractName}</td>
                                    <td className="px-6 py-3 text-sm text-mediumGray">{item.provider}</td>
                                    <td className="px-6 py-3 text-sm text-mediumGray font-mono">{item.expirationDate}</td>
                                    <td className="px-6 py-3"><StatusBadge status={item.status} /></td>
                                    <td className="px-6 py-3 text-sm text-right font-medium">{formatCurrency(item.annualCost)}</td>
                                    <td className="px-6 py-3 text-right"><ExternalLink size={14} className="text-gray-400 ml-auto"/></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-8 text-center text-mediumGray">No contracts linked to this client.</div>
            )}
        </div>
      </div>
    </div>
  );
};

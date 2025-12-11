
import React, { createContext, useContext, useState, useEffect } from 'react';
import { License, Hardware, SupportContract, Client, User } from '../types';
import { MOCK_LICENSES, MOCK_HARDWARE, MOCK_SUPPORT_CONTRACTS, MOCK_CLIENTS, MOCK_USER } from '../constants';

interface CompanySettings {
  name: string;
  industry: string;
  timezone: string;
  logo?: string;
}

interface DataContextType {
  licenses: License[];
  hardware: Hardware[];
  contracts: SupportContract[];
  clients: Client[];
  user: User;
  companySettings: CompanySettings;
  
  addLicense: (item: License) => void;
  updateLicense: (item: License) => void;
  deleteLicense: (id: string) => void;

  addHardware: (item: Hardware) => void;
  updateHardware: (item: Hardware) => void;
  deleteHardware: (id: string) => void;

  addContract: (item: SupportContract) => void;
  updateContract: (item: SupportContract) => void;
  deleteContract: (id: string) => void;

  addClient: (item: Client) => void;
  updateClient: (item: Client) => void;
  deleteClient: (id: string) => void;

  updateUser: (user: User) => void;
  updateCompanySettings: (settings: CompanySettings) => void;

  getClientActiveCount: (clientName: string) => number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const safeParse = (key: string, fallback: any) => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    // Ensure array where expected
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    return parsed;
  } catch (e) {
    console.warn(`Error parsing ${key} from localStorage, using fallback`, e);
    return fallback;
  }
};

// Helper to calculate status based on date
const calculateStatus = (dateString: string): 'Active' | 'Expiring' | 'Expired' => {
    if (!dateString) return 'Active';
    const now = new Date();
    const exp = new Date(dateString);
    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays <= 30) return 'Expiring';
    return 'Active';
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from LocalStorage or fallback to Mocks using safeParse
  const [licenses, setLicenses] = useState<License[]>(() => {
    const data = safeParse('traceti_licenses', MOCK_LICENSES);
    // Auto-refresh status on load
    return data.map((l: License) => ({ ...l, status: calculateStatus(l.expirationDate) }));
  });
  
  const [hardware, setHardware] = useState<Hardware[]>(() => {
    const data = safeParse('traceti_hardware', MOCK_HARDWARE);
    return data.map((h: Hardware) => ({ ...h, status: calculateStatus(h.warrantyExpiration) }));
  });

  const [contracts, setContracts] = useState<SupportContract[]>(() => {
    const data = safeParse('traceti_contracts', MOCK_SUPPORT_CONTRACTS);
    return data.map((c: SupportContract) => ({ ...c, status: calculateStatus(c.expirationDate) }));
  });

  const [clients, setClients] = useState<Client[]>(() => safeParse('traceti_clients', MOCK_CLIENTS));
  
  const [user, setUser] = useState<User>(() => safeParse('traceti_user', MOCK_USER));
  
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => safeParse('traceti_company', {
      name: 'Nextcom Systems',
      industry: 'IT Services & Consulting',
      timezone: '(GMT-05:00) Eastern Time (US & Canada)'
  }));

  // Save to LocalStorage whenever data changes
  useEffect(() => { localStorage.setItem('traceti_licenses', JSON.stringify(licenses)); }, [licenses]);
  useEffect(() => { localStorage.setItem('traceti_hardware', JSON.stringify(hardware)); }, [hardware]);
  useEffect(() => { localStorage.setItem('traceti_contracts', JSON.stringify(contracts)); }, [contracts]);
  useEffect(() => { localStorage.setItem('traceti_clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('traceti_user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('traceti_company', JSON.stringify(companySettings)); }, [companySettings]);

  // Actions
  const addLicense = (item: License) => setLicenses(prev => [...prev, { ...item, status: calculateStatus(item.expirationDate) }]);
  const updateLicense = (item: License) => setLicenses(prev => prev.map(l => l.id === item.id ? { ...item, status: calculateStatus(item.expirationDate) } : l));
  const deleteLicense = (id: string) => setLicenses(prev => prev.filter(l => l.id !== id));

  const addHardware = (item: Hardware) => setHardware(prev => [...prev, { ...item, status: calculateStatus(item.warrantyExpiration) }]);
  const updateHardware = (item: Hardware) => setHardware(prev => prev.map(h => h.id === item.id ? { ...item, status: calculateStatus(item.warrantyExpiration) } : h));
  const deleteHardware = (id: string) => setHardware(prev => prev.filter(h => h.id !== id));

  const addContract = (item: SupportContract) => setContracts(prev => [...prev, { ...item, status: calculateStatus(item.expirationDate) }]);
  const updateContract = (item: SupportContract) => setContracts(prev => prev.map(c => c.id === item.id ? { ...item, status: calculateStatus(item.expirationDate) } : c));
  const deleteContract = (id: string) => setContracts(prev => prev.filter(c => c.id !== id));

  const addClient = (item: Client) => setClients(prev => [...prev, item]);
  const updateClient = (item: Client) => setClients(prev => prev.map(c => c.id === item.id ? item : c));
  const deleteClient = (id: string) => setClients(prev => prev.filter(c => c.id !== id));

  const updateUser = (updatedUser: User) => setUser(updatedUser);
  const updateCompanySettings = (settings: CompanySettings) => setCompanySettings(settings);

  // Helper to calculate active items for a client dynamically
  const getClientActiveCount = (clientName: string) => {
    if (!clientName) return 0;
    const lCount = licenses.filter(l => l.client === clientName && l.status === 'Active').length;
    const hCount = hardware.filter(h => h.client === clientName && h.status === 'Active').length;
    return lCount + hCount;
  };

  return (
    <DataContext.Provider value={{
      licenses, hardware, contracts, clients, user, companySettings,
      addLicense, updateLicense, deleteLicense,
      addHardware, updateHardware, deleteHardware,
      addContract, updateContract, deleteContract,
      addClient, updateClient, deleteClient,
      updateUser, updateCompanySettings,
      getClientActiveCount
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

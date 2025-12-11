import React, { createContext, useContext, useState, useEffect } from 'react';
import { License, Hardware, SupportContract, Client, User } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { calculateStatus } from '../utils/statusCalculator';

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
  loading: boolean;

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

  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser, profile, organization, traceTIUser } = useAuth();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [hardware, setHardware] = useState<Hardware[]>([]);
  const [contracts, setContracts] = useState<SupportContract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User>({
    id: 'u1',
    name: 'User',
    email: 'user@example.com',
    role: 'INTEGRATOR',
    avatar: 'U'
  });
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: 'Company',
    industry: 'IT Services',
    timezone: '(GMT-05:00) Eastern Time (US & Canada)'
  });

  const refreshData = async () => {
    if (!authUser || !profile?.organization_id) return;

    try {
      setLoading(true);

      // Fetch licenses
      const { data: licensesData } = await supabase
        .from('licenses')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('expiration_date', { ascending: true });

      // Fetch hardware
      const { data: hardwareData } = await supabase
        .from('hardware')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('warranty_expiration', { ascending: true });

      // Fetch contracts
      const { data: contractsData } = await supabase
        .from('support_contracts')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('expiration_date', { ascending: true });

      // Fetch clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('name', { ascending: true });

      setLicenses(licensesData?.map(l => ({
        id: l.id,
        softwareName: l.software_name,
        vendor: l.vendor,
        provider: l.provider,
        client: l.client_name,
        clientContact: l.client_contact,
        quantity: l.quantity,
        expirationDate: l.expiration_date,
        status: calculateStatus(l.expiration_date),
        annualCost: Number(l.annual_cost),
        contractNumber: l.contract_number,
        supportIncluded: l.support_included,
        supportName: l.support_name,
        supportExpiration: l.support_expiration,
        supportCost: l.support_cost ? Number(l.support_cost) : undefined,
        notes: l.notes,
        responsibleName: l.responsible_name
      })) || []);

      setHardware(hardwareData?.map(h => ({
        id: h.id,
        hardwareType: h.hardware_type,
        manufacturer: h.manufacturer,
        model: h.model,
        serialNumber: h.serial_number,
        provider: h.provider,
        client: h.client_name,
        clientContact: h.client_contact,
        quantity: h.quantity,
        purchaseDate: h.purchase_date,
        warrantyExpiration: h.warranty_expiration,
        status: calculateStatus(h.warranty_expiration),
        purchaseCost: Number(h.purchase_cost),
        location: h.location,
        supportIncluded: h.support_included,
        supportProvider: h.support_provider,
        supportExpiration: h.support_expiration,
        supportCost: h.support_cost ? Number(h.support_cost) : undefined,
        notes: h.notes,
        responsibleName: h.responsible_name
      })) || []);

      setContracts(contractsData?.map(c => ({
        id: c.id,
        contractId: c.contract_id,
        vendorContractNumber: c.vendor_contract_number,
        contractName: c.contract_name,
        provider: c.provider,
        client: c.client_name,
        clientContact: c.client_contact,
        type: c.type,
        assetsDescription: c.assets_description,
        startDate: c.start_date,
        expirationDate: c.expiration_date,
        status: calculateStatus(c.expiration_date),
        annualCost: Number(c.annual_cost),
        billingFrequency: c.billing_frequency,
        autoRenewal: c.auto_renewal,
        responsibleName: c.responsible_name,
        providerContact: c.provider_contact,
        notes: c.notes
      })) || []);

      setClients(clientsData?.map(cl => ({
        id: cl.id,
        name: cl.name,
        email: cl.contact_email || '',
        phone: cl.contact_phone || '',
        notes: cl.notes,
        activeLicenses: 0
      })) || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 DataContext: traceTIUser cambió:', traceTIUser);
    if (traceTIUser) {
      console.log('✅ Actualizando user con traceTIUser:', traceTIUser);
      setUser(traceTIUser);
    } else {
      console.log('⚠️ traceTIUser es null/undefined');
    }
  }, [traceTIUser]);

  useEffect(() => {
    if (organization) {
      setCompanySettings({
        name: organization.name,
        industry: 'IT Services & Consulting',
        timezone: '(GMT-05:00) Eastern Time (US & Canada)'
      });
    }
  }, [organization]);

  useEffect(() => {
    if (authUser && profile?.organization_id) {
      refreshData();
    }
  }, [authUser, profile?.organization_id]);

  const addLicense = (item: License) => {
    if (!profile?.organization_id) return;

    (async () => {
      const { error } = await supabase.from('licenses').insert({
        organization_id: profile.organization_id,
        software_name: item.softwareName,
        vendor: item.vendor,
        provider: item.provider || null,
        client_name: item.client || null,
        client_contact: item.clientContact || null,
        quantity: item.quantity,
        expiration_date: item.expirationDate || null,
        annual_cost: item.annualCost || 0,
        contract_number: item.contractNumber || null,
        support_included: item.supportIncluded,
        support_name: item.supportName || null,
        support_expiration: item.supportExpiration || null,
        support_cost: item.supportCost || null,
        notes: item.notes || null,
        responsible_name: item.responsibleName || null
      });

      if (error) {
        console.error('Error adding license:', error);
        alert(`Error creating license: ${error.message}`);
      } else {
        await refreshData();
      }
    })();
  };

  const updateLicense = (item: License) => {
    (async () => {
      const { error } = await supabase
        .from('licenses')
        .update({
          software_name: item.softwareName,
          vendor: item.vendor,
          provider: item.provider || null,
          client_name: item.client || null,
          client_contact: item.clientContact || null,
          quantity: item.quantity,
          expiration_date: item.expirationDate || null,
          annual_cost: item.annualCost || 0,
          contract_number: item.contractNumber || null,
          support_included: item.supportIncluded,
          support_name: item.supportName || null,
          support_expiration: item.supportExpiration || null,
          support_cost: item.supportCost || null,
          notes: item.notes || null,
          responsible_name: item.responsibleName || null
        })
        .eq('id', item.id);

      if (!error) await refreshData();
    })();
  };

  const deleteLicense = (id: string) => {
    (async () => {
      const { error } = await supabase.from('licenses').delete().eq('id', id);
      if (!error) await refreshData();
    })();
  };

  const addHardware = (item: Hardware) => {
    if (!profile?.organization_id) return;

    (async () => {
      const { error } = await supabase.from('hardware').insert({
        organization_id: profile.organization_id,
        hardware_type: item.hardwareType,
        manufacturer: item.manufacturer,
        model: item.model,
        serial_number: item.serialNumber,
        provider: item.provider || null,
        client_name: item.client || null,
        client_contact: item.clientContact || null,
        quantity: item.quantity,
        purchase_date: item.purchaseDate || null,
        warranty_expiration: item.warrantyExpiration || null,
        purchase_cost: item.purchaseCost || 0,
        location: item.location || null,
        support_included: item.supportIncluded,
        support_provider: item.supportProvider || null,
        support_expiration: item.supportExpiration || null,
        support_cost: item.supportCost || null,
        notes: item.notes || null,
        responsible_name: item.responsibleName || null
      });

      if (error) {
        console.error('Error adding hardware:', error);
        alert(`Error creating hardware: ${error.message}`);
      } else {
        await refreshData();
      }
    })();
  };

  const updateHardware = (item: Hardware) => {
    (async () => {
      const { error } = await supabase
        .from('hardware')
        .update({
          hardware_type: item.hardwareType,
          manufacturer: item.manufacturer,
          model: item.model,
          serial_number: item.serialNumber,
          provider: item.provider || null,
          client_name: item.client || null,
          client_contact: item.clientContact || null,
          quantity: item.quantity,
          purchase_date: item.purchaseDate || null,
          warranty_expiration: item.warrantyExpiration || null,
          purchase_cost: item.purchaseCost || 0,
          location: item.location || null,
          support_included: item.supportIncluded,
          support_provider: item.supportProvider || null,
          support_expiration: item.supportExpiration || null,
          support_cost: item.supportCost || null,
          notes: item.notes || null,
          responsible_name: item.responsibleName || null
        })
        .eq('id', item.id);

      if (!error) await refreshData();
    })();
  };

  const deleteHardware = (id: string) => {
    (async () => {
      const { error } = await supabase.from('hardware').delete().eq('id', id);
      if (!error) await refreshData();
    })();
  };

  const addContract = (item: SupportContract) => {
    if (!profile?.organization_id) return;

    (async () => {
      const { error } = await supabase.from('support_contracts').insert({
        organization_id: profile.organization_id,
        contract_id: item.contractId,
        vendor_contract_number: item.vendorContractNumber || null,
        contract_name: item.contractName,
        provider: item.provider,
        client_name: item.client || null,
        client_contact: item.clientContact || null,
        type: item.type,
        assets_description: item.assetsDescription || null,
        start_date: item.startDate || null,
        expiration_date: item.expirationDate || null,
        annual_cost: item.annualCost || 0,
        billing_frequency: item.billingFrequency || 'Annual',
        auto_renewal: item.autoRenewal,
        responsible_name: item.responsibleName || null,
        provider_contact: item.providerContact || null,
        notes: item.notes || null
      });

      if (error) {
        console.error('Error adding support contract:', error);
        alert(`Error creating support contract: ${error.message}`);
      } else {
        await refreshData();
      }
    })();
  };

  const updateContract = (item: SupportContract) => {
    (async () => {
      const { error } = await supabase
        .from('support_contracts')
        .update({
          contract_id: item.contractId,
          vendor_contract_number: item.vendorContractNumber || null,
          contract_name: item.contractName,
          provider: item.provider,
          client_name: item.client || null,
          client_contact: item.clientContact || null,
          type: item.type,
          assets_description: item.assetsDescription || null,
          start_date: item.startDate || null,
          expiration_date: item.expirationDate || null,
          annual_cost: item.annualCost || 0,
          billing_frequency: item.billingFrequency || 'Annual',
          auto_renewal: item.autoRenewal,
          responsible_name: item.responsibleName || null,
          provider_contact: item.providerContact || null,
          notes: item.notes || null
        })
        .eq('id', item.id);

      if (!error) await refreshData();
    })();
  };

  const deleteContract = (id: string) => {
    (async () => {
      const { error } = await supabase.from('support_contracts').delete().eq('id', id);
      if (!error) await refreshData();
    })();
  };

  const addClient = (item: Client) => {
    if (!profile?.organization_id) return;

    (async () => {
      const { error } = await supabase.from('clients').insert({
        organization_id: profile.organization_id,
        name: item.name,
        contact_email: item.email || null,
        contact_phone: item.phone || null,
        notes: item.notes || null
      });

      if (error) {
        console.error('Error adding client:', error);
        alert(`Error creating client: ${error.message}`);
      } else {
        await refreshData();
      }
    })();
  };

  const updateClient = (item: Client) => {
    (async () => {
      const { error } = await supabase
        .from('clients')
        .update({
          name: item.name,
          contact_email: item.email || null,
          contact_phone: item.phone || null,
          notes: item.notes || null
        })
        .eq('id', item.id);

      if (!error) await refreshData();
    })();
  };

  const deleteClient = (id: string) => {
    (async () => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (!error) await refreshData();
    })();
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    (async () => {
      await supabase
        .from('profiles')
        .update({
          full_name: updatedUser.name,
        })
        .eq('id', updatedUser.id);
    })();
  };

  const updateCompanySettings = (settings: CompanySettings) => {
    setCompanySettings(settings);
    (async () => {
      if (organization?.id) {
        await supabase
          .from('organizations')
          .update({
            name: settings.name,
          })
          .eq('id', organization.id);
      }
    })();
  };

  const getClientActiveCount = (clientName: string) => {
    if (!clientName) return 0;
    const lCount = licenses.filter(l => l.client === clientName && l.status === 'Active').length;
    const hCount = hardware.filter(h => h.client === clientName && h.status === 'Active').length;
    return lCount + hCount;
  };

  return (
    <DataContext.Provider value={{
      licenses, hardware, contracts, clients, user, companySettings, loading,
      addLicense, updateLicense, deleteLicense,
      addHardware, updateHardware, deleteHardware,
      addContract, updateContract, deleteContract,
      addClient, updateClient, deleteClient,
      updateUser, updateCompanySettings,
      getClientActiveCount,
      refreshData
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

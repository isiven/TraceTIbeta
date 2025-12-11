
import { License, Client, User, SaaSUser, Subscription, Hardware, SupportContract } from './types';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Isaac Villasmil',
  email: 'isaac@nextcom.pa',
  role: 'INTEGRATOR',
  avatar: 'IV'
};

export const MOCK_CLIENTS: Client[] = [
  { id: 'c1', name: 'Banco Nacional', email: 'tech@bn.com', phone: '+507-200-0001', activeLicenses: 15 },
  { id: 'c2', name: 'Grupo Melo', email: 'it@grupomelo.pa', phone: '+507-200-0002', activeLicenses: 8 },
  { id: 'c3', name: 'Cable Onda', email: 'infra@cableonda.net', phone: '+507-200-0003', activeLicenses: 22 },
  { id: 'c4', name: 'Copa Airlines', email: 'licensing@copa.com', phone: '+507-200-0004', activeLicenses: 45 },
];

export const TEAM_MEMBERS = [
  'Isaac Villasmil',
  'Maria Rodriguez',
  'Carlos Perez',
  'Ana Gomez',
  'John Smith'
];

export const MOCK_LICENSES: License[] = [
  { 
    id: 'l1', 
    softwareName: 'Trend Micro Apex One', 
    vendor: 'Trend Micro', 
    provider: 'Ingram Micro',
    client: 'Banco Nacional', 
    clientContact: 'Roberto Jimenez',
    quantity: 50, 
    expirationDate: '2026-01-15', 
    status: 'Active', 
    annualCost: 15000, 
    contractNumber: 'TM-2023-8899',
    supportIncluded: true,
    supportName: 'Premium 24/7',
    supportExpiration: '2026-01-15',
    notes: 'Renewal discussion starts in Dec 2025',
    hasAttachment: true,
    responsibleName: 'Isaac Villasmil'
  },
  { 
    id: 'l2', 
    softwareName: 'Microsoft 365 E3', 
    vendor: 'Microsoft', 
    provider: 'TD SYNNEX',
    client: 'Grupo Melo', 
    clientContact: 'Sofia Martinez',
    quantity: 200, 
    expirationDate: '2025-12-20', 
    status: 'Expiring', 
    annualCost: 45000, 
    contractNumber: 'MS-VL-445522',
    supportIncluded: true,
    supportName: 'Unified Support',
    hasAttachment: true,
    responsibleName: 'Maria Rodriguez'
  },
  { 
    id: 'l3', 
    softwareName: 'VMware vSphere', 
    vendor: 'VMware', 
    provider: 'Licencias OnLine',
    client: 'Cable Onda', 
    clientContact: 'Miguel Santos',
    quantity: 10, 
    expirationDate: '2025-11-30', 
    status: 'Expired', 
    annualCost: 12000, 
    contractNumber: 'ELA-998877',
    supportIncluded: false,
    notes: 'Pending cancellation confirmation',
    responsibleName: 'Isaac Villasmil'
  },
  { 
    id: 'l4', 
    softwareName: 'Adobe Creative Cloud', 
    vendor: 'Adobe', 
    provider: 'Ingram Micro',
    client: 'Banco Nacional', 
    clientContact: 'Roberto Jimenez',
    quantity: 5, 
    expirationDate: '2026-03-10', 
    status: 'Active', 
    annualCost: 4200, 
    contractNumber: 'AD-VIP-112233',
    supportIncluded: true,
    supportName: 'Standard Support',
    responsibleName: 'Carlos Perez'
  },
  { 
    id: 'l5', 
    softwareName: 'Salesforce Enterprise', 
    vendor: 'Salesforce', 
    provider: 'Direct',
    client: 'Copa Airlines', 
    clientContact: 'Elena White',
    quantity: 150, 
    expirationDate: '2026-06-01', 
    status: 'Active', 
    annualCost: 225000, 
    contractNumber: 'SF-ENT-555',
    supportIncluded: true,
    supportName: 'Premier Success Plan',
    hasAttachment: true,
    responsibleName: 'Ana Gomez'
  },
  { 
    id: 'l6', 
    softwareName: 'Zoom Rooms', 
    vendor: 'Zoom', 
    provider: 'Westcon',
    client: 'Grupo Melo', 
    clientContact: 'Sofia Martinez',
    quantity: 12, 
    expirationDate: '2025-12-05', 
    status: 'Expiring', 
    annualCost: 6000, 
    supportIncluded: false,
    responsibleName: 'Isaac Villasmil'
  },
];

export const MOCK_HARDWARE: Hardware[] = [
  {
    id: 'h1',
    hardwareType: 'Server',
    manufacturer: 'Dell',
    model: 'PowerEdge R740',
    serialNumber: 'SN12345678',
    provider: 'Ingram Micro',
    quantity: 1,
    purchaseDate: '2023-08-15',
    warrantyExpiration: '2026-08-15',
    status: 'Active',
    purchaseCost: 15000,
    location: 'Data Center A',
    supportIncluded: true,
    supportProvider: 'Dell ProSupport',
    supportExpiration: '2026-08-15',
    supportCost: 2000,
    hasAttachment: true,
    responsibleName: 'Isaac Villasmil'
  },
  {
    id: 'h2',
    hardwareType: 'Firewall',
    manufacturer: 'Fortinet',
    model: 'FortiGate 100F',
    serialNumber: 'SN87654321',
    provider: 'Westcon',
    quantity: 1,
    purchaseDate: '2022-12-10',
    warrantyExpiration: '2025-12-10',
    status: 'Expiring',
    purchaseCost: 3500,
    location: 'Main Office',
    supportIncluded: true,
    supportProvider: 'FortiCare',
    supportExpiration: '2025-12-10',
    hasAttachment: true,
    responsibleName: 'Maria Rodriguez'
  },
  {
    id: 'h3',
    hardwareType: 'Switch',
    manufacturer: 'Cisco',
    model: 'Catalyst 2960',
    serialNumber: 'SN11223344',
    provider: 'Ingram Micro',
    quantity: 2,
    purchaseDate: '2020-10-30',
    warrantyExpiration: '2025-10-30',
    status: 'Expired',
    purchaseCost: 2200,
    location: 'Branch Office',
    supportIncluded: false,
    responsibleName: 'Isaac Villasmil'
  },
  {
    id: 'h4',
    hardwareType: 'UPS',
    manufacturer: 'APC',
    model: 'Smart-UPS 1500',
    serialNumber: 'SN99887766',
    provider: 'Local Vendor',
    quantity: 1,
    purchaseDate: '2024-03-20',
    warrantyExpiration: '2027-03-20',
    status: 'Active',
    purchaseCost: 1800,
    location: 'Server Room',
    supportIncluded: false,
    hasAttachment: true,
    responsibleName: 'Carlos Perez'
  },
  {
    id: 'h5',
    hardwareType: 'Storage',
    manufacturer: 'Synology',
    model: 'DS920+',
    serialNumber: 'SN55443322',
    provider: 'Amazon',
    quantity: 1,
    purchaseDate: '2023-11-05',
    warrantyExpiration: '2026-11-05',
    status: 'Active',
    purchaseCost: 600,
    location: 'Data Center B',
    supportIncluded: false,
    hasAttachment: true,
    responsibleName: 'Ana Gomez'
  },
  {
    id: 'h6',
    hardwareType: 'Laptop',
    manufacturer: 'Lenovo',
    model: 'ThinkPad X1 Carbon',
    serialNumber: 'SN66778899',
    provider: 'CDW',
    quantity: 1,
    purchaseDate: '2022-12-01',
    warrantyExpiration: '2025-12-01',
    status: 'Expiring',
    purchaseCost: 1400,
    location: 'Office Floor 2',
    supportIncluded: true,
    supportProvider: 'Lenovo Premier',
    responsibleName: 'Isaac Villasmil'
  }
];

export const MOCK_SUPPORT_CONTRACTS: SupportContract[] = [
  {
    id: 'sc1',
    contractId: 'CT-2024-001',
    vendorContractNumber: 'TM-SUP-9988',
    contractName: 'Trend Micro Premium Support',
    provider: 'Trend Micro',
    type: 'Software Support',
    assetsDescription: '1 Software',
    startDate: '2024-01-15',
    expirationDate: '2026-01-15',
    status: 'Active',
    annualCost: 15000,
    billingFrequency: 'Annual',
    autoRenewal: true,
    responsibleName: 'Isaac Villasmil',
    providerContact: 'support@trendmicro.com',
    hasAttachment: true
  },
  {
    id: 'sc2',
    contractId: 'CT-2024-002',
    vendorContractNumber: 'MS-CLOUD-77',
    contractName: 'Microsoft Cloud Services',
    provider: 'Microsoft',
    type: 'Software Support',
    assetsDescription: '1 Software',
    startDate: '2023-12-20',
    expirationDate: '2025-12-20',
    status: 'Expiring',
    annualCost: 45000,
    billingFrequency: 'Annual',
    autoRenewal: true,
    responsibleName: 'Maria Rodriguez',
    hasAttachment: true
  },
  {
    id: 'sc3',
    contractId: 'CT-2024-003',
    vendorContractNumber: 'DLL-PRO-1122',
    contractName: 'Dell ProSupport Plus',
    provider: 'Dell',
    type: 'Hardware Warranty',
    assetsDescription: '2 Hardware',
    startDate: '2023-08-15',
    expirationDate: '2026-08-15',
    status: 'Active',
    annualCost: 8500,
    billingFrequency: 'Annual',
    autoRenewal: false,
    responsibleName: 'Isaac Villasmil',
    hasAttachment: true
  },
  {
    id: 'sc4',
    contractId: 'CT-2024-004',
    vendorContractNumber: 'FT-CARE-55',
    contractName: 'FortiCare 24x7',
    provider: 'Fortinet',
    type: 'Hardware Warranty',
    assetsDescription: '1 Hardware',
    startDate: '2022-12-10',
    expirationDate: '2025-12-10',
    status: 'Expiring',
    annualCost: 3500,
    billingFrequency: 'Annual',
    autoRenewal: true,
    responsibleName: 'Carlos Perez'
  },
  {
    id: 'sc5',
    contractId: 'CT-2024-005',
    vendorContractNumber: 'PP-MAINT-900',
    contractName: 'Third Party Maintenance',
    provider: 'Park Place',
    type: 'Multi-Asset Coverage',
    assetsDescription: '5 Hardware, 3 Software',
    startDate: '2024-03-20',
    expirationDate: '2027-03-20',
    status: 'Active',
    annualCost: 25000,
    billingFrequency: 'Quarterly',
    autoRenewal: true,
    responsibleName: 'Ana Gomez',
    hasAttachment: true
  },
  {
    id: 'sc6',
    contractId: 'CT-2024-006',
    vendorContractNumber: 'APC-BAT-33',
    contractName: 'UPS Battery Maintenance',
    provider: 'APC',
    type: 'Maintenance Contract',
    assetsDescription: 'No assets linked',
    startDate: '2024-06-30',
    expirationDate: '2026-06-30',
    status: 'Active',
    annualCost: 2400,
    billingFrequency: 'Annual',
    autoRenewal: true,
    responsibleName: 'Isaac Villasmil'
  }
];

export const VENDORS = ['All Vendors', 'Microsoft', 'Adobe', 'Trend Micro', 'VMware', 'Cisco', 'Oracle', 'Salesforce', 'Zoom'];
export const MANUFACTURERS = ['All Manufacturers', 'Dell', 'HP', 'Cisco', 'Fortinet', 'Ubiquiti', 'Lenovo', 'APC', 'Epson', 'Brother', 'Canon', 'Synology', 'QNAP', 'Apple', 'Samsung'];
export const PROVIDERS = ['Ingram Micro', 'TD SYNNEX', 'Licencias OnLine', 'Westcon', 'SoftwareOne', 'CDW', 'Direct', 'Trend Micro', 'Microsoft', 'Dell', 'Fortinet', 'Park Place', 'APC'];
export const CONTRACT_TYPES = ['Software Support', 'Hardware Warranty', 'Multi-Asset Coverage', 'Consulting Services', 'Maintenance Contract', 'Custom'];

export const SOFTWARE_NAMES = [
  'Microsoft 365 E3', 
  'Microsoft 365 E5', 
  'Adobe Creative Cloud', 
  'Trend Micro Apex One', 
  'VMware vSphere', 
  'Salesforce Enterprise', 
  'Zoom Rooms', 
  'Slack Business+', 
  'Jira Software',
  'AutoCAD'
];

export const HARDWARE_TYPES = [
  'Server', 'Firewall', 'Switch', 'Router', 'Access Point', 'Storage', 
  'UPS', 'Printer', 'Scanner', 'Desktop', 'Laptop', 'Monitor', 'Tablet', 'Phone', 'Other'
];

export const SUPPORT_NAMES = [
  'Standard Manufacturer Support',
  'Premium 24/7 Support',
  'Gold Partner Support',
  'Silver Partner Support',
  'Basic Maintenance',
  'Enterprise SLA'
];

export const STATUS_FILTERS = ['All Status', 'Active', 'Expiring', 'Expired'];

// --- SUPER ADMIN MOCK DATA ---

export const MOCK_SAAS_USERS: SaaSUser[] = [
  { id: 'u1', name: 'Isaac Villasmil', email: 'isaac@nextcom.pa', company: 'Nextcom Systems', role: 'INTEGRATOR', plan: 'Pro', status: 'Active', joinedDate: '2025-01-10' },
  { id: 'u2', name: 'Maria Rodriguez', email: 'maria@techsolutions.com', company: 'TechSolutions Inc', role: 'INTEGRATOR', plan: 'Enterprise', status: 'Active', joinedDate: '2025-02-14' },
  { id: 'u3', name: 'John Doe', email: 'john@acmecorp.com', company: 'Acme Corp', role: 'END_USER', plan: 'Free Trial', status: 'Active', joinedDate: '2025-03-01' },
  { id: 'u4', name: 'Sarah Smith', email: 'sarah@global.net', company: 'Global Net', role: 'INTEGRATOR', plan: 'Pro', status: 'Inactive', joinedDate: '2024-11-20' },
  { id: 'u5', name: 'David Wilson', email: 'david@startuphub.io', company: 'StartupHub', role: 'END_USER', plan: 'Pro', status: 'Active', joinedDate: '2025-01-05' },
];

export const MOCK_SUBSCRIPTIONS: Subscription[] = [
  { id: 's1', company: 'Nextcom Systems', plan: 'Pro Integrator', amount: 99, interval: 'Monthly', status: 'Active', nextBilling: '2025-12-10' },
  { id: 's2', company: 'TechSolutions Inc', plan: 'Enterprise', amount: 299, interval: 'Monthly', status: 'Active', nextBilling: '2025-12-14' },
  { id: 's3', company: 'Acme Corp', plan: 'Business Plan', amount: 49, interval: 'Monthly', status: 'Active', nextBilling: '2025-12-01' },
  { id: 's4', company: 'Global Net', plan: 'Pro Integrator', amount: 99, interval: 'Monthly', status: 'Past Due', nextBilling: '2025-11-20' },
  { id: 's5', company: 'StartupHub', plan: 'Business Plan', amount: 49, interval: 'Monthly', status: 'Active', nextBilling: '2025-12-05' },
];

import { PermissionRole, RolePermissions } from './types';

export const ROLE_PERMISSIONS: Record<PermissionRole, RolePermissions> = {
  super_admin: {
    canViewAll: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: true,
    canManageOrg: true,
    canViewReports: true,
    canExport: true,
    canBulkActions: true,
    canManageClients: true,
  },
  admin: {
    canViewAll: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: true,
    canManageOrg: true,
    canViewReports: true,
    canExport: true,
    canBulkActions: true,
    canManageClients: true,
  },
  manager: {
    canViewAll: false,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canManageUsers: false,
    canManageOrg: false,
    canViewReports: true,
    canExport: true,
    canBulkActions: true,
    canManageClients: true,
  },
  user: {
    canViewAll: false,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canManageUsers: false,
    canManageOrg: false,
    canViewReports: false,
    canExport: false,
    canBulkActions: false,
    canManageClients: false,
  },
  viewer: {
    canViewAll: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canManageUsers: false,
    canManageOrg: false,
    canViewReports: true,
    canExport: false,
    canBulkActions: false,
    canManageClients: false,
  },
};

export const ROLE_LABELS: Record<PermissionRole, string> = {
  super_admin: 'Super Administrador',
  admin: 'Administrador',
  manager: 'Gerente',
  user: 'Usuario',
  viewer: 'Solo Lectura',
};

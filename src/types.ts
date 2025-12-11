
export type UserRole = 'SUPER_ADMIN' | 'INTEGRATOR' | 'END_USER';

export type PermissionRole = 'super_admin' | 'admin' | 'manager' | 'user' | 'viewer';

export type UserScope = 'all' | 'assigned' | 'department';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  permissionRole: PermissionRole;
  scope: UserScope;
  department?: string;
  organization_id?: string;
  account_type: 'integrator' | 'end_user';
}

export interface RolePermissions {
  canViewAll: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  canManageOrg: boolean;
  canViewReports: boolean;
  canExport: boolean;
  canBulkActions: boolean;
  canManageClients: boolean;
}

export type LicenseStatus = 'Active' | 'Expiring' | 'Expired';

export interface License {
  id: string;
  softwareName: string;
  vendor: string;
  provider?: string; 
  client?: string; 
  clientContact?: string; 
  quantity: number;
  expirationDate: string;
  status: LicenseStatus;
  annualCost: number;
  contractNumber?: string;
  supportIncluded: boolean;
  supportName?: string;
  supportExpiration?: string;
  supportCost?: number;
  notes?: string;
  hasAttachment?: boolean; 
  responsibleName?: string; 
}

export interface Hardware {
  id: string;
  hardwareType: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  provider?: string;
  client?: string;
  clientContact?: string;
  quantity: number;
  purchaseDate?: string;
  warrantyExpiration: string;
  status: LicenseStatus;
  purchaseCost: number;
  location: string;
  supportIncluded: boolean;
  supportProvider?: string;
  supportExpiration?: string;
  supportCost?: number;
  notes?: string;
  hasAttachment?: boolean;
  responsibleName?: string;
}

export interface SupportContract {
  id: string;
  contractId: string; // CT-YYYY-NNN (Internal)
  vendorContractNumber?: string; // External Vendor Reference
  contractName: string;
  provider: string;
  client?: string;
  clientContact?: string;
  type: string;
  assetsDescription: string; // e.g., "1 Software, 2 Hardware"
  startDate: string;
  expirationDate: string;
  status: LicenseStatus;
  annualCost: number;
  billingFrequency: 'Annual' | 'Quarterly' | 'Monthly' | 'One-time';
  autoRenewal: boolean;
  responsibleName?: string;
  providerContact?: string;
  notes?: string;
  hasAttachment?: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  created_at?: string;
  activeLicenses: number;
}

export interface Metrics {
  activeCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  totalValue: number;
}

// Super Admin Interfaces
export interface SaaSUser {
  id: string;
  name: string;
  email: string;
  company: string;
  role: UserRole;
  plan: 'Free Trial' | 'Pro' | 'Enterprise';
  status: 'Active' | 'Inactive';
  joinedDate: string;
}

export interface Subscription {
  id: string;
  company: string;
  plan: string;
  amount: number;
  interval: 'Monthly' | 'Yearly';
  status: 'Active' | 'Past Due' | 'Cancelled';
  nextBilling: string;
}

import { supabase } from './supabase';

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface SuperAdminMetrics {
  totalOrganizations: number;
  activeOrganizations: number;
  trialOrganizations: number;
  totalUsers: number;
  newUsersThisMonth: number;
  mrr: number;
  mrrGrowth: number;
  churnRate: number;
  arpu: number;
  totalTickets: number;
  openTickets: number;
  avgResponseTime: number;
}

export interface SupportTicket {
  id: string;
  organization_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'feature_request' | 'bug' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  assigned_to?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  owner_id?: string;
  owner_email?: string;
  billing_email?: string;
  subscription_plan: 'free' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'trial' | 'past_due' | 'cancelled';
  trial_ends_at?: string;
  max_users: number;
  current_users: number;
  max_items: number;
  current_items: number;
  mrr: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  last_activity_at?: string;
  health_score: number;
  created_at: string;
  updated_at: string;
}

export const superAdminApi = {
  async getMetrics(): Promise<SuperAdminMetrics> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/super-admin-metrics`,
      { headers }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch metrics');
    }

    return response.json();
  },

  async listOrganizations(params?: {
    status?: string;
    plan?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    organizations: Organization[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.plan) queryParams.set('plan', params.plan);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/admin-organizations?${queryParams}`,
      { headers }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch organizations');
    }

    return response.json();
  },

  async getOrganization(orgId: string): Promise<{
    organization: Organization;
    users: any[];
    recentActivity: any[];
    openTickets: SupportTicket[];
  }> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/admin-organizations/${orgId}`,
      { headers }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch organization');
    }

    return response.json();
  },

  async updateOrganization(orgId: string, updates: Partial<Organization>): Promise<Organization> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/admin-organizations/${orgId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update organization');
    }

    return response.json();
  },

  async suspendOrganization(orgId: string): Promise<{ success: boolean; message: string }> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/admin-organizations/${orgId}/suspend`,
      {
        method: 'POST',
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to suspend organization');
    }

    return response.json();
  },

  async reactivateOrganization(orgId: string): Promise<{ success: boolean; message: string }> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/admin-organizations/${orgId}/reactivate`,
      {
        method: 'POST',
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reactivate organization');
    }

    return response.json();
  },

  async listTickets(params?: {
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    tickets: SupportTicket[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.priority) queryParams.set('priority', params.priority);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/support-tickets?${queryParams}`,
      { headers }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch tickets');
    }

    return response.json();
  },

  async getTicket(ticketId: string): Promise<{
    ticket: SupportTicket;
    messages: TicketMessage[];
  }> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/support-tickets/${ticketId}`,
      { headers }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch ticket');
    }

    return response.json();
  },

  async createTicket(data: {
    subject: string;
    description: string;
    category?: string;
    priority?: string;
  }): Promise<SupportTicket> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/support-tickets`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create ticket');
    }

    return response.json();
  },

  async updateTicket(ticketId: string, updates: {
    status?: string;
    priority?: string;
    assigned_to?: string;
  }): Promise<SupportTicket> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/support-tickets/${ticketId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update ticket');
    }

    return response.json();
  },

  async addTicketMessage(ticketId: string, data: {
    message: string;
    is_internal?: boolean;
  }): Promise<TicketMessage> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/support-tickets/${ticketId}/messages`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add message');
    }

    return response.json();
  },

  async listUsers(params?: {
    organization?: string;
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    users: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();
    if (params?.organization) queryParams.set('organization', params.organization);
    if (params?.role) queryParams.set('role', params.role);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/admin-users?${queryParams}`,
      { headers }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch users');
    }

    return response.json();
  },

  async updateUser(userId: string, updates: {
    is_active?: boolean;
    role?: string;
  }): Promise<any> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/admin-users/${userId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user');
    }

    return response.json();
  },

  async getActivity(params?: {
    organization?: string;
    limit?: number;
    page?: number;
  }): Promise<{
    activities: any[];
    platformActivities: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();
    if (params?.organization) queryParams.set('organization', params.organization);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.page) queryParams.set('page', params.page.toString());

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/admin-activity?${queryParams}`,
      { headers }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch activity');
    }

    return response.json();
  },
};

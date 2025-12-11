import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// DEBUG: Verificar variables de entorno
console.log('🔌 Supabase URL:', supabaseUrl ? '✅ Configurado' : '❌ FALTA');
console.log('🔑 Supabase Key:', supabaseAnonKey ? '✅ Configurado' : '❌ FALTA');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          logo_url: string | null;
          account_type: 'integrator' | 'end_user' | null;
          subscription_plan: string;
          max_users: number;
          max_assets: number;
          trial_ends_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          logo_url?: string | null;
          account_type?: 'integrator' | 'end_user' | null;
          subscription_plan?: string;
          max_users?: number;
          max_assets?: number;
          trial_ends_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string | null;
          logo_url?: string | null;
          account_type?: 'integrator' | 'end_user' | null;
          subscription_plan?: string;
          max_users?: number;
          max_assets?: number;
          trial_ends_at?: string | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          full_name: string | null;
          role: 'super_admin' | 'admin' | 'manager' | 'user' | 'viewer';
          scope: 'all' | 'assigned' | 'department';
          department: string | null;
          auth_provider: string | null;
          last_login: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          organization_id?: string;
          email: string;
          full_name?: string | null;
          role?: 'super_admin' | 'admin' | 'manager' | 'user' | 'viewer';
          scope?: 'all' | 'assigned' | 'department';
          department?: string | null;
          auth_provider?: string | null;
          last_login?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          full_name?: string | null;
          role?: 'super_admin' | 'admin' | 'manager' | 'user' | 'viewer';
          scope?: 'all' | 'assigned' | 'department';
          department?: string | null;
          auth_provider?: string | null;
          last_login?: string | null;
          created_at?: string;
        };
      };
    };
  };
};

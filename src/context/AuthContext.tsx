import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  organization_id: string | null;
  email: string;
  full_name: string | null;
  role: 'super_admin' | 'admin' | 'manager' | 'user' | 'viewer';
  scope: 'all' | 'assigned' | 'department';
  department?: string | null;
  account_type?: string | null;
}

interface Organization {
  id: string;
  name: string;
  account_type: 'integrator' | 'end_user';
  subscription_plan: string;
  max_users: number;
  max_assets: number;
}

export type UserRole = 'INTEGRATOR' | 'END_USER' | 'SUPER_ADMIN';

export interface TraceTIUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  organization: Organization | null;
  session: Session | null;
  traceTIUser: TraceTIUser | null;
  loading: boolean;
  signUp: (data: {
    email: string;
    password: string;
    fullName: string;
    companyName: string;
    accountType: 'integrator' | 'end_user';
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (requiredRole: string) => boolean;
  canAccessResource: (resourceOwnerId?: string, resourceDepartment?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const roleHierarchy = {
    super_admin: 5,
    admin: 4,
    manager: 3,
    user: 2,
    viewer: 1,
  };

  const fetchProfile = async (userId: string) => {
    console.log('📥 [AuthContext] Cargando perfil desde Supabase para userId:', userId);
    try {
      // PASO 1: Leer perfil desde la base de datos
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('❌ [AuthContext] Error cargando perfil:', profileError);
        throw profileError;
      }

      if (!profileData) {
        console.warn('⚠️ [AuthContext] No se encontró perfil para userId:', userId);
        setProfile(null);
        setOrganization(null);
        setLoading(false);
        return;
      }

      console.log('✅ [AuthContext] Perfil cargado desde DB:', {
        email: profileData.email,
        role: profileData.role,
        scope: profileData.scope,
        account_type: profileData.account_type,
        organization_id: profileData.organization_id
      });

      // IMPORTANTE: Usar los datos de la base de datos, NO hardcodear nada
      setProfile(profileData);

      // PASO 2: Si tiene organización, cargarla
      if (profileData.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.organization_id)
          .maybeSingle();

        if (orgError) {
          console.error('❌ [AuthContext] Error cargando organización:', orgError);
        } else if (orgData) {
          console.log('✅ [AuthContext] Organización cargada:', {
            name: orgData.name,
            account_type: orgData.account_type
          });
          setOrganization(orgData);
        }
      }
    } catch (error) {
      console.error('❌ [AuthContext] Excepción al cargar perfil:', error);
      setProfile(null);
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const hasPermission = (requiredRole: string): boolean => {
    if (!profile) return false;
    const userRoleLevel = roleHierarchy[profile.role];
    const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy];
    return userRoleLevel >= requiredRoleLevel;
  };

  const canAccessResource = (resourceOwnerId?: string, resourceDepartment?: string): boolean => {
    if (!profile) return false;

    // Super Admin y Admin tienen acceso a todo
    if (profile.role === 'super_admin' || profile.role === 'admin') {
      return true;
    }

    // Scope 'all' tiene acceso a todo
    if (profile.scope === 'all') {
      return true;
    }

    // Scope 'assigned' solo tiene acceso a sus propios recursos
    if (profile.scope === 'assigned' && resourceOwnerId) {
      return resourceOwnerId === profile.id;
    }

    // Scope 'department' tiene acceso a recursos de su departamento
    if (profile.scope === 'department' && resourceDepartment && profile.department) {
      return resourceDepartment === profile.department;
    }

    return false;
  };

  const signUp = async (data: {
    email: string;
    password: string;
    fullName: string;
    companyName: string;
    accountType: 'integrator' | 'end_user';
  }): Promise<void> => {
    console.log('📝 [AuthContext] Iniciando registro:', data.email);

    // PASO 1: Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          company_name: data.companyName,
          account_type: data.accountType,
        },
      },
    });

    if (authError) {
      console.error('❌ [AuthContext] Error en auth.signUp:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario');
    }

    const userId = authData.user.id;
    console.log('✅ [AuthContext] Usuario creado en Auth:', userId);

    // PASO 2: Crear la organización
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: data.companyName,
        account_type: data.accountType,
        subscription_plan: 'free',
        subscription_status: 'active',
        max_users: 5,
        max_assets: 50,
        owner_id: userId,
      })
      .select()
      .single();

    if (orgError) {
      console.error('❌ [AuthContext] Error creando organización:', orgError);
      throw new Error('Error creando la organización: ' + orgError.message);
    }

    console.log('✅ [AuthContext] Organización creada:', orgData.id);

    // PASO 3: Crear o actualizar el perfil como ADMIN
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: data.email,
          full_name: data.fullName,
          organization_id: orgData.id,
          role: 'admin',
          scope: 'all',
          account_type: data.accountType,
          is_active: true,
          auth_provider: 'email',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
        }
      );

    if (profileError) {
      console.error('❌ [AuthContext] Error creando perfil:', profileError);
      throw new Error('Error creando el perfil: ' + profileError.message);
    }

    console.log('✅ [AuthContext] Perfil creado como ADMIN');

    // PASO 4: Cargar el usuario en el estado
    await fetchProfile(userId);

    console.log('✅ [AuthContext] Registro completo exitoso');
  };

  const handleOAuthCallback = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) return;

    const userId = session.user.id;
    const userEmail = session.user.email || '';
    const userName =
      session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      userEmail.split('@')[0];

    // Verificar si ya tiene perfil
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    // Si ya tiene perfil con organización, solo cargar
    if (existingProfile?.organization_id) {
      await fetchProfile(userId);
      return;
    }

    // Si no tiene organización, es usuario nuevo - crear todo
    console.log('🆕 [AuthContext] Usuario OAuth nuevo, creando organización...');

    // Crear organización
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: userName + "'s Organization",
        account_type: 'end_user',
        subscription_plan: 'free',
        subscription_status: 'active',
        max_users: 5,
        max_assets: 50,
        owner_id: userId,
      })
      .select()
      .single();

    if (orgError) {
      console.error('❌ [AuthContext] Error creando org para OAuth:', orgError);
      return;
    }

    // Actualizar/crear perfil como admin
    await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: userEmail,
          full_name: userName,
          organization_id: orgData.id,
          role: 'admin',
          scope: 'all',
          account_type: 'end_user',
          is_active: true,
          auth_provider: session.user.app_metadata?.provider || 'oauth',
        },
        {
          onConflict: 'id',
        }
      );

    await fetchProfile(userId);
  };

  useEffect(() => {
    console.log('🔄 [AuthContext] Inicializando...');

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 [AuthContext] Sesión actual:', session ? 'Encontrada' : 'No hay sesión');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        console.log('🔔 [AuthContext] Auth event:', event);

        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          // Verificar si es OAuth (no tiene password)
          const isOAuth =
            session.user.app_metadata?.provider && session.user.app_metadata.provider !== 'email';

          if (isOAuth) {
            await handleOAuthCallback();
          } else {
            await fetchProfile(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 [AuthContext] Usuario cerró sesión');
          setProfile(null);
          setOrganization(null);
          setLoading(false);
        } else if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setOrganization(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    console.log('👋 [AuthContext] Cerrando sesión...');
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setOrganization(null);
    setSession(null);
  };

  // MAPEO DE ROL PARA traceTIUser
  // IMPORTANTE: Leer directamente desde profile.role (que viene de Supabase)
  const traceTIUser: TraceTIUser | null = profile
    ? {
        id: profile.id,
        name: profile.full_name || profile.email || 'User',
        email: profile.email || '',
        // LÓGICA CORRECTA: Si es super_admin, mapear a SUPER_ADMIN
        // De lo contrario, usar el account_type de la organización
        role:
          profile.role === 'super_admin'
            ? 'SUPER_ADMIN'
            : organization?.account_type === 'integrator'
            ? 'INTEGRATOR'
            : 'END_USER',
        avatar: profile.full_name?.substring(0, 2).toUpperCase() || 'U',
      }
    : null;

  // DEBUG: Log del estado actual
  console.log('🎯 [AuthContext] Estado actual:', {
    hasUser: !!user,
    hasProfile: !!profile,
    profileRole: profile?.role,
    profileEmail: profile?.email,
    hasOrganization: !!organization,
    organizationAccountType: organization?.account_type,
    traceTIUserRole: traceTIUser?.role,
    loading
  });

  const value = {
    user,
    profile,
    organization,
    session,
    traceTIUser,
    loading,
    signUp,
    signOut,
    refreshProfile,
    hasPermission,
    canAccessResource,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

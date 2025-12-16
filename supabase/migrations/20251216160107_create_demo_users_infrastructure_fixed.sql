/*
  # Crear Infraestructura para Usuarios Demo
  
  ## Propósito
  Crear organizaciones y funciones helper para tres usuarios demo:
  1. Super Admin - Administrador de plataforma  
  2. Integrador - Empresa integradora de IT
  3. End User - Usuario final (ya existe)
  
  ## Credenciales Demo
  - Super Admin: superadmin@demo.com / SuperAdmin2024
  - Integrador: integrador@demo.com / IntegradorDemo2024
  - End User: expiretrace@gmail.com / DemoPass2024
*/

-- ============================================
-- 1. CREAR ORGANIZACIONES
-- ============================================

INSERT INTO organizations (
  id,
  name,
  account_type,
  subscription_plan,
  subscription_status,
  max_users,
  max_assets,
  created_at
) VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'Tech Solutions Inc',
  'integrator',
  'enterprise',
  'active',
  50,
  500,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  account_type = EXCLUDED.account_type;

INSERT INTO organizations (
  id,
  name,
  account_type,
  subscription_plan,
  subscription_status,
  max_users,
  max_assets,
  created_at
) VALUES (
  'b2222222-2222-2222-2222-222222222222',
  'TraceTI Platform',
  'end_user',
  'enterprise',
  'active',
  10,
  100,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name;

-- ============================================
-- 2. FUNCIÓN PARA CONFIGURAR PERFILES
-- ============================================

CREATE OR REPLACE FUNCTION setup_demo_user_profile(
  p_email text,
  p_full_name text,
  p_org_name text,
  p_role text DEFAULT 'admin',
  p_is_super_admin boolean DEFAULT false
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    RETURN 'ERROR: Usuario ' || p_email || ' no encontrado. Créalo primero en Supabase Dashboard.';
  END IF;
  
  SELECT id INTO v_org_id FROM organizations WHERE name = p_org_name;
  
  IF v_org_id IS NULL THEN
    RETURN 'ERROR: Organización ' || p_org_name || ' no encontrada';
  END IF;
  
  INSERT INTO profiles (
    id, email, full_name, organization_id, role, scope, account_type,
    is_active, auth_provider, created_at
  ) VALUES (
    v_user_id, p_email, p_full_name, v_org_id,
    CASE WHEN p_is_super_admin THEN 'super_admin' ELSE p_role::text END,
    'all',
    (SELECT account_type FROM organizations WHERE id = v_org_id),
    true, 'email', now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    organization_id = EXCLUDED.organization_id,
    role = EXCLUDED.role,
    scope = EXCLUDED.scope,
    is_active = EXCLUDED.is_active;
  
  IF p_is_super_admin THEN
    INSERT INTO platform_admins (user_id, is_active, created_at)
    VALUES (v_user_id, true, now())
    ON CONFLICT (user_id) DO UPDATE SET is_active = true;
  END IF;
  
  RETURN 'SUCCESS: Perfil configurado para ' || p_email;
END;
$$;

-- ============================================
-- 3. FUNCIÓN PARA DATOS DEMO DEL INTEGRADOR
-- ============================================

CREATE OR REPLACE FUNCTION add_integrator_demo_data()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_client1_id uuid;
  v_client2_id uuid;
BEGIN
  SELECT id INTO v_org_id FROM organizations WHERE name = 'Tech Solutions Inc';
  
  IF v_org_id IS NULL THEN
    RETURN 'ERROR: Organización Tech Solutions Inc no encontrada';
  END IF;
  
  -- Crear clientes
  INSERT INTO clients (id, organization_id, name, contact_name, contact_email, contact_phone, notes, is_active, created_at)
  VALUES 
    ('c1111111-1111-1111-1111-111111111111', v_org_id, 'Acme Corp', 'John Smith', 'contact@acmecorp.com', '+1-555-0101', 'Cliente principal - Sector manufactura', true, now()),
    ('c2222222-2222-2222-2222-222222222222', v_org_id, 'Global Services Ltd', 'Jane Doe', 'info@globalservices.com', '+1-555-0202', 'Cliente sector servicios financieros', true, now())
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
  
  v_client1_id := 'c1111111-1111-1111-1111-111111111111';
  v_client2_id := 'c2222222-2222-2222-2222-222222222222';
  
  -- Licencias
  INSERT INTO licenses (
    organization_id, client_id, software_name, vendor, provider, client_name,
    quantity, expiration_date, status, annual_cost, support_included, notes, created_at
  ) VALUES
    (v_org_id, v_client1_id, 'Microsoft 365 E5', 'Microsoft', 'Tech Solutions Inc', 'Acme Corp',
     100, '2025-06-30', 'active', 12000.00, true, 'Licencias enterprise para cliente Acme Corp', now()),
    (v_org_id, v_client1_id, 'Adobe Creative Cloud', 'Adobe', 'Tech Solutions Inc', 'Acme Corp',
     25, '2025-03-15', 'active', 6000.00, false, 'Licencias para equipo de diseño', now()),
    (v_org_id, v_client2_id, 'Salesforce Enterprise', 'Salesforce', 'Tech Solutions Inc', 'Global Services Ltd',
     50, '2025-12-31', 'active', 24000.00, true, 'CRM para equipo de ventas', now())
  ON CONFLICT DO NOTHING;
  
  -- Hardware
  INSERT INTO hardware (
    organization_id, client_id, hardware_type, manufacturer, model, serial_number,
    provider, client_name, quantity, purchase_date, warranty_expiration, status,
    purchase_cost, location, support_included, notes, created_at
  ) VALUES
    (v_org_id, v_client1_id, 'Server', 'Dell', 'PowerEdge R740', 'DELL-SVR-001',
     'Tech Solutions Inc', 'Acme Corp', 2, '2023-06-15', '2026-06-15', 'active',
     15000.00, 'Acme Corp - Data Center', true, 'Servidores principales del cliente', now()),
    (v_org_id, v_client2_id, 'Firewall', 'Cisco', 'ASA 5525-X', 'CISCO-FW-001',
     'Tech Solutions Inc', 'Global Services Ltd', 1, '2023-08-20', '2026-08-20', 'active',
     8000.00, 'Global Services - Network Room', true, 'Firewall principal', now())
  ON CONFLICT DO NOTHING;
  
  -- Contratos de soporte
  INSERT INTO support_contracts (
    organization_id, contract_id, contract_name, provider, type, assets_description,
    start_date, expiration_date, status, annual_cost, billing_frequency,
    auto_renewal, responsible_name, notes, created_at
  ) VALUES
    (v_org_id, 'INT-2024-001', 'Acme Corp - Soporte IT Integral', 'Tech Solutions Inc',
     'Managed Services', 'Soporte completo para infraestructura IT',
     '2024-01-01', '2025-12-31', 'active', 36000.00, 'Annual',
     true, 'Integrador Demo', 'Contrato de servicios administrados', now()),
    (v_org_id, 'INT-2024-002', 'Global Services - Cloud Support', 'Tech Solutions Inc',
     'Cloud Services', 'Administración de infraestructura cloud',
     '2024-06-01', '2025-06-01', 'active', 24000.00, 'Annual',
     true, 'Integrador Demo', 'Gestión y soporte de servicios cloud', now())
  ON CONFLICT DO NOTHING;
  
  RETURN 'SUCCESS: Datos demo agregados para integrador';
END;
$$;

-- Ejecutar función de datos demo
SELECT add_integrator_demo_data();

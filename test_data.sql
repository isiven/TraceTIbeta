-- Script de Testing para TraceTI
-- Este script te ayudará a configurar datos de prueba rápidamente

-- ============================================
-- PASO 1: Promover tu usuario a Super Admin
-- ============================================
-- Reemplaza 'tu@email.com' con el email que usaste para registrarte
SELECT promote_to_super_admin('tu@email.com');

-- ============================================
-- PASO 2: Ver tu perfil y permisos
-- ============================================
SELECT * FROM check_user_permissions();

-- ============================================
-- PASO 3: Ver todos los roles disponibles
-- ============================================
SELECT * FROM get_role_info();

-- ============================================
-- PASO 4: Ver todos los usuarios registrados
-- ============================================
SELECT
  p.email,
  p.full_name,
  p.role,
  p.scope,
  p.is_active,
  o.name as organization,
  o.account_type,
  o.subscription_plan
FROM profiles p
LEFT JOIN organizations o ON o.id = p.organization_id
ORDER BY p.created_at;

-- ============================================
-- PASO 5 (Opcional): Cambiar rol de usuarios
-- ============================================
-- Después de registrar usuarios adicionales, puedes cambiar sus roles:

-- Promover a Admin:
-- UPDATE profiles SET role = 'admin', scope = 'all' WHERE email = 'admin@test.com';

-- Promover a Manager con vista completa:
-- UPDATE profiles SET role = 'manager', scope = 'all' WHERE email = 'manager@test.com';

-- Promover a Manager con vista limitada:
-- UPDATE profiles SET role = 'manager', scope = 'assigned' WHERE email = 'manager2@test.com';

-- Cambiar a Viewer:
-- UPDATE profiles SET role = 'viewer' WHERE email = 'viewer@test.com';

-- ============================================
-- PASO 6 (Opcional): Crear datos de prueba
-- ============================================
-- Una vez que tengas usuarios, puedes crear recursos de prueba:

-- Ver tu organization_id:
-- SELECT id, name FROM organizations WHERE name = 'Tu Empresa';

-- Crear una licencia de prueba:
-- INSERT INTO licenses (organization_id, name, vendor, license_type, seats, cost, currency, status, created_by)
-- VALUES (
--   'TU-ORGANIZATION-ID',
--   'Microsoft 365 Business',
--   'Microsoft',
--   'Subscription',
--   10,
--   150.00,
--   'USD',
--   'active',
--   auth.uid()
-- );

-- Crear un hardware de prueba:
-- INSERT INTO hardware (organization_id, name, category, brand, model, serial_number, status, created_by)
-- VALUES (
--   'TU-ORGANIZATION-ID',
--   'Laptop Dell XPS 15',
--   'laptop',
--   'Dell',
--   'XPS 15 9520',
--   'DL123456789',
--   'in_use',
--   auth.uid()
-- );

-- Crear un contrato de prueba:
-- INSERT INTO contracts (organization_id, name, vendor, contract_type, value, currency, status, created_by)
-- VALUES (
--   'TU-ORGANIZATION-ID',
--   'Soporte Técnico Anual',
--   'TechSupport Inc',
--   'Support',
--   5000.00,
--   'USD',
--   'active',
--   auth.uid()
-- );

-- ============================================
-- PASO 7: Verificar políticas RLS
-- ============================================
-- Ver todas las políticas activas:
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- CONSULTAS ÚTILES PARA DEBUGGING
-- ============================================

-- Ver todas las organizaciones:
-- SELECT * FROM organizations ORDER BY created_at;

-- Ver todos los perfiles:
-- SELECT p.*, o.name as org_name FROM profiles p LEFT JOIN organizations o ON o.id = p.organization_id;

-- Ver licencias con información de usuarios:
-- SELECT
--   l.name,
--   l.vendor,
--   l.status,
--   l.expiration_date,
--   creator.email as created_by,
--   assigned.email as assigned_to
-- FROM licenses l
-- LEFT JOIN profiles creator ON creator.id = l.created_by
-- LEFT JOIN profiles assigned ON assigned.id = l.assigned_to;

-- Ver hardware con información de usuarios:
-- SELECT
--   h.name,
--   h.category,
--   h.status,
--   creator.email as created_by,
--   assigned.email as assigned_to
-- FROM hardware h
-- LEFT JOIN profiles creator ON creator.id = h.created_by
-- LEFT JOIN profiles assigned ON assigned.id = h.assigned_to;

-- Ver contratos con información de usuarios:
-- SELECT
--   c.name,
--   c.vendor,
--   c.status,
--   c.end_date,
--   creator.email as created_by,
--   assigned.email as assigned_to
-- FROM contracts c
-- LEFT JOIN profiles creator ON creator.id = c.created_by
-- LEFT JOIN profiles assigned ON assigned.id = c.assigned_to;

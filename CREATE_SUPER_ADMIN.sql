-- ============================================
-- CREAR SUPER ADMIN - Ejecutar en Supabase SQL Editor
-- ============================================

-- Opción 1: Convertir un usuario existente en Super Admin
-- Reemplaza 'tu-email@ejemplo.com' con tu email real

UPDATE profiles
SET
  role = 'super_admin',
  scope = 'platform',
  account_type = 'admin'
WHERE email = 'tu-email@ejemplo.com';

-- Verificar que se actualizó correctamente
SELECT
  id,
  email,
  full_name,
  role,
  scope,
  account_type,
  is_active
FROM profiles
WHERE email = 'tu-email@ejemplo.com';

-- ============================================
-- Opción 2: Crear nuevo usuario Super Admin desde cero
-- (Solo si no tienes un usuario aún)
-- ============================================

-- PASO 1: Crear usuario en auth.users (desde Supabase Dashboard > Authentication > Users)
-- O usar la UI de registro normal de tu app

-- PASO 2: Después de crear el usuario, ejecutar esto:
UPDATE profiles
SET
  role = 'super_admin',
  scope = 'platform',
  account_type = 'admin',
  organization_id = NULL  -- Super admin no pertenece a ninguna organización
WHERE email = 'nuevo-superadmin@ejemplo.com';

-- ============================================
-- VERIFICACIÓN COMPLETA
-- ============================================

-- Ver todos los super admins
SELECT
  id,
  email,
  full_name,
  role,
  scope,
  account_type,
  created_at
FROM profiles
WHERE role = 'super_admin';

-- Verificar que no esté en platform_admins (esa tabla es legacy)
SELECT * FROM platform_admins WHERE user_id IN (
  SELECT id FROM profiles WHERE role = 'super_admin'
);

-- Si aparece en platform_admins, NO es necesario tenerlo ahí
-- El sistema usa profiles.role = 'super_admin'

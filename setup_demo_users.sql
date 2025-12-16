-- ============================================
-- SCRIPT COMPLETO PARA CONFIGURAR USUARIOS DEMO
-- ============================================
-- Este script debe ejecutarse DESPUÉS de crear los usuarios en el Dashboard de Supabase

-- ============================================
-- PASO 1: Verificar que los usuarios existen en auth.users
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '=== VERIFICANDO USUARIOS EN AUTH.USERS ===';

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'integrador@demo.com') THEN
    RAISE WARNING '⚠️  Usuario integrador@demo.com NO ENCONTRADO. Por favor créalo en el Dashboard.';
  ELSE
    RAISE NOTICE '✅ Usuario integrador@demo.com encontrado';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'superadmin@demo.com') THEN
    RAISE WARNING '⚠️  Usuario superadmin@demo.com NO ENCONTRADO. Por favor créalo en el Dashboard.';
  ELSE
    RAISE NOTICE '✅ Usuario superadmin@demo.com encontrado';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'expiretrace@gmail.com') THEN
    RAISE WARNING '⚠️  Usuario expiretrace@gmail.com NO ENCONTRADO';
  ELSE
    RAISE NOTICE '✅ Usuario expiretrace@gmail.com encontrado';
  END IF;
END $$;

-- ============================================
-- PASO 2: Configurar perfil del INTEGRADOR
-- ============================================
SELECT setup_demo_user_profile(
  'integrador@demo.com',
  'Integrador Demo',
  'Tech Solutions Inc',
  'admin',
  false
);

-- ============================================
-- PASO 3: Configurar perfil del SUPER ADMIN
-- ============================================
SELECT setup_demo_user_profile(
  'superadmin@demo.com',
  'Super Admin Demo',
  'TraceTI Platform',
  'admin',
  true
);

-- ============================================
-- PASO 4: Agregar datos demo para el integrador
-- ============================================
SELECT add_integrator_demo_data();

-- ============================================
-- PASO 5: Verificar configuración final
-- ============================================
SELECT
  '=== RESUMEN DE CONFIGURACIÓN ===' as mensaje;

SELECT
  p.email,
  p.full_name,
  p.role as permission_role,
  o.name as organization,
  o.account_type,
  CASE WHEN pa.is_active THEN 'YES' ELSE 'NO' END as is_platform_admin,
  CASE
    WHEN p.email = 'expiretrace@gmail.com' THEN '✅ Listo'
    WHEN auth.users.id IS NOT NULL THEN '✅ Configurado'
    ELSE '⚠️ Falta crear en Dashboard'
  END as status
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
LEFT JOIN platform_admins pa ON p.id = pa.user_id
LEFT JOIN auth.users ON auth.users.id = p.id
WHERE p.email IN ('expiretrace@gmail.com', 'integrador@demo.com', 'superadmin@demo.com')
ORDER BY
  CASE
    WHEN p.email = 'expiretrace@gmail.com' THEN 1
    WHEN p.email = 'integrador@demo.com' THEN 2
    WHEN p.email = 'superadmin@demo.com' THEN 3
  END;

-- ============================================
-- PASO 6: Verificar datos disponibles por organización
-- ============================================
SELECT
  '=== DATOS POR ORGANIZACIÓN ===' as mensaje;

SELECT
  o.name as organization,
  o.account_type,
  (SELECT COUNT(*) FROM licenses WHERE organization_id = o.id) as licenses,
  (SELECT COUNT(*) FROM hardware WHERE organization_id = o.id) as hardware,
  (SELECT COUNT(*) FROM support_contracts WHERE organization_id = o.id) as contracts,
  (SELECT COUNT(*) FROM clients WHERE organization_id = o.id) as clients
FROM organizations o
WHERE o.name IN ('Demo Company', 'Tech Solutions Inc', 'TraceTI Platform')
ORDER BY o.name;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
/*
Si todo está correcto, deberías ver:

1. Tres usuarios configurados con status "✅"
2. Datos para cada organización:
   - Demo Company (End User): 4 licenses, 4 hardware, 3 contracts, 0 clients
   - Tech Solutions Inc (Integrador): 3 licenses, 2 hardware, 2 contracts, 2 clients
   - TraceTI Platform (Super Admin): 0 licenses, 0 hardware, 0 contracts, 0 clients

CREDENCIALES:
- End User: expiretrace@gmail.com / DemoPass2024
- Integrador: integrador@demo.com / IntegradorDemo2024
- Super Admin: superadmin@demo.com / SuperAdmin2024
*/

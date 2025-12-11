# Super Admin Setup Guide

## ¿Qué es un Super Admin?

El Super Admin es el administrador global de la plataforma TraceTI. Tiene acceso a:

- **Todas las organizaciones** registradas en la plataforma
- **Todos los usuarios** de todas las organizaciones
- **Métricas globales** de la plataforma
- **Gestión de suscripciones** y planes
- **Activar/suspender** cuentas de organizaciones

## Convertir un Usuario en Super Admin

### Paso 1: Identificar tu email

Primero, necesitas saber el email de tu cuenta de usuario.

### Paso 2: Ejecutar SQL en Supabase

Ve a Supabase Dashboard → SQL Editor y ejecuta:

```sql
-- Reemplaza con tu email real
UPDATE profiles
SET
  role = 'super_admin',
  scope = 'all'
WHERE email = 'tu-email@ejemplo.com';

-- Verificar que funcionó
SELECT id, email, role, scope, account_type
FROM profiles
WHERE email = 'tu-email@ejemplo.com';
```

### Paso 3: Cerrar sesión y volver a iniciar

1. Cierra sesión en la aplicación
2. Vuelve a iniciar sesión
3. Deberías ver el nuevo menú "Super Admin Dashboard"

## ¿Qué verás como Super Admin?

### En el Sidebar:
- **Platform Dashboard** - Vista general de toda la plataforma
- **Overview** - Resumen administrativo
- **User Management** - Gestión de usuarios
- **Subscriptions** - Gestión de suscripciones
- **Settings** - Configuración

### En Platform Dashboard:

**4 Pestañas principales:**

1. **Resumen (Overview)**
   - Organizaciones recientes
   - Usuarios recientes
   - Estadísticas generales

2. **Organizaciones**
   - Lista completa de todas las organizaciones
   - Búsqueda por nombre o email
   - Activar/suspender organizaciones
   - Ver plan, estado, usuarios, fecha de creación

3. **Usuarios**
   - Lista completa de todos los usuarios
   - Ver organización, rol, estado
   - Último login

4. **Suscripciones**
   - Distribución por plan (Free, Pro, Enterprise)
   - Distribución por tipo (Integrador, Usuario Final)
   - MRR (Monthly Recurring Revenue)
   - ARR proyectado

## Métricas en el Dashboard

- **Organizaciones Totales** - Con nuevas este mes
- **Usuarios Totales** - En toda la plataforma
- **Suscripciones Activas** - Cuentas pagadas
- **MRR Estimado** - Revenue mensual

## Acciones Disponibles

### Suspender una Organización
Haz clic en el botón de "Suspender" (ícono de prohibido) en la tabla de organizaciones.

### Activar una Organización
Haz clic en el botón de "Activar" (ícono de check) en la tabla de organizaciones.

## Notas de Seguridad

- El rol `super_admin` solo se puede asignar manualmente desde la base de datos
- No hay UI para promover usuarios a super admin (por seguridad)
- Los super admins pueden ver TODOS los datos de TODAS las organizaciones
- Usa este poder con responsabilidad

## Diferencias entre Roles

| Rol | Acceso | Puede Ver |
|-----|--------|-----------|
| **Super Admin** | Toda la plataforma | Todas las organizaciones y usuarios |
| **Admin** | Su organización | Solo usuarios y datos de su organización |
| **Manager** | Su organización | Usuarios de su departamento/scope |
| **User** | Su organización | Solo sus propios datos |

## Troubleshooting

### No veo el menú de Super Admin
1. Verifica que tu rol sea `super_admin` en la tabla `profiles`
2. Cierra sesión y vuelve a iniciar
3. Limpia la caché del navegador

### No puedo ver organizaciones
1. Verifica las políticas RLS en Supabase
2. Asegúrate de que la migración `add_super_admin_support` se ejecutó correctamente

### Errores de permisos
Las políticas RLS permiten a super admins ver TODO. Si hay errores:
1. Ve a Supabase → Database → Policies
2. Verifica que existan las políticas "Super admins can read all..."
3. Re-ejecuta la migración si es necesario

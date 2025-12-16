# Usuarios Demo - TraceTI

Este documento contiene las instrucciones para configurar y acceder a los tres usuarios demo del sistema.

## Credenciales de Acceso

### 1. END USER (Usuario Final) ✅ LISTO
**Usuario ya configurado y funcional**

- **Email**: `expiretrace@gmail.com`
- **Password**: `DemoPass2024`
- **Tipo**: Usuario Final (End User)
- **Organización**: Demo Company
- **Rol**: Admin
- **Acceso**: Dashboard de gestión de activos propios

**Datos disponibles**:
- 4 Licencias de software
- 4 Equipos de hardware
- 3 Contratos de soporte

---

### 2. INTEGRADOR (Empresa Integradora) ⚠️ REQUIERE CONFIGURACIÓN

- **Email**: `integrador@demo.com`
- **Password**: `IntegradorDemo2024`
- **Tipo**: Integrador de IT
- **Organización**: Tech Solutions Inc
- **Rol**: Admin
- **Acceso**: Dashboard con gestión de múltiples clientes

**Datos disponibles** (una vez configurado):
- 2 Clientes (Acme Corp, Global Services Ltd)
- 3 Licencias de software para clientes
- 2 Equipos de hardware para clientes
- 2 Contratos de servicios administrados

---

### 3. SUPER ADMIN (Administrador de Plataforma) ⚠️ REQUIERE CONFIGURACIÓN

- **Email**: `superadmin@demo.com`
- **Password**: `SuperAdmin2024`
- **Tipo**: Administrador de Plataforma
- **Organización**: TraceTI Platform
- **Rol**: Super Admin
- **Acceso**: Panel de administración completo de la plataforma

**Acceso incluye**:
- Gestión de todas las organizaciones
- Gestión de todos los usuarios
- Análisis y reportes globales
- Configuración de la plataforma

---

## Instrucciones de Configuración

### Paso 1: Crear Usuarios en Supabase Dashboard

Los usuarios Integrador y Super Admin deben ser creados manualmente en el dashboard de Supabase:

1. Ir a: [Supabase Dashboard - Authentication](https://supabase.com/dashboard/project/uswroedvunnadywahyhg/auth/users)

2. Click en **"Add User"** > **"Create new user"**

3. Crear el usuario **INTEGRADOR**:
   ```
   Email: integrador@demo.com
   Password: IntegradorDemo2024
   Auto Confirm User: ✅ YES
   ```

4. Crear el usuario **SUPER ADMIN**:
   ```
   Email: superadmin@demo.com
   Password: SuperAdmin2024
   Auto Confirm User: ✅ YES
   ```

### Paso 2: Configurar Perfiles

Una vez creados los usuarios en el dashboard, ejecutar estas queries SQL en Supabase:

1. Ir a: [Supabase Dashboard - SQL Editor](https://supabase.com/dashboard/project/uswroedvunnadywahyhg/sql/new)

2. Ejecutar para configurar el **INTEGRADOR**:
   ```sql
   SELECT setup_demo_user_profile(
     'integrador@demo.com',
     'Integrador Demo',
     'Tech Solutions Inc',
     'admin',
     false
   );
   ```

3. Ejecutar para configurar el **SUPER ADMIN**:
   ```sql
   SELECT setup_demo_user_profile(
     'superadmin@demo.com',
     'Super Admin Demo',
     'TraceTI Platform',
     'admin',
     true
   );
   ```

### Paso 3: Verificar Configuración

Ejecutar esta query para verificar que todo está correctamente configurado:

```sql
SELECT
  p.email,
  p.full_name,
  p.role,
  o.name as organization,
  o.account_type,
  CASE WHEN pa.is_active THEN 'YES' ELSE 'NO' END as is_platform_admin
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
LEFT JOIN platform_admins pa ON p.id = pa.user_id
WHERE p.email IN ('expiretrace@gmail.com', 'integrador@demo.com', 'superadmin@demo.com')
ORDER BY p.email;
```

Deberías ver 3 usuarios con sus respectivas configuraciones.

---

## Acceso Local

### Configurar Variables de Entorno

Asegúrate de que tu archivo `.env` tenga las credenciales correctas:

```env
VITE_SUPABASE_URL=https://uswroedvunnadywahyhg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzd3JvZWR2dW5uYWR5d2FoeWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTQ0NjMsImV4cCI6MjA4MDk3MDQ2M30.MC3jJdg8cfQsgkwOL73lXvxANJkk45l8dwaMl9yYEqc
```

### Iniciar el Proyecto

```bash
npm install
npm run dev
```

### Login

Ve a `http://localhost:5173` y usa cualquiera de las tres credenciales según el tipo de usuario que quieras probar.

---

## Flujo de Navegación por Tipo de Usuario

### End User (expiretrace@gmail.com)
- Login → Dashboard → Ver/Gestionar licencias, hardware y contratos propios

### Integrador (integrador@demo.com)
- Login → Dashboard → Ver/Gestionar clientes y sus activos
- Puede crear y asignar activos a diferentes clientes

### Super Admin (superadmin@demo.com)
- Login → Admin Dashboard → Gestión completa de la plataforma
- Panel de control con estadísticas globales
- Gestión de organizaciones y usuarios
- Acceso a todas las funcionalidades administrativas

---

## Solución de Problemas

### Error: "Invalid JWT" o "No se puede acceder"
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que los usuarios fueron confirmados (Auto Confirm: YES)

### Error: "No se encontró el perfil"
- Ejecuta las funciones `setup_demo_user_profile()` del Paso 2
- Verifica que las organizaciones existen en la base de datos

### No aparecen datos
- Para el end user: Los datos ya están cargados
- Para el integrador: Ejecuta `SELECT add_integrator_demo_data();`
- Para el super admin: Verifica que `platform_admins` tenga el registro

### Consola del navegador muestra errores
- Abre las herramientas de desarrollador (F12)
- Revisa la pestaña Console para ver mensajes de debug
- Busca logs que empiecen con 🔌, 🔐, 📥, ✅ o ❌

---

## Contacto

Si tienes problemas con la configuración, verifica:
1. Las credenciales de Supabase en `.env`
2. Que los usuarios fueron creados en el Dashboard
3. Que ejecutaste las funciones SQL de configuración
4. Los logs en la consola del navegador para más detalles

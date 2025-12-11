# Guía de Testing de Roles - TraceTI

## Sistema de Roles Implementado

### Roles Disponibles

1. **super_admin** - Administrador del sistema
   - Acceso completo a todo el sistema
   - Puede gestionar todas las organizaciones
   - Puede promover otros usuarios a cualquier rol

2. **admin** - Administrador de organización
   - Acceso completo a su organización
   - Puede gestionar usuarios de su organización
   - Puede crear, editar y eliminar todos los recursos

3. **manager** - Gerente
   - Puede gestionar recursos según su scope
   - Scope 'all': puede ver todos los recursos de la organización
   - Scope 'assigned': solo puede ver recursos asignados a él

4. **user** - Usuario estándar
   - Puede crear recursos (licencias, hardware, contratos)
   - Solo puede editar recursos que él creó o que le fueron asignados
   - No puede eliminar recursos

5. **viewer** - Solo lectura
   - Acceso de solo lectura a recursos asignados

### Tipos de Cuenta

1. **end_user** - Usuario final
   - Gestiona sus propios activos IT

2. **integrator** - Integrador (Multi-cliente)
   - Puede gestionar múltiples clientes
   - Tiene acceso a funcionalidad de gestión multi-cliente

## Cómo Probar los Roles

### 1. Registrar el Primer Usuario (Super Admin)

```
1. Accede a: http://localhost:5173/register
2. Completa el formulario:
   - Nombre completo: Tu nombre
   - Email: tu@email.com
   - Nombre de la empresa: Tu Empresa
   - Tipo de cuenta: Usuario Final o Integrador
   - Contraseña: (mínimo 6 caracteres)
3. Click en "Crear Cuenta"
```

### 2. Promover el Primer Usuario a Super Admin

Después de registrarte, necesitas promoverte a super_admin manualmente usando la base de datos:

**Opción A: Usando SQL directo en Supabase Dashboard**
```sql
-- Reemplaza 'tu@email.com' con tu email real
SELECT promote_to_super_admin('tu@email.com');
```

**Opción B: Actualización manual**
```sql
UPDATE profiles
SET role = 'super_admin', scope = 'all'
WHERE email = 'tu@email.com';
```

### 3. Crear Usuarios de Prueba con Diferentes Roles

Una vez que seas super_admin, puedes:

#### Crear un Admin:
```
1. Registra otro usuario normalmente
2. Luego ejecuta en SQL:
UPDATE profiles
SET role = 'admin', scope = 'all'
WHERE email = 'admin@test.com';
```

#### Crear un Manager:
```
1. Registra otro usuario
2. Ejecuta en SQL:
UPDATE profiles
SET role = 'manager', scope = 'all'
WHERE email = 'manager@test.com';
-- O para scope limitado:
UPDATE profiles
SET role = 'manager', scope = 'assigned'
WHERE email = 'manager2@test.com';
```

#### Crear un User Regular:
```
1. Simplemente registra un usuario - el rol por defecto es 'user'
```

#### Crear un Viewer:
```
1. Registra un usuario
2. Ejecuta en SQL:
UPDATE profiles
SET role = 'viewer'
WHERE email = 'viewer@test.com';
```

### 4. Probar Funcionalidad Multi-Cliente (Integradores)

Para probar como integrador:

```
1. Registra un usuario con "Tipo de cuenta: Integrador"
2. Promócelo a admin o super_admin
3. En el dashboard, podrás:
   - Crear múltiples clientes
   - Asignar recursos a diferentes clientes
   - Ver todos los clientes en un solo lugar
```

## Escenarios de Prueba

### Escenario 1: Super Admin
**Objetivo**: Verificar acceso total

1. Inicia sesión como super_admin
2. Verifica que puedes:
   - Ver todas las organizaciones (si hay múltiples)
   - Crear, editar, eliminar cualquier recurso
   - Gestionar usuarios

### Escenario 2: Admin de Organización
**Objetivo**: Verificar gestión de organización

1. Inicia sesión como admin
2. Verifica que puedes:
   - Ver todos los recursos de tu organización
   - Crear nuevos usuarios (invitaciones)
   - Editar y eliminar recursos
   - No puedes ver recursos de otras organizaciones

### Escenario 3: Manager con Scope 'all'
**Objetivo**: Verificar vista completa sin permisos de eliminación

1. Inicia sesión como manager (scope: all)
2. Verifica que puedes:
   - Ver todos los recursos de tu organización
   - Crear nuevos recursos
   - Editar recursos
   - NO puedes eliminar recursos

### Escenario 4: Manager con Scope 'assigned'
**Objetivo**: Verificar vista limitada

1. Inicia sesión como manager (scope: assigned)
2. Verifica que puedes:
   - Solo ver recursos asignados a ti
   - Crear nuevos recursos
   - Editar solo tus recursos
   - NO puedes eliminar recursos

### Escenario 5: Usuario Regular
**Objetivo**: Verificar permisos básicos

1. Inicia sesión como user
2. Verifica que puedes:
   - Crear recursos
   - Ver recursos que creaste o que te asignaron
   - Editar solo tus recursos
   - NO puedes eliminar recursos

### Escenario 6: Viewer
**Objetivo**: Verificar solo lectura

1. Inicia sesión como viewer
2. Verifica que puedes:
   - Solo ver recursos asignados a ti
   - NO puedes crear, editar ni eliminar

## Verificar Permisos de tu Usuario Actual

Puedes ejecutar esta función en SQL para ver tus permisos:

```sql
SELECT * FROM check_user_permissions();
```

## Ver Información de Todos los Roles

```sql
SELECT * FROM get_role_info();
```

## Notas Importantes

1. **RLS (Row Level Security)** está habilitado en todas las tablas
2. Los permisos se validan a nivel de base de datos, no solo en el frontend
3. Cada usuario solo puede ver recursos de su organización
4. El scope determina qué recursos puede ver un usuario dentro de su organización
5. Las políticas RLS previenen acceso no autorizado incluso si se manipula el frontend

## Comandos SQL Útiles para Testing

### Ver todos los usuarios y sus roles:
```sql
SELECT
  p.email,
  p.full_name,
  p.role,
  p.scope,
  o.name as organization,
  o.account_type
FROM profiles p
LEFT JOIN organizations o ON o.id = p.organization_id
ORDER BY p.created_at;
```

### Ver recursos por usuario:
```sql
-- Licencias
SELECT l.name, l.vendor, p.email as created_by, p2.email as assigned_to
FROM licenses l
LEFT JOIN profiles p ON p.id = l.created_by
LEFT JOIN profiles p2 ON p2.id = l.assigned_to;

-- Hardware
SELECT h.name, h.category, p.email as created_by, p2.email as assigned_to
FROM hardware h
LEFT JOIN profiles p ON p.id = h.created_by
LEFT JOIN profiles p2 ON p2.id = h.assigned_to;

-- Contratos
SELECT c.name, c.vendor, p.email as created_by, p2.email as assigned_to
FROM contracts c
LEFT JOIN profiles p ON p.id = c.created_by
LEFT JOIN profiles p2 ON p2.id = c.assigned_to;
```

### Cambiar el rol de un usuario:
```sql
UPDATE profiles
SET role = 'admin', scope = 'all'
WHERE email = 'usuario@email.com';
```

## Estado del Sistema

✅ Base de datos configurada con todas las tablas
✅ RLS habilitado y políticas configuradas
✅ Sistema de autenticación implementado
✅ Roles y permisos funcionando
✅ Funciones de gestión de super_admin
✅ Frontend con rutas protegidas

## Próximos Pasos para Producción

1. Configurar variables de entorno de producción
2. Establecer el primer super_admin
3. Configurar notificaciones por email
4. Implementar límites de plan según subscription_plan
5. Configurar backups automáticos de la base de datos

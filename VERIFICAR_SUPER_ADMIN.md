# 🔍 Guía de Verificación - Super Admin Dashboard

## Paso 1: Crear Usuario Super Admin

### Opción A: Usar un usuario existente

1. Abre **Supabase Dashboard** → Tu Proyecto
2. Ve a **SQL Editor**
3. Ejecuta este SQL (reemplaza con tu email):

```sql
UPDATE profiles
SET
  role = 'super_admin',
  scope = 'platform',
  account_type = 'admin'
WHERE email = 'tu-email@ejemplo.com';

-- Verificar
SELECT email, role, scope, account_type
FROM profiles
WHERE email = 'tu-email@ejemplo.com';
```

### Opción B: Crear nuevo usuario

1. Ve a **Authentication** → **Users** → **Invite User**
2. Email: `admin@traceti.com`
3. Password: (tu contraseña segura)
4. Después, ejecuta en SQL Editor:

```sql
UPDATE profiles
SET
  role = 'super_admin',
  scope = 'platform',
  account_type = 'admin'
WHERE email = 'admin@traceti.com';
```

---

## Paso 2: Login y Verificar Acceso

### 2.1 Login
1. Abre tu aplicación: `http://localhost:5173` (o tu URL)
2. Haz login con el email configurado como super_admin
3. Deberías ser redirigido automáticamente

### 2.2 Verificar Menú Lateral

Deberías ver estos elementos de menú (en este orden):

- ✅ **Platform Dashboard** (ícono Activity)
- ✅ **Organizations** (ícono Building2)
- ✅ **User Management** (ícono Users)
- ✅ **All Tickets** (ícono MessageSquare)
- ✅ **Subscriptions** (ícono CreditCard)
- ✅ **Help & Support** (ícono HelpCircle)
- ✅ **Settings** (ícono Settings)

Si ves estos menús, ¡estás como super admin correctamente! 🎉

---

## Paso 3: Verificar Platform Dashboard

### 3.1 Click en "Platform Dashboard"

Deberías ver estas métricas:

#### KPIs Principales:
- **Total Organizations**: Número total de organizaciones
- **Active Users**: Usuarios activos en la plataforma
- **MRR**: Monthly Recurring Revenue (puede ser $0 si es nuevo)
- **Open Tickets**: Tickets de soporte abiertos

#### Growth Indicators:
- Indicadores verdes ↑ o rojos ↓
- Porcentajes de crecimiento

#### Gráfico de Tendencias:
- Gráfica de MRR últimos 6 meses (puede estar vacía si es nuevo)

#### Tabla de Organizaciones:
Columnas:
- Organization
- Owner
- Plan (free/pro/enterprise)
- Users
- MRR
- Status
- Health Score
- Actions

### 3.2 Si No Ves Datos:

Es normal en una instalación nueva. Para crear datos de prueba:

```sql
-- Crear organización de prueba
INSERT INTO organizations (name, account_type, subscription_plan, subscription_status, mrr, health_score)
VALUES ('Empresa Demo', 'organization', 'pro', 'active', 99.00, 85);

-- Crear usuario de prueba en esa org
INSERT INTO profiles (email, full_name, role, organization_id)
SELECT 'usuario@demo.com', 'Usuario Demo', 'member',
  (SELECT id FROM organizations WHERE name = 'Empresa Demo' LIMIT 1);
```

---

## Paso 4: Verificar Organizations

### 4.1 Click en "Organizations"

Deberías ver:
- Lista de todas las organizaciones
- Filtros por:
  - Status (All, Active, Trial, Suspended)
  - Plan (All, Free, Pro, Enterprise)
- Barra de búsqueda

### 4.2 Click en una organización

Deberías ver modal con:
- Nombre
- Owner email
- Plan actual
- Número de usuarios
- MRR
- Health Score
- Botones: "Change Plan", "Suspend", "View Analytics"

### 4.3 Probar Acciones:

#### Cambiar Plan:
1. Click en organización
2. Click "Change Plan"
3. Seleccionar nuevo plan
4. Guardar
5. ✅ Debería actualizarse

#### Suspender:
1. Click "Suspend"
2. Confirmar
3. ✅ Status debería cambiar a "suspended"

#### Reactivar:
1. Click en organización suspendida
2. Click "Reactivate"
3. ✅ Status vuelve a "active"

---

## Paso 5: Verificar User Management

### 5.1 Click en "User Management"

Deberías ver tabla con:
- Name
- Email
- Role
- Organization
- Status (Active/Inactive)
- Last Login
- Actions

### 5.2 Filtros Disponibles:

- Por rol (All, Admin, Member, Manager)
- Por status (All, Active, Inactive)
- Búsqueda por nombre/email

### 5.3 Probar Acciones:

1. Click en un usuario
2. Cambiar status (Active ↔ Inactive)
3. ✅ Debería actualizarse

---

## Paso 6: Verificar Sistema de Tickets

### 6.1 Crear Ticket de Prueba

#### Como Usuario Normal:
1. Logout del super admin
2. Login con usuario normal
3. Click "Help & Support" en el menú
4. Click "Nuevo Ticket"
5. Llenar formulario:
   - **Asunto**: "Prueba del sistema de tickets"
   - **Descripción**: "Este es un ticket de prueba para verificar funcionamiento"
   - **Categoría**: Technical
   - **Prioridad**: Medium
6. Click "Crear Ticket"
7. ✅ Debería aparecer en la lista

### 6.2 Ver Ticket como Super Admin

1. Logout y login como super admin
2. Click "All Tickets" en el menú
3. ✅ Deberías ver el ticket creado

### 6.3 Probar Funcionalidad:

#### Ver Todos los Tickets:
- ✅ Deberías ver tickets de TODAS las organizaciones

#### Filtrar:
- Por status (Open, In Progress, Resolved, Closed)
- Por prioridad (Low, Medium, High, Critical)
- Por búsqueda de texto

#### Abrir Ticket:
1. Click en un ticket
2. Deberías ver:
   - Subject y descripción completa
   - Información del usuario
   - Thread de mensajes
   - Dropdowns para cambiar estado y prioridad (super admin)
   - Checkbox "Nota interna"

#### Cambiar Estado:
1. Seleccionar nuevo estado en dropdown
2. ✅ Debería actualizarse automáticamente

#### Responder:
1. Escribir mensaje en el textarea
2. Marcar "Nota interna" (opcional)
3. Click "Enviar"
4. ✅ Mensaje debería aparecer en el thread

#### Verificar Real-Time:
1. Abrir ticket en 2 navegadores diferentes
2. Enviar mensaje desde uno
3. ✅ Debería aparecer automáticamente en el otro

---

## Paso 7: Verificar Edge Functions

### 7.1 Verificar que están Desplegadas

En **Supabase Dashboard** → **Edge Functions**:

Deberías ver estas 7 funciones:

1. ✅ `super-admin-metrics`
2. ✅ `admin-organizations`
3. ✅ `support-tickets`
4. ✅ `admin-users`
5. ✅ `admin-activity`
6. ✅ `stripe-webhook`
7. ✅ `calculate-health-scores`

### 7.2 Probar Métricas API

Abre la consola del navegador (F12) y ejecuta:

```javascript
const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/super-admin-metrics`;
const token = (await supabase.auth.getSession()).data.session.access_token;

const response = await fetch(apiUrl, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const data = await response.json();
console.log('📊 Métricas:', data);
```

Deberías ver objeto con:
```json
{
  "totalOrganizations": 3,
  "activeOrganizations": 2,
  "totalUsers": 15,
  "mrr": 297.00,
  "mrrGrowth": 15.5,
  "openTickets": 4,
  ...
}
```

---

## Paso 8: Verificar Health Scores

### 8.1 Ejecutar Cálculo Manual

En **Supabase Dashboard** → **Edge Functions** → `calculate-health-scores`:

1. Click en la función
2. Click "Invoke function"
3. Headers:
   ```json
   {
     "Authorization": "Bearer TU_TOKEN_AQUI"
   }
   ```
4. Body: `{}`
5. Click "Send request"

✅ Deberías ver respuesta:
```json
{
  "success": true,
  "processed": 3,
  "results": [
    {
      "organization_id": "...",
      "organization_name": "Empresa Demo",
      "health_score": 85,
      "breakdown": {
        "activity": 40,
        "logins": 30,
        "tickets": 15
      }
    }
  ]
}
```

### 8.2 Verificar en Dashboard

1. Ve a "Organizations"
2. Revisa columna "Health Score"
3. ✅ Deberías ver valores actualizados (0-100)

#### Colores del Health Score:
- 🟢 Verde (80-100): Excelente salud
- 🟡 Amarillo (60-79): Salud moderada
- 🔴 Rojo (0-59): Necesita atención

---

## Paso 9: Verificar Logs de Actividad

### 9.1 Via API (Consola del navegador):

```javascript
const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-activity?limit=10`;
const token = (await supabase.auth.getSession()).data.session.access_token;

const response = await fetch(apiUrl, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const data = await response.json();
console.log('📋 Activity Logs:', data);
```

Deberías ver array de logs con:
```json
{
  "logs": [
    {
      "id": "...",
      "organization_id": "...",
      "user_email": "user@example.com",
      "action": "create_ticket",
      "resource_type": "ticket",
      "created_at": "2025-12-28T..."
    }
  ]
}
```

---

## Paso 10: Verificar RLS (Seguridad)

### 10.1 Probar como Usuario Normal

1. Logout del super admin
2. Login con usuario normal
3. Intenta acceder a "Platform Dashboard" manualmente:
   - Debería mostrar su dashboard normal
   - NO debería ver métricas de plataforma

### 10.2 Probar Aislamiento de Tickets

Como usuario normal:
1. Ve a "Help & Support"
2. ✅ Solo deberías ver TUS propios tickets
3. ❌ NO deberías ver tickets de otras organizaciones

Como super admin:
1. Login como super admin
2. Ve a "All Tickets"
3. ✅ Deberías ver TODOS los tickets de TODAS las organizaciones

### 10.3 Probar Notas Internas

1. Como super admin, crea nota interna en un ticket
2. Logout y login como el usuario dueño del ticket
3. Abre el ticket
4. ✅ NO deberías ver la nota interna
5. Login como super admin nuevamente
6. ✅ Deberías ver la nota interna marcada con badge amarillo

---

## ✅ Checklist de Verificación Completa

### Backend:
- [ ] 7 Edge Functions desplegadas
- [ ] Tablas `support_tickets` y `ticket_messages` creadas
- [ ] Columnas agregadas a `organizations`
- [ ] RLS policies funcionando

### Frontend:
- [ ] Menú de super admin visible
- [ ] Platform Dashboard muestra métricas
- [ ] Organizations page funciona
- [ ] User Management funciona
- [ ] All Tickets muestra todos los tickets
- [ ] Help & Support permite crear tickets
- [ ] Ticket Detail permite conversaciones
- [ ] Real-time funciona

### Funcionalidad:
- [ ] Crear tickets como usuario
- [ ] Ver todos los tickets como super admin
- [ ] Cambiar estado de tickets
- [ ] Agregar mensajes
- [ ] Notas internas solo visibles para admins
- [ ] Filtros funcionan
- [ ] Búsqueda funciona
- [ ] Health scores se calculan

### Seguridad:
- [ ] Usuarios normales no ven datos de otros
- [ ] Super admin ve todo
- [ ] Notas internas protegidas
- [ ] APIs verifican autenticación
- [ ] RLS previene acceso no autorizado

---

## 🐛 Troubleshooting

### No veo el menú de super admin

**Verificar en SQL**:
```sql
SELECT email, role, scope, account_type
FROM profiles
WHERE email = 'tu-email@ejemplo.com';
```

Debe mostrar:
- `role = 'super_admin'`
- `scope = 'platform'`

Si no, ejecutar:
```sql
UPDATE profiles
SET role = 'super_admin', scope = 'platform'
WHERE email = 'tu-email@ejemplo.com';
```

### Error al cargar métricas

**Verificar en consola del navegador** (F12):
- ¿Hay errores de CORS?
- ¿Hay errores 401/403?
- ¿El token está presente?

**Verificar Edge Function**:
1. Supabase Dashboard → Edge Functions → `super-admin-metrics`
2. Ver logs
3. ¿Hay errores?

### Tickets no aparecen

**Verificar RLS**:
```sql
-- Ver políticas
SELECT * FROM pg_policies
WHERE tablename = 'support_tickets';
```

**Crear ticket de prueba manual**:
```sql
INSERT INTO support_tickets (
  organization_id,
  user_id,
  user_email,
  user_name,
  subject,
  description,
  category,
  priority,
  status
)
SELECT
  (SELECT id FROM organizations LIMIT 1),
  (SELECT id FROM profiles LIMIT 1),
  'test@example.com',
  'Test User',
  'Ticket de Prueba',
  'Este es un ticket de prueba',
  'technical',
  'medium',
  'open';
```

### Real-time no funciona

**Verificar Realtime habilitado**:
1. Supabase Dashboard → Database → Replication
2. Buscar tabla `ticket_messages`
3. ✅ Asegurar que está habilitada

**Verificar suscripciones**:
- Consola del navegador (F12)
- Buscar errores de WebSocket
- Verificar que la suscripción se establece

---

## 📞 Si Necesitas Ayuda

1. **Revisar logs**:
   - Supabase Dashboard → Logs
   - Consola del navegador (F12)

2. **Verificar Edge Functions**:
   - Supabase Dashboard → Edge Functions
   - Ver logs de cada función

3. **Verificar base de datos**:
   - SQL Editor
   - Ejecutar queries de verificación

4. **Revisar documentación**:
   - `SUPER_ADMIN_API.md`
   - `COMPLETE_IMPLEMENTATION_GUIDE.md`

---

## 🎉 ¡Listo!

Si completaste todos los pasos y todo funciona, ¡felicitaciones! 🚀

Tienes un **Super Admin Dashboard completamente funcional** con:
- ✅ Gestión de organizaciones
- ✅ Gestión de usuarios
- ✅ Sistema de tickets completo
- ✅ Métricas en tiempo real
- ✅ Health scores automáticos
- ✅ Real-time chat
- ✅ Seguridad robusta con RLS

**Todo 100% con Supabase, sin backend Node.js.**

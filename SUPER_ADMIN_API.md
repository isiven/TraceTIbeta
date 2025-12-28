# Super Admin API Documentation

This document describes the Supabase Edge Functions implemented for Super Admin functionality in TraceTI.

## Overview

All Super Admin APIs are implemented as Supabase Edge Functions for security, scalability, and maintainability. These functions require authentication and super admin role verification.

## Base URL

```
https://[your-project].supabase.co/functions/v1/
```

## Authentication

All endpoints (except Stripe webhook) require a valid JWT token in the Authorization header:

```
Authorization: Bearer [your-token]
```

## Edge Functions

### 1. Super Admin Metrics

**Function:** `super-admin-metrics`
**Method:** GET
**Auth Required:** Yes (super_admin only)

Returns comprehensive metrics for the entire platform.

**Response:**
```json
{
  "totalOrganizations": 50,
  "activeOrganizations": 45,
  "trialOrganizations": 5,
  "totalUsers": 250,
  "newUsersThisMonth": 15,
  "mrr": 4500.00,
  "mrrGrowth": 12.5,
  "churnRate": 2.1,
  "arpu": 100.00,
  "totalTickets": 30,
  "openTickets": 5,
  "avgResponseTime": 24.5
}
```

**Usage:**
```typescript
import { superAdminApi } from './lib/superAdminApi';

const metrics = await superAdminApi.getMetrics();
```

---

### 2. Organization Management

**Function:** `admin-organizations`
**Auth Required:** Yes (super_admin only)

#### List Organizations

**Method:** GET
**Query Parameters:**
- `status` (optional): Filter by subscription_status
- `plan` (optional): Filter by subscription_plan
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "organizations": [...],
  "total": 50,
  "page": 1,
  "totalPages": 3
}
```

#### Get Organization Details

**Method:** GET
**Path:** `/admin-organizations/{orgId}`

**Response:**
```json
{
  "organization": {...},
  "users": [...],
  "recentActivity": [...],
  "openTickets": [...]
}
```

#### Update Organization

**Method:** PATCH
**Path:** `/admin-organizations/{orgId}`
**Body:**
```json
{
  "subscription_plan": "pro",
  "subscription_status": "active",
  "max_users": 10,
  "max_items": 500,
  "trial_ends_at": "2024-12-31T23:59:59Z",
  "mrr": 99.00
}
```

#### Suspend Organization

**Method:** POST
**Path:** `/admin-organizations/{orgId}/suspend`

Deactivates all users and sets subscription to cancelled.

#### Reactivate Organization

**Method:** POST
**Path:** `/admin-organizations/{orgId}/reactivate`

Reactivates all users and sets subscription to active.

**Usage:**
```typescript
// List organizations
const orgs = await superAdminApi.listOrganizations({
  status: 'active',
  page: 1
});

// Get details
const details = await superAdminApi.getOrganization(orgId);

// Update
const updated = await superAdminApi.updateOrganization(orgId, {
  subscription_plan: 'enterprise'
});

// Suspend
await superAdminApi.suspendOrganization(orgId);

// Reactivate
await superAdminApi.reactivateOrganization(orgId);
```

---

### 3. Support Tickets

**Function:** `support-tickets`
**Auth Required:** Yes

#### List Tickets

**Method:** GET
**Query Parameters:**
- `status` (optional): open, in_progress, waiting, resolved, closed
- `priority` (optional): low, medium, high, critical
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "tickets": [...],
  "total": 30,
  "page": 1,
  "totalPages": 2
}
```

#### Get Ticket Details

**Method:** GET
**Path:** `/support-tickets/{ticketId}`

**Response:**
```json
{
  "ticket": {...},
  "messages": [...]
}
```

Note: Non-super-admins only see non-internal messages.

#### Create Ticket

**Method:** POST
**Body:**
```json
{
  "subject": "Issue with license import",
  "description": "Detailed description...",
  "category": "technical",
  "priority": "medium"
}
```

**Categories:** technical, billing, feature_request, bug, other
**Priorities:** low, medium, high, critical

#### Update Ticket (Super Admin Only)

**Method:** PATCH
**Path:** `/support-tickets/{ticketId}`
**Body:**
```json
{
  "status": "in_progress",
  "priority": "high",
  "assigned_to": "admin-user-id"
}
```

#### Add Message

**Method:** POST
**Path:** `/support-tickets/{ticketId}/messages`
**Body:**
```json
{
  "message": "Message content...",
  "is_internal": false
}
```

Note: `is_internal` only works for super admins.

**Usage:**
```typescript
// List tickets
const tickets = await superAdminApi.listTickets({
  status: 'open'
});

// Get ticket
const ticket = await superAdminApi.getTicket(ticketId);

// Create ticket
const newTicket = await superAdminApi.createTicket({
  subject: 'Need help',
  description: 'Details...',
  category: 'technical',
  priority: 'medium'
});

// Update ticket (super admin only)
await superAdminApi.updateTicket(ticketId, {
  status: 'resolved'
});

// Add message
await superAdminApi.addTicketMessage(ticketId, {
  message: 'Here is the solution...'
});
```

---

### 4. User Management

**Function:** `admin-users`
**Auth Required:** Yes (super_admin only)

#### List Users

**Method:** GET
**Query Parameters:**
- `organization` (optional): Filter by organization ID
- `role` (optional): Filter by role
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "users": [...],
  "total": 250,
  "page": 1,
  "totalPages": 5
}
```

#### Update User

**Method:** PATCH
**Path:** `/admin-users/{userId}`
**Body:**
```json
{
  "is_active": true,
  "role": "manager"
}
```

**Usage:**
```typescript
// List all users
const users = await superAdminApi.listUsers();

// List users from specific organization
const orgUsers = await superAdminApi.listUsers({
  organization: orgId
});

// Update user
await superAdminApi.updateUser(userId, {
  is_active: false
});
```

---

### 5. Activity Logs

**Function:** `admin-activity`
**Auth Required:** Yes (super_admin only)

#### Get Activity Logs

**Method:** GET
**Query Parameters:**
- `organization` (optional): Filter by organization ID
- `limit` (optional): Items per page (default: 50)
- `page` (optional): Page number

**Response:**
```json
{
  "activities": [...],
  "platformActivities": [...],
  "total": 1500,
  "page": 1,
  "totalPages": 30
}
```

**Usage:**
```typescript
// Get all activity
const activity = await superAdminApi.getActivity();

// Get activity for specific organization
const orgActivity = await superAdminApi.getActivity({
  organization: orgId,
  limit: 100
});
```

---

### 6. Stripe Webhook

**Function:** `stripe-webhook`
**Method:** POST
**Auth Required:** No (uses Stripe signature verification)

Handles Stripe webhook events:
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.deleted`
- `customer.subscription.updated`
- `customer.subscription.created`

**Setup:**
1. Configure webhook URL in Stripe Dashboard:
   ```
   https://[your-project].supabase.co/functions/v1/stripe-webhook
   ```

2. Add webhook secret to Supabase environment variables (managed automatically)

3. Select events to listen for in Stripe Dashboard

**Automatic Actions:**
- Updates subscription status in database
- Updates organization MRR and status
- Logs activity for audit trail
- Sends email notifications on payment failures

---

## Database Schema

### Organizations Table (Extended)

New columns added:
- `owner_email` (text)
- `billing_email` (text)
- `current_users` (integer)
- `max_items` (integer)
- `current_items` (integer)
- `mrr` (decimal)
- `stripe_customer_id` (text)
- `stripe_subscription_id` (text)
- `last_activity_at` (timestamptz)
- `health_score` (integer 0-100)

### Support Tickets Table

```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations,
  user_id UUID REFERENCES auth.users,
  user_email TEXT,
  user_name TEXT,
  subject TEXT,
  description TEXT,
  category TEXT CHECK (category IN (...)),
  priority TEXT CHECK (priority IN (...)),
  status TEXT CHECK (status IN (...)),
  assigned_to UUID REFERENCES platform_admins,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Ticket Messages Table

```sql
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets,
  user_id UUID REFERENCES auth.users,
  user_name TEXT,
  user_role TEXT,
  message TEXT,
  is_internal BOOLEAN,
  created_at TIMESTAMPTZ
);
```

### Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations UNIQUE,
  plan_id TEXT CHECK (plan_id IN ('free_trial', 'pro', 'enterprise')),
  status TEXT,
  amount DECIMAL(10,2),
  interval TEXT CHECK (interval IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## Helper Functions

### Calculate Health Score

```sql
SELECT calculate_health_score(organization_id);
```

Returns a score from 0-100 based on:
- Last activity (0-40 points)
- Active user logins (0-30 points)
- Open vs closed tickets (0-30 points)

### Update Organization Stats

```sql
SELECT update_organization_stats(organization_id);
```

Updates:
- `current_users` count
- `current_items` count (licenses + hardware + contracts)
- `health_score`

---

## Frontend Integration

### 1. Install Dependencies

Already included in package.json:
- `@supabase/supabase-js`

### 2. Use API Service

```typescript
import { superAdminApi } from './lib/superAdminApi';

// All functions return properly typed responses
const metrics = await superAdminApi.getMetrics();
const orgs = await superAdminApi.listOrganizations();
const tickets = await superAdminApi.listTickets();
```

### 3. Use React Hooks

```typescript
import { usePlatformStats } from './hooks/usePlatformStats';
import { useOrganizations } from './hooks/useOrganizations';
import { useSupportTickets } from './hooks/useSupportTickets';
import { useAllUsers } from './hooks/useAllUsers';

function Dashboard() {
  const { stats, loading } = usePlatformStats();
  const { organizations } = useOrganizations();
  const { tickets } = useSupportTickets({ status: 'open' });

  // Use the data...
}
```

---

## Security Considerations

1. **Authentication**: All endpoints verify JWT tokens
2. **Authorization**: Super admin role checked for protected endpoints
3. **RLS Policies**: Row-level security enforced on all tables
4. **Service Role Key**: Only used server-side in Edge Functions
5. **Rate Limiting**: Automatic via Supabase
6. **CORS**: Configured to allow all origins (adjust for production)

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "error": "Error message description"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

---

## Testing

### Using Postman/Thunder Client

1. Get auth token:
```bash
# Login to get token
curl -X POST https://[project].supabase.co/auth/v1/token?grant_type=password \
  -H "apikey: [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

2. Test endpoint:
```bash
curl https://[project].supabase.co/functions/v1/super-admin-metrics \
  -H "Authorization: Bearer [token]"
```

### Using Frontend

```typescript
// The API handles authentication automatically
const metrics = await superAdminApi.getMetrics();
```

---

## Deployment

Edge Functions are automatically deployed and configured. No manual steps required.

To update a function:
```bash
# Functions are deployed via the mcp__supabase__deploy_edge_function tool
# No CLI access needed
```

---

## Monitoring

Monitor Edge Function logs in Supabase Dashboard:
1. Go to Edge Functions section
2. Click on function name
3. View Logs tab

All errors are logged with context for debugging.

---

## Future Enhancements

Potential additions:
- Email notifications via Resend integration
- Advanced analytics and reporting
- Bulk operations for organizations
- Custom webhook support for integrations
- Export functionality for data
- Advanced search and filtering

---

## Support

For issues or questions:
1. Check Supabase Edge Function logs
2. Review browser console for frontend errors
3. Verify authentication tokens are valid
4. Ensure user has super_admin role

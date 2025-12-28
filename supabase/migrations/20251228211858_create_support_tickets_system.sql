/*
  # Create Support Tickets System

  1. New Tables
    - `support_tickets` - Main tickets table
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `user_email` (text)
      - `user_name` (text)
      - `subject` (text)
      - `description` (text)
      - `category` (text)
      - `priority` (text)
      - `status` (text)
      - `assigned_to` (uuid)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `resolved_at` (timestamptz)
    
    - `ticket_messages` - Messages within tickets
      - `id` (uuid, primary key)
      - `ticket_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `user_name` (text)
      - `user_role` (text)
      - `message` (text)
      - `is_internal` (boolean)
      - `created_at` (timestamptz)
    
    - `activity_logs` - Platform activity logs
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `user_email` (text)
      - `action` (text)
      - `resource_type` (text)
      - `resource_id` (text)
      - `metadata` (jsonb)
      - `ip_address` (text)
      - `created_at` (timestamptz)

  2. Updates
    - Add MRR, health_score, last_activity_at, current_items, max_items to organizations

  3. Security
    - Enable RLS on all new tables
    - Users can view their own tickets
    - Super admins can view and manage all tickets
    - Activity logs visible to super admins only

  4. Sample Data
    - 3 example support tickets
    - Updated MRR for existing organizations
*/

-- ============================================================================
-- TABLAS PARA SUPER ADMIN
-- ============================================================================

-- Actualizar tabla organizations (agregar campos para métricas)
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS mrr DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 50 CHECK (health_score >= 0 AND health_score <= 100),
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS current_items INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_items INTEGER DEFAULT 50;

-- Crear tabla de tickets de soporte
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('technical', 'billing', 'feature_request', 'bug', 'other')) DEFAULT 'technical',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')) DEFAULT 'open',
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Mensajes de tickets
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  user_role TEXT,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_org ON support_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_logs_org ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON activity_logs(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users see only their tickets, super admins see all
DROP POLICY IF EXISTS "Users can view relevant tickets" ON support_tickets;
CREATE POLICY "Users can view relevant tickets" ON support_tickets FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM platform_admins 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Policy: Users can create tickets
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
CREATE POLICY "Users can create tickets" ON support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Super admins can update tickets
DROP POLICY IF EXISTS "Super admins can update tickets" ON support_tickets;
CREATE POLICY "Super admins can update tickets" ON support_tickets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM platform_admins 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Policy: Messages visibility
DROP POLICY IF EXISTS "Users can view ticket messages" ON ticket_messages;
CREATE POLICY "Users can view ticket messages" ON ticket_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM support_tickets t
    WHERE t.id = ticket_id 
    AND (
      t.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM platform_admins 
        WHERE user_id = auth.uid() AND role = 'super_admin'
      )
    )
  )
  AND (
    is_internal = false 
    OR EXISTS (
      SELECT 1 FROM platform_admins 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  )
);

-- Policy: Add messages
DROP POLICY IF EXISTS "Users can add messages" ON ticket_messages;
CREATE POLICY "Users can add messages" ON ticket_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM support_tickets t
    WHERE t.id = ticket_id AND t.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM platform_admins 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Policy: Activity logs (super admin only)
DROP POLICY IF EXISTS "Super admins view logs" ON activity_logs;
CREATE POLICY "Super admins view logs" ON activity_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM platform_admins 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- DATOS DE PRUEBA
-- ============================================================================

-- Insertar 3 tickets de ejemplo
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
  o.id,
  p.id,
  p.email,
  p.full_name,
  'Cannot export licenses to CSV',
  'When I try to export my licenses, I get an error message saying "Export failed". This started happening yesterday.',
  'technical',
  'high',
  'open'
FROM organizations o
CROSS JOIN profiles p
LIMIT 1;

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
  o.id,
  p.id,
  p.email,
  p.full_name,
  'Billing question about invoice',
  'I have a question about the invoice I received last month. The amount seems higher than expected.',
  'billing',
  'medium',
  'in_progress'
FROM organizations o
CROSS JOIN profiles p
LIMIT 1;

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
  o.id,
  p.id,
  p.email,
  p.full_name,
  'Feature request: Bulk import',
  'Would be great to have a way to import multiple licenses at once via Excel file.',
  'feature_request',
  'low',
  'open'
FROM organizations o
CROSS JOIN profiles p
LIMIT 1;

-- Actualizar MRR de organizaciones existentes
UPDATE organizations SET mrr = 99 WHERE subscription_plan = 'enterprise';
UPDATE organizations SET mrr = 29 WHERE subscription_plan = 'pro';
UPDATE organizations SET mrr = 0 WHERE subscription_plan = 'free';
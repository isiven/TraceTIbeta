/*
  # Create Super Admin Infrastructure

  This migration creates all necessary tables and functions for Super Admin functionality.

  ## 1. New Tables
    - `support_tickets` - Support ticket system
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `user_id` (uuid, references auth.users)
      - `user_email` (text)
      - `user_name` (text)
      - `subject` (text)
      - `description` (text)
      - `category` (text) - technical, billing, feature_request, bug, other
      - `priority` (text) - low, medium, high, critical
      - `status` (text) - open, in_progress, waiting, resolved, closed
      - `assigned_to` (uuid, references platform_admins, nullable)
      - `resolved_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `ticket_messages` - Messages for support tickets
      - `id` (uuid, primary key)
      - `ticket_id` (uuid, references support_tickets)
      - `user_id` (uuid, references auth.users)
      - `user_name` (text)
      - `user_role` (text)
      - `message` (text)
      - `is_internal` (boolean) - Only visible to super_admin
      - `created_at` (timestamptz)

    - `subscriptions` - Subscription tracking
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `plan_id` (text)
      - `status` (text)
      - `amount` (decimal)
      - `interval` (text) - monthly, yearly
      - `current_period_start` (timestamptz)
      - `current_period_end` (timestamptz)
      - `stripe_subscription_id` (text, nullable)
      - `stripe_customer_id` (text, nullable)
      - `cancelled_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  ## 2. Modifications to Existing Tables
    - Add columns to organizations table:
      - `owner_email` (text)
      - `billing_email` (text)
      - `current_users` (integer)
      - `max_items` (integer) - -1 for unlimited
      - `current_items` (integer)
      - `mrr` (decimal) - Monthly Recurring Revenue
      - `stripe_customer_id` (text)
      - `stripe_subscription_id` (text)
      - `last_activity_at` (timestamptz)
      - `health_score` (integer) - 0-100

  ## 3. Security
    - Enable RLS on all new tables
    - Users can view/create their own tickets
    - Super admins can view/manage all tickets
    - Only super admins can view subscriptions

  ## 4. Indexes
    - Add indexes for frequently queried columns
*/

-- ============================================================================
-- PART 1: ADD COLUMNS TO ORGANIZATIONS TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'owner_email'
  ) THEN
    ALTER TABLE organizations ADD COLUMN owner_email TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'billing_email'
  ) THEN
    ALTER TABLE organizations ADD COLUMN billing_email TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'current_users'
  ) THEN
    ALTER TABLE organizations ADD COLUMN current_users INTEGER DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'max_items'
  ) THEN
    ALTER TABLE organizations ADD COLUMN max_items INTEGER DEFAULT 100 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'current_items'
  ) THEN
    ALTER TABLE organizations ADD COLUMN current_items INTEGER DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'mrr'
  ) THEN
    ALTER TABLE organizations ADD COLUMN mrr DECIMAL(10,2) DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE organizations ADD COLUMN stripe_customer_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE organizations ADD COLUMN stripe_subscription_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'last_activity_at'
  ) THEN
    ALTER TABLE organizations ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'health_score'
  ) THEN
    ALTER TABLE organizations ADD COLUMN health_score INTEGER DEFAULT 100;
  END IF;
END $$;

-- ============================================================================
-- PART 2: CREATE SUPPORT_TICKETS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES platform_admins(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT valid_category CHECK (category IN ('technical', 'billing', 'feature_request', 'bug', 'other')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_status CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed'))
);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets
CREATE POLICY "Users can view own organization tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Super admins can view all tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Super admins can update tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Indexes for support_tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_organization_id ON support_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- ============================================================================
-- PART 3: CREATE TICKET_MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ticket_messages
CREATE POLICY "Users can view non-internal messages of their tickets"
  ON ticket_messages FOR SELECT
  TO authenticated
  USING (
    ticket_id IN (
      SELECT id FROM support_tickets
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
    AND (
      is_internal = false
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    )
  );

CREATE POLICY "Users can create messages on their tickets"
  ON ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM support_tickets
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Super admins can create any messages"
  ON ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Indexes for ticket_messages
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON ticket_messages(created_at DESC);

-- ============================================================================
-- PART 4: CREATE SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  interval TEXT NOT NULL DEFAULT 'monthly',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT now() + interval '1 month',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT valid_plan_id CHECK (plan_id IN ('free_trial', 'pro', 'enterprise')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'trial', 'past_due', 'cancelled')),
  CONSTRAINT valid_interval CHECK (interval IN ('monthly', 'yearly'))
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Super admins can view all subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Organization admins can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Super admins can manage subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- ============================================================================
-- PART 5: CREATE TRIGGERS
-- ============================================================================

-- Trigger to update updated_at for support_tickets
CREATE OR REPLACE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at for subscriptions
CREATE OR REPLACE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 6: HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate organization health score
CREATE OR REPLACE FUNCTION calculate_health_score(org_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_score INTEGER := 0;
  login_score INTEGER := 0;
  ticket_score INTEGER := 0;
  days_since_activity INTEGER;
  active_users_count INTEGER;
  open_tickets_count INTEGER;
  total_tickets_count INTEGER;
BEGIN
  -- Activity score (0-40 points)
  SELECT EXTRACT(DAY FROM (now() - COALESCE(last_activity_at, created_at)))::INTEGER
  INTO days_since_activity
  FROM organizations
  WHERE id = org_id;
  
  IF days_since_activity <= 1 THEN
    activity_score := 40;
  ELSIF days_since_activity <= 7 THEN
    activity_score := 30;
  ELSIF days_since_activity <= 30 THEN
    activity_score := 20;
  ELSIF days_since_activity <= 90 THEN
    activity_score := 10;
  ELSE
    activity_score := 0;
  END IF;

  -- Login score (0-30 points)
  SELECT COUNT(*)
  INTO active_users_count
  FROM profiles
  WHERE organization_id = org_id
    AND last_login > now() - interval '7 days'
    AND is_active = true;
  
  IF active_users_count >= 3 THEN
    login_score := 30;
  ELSIF active_users_count = 2 THEN
    login_score := 20;
  ELSIF active_users_count = 1 THEN
    login_score := 10;
  ELSE
    login_score := 0;
  END IF;

  -- Ticket score (0-30 points)
  SELECT 
    COUNT(*) FILTER (WHERE status IN ('open', 'in_progress')) as open_tickets,
    COUNT(*) as total_tickets
  INTO open_tickets_count, total_tickets_count
  FROM support_tickets
  WHERE organization_id = org_id
    AND created_at > now() - interval '90 days';
  
  IF total_tickets_count = 0 THEN
    ticket_score := 30;
  ELSIF open_tickets_count = 0 THEN
    ticket_score := 30;
  ELSIF open_tickets_count <= 2 THEN
    ticket_score := 20;
  ELSIF open_tickets_count <= 5 THEN
    ticket_score := 10;
  ELSE
    ticket_score := 0;
  END IF;

  RETURN activity_score + login_score + ticket_score;
END;
$$;

-- Function to update organization stats
CREATE OR REPLACE FUNCTION update_organization_stats(org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
  item_count INTEGER;
BEGIN
  -- Count users
  SELECT COUNT(*)
  INTO user_count
  FROM profiles
  WHERE organization_id = org_id
    AND is_active = true;

  -- Count items (licenses + hardware + contracts)
  SELECT 
    COALESCE((SELECT COUNT(*) FROM licenses WHERE organization_id = org_id), 0) +
    COALESCE((SELECT COUNT(*) FROM hardware WHERE organization_id = org_id), 0) +
    COALESCE((SELECT COUNT(*) FROM contracts WHERE organization_id = org_id), 0)
  INTO item_count;

  -- Update organization
  UPDATE organizations
  SET 
    current_users = user_count,
    current_items = item_count,
    health_score = calculate_health_score(org_id),
    updated_at = now()
  WHERE id = org_id;
END;
$$;

-- Function to log activity and update organization last_activity_at
CREATE OR REPLACE FUNCTION log_organization_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE organizations
  SET last_activity_at = now()
  WHERE id = NEW.organization_id;
  
  RETURN NEW;
END;
$$;

-- Apply activity logging triggers
DROP TRIGGER IF EXISTS log_license_activity ON licenses;
CREATE TRIGGER log_license_activity
  AFTER INSERT OR UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION log_organization_activity();

DROP TRIGGER IF EXISTS log_hardware_activity ON hardware;
CREATE TRIGGER log_hardware_activity
  AFTER INSERT OR UPDATE ON hardware
  FOR EACH ROW
  EXECUTE FUNCTION log_organization_activity();

DROP TRIGGER IF EXISTS log_contract_activity ON contracts;
CREATE TRIGGER log_contract_activity
  AFTER INSERT OR UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION log_organization_activity();

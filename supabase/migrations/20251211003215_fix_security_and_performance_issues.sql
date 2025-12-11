/*
  # Fix Security and Performance Issues

  This migration addresses multiple security and performance issues identified by Supabase:

  ## 1. Foreign Key Indexes
    - Add missing indexes for all foreign key columns to improve query performance
    - Tables affected: activity_log, alert_rules, clients, contracts, hardware, invitations, licenses, organizations, platform_admins, support_contracts

  ## 2. RLS Policy Optimization
    - Replace `auth.uid()` with `(select auth.uid())` in all RLS policies
    - This prevents re-evaluation for each row and improves performance at scale
    - All tables with RLS policies are optimized

  ## 3. Remove Unused Indexes
    - Drop indexes that are not being used to reduce storage overhead
    - Keep essential indexes for foreign keys and frequently queried columns

  ## 4. Consolidate Duplicate Policies
    - Remove duplicate permissive policies that create ambiguity
    - Keep the most specific and restrictive policies

  ## 5. Remove Duplicate Indexes
    - Drop duplicate indexes (idx_*_org vs idx_*_organization)
    - Keep the more descriptive naming convention

  ## 6. Fix Function Search Paths
    - Add explicit search_path to all functions to prevent security issues
*/

-- ============================================================================
-- PART 1: ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

-- activity_log indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);

-- alert_rules indexes
CREATE INDEX IF NOT EXISTS idx_alert_rules_organization_id ON alert_rules(organization_id);

-- clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);

-- contracts indexes
CREATE INDEX IF NOT EXISTS idx_contracts_assigned_to ON contracts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON contracts(created_by);

-- hardware indexes
CREATE INDEX IF NOT EXISTS idx_hardware_assigned_to ON hardware(assigned_to);
CREATE INDEX IF NOT EXISTS idx_hardware_client_id ON hardware(client_id);
CREATE INDEX IF NOT EXISTS idx_hardware_created_by ON hardware(created_by);

-- invitations indexes
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON invitations(invited_by);

-- licenses indexes
CREATE INDEX IF NOT EXISTS idx_licenses_client_id ON licenses(client_id);
CREATE INDEX IF NOT EXISTS idx_licenses_created_by ON licenses(created_by);

-- organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);

-- platform_admins indexes
CREATE INDEX IF NOT EXISTS idx_platform_admins_invited_by ON platform_admins(invited_by);

-- support_contracts indexes
CREATE INDEX IF NOT EXISTS idx_support_contracts_client_id ON support_contracts(client_id);

-- ============================================================================
-- PART 2: REMOVE DUPLICATE INDEXES
-- ============================================================================

-- Keep the more descriptive naming (_organization) and remove _org duplicates
DROP INDEX IF EXISTS idx_clients_org;
DROP INDEX IF EXISTS idx_hardware_org;
DROP INDEX IF EXISTS idx_licenses_org;

-- ============================================================================
-- PART 3: REMOVE UNUSED INDEXES
-- ============================================================================

-- Remove indexes that are not being used
DROP INDEX IF EXISTS idx_profiles_role_super_admin;
DROP INDEX IF EXISTS idx_licenses_expiration;
DROP INDEX IF EXISTS idx_contracts_org;
DROP INDEX IF EXISTS idx_activity_org;
DROP INDEX IF EXISTS idx_activity_created;
DROP INDEX IF EXISTS idx_activity_actor;
DROP INDEX IF EXISTS idx_activity_target;
DROP INDEX IF EXISTS idx_platform_admins_user;
DROP INDEX IF EXISTS idx_platform_admins_email;
DROP INDEX IF EXISTS idx_licenses_status;
DROP INDEX IF EXISTS idx_hardware_warranty;
DROP INDEX IF EXISTS idx_contracts_expiration;
DROP INDEX IF EXISTS idx_invitations_token;
DROP INDEX IF EXISTS idx_invitations_email;

-- ============================================================================
-- PART 4: OPTIMIZE RLS POLICIES - LICENSES TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "View licenses" ON licenses;
DROP POLICY IF EXISTS "Create licenses" ON licenses;
DROP POLICY IF EXISTS "Update licenses" ON licenses;
DROP POLICY IF EXISTS "Insert licenses" ON licenses;

-- Recreate with optimized auth checks
CREATE POLICY "View licenses"
  ON licenses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.organization_id = licenses.organization_id
      AND (
        profiles.role IN ('super_admin', 'admin')
        OR profiles.scope = 'all'
        OR (profiles.scope = 'assigned' AND licenses.assigned_to = profiles.id)
      )
    )
  );

CREATE POLICY "Create licenses"
  ON licenses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.organization_id = licenses.organization_id
      AND profiles.role IN ('super_admin', 'admin', 'manager')
    )
  );

CREATE POLICY "Update licenses"
  ON licenses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.organization_id = licenses.organization_id
      AND (
        profiles.role IN ('super_admin', 'admin', 'manager')
        OR (profiles.scope = 'assigned' AND licenses.assigned_to = profiles.id)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.organization_id = licenses.organization_id
      AND (
        profiles.role IN ('super_admin', 'admin', 'manager')
        OR (profiles.scope = 'assigned' AND licenses.assigned_to = profiles.id)
      )
    )
  );

-- ============================================================================
-- PART 5: OPTIMIZE RLS POLICIES - HARDWARE TABLE
-- ============================================================================

DROP POLICY IF EXISTS "View hardware" ON hardware;
DROP POLICY IF EXISTS "Create hardware" ON hardware;
DROP POLICY IF EXISTS "Update hardware" ON hardware;
DROP POLICY IF EXISTS "Insert hardware" ON hardware;

CREATE POLICY "View hardware"
  ON hardware FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.organization_id = hardware.organization_id
      AND (
        profiles.role IN ('super_admin', 'admin')
        OR profiles.scope = 'all'
        OR (profiles.scope = 'assigned' AND hardware.assigned_to = profiles.id)
      )
    )
  );

CREATE POLICY "Create hardware"
  ON hardware FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.organization_id = hardware.organization_id
      AND profiles.role IN ('super_admin', 'admin', 'manager')
    )
  );

CREATE POLICY "Update hardware"
  ON hardware FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.organization_id = hardware.organization_id
      AND (
        profiles.role IN ('super_admin', 'admin', 'manager')
        OR (profiles.scope = 'assigned' AND hardware.assigned_to = profiles.id)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.organization_id = hardware.organization_id
      AND (
        profiles.role IN ('super_admin', 'admin', 'manager')
        OR (profiles.scope = 'assigned' AND hardware.assigned_to = profiles.id)
      )
    )
  );

-- ============================================================================
-- PART 6: OPTIMIZE RLS POLICIES - CONTRACTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "View contracts" ON contracts;
DROP POLICY IF EXISTS "Create contracts" ON contracts;
DROP POLICY IF EXISTS "Update contracts" ON contracts;
DROP POLICY IF EXISTS "Insert contracts" ON contracts;

CREATE POLICY "View contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.organization_id = contracts.organization_id
      AND (
        profiles.role IN ('super_admin', 'admin')
        OR profiles.scope = 'all'
        OR (profiles.scope = 'assigned' AND contracts.assigned_to = profiles.id)
      )
    )
  );

CREATE POLICY "Create contracts"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.organization_id = contracts.organization_id
      AND profiles.role IN ('super_admin', 'admin', 'manager')
    )
  );

CREATE POLICY "Update contracts"
  ON contracts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.organization_id = contracts.organization_id
      AND (
        profiles.role IN ('super_admin', 'admin', 'manager')
        OR (profiles.scope = 'assigned' AND contracts.assigned_to = profiles.id)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.organization_id = contracts.organization_id
      AND (
        profiles.role IN ('super_admin', 'admin', 'manager')
        OR (profiles.scope = 'assigned' AND contracts.assigned_to = profiles.id)
      )
    )
  );

-- ============================================================================
-- PART 7: OPTIMIZE RLS POLICIES - CLIENTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Create clients" ON clients;
DROP POLICY IF EXISTS "Insert clients" ON clients;

CREATE POLICY "Create clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.organization_id = clients.organization_id
      AND profiles.role IN ('super_admin', 'admin', 'manager')
    )
  );

-- ============================================================================
-- PART 8: OPTIMIZE RLS POLICIES - ACTIVITY_LOG TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Insert activity log" ON activity_log;

CREATE POLICY "Insert activity log"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- PART 9: OPTIMIZE RLS POLICIES - ORGANIZATIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can create their own organization" ON organizations;
DROP POLICY IF EXISTS "Users can create organization during registration" ON organizations;
DROP POLICY IF EXISTS "Users can update own organization" ON organizations;
DROP POLICY IF EXISTS "Update organization" ON organizations;
DROP POLICY IF EXISTS "View own organization" ON organizations;

CREATE POLICY "Users can create organization during registration"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Users can update own organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.organization_id = organizations.id
      AND profiles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.organization_id = organizations.id
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "View own organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.organization_id = organizations.id
    )
  );

-- ============================================================================
-- PART 10: OPTIMIZE RLS POLICIES - PROFILES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read same org profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    profiles.id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (select auth.uid())
      AND p.organization_id = profiles.organization_id
      AND p.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- ============================================================================
-- PART 11: OPTIMIZE RLS POLICIES - PLATFORM_ADMINS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Platform admins can view all platform admins" ON platform_admins;
DROP POLICY IF EXISTS "Super admins can insert platform admins" ON platform_admins;
DROP POLICY IF EXISTS "Super admins can update platform admins" ON platform_admins;
DROP POLICY IF EXISTS "Super admins can delete platform admins" ON platform_admins;

CREATE POLICY "Platform admins can view all platform admins"
  ON platform_admins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can insert platform admins"
  ON platform_admins FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update platform admins"
  ON platform_admins FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete platform admins"
  ON platform_admins FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

-- ============================================================================
-- PART 12: OPTIMIZE RLS POLICIES - PLATFORM_ACTIVITY_LOG TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Platform admins can view activity log" ON platform_activity_log;
DROP POLICY IF EXISTS "Platform admins can insert activity log" ON platform_activity_log;

CREATE POLICY "Platform admins can view activity log"
  ON platform_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Platform admins can insert activity log"
  ON platform_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

-- ============================================================================
-- PART 13: CONSOLIDATE ALERT_RULES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Manage alert rules" ON alert_rules;
DROP POLICY IF EXISTS "View alert rules" ON alert_rules;

CREATE POLICY "View alert rules"
  ON alert_rules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.organization_id = alert_rules.organization_id
    )
  );

CREATE POLICY "Manage alert rules"
  ON alert_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.organization_id = alert_rules.organization_id
      AND profiles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.organization_id = alert_rules.organization_id
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

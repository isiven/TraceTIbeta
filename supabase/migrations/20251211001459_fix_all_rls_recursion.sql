/*
  # Fix All RLS Infinite Recursion Issues

  1. Problem
    - All tables have policies that query profiles table
    - This causes infinite recursion errors
  
  2. Solution
    - Create helper functions for common checks
    - Replace all subqueries with function calls
*/

-- Helper to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid();
$$;

-- Helper to get user scope
CREATE OR REPLACE FUNCTION get_user_scope()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT scope::text FROM profiles WHERE id = auth.uid();
$$;

-- Helper to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT get_user_role() = ANY(roles);
$$;

-- FIX CLIENTS POLICIES
DROP POLICY IF EXISTS "View clients" ON clients;
DROP POLICY IF EXISTS "Users can view clients in their organization" ON clients;
DROP POLICY IF EXISTS "Update clients" ON clients;
DROP POLICY IF EXISTS "Delete clients" ON clients;
DROP POLICY IF EXISTS "Admins can manage clients" ON clients;

CREATE POLICY "View clients" ON clients FOR SELECT TO authenticated
  USING (organization_id = get_user_organization());

CREATE POLICY "Update clients" ON clients FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization() AND user_has_role(ARRAY['super_admin', 'admin', 'manager']));

CREATE POLICY "Delete clients" ON clients FOR DELETE TO authenticated
  USING (organization_id = get_user_organization() AND user_has_role(ARRAY['super_admin', 'admin']));

CREATE POLICY "Insert clients" ON clients FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization() AND user_has_role(ARRAY['super_admin', 'admin']));

-- FIX LICENSES POLICIES
DROP POLICY IF EXISTS "Users can view licenses in their organization" ON licenses;
DROP POLICY IF EXISTS "Users can manage licenses in their organization" ON licenses;
DROP POLICY IF EXISTS "Super admins can read all licenses" ON licenses;
DROP POLICY IF EXISTS "View licenses by scope" ON licenses;
DROP POLICY IF EXISTS "Update own licenses" ON licenses;
DROP POLICY IF EXISTS "Delete licenses" ON licenses;

CREATE POLICY "View licenses" ON licenses FOR SELECT TO authenticated
  USING (
    organization_id = get_user_organization() AND (
      user_has_role(ARRAY['super_admin', 'admin']) OR
      (get_user_role() = 'manager' AND get_user_scope() = 'all') OR
      assigned_to = auth.uid() OR
      created_by = auth.uid()
    )
  );

CREATE POLICY "Update licenses" ON licenses FOR UPDATE TO authenticated
  USING (
    organization_id = get_user_organization() AND (
      user_has_role(ARRAY['super_admin', 'admin']) OR
      assigned_to = auth.uid() OR
      created_by = auth.uid()
    )
  );

CREATE POLICY "Delete licenses" ON licenses FOR DELETE TO authenticated
  USING (organization_id = get_user_organization() AND user_has_role(ARRAY['super_admin', 'admin']));

CREATE POLICY "Insert licenses" ON licenses FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization() AND user_has_role(ARRAY['super_admin', 'admin']));

-- FIX HARDWARE POLICIES
DROP POLICY IF EXISTS "Users can view hardware in their organization" ON hardware;
DROP POLICY IF EXISTS "Users can manage hardware in their organization" ON hardware;
DROP POLICY IF EXISTS "Super admins can read all hardware" ON hardware;
DROP POLICY IF EXISTS "View hardware by scope" ON hardware;
DROP POLICY IF EXISTS "Update own hardware" ON hardware;
DROP POLICY IF EXISTS "Delete hardware" ON hardware;

CREATE POLICY "View hardware" ON hardware FOR SELECT TO authenticated
  USING (
    organization_id = get_user_organization() AND (
      user_has_role(ARRAY['super_admin', 'admin']) OR
      (get_user_role() = 'manager' AND get_user_scope() = 'all') OR
      assigned_to = auth.uid() OR
      created_by = auth.uid()
    )
  );

CREATE POLICY "Update hardware" ON hardware FOR UPDATE TO authenticated
  USING (
    organization_id = get_user_organization() AND (
      user_has_role(ARRAY['super_admin', 'admin']) OR
      assigned_to = auth.uid() OR
      created_by = auth.uid()
    )
  );

CREATE POLICY "Delete hardware" ON hardware FOR DELETE TO authenticated
  USING (organization_id = get_user_organization() AND user_has_role(ARRAY['super_admin', 'admin']));

CREATE POLICY "Insert hardware" ON hardware FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization() AND user_has_role(ARRAY['super_admin', 'admin']));

-- FIX CONTRACTS POLICIES
DROP POLICY IF EXISTS "View contracts by scope" ON contracts;
DROP POLICY IF EXISTS "Update own contracts" ON contracts;
DROP POLICY IF EXISTS "Delete contracts" ON contracts;

CREATE POLICY "View contracts" ON contracts FOR SELECT TO authenticated
  USING (
    organization_id = get_user_organization() AND (
      user_has_role(ARRAY['super_admin', 'admin']) OR
      (get_user_role() = 'manager' AND get_user_scope() = 'all') OR
      assigned_to = auth.uid() OR
      created_by = auth.uid()
    )
  );

CREATE POLICY "Update contracts" ON contracts FOR UPDATE TO authenticated
  USING (
    organization_id = get_user_organization() AND (
      user_has_role(ARRAY['super_admin', 'admin']) OR
      assigned_to = auth.uid() OR
      created_by = auth.uid()
    )
  );

CREATE POLICY "Delete contracts" ON contracts FOR DELETE TO authenticated
  USING (organization_id = get_user_organization() AND user_has_role(ARRAY['super_admin', 'admin']));

CREATE POLICY "Insert contracts" ON contracts FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization() AND user_has_role(ARRAY['super_admin', 'admin']));

-- FIX SUPPORT_CONTRACTS POLICIES
DROP POLICY IF EXISTS "Users can view contracts in their organization" ON support_contracts;
DROP POLICY IF EXISTS "Users can manage contracts in their organization" ON support_contracts;
DROP POLICY IF EXISTS "Super admins can read all support_contracts" ON support_contracts;

CREATE POLICY "View support contracts" ON support_contracts FOR SELECT TO authenticated
  USING (organization_id = get_user_organization());

CREATE POLICY "Update support contracts" ON support_contracts FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization() AND user_has_role(ARRAY['super_admin', 'admin']));

CREATE POLICY "Delete support contracts" ON support_contracts FOR DELETE TO authenticated
  USING (organization_id = get_user_organization() AND user_has_role(ARRAY['super_admin', 'admin']));

CREATE POLICY "Insert support contracts" ON support_contracts FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_organization() AND user_has_role(ARRAY['super_admin', 'admin']));

-- FIX ORGANIZATIONS POLICIES
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
DROP POLICY IF EXISTS "Users can read own organization" ON organizations;
DROP POLICY IF EXISTS "Super admins can read all organizations" ON organizations;
DROP POLICY IF EXISTS "Super admins can update all organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can update organization" ON organizations;

CREATE POLICY "View own organization" ON organizations FOR SELECT TO authenticated
  USING (id = get_user_organization() OR auth.uid() = owner_id);

CREATE POLICY "Update organization" ON organizations FOR UPDATE TO authenticated
  USING (id = get_user_organization() AND user_has_role(ARRAY['super_admin', 'admin']));

-- FIX ACTIVITY_LOG POLICIES
DROP POLICY IF EXISTS "View activity log" ON activity_log;

CREATE POLICY "View activity log" ON activity_log FOR SELECT TO authenticated
  USING (organization_id = get_user_organization() AND user_has_role(ARRAY['super_admin', 'admin', 'manager']));

-- FIX ALERT_RULES POLICIES
DROP POLICY IF EXISTS "View alert rules" ON alert_rules;
DROP POLICY IF EXISTS "Manage alert rules" ON alert_rules;

CREATE POLICY "View alert rules" ON alert_rules FOR SELECT TO authenticated
  USING (organization_id = get_user_organization());

CREATE POLICY "Manage alert rules" ON alert_rules FOR ALL TO authenticated
  USING (organization_id = get_user_organization() AND user_has_role(ARRAY['super_admin', 'admin']));

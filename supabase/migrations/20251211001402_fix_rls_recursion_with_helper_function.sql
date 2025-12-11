/*
  # Fix RLS Infinite Recursion with Helper Function

  1. Problem
    - Policies that query profiles table cause infinite recursion
    - Happens when checking organization_id or role
  
  2. Solution
    - Create helper function that bypasses RLS using security definer
    - Use function in policies instead of subqueries
    - Clean up duplicate policies
  
  3. Changes
    - Add get_user_organization() function
    - Recreate all policies using the helper function
    - Remove duplicate policies
*/

-- Create helper function to get user's organization (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_organization()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

-- Drop all existing profiles policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read org profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create simple non-recursive policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read same org profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Fix invitations policies (remove duplicates and use helper)
DROP POLICY IF EXISTS "View invitations" ON invitations;
DROP POLICY IF EXISTS "Manage invitations" ON invitations;
DROP POLICY IF EXISTS "Organization members can view invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON invitations;

CREATE POLICY "Users can view org invitations"
  ON invitations FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization());

CREATE POLICY "Admins can manage invitations"
  ON invitations FOR ALL
  TO authenticated
  USING (
    organization_id = get_user_organization() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

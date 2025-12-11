/*
  # Fix Profiles RLS Recursion Issue

  1. Problem
    - The current "Users can read profiles" policy has infinite recursion
    - It tries to SELECT from profiles inside the policy, causing 500 errors
  
  2. Solution
    - Drop the problematic policy
    - Create a simple, non-recursive policy
    - Use SECURITY DEFINER functions to prevent recursion
    - Allow users to read their own profile
    - Allow super_admins to read all profiles
    - Allow admins to read profiles in their organization

  3. Security
    - Users can only see their own profile
    - Super admins can see all profiles
    - Regular admins can see profiles in their organization
*/

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can read profiles" ON profiles;

-- Create helper function to check if user is super admin (without recursion)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
      AND role = 'super_admin'
  );
$$;

-- Create helper function to check if user is admin in same org (without recursion)
CREATE OR REPLACE FUNCTION public.is_admin_in_org(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
      AND organization_id = target_org_id
      AND role IN ('super_admin', 'admin')
  );
$$;

-- Create new simple policy for reading profiles
-- This policy is SIMPLE and does NOT cause recursion because:
-- 1. First condition (id = auth.uid()) is direct, no subquery
-- 2. Helper functions use SECURITY DEFINER which bypasses RLS
CREATE POLICY "Users can read accessible profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Can read own profile (no recursion)
    id = auth.uid()
    -- Super admins can read all profiles (function bypasses RLS)
    OR public.is_super_admin()
    -- Admins can read profiles in their org (function bypasses RLS)
    OR public.is_admin_in_org(organization_id)
  );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_in_org(uuid) TO authenticated;

/*
  # Fix RLS Infinite Recursion and Super Admin Access

  1. Problem
    - Policy "Users can read accessible profiles" causes infinite recursion
    - Subquery: `organization_id IN (SELECT organization_id FROM profiles...)`
    - This queries profiles table WITHIN a profiles policy = infinite loop
    - Super admins cannot see all organizations (only their own)
    
  2. Root Cause
    - RLS policies on profiles table query profiles table again
    - Creates circular dependency when RLS is active
    
  3. Solution
    - Use SECURITY DEFINER function get_user_organization() to bypass RLS
    - Add policy for platform admins to view ALL organizations
    - Simplify profiles policy to avoid recursion
    
  4. Changes
    - Drop and recreate profiles SELECT policy without recursion
    - Add new policy for organizations SELECT for platform admins
    - Use existing helper function get_user_organization()
*/

-- Fix profiles SELECT policy to avoid recursion
DROP POLICY IF EXISTS "Users can read accessible profiles" ON profiles;

CREATE POLICY "Users can read accessible profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Own profile
    id = auth.uid()
    -- Same organization (use helper function to avoid recursion)
    OR organization_id = get_user_organization()
    -- Platform admin flag (simple column check, no recursion)
    OR is_platform_admin = true
  );

-- Add policy for platform admins to view ALL organizations
DROP POLICY IF EXISTS "Platform admins can view all organizations" ON organizations;

CREATE POLICY "Platform admins can view all organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_platform_admin = true
    )
  );

-- Note: Keep existing policy "View own organization" for regular users
-- Platform admins will match the new policy above
-- Regular users will match the existing policy

COMMENT ON POLICY "Users can read accessible profiles" ON profiles IS 
  'Allows users to read their own profile, profiles in their org (via helper function), or all profiles if platform admin';

COMMENT ON POLICY "Platform admins can view all organizations" ON organizations IS 
  'Platform admins (super_admin role with is_platform_admin=true) can view all organizations';

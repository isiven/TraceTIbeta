/*
  # Fix Platform Admins RLS Policy for Login
  
  ## Problem
  Users cannot login because they cannot check if they are platform admins.
  The current policy only allows super_admins to read from platform_admins table.
  
  ## Changes
  1. Add policy to allow authenticated users to check their own platform_admin status
  2. This is needed during login to determine routing
  
  ## Security
  - Users can only see their own platform_admin record
  - Cannot see other users' platform_admin status
  - Super admins still have full access to all records
*/

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Platform admins can view all platform admins" ON platform_admins;

-- Allow super admins to view all platform admin records
CREATE POLICY "Super admins can view all platform admins"
  ON platform_admins
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Allow authenticated users to view their own platform_admin record
CREATE POLICY "Users can view own platform admin status"
  ON platform_admins
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

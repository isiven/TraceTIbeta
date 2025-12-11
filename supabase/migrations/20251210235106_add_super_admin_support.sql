/*
  # Add Super Admin Support

  1. Purpose
    - Enable super admin role for platform-wide administration
    - Super admins can view and manage all organizations and users
    - Add RLS policies to allow super admins to access all data

  2. Changes
    - Ensure role column supports 'super_admin' value
    - Add RLS policies for super admins to access all tables
    - Super admins bypass organization restrictions

  3. Security
    - Only manually assigned super admins can access platform-wide data
    - Super admin role must be set directly in database
    - Regular admins are limited to their organization

  4. Notes
    - To make a user super admin, run:
      UPDATE profiles SET role = 'super_admin', scope = 'all' WHERE email = 'your-email@example.com';
*/

-- Ensure role column can store super_admin
DO $$
BEGIN
  -- No need to alter if already varchar, just verify it exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role VARCHAR(50) DEFAULT 'user';
  END IF;
END $$;

-- RLS Policies for Super Admin Access

-- Super admins can read ALL organizations
DROP POLICY IF EXISTS "Super admins can read all organizations" ON organizations;
CREATE POLICY "Super admins can read all organizations"
ON organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  auth.uid() = owner_id
  OR
  id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Super admins can update ALL organizations
DROP POLICY IF EXISTS "Super admins can update all organizations" ON organizations;
CREATE POLICY "Super admins can update all organizations"
ON organizations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  auth.uid() = owner_id
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  auth.uid() = owner_id
);

-- Super admins can read ALL profiles
DROP POLICY IF EXISTS "Super admins can read all profiles" ON profiles;
CREATE POLICY "Super admins can read all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'super_admin'
  )
  OR
  auth.uid() = id
  OR
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- Super admins can read ALL licenses
DROP POLICY IF EXISTS "Super admins can read all licenses" ON licenses;
CREATE POLICY "Super admins can read all licenses"
ON licenses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- Super admins can read ALL hardware
DROP POLICY IF EXISTS "Super admins can read all hardware" ON hardware;
CREATE POLICY "Super admins can read all hardware"
ON hardware
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- Super admins can read ALL support contracts
DROP POLICY IF EXISTS "Super admins can read all support_contracts" ON support_contracts;
CREATE POLICY "Super admins can read all support_contracts"
ON support_contracts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- Create index for faster super admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_role_super_admin 
ON profiles(role) 
WHERE role = 'super_admin';

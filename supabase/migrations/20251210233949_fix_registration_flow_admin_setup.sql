/*
  # Fix Registration Flow - Admin Setup

  1. Changes to Tables
    - Add `owner_id` to organizations table
      - References auth.users(id)
      - Indicates who created/owns the organization
    - Add `account_type` to profiles table
      - Stores 'integrator' or 'end_user'
      - Matches the organization's account type

  2. RLS Policies
    - Allow users to create their own organization during registration
    - Allow users to insert their own profile during registration
    - Allow users to update their own profile
    - Allow users to read organizations they own or belong to

  3. Notes
    - This ensures new registrations automatically become admins
    - Owner has full control over their organization
    - Supports both email and OAuth registration flows
*/

-- Add owner_id to organizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE organizations 
    ADD COLUMN owner_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add account_type to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'account_type'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN account_type VARCHAR(50) DEFAULT 'end_user';
  END IF;
END $$;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can create their own organization" ON organizations;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own organization" ON organizations;

-- RLS: Users can create their own organization
CREATE POLICY "Users can create their own organization" 
ON organizations
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- RLS: Users can read organizations they own
CREATE POLICY "Users can read own organization" 
ON organizations
FOR SELECT 
TO authenticated
USING (
  auth.uid() = owner_id OR
  id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- RLS: Users can update organizations they own
CREATE POLICY "Users can update own organization" 
ON organizations
FOR UPDATE 
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- RLS: Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
ON profiles
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- RLS: Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

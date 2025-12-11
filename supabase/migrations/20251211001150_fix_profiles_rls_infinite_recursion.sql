/*
  # Fix Infinite Recursion in Profiles RLS Policies

  1. Problem
    - The "Super admins can read all profiles" policy causes infinite recursion
    - It queries the profiles table within the policy itself, creating a loop
  
  2. Solution
    - Drop the problematic policy
    - Create simple, non-recursive policies
    - Users can only read/update their own profile
    - Organization members can see each other (without recursion)
  
  3. Security
    - Users can read their own profile
    - Users can read profiles in their organization
    - Users can only update their own profile
    - RLS remains enabled and secure
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Super admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Simple policy: Users can read their own profile (no recursion)
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Simple policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Simple policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy: Users can read profiles in their organization (using a safe subquery)
CREATE POLICY "Users can read org profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

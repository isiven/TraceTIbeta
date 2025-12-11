/*
  # Fix Infinite Recursion in Profiles RLS

  1. Problem
    - The "Org members can view profiles" policy causes infinite recursion
    - When querying profiles, the policy queries profiles again to check organization_id
    - This prevents users from accessing the application

  2. Solution
    - Drop the problematic policy
    - Keep only the "Users can view own profile" policy for SELECT
    - Organization members will only see their own profile for now
    - Future: Add a function-based approach to avoid recursion

  3. Security
    - Users can still only view their own profile
    - Users can still only update their own profile
    - RLS remains enabled and secure
*/

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Org members can view profiles" ON profiles;

-- Ensure the simple non-recursive policy exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;

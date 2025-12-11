/*
  # Add Helper Function to Check Admin Role

  1. Problem
    - Checking role in policies still causes recursion
  
  2. Solution
    - Create is_user_admin() helper function
    - Use it in invitations policies
*/

-- Helper function to check if user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
$$;

-- Recreate invitations policies with helper
DROP POLICY IF EXISTS "Users can view org invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON invitations;

CREATE POLICY "Users can view org invitations"
  ON invitations FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization());

CREATE POLICY "Admins can insert invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = get_user_organization() 
    AND is_user_admin()
  );

CREATE POLICY "Admins can update invitations"
  ON invitations FOR UPDATE
  TO authenticated
  USING (
    organization_id = get_user_organization() 
    AND is_user_admin()
  );

CREATE POLICY "Admins can delete invitations"
  ON invitations FOR DELETE
  TO authenticated
  USING (
    organization_id = get_user_organization() 
    AND is_user_admin()
  );

/*
  # Add Super Admin Management Functions

  1. Functions
    - `promote_to_super_admin`: Function to promote a user to super_admin role
    - Can only be called by existing super_admins or if no super_admin exists yet

  2. Security
    - Function is secure and checks for existing super_admin privileges
    - First user can be promoted without restrictions
*/

-- Function to promote a user to super_admin
CREATE OR REPLACE FUNCTION promote_to_super_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
  super_admin_count int;
BEGIN
  -- Count existing super admins
  SELECT COUNT(*) INTO super_admin_count
  FROM profiles
  WHERE role = 'super_admin';

  -- Get the target user
  SELECT id INTO target_user_id
  FROM profiles
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Allow promotion if no super_admin exists OR if caller is super_admin
  IF super_admin_count = 0 OR 
     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin') THEN
    
    UPDATE profiles
    SET role = 'super_admin',
        scope = 'all',
        updated_at = now()
    WHERE id = target_user_id;
    
    RAISE NOTICE 'User % promoted to super_admin', user_email;
  ELSE
    RAISE EXCEPTION 'Only super admins can promote other users to super_admin';
  END IF;
END;
$$;

-- Function to get role information
CREATE OR REPLACE FUNCTION get_role_info()
RETURNS TABLE (
  role_name text,
  description text,
  can_manage_users boolean,
  can_manage_all_resources boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'super_admin'::text, 
    'Full system access, can manage everything'::text,
    true,
    true
  UNION ALL
  SELECT 
    'admin'::text,
    'Organization admin, can manage users and resources'::text,
    true,
    true
  UNION ALL
  SELECT 
    'manager'::text,
    'Can manage resources based on scope'::text,
    false,
    false
  UNION ALL
  SELECT 
    'user'::text,
    'Can create and manage own resources'::text,
    false,
    false
  UNION ALL
  SELECT 
    'viewer'::text,
    'Read-only access'::text,
    false,
    false;
END;
$$;

-- Function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permissions()
RETURNS TABLE (
  user_id uuid,
  user_email text,
  user_role text,
  user_scope text,
  organization_name text,
  account_type text,
  can_create_licenses boolean,
  can_delete_licenses boolean,
  can_view_all_resources boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.role::text,
    p.scope::text,
    o.name,
    o.account_type::text,
    (p.role IN ('super_admin', 'admin', 'manager', 'user'))::boolean,
    (p.role IN ('super_admin', 'admin'))::boolean,
    (p.role IN ('super_admin', 'admin') OR (p.role = 'manager' AND p.scope = 'all'))::boolean
  FROM profiles p
  LEFT JOIN organizations o ON o.id = p.organization_id
  WHERE p.id = auth.uid();
END;
$$;

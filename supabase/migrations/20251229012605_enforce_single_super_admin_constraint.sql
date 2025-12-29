/*
  # Enforce Single Super Admin Constraint

  1. Security Changes
    - Add CHECK constraint to ensure only ONE super_admin can exist
    - Remove any duplicate super_admins (keep only Isaac Villasmil)
    - Create unique partial index to enforce at database level
  
  2. Data Cleanup
    - Delete any super_admins that aren't Isaac Villasmil (isaac.villasmil@nextcomsystems.com)
    - Ensure Isaac is the only super_admin
  
  3. Important Notes
    - Only ONE super_admin can exist in the entire platform
    - This is the platform owner and cannot be changed
    - Other admin roles: support_admin, billing_admin, readonly_admin
*/

-- First, let's ensure Isaac is the super_admin
-- Remove all other super_admins (if any exist)
DELETE FROM platform_admins 
WHERE role = 'super_admin' 
AND user_id NOT IN (
  SELECT pa.user_id 
  FROM platform_admins pa
  JOIN profiles p ON p.id = pa.user_id
  WHERE p.email = 'isaac.villasmil@nextcomsystems.com'
  LIMIT 1
);

-- Create a unique partial index to enforce only one super_admin
-- This will prevent any future attempts to create multiple super_admins
DROP INDEX IF EXISTS idx_single_super_admin;
CREATE UNIQUE INDEX idx_single_super_admin 
ON platform_admins (role) 
WHERE role = 'super_admin';

-- Add a trigger to prevent updating existing super_admin to someone else
CREATE OR REPLACE FUNCTION prevent_super_admin_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent changing super_admin user_id
  IF OLD.role = 'super_admin' AND NEW.user_id != OLD.user_id THEN
    RAISE EXCEPTION 'Cannot change Super Admin user. Only Isaac Villasmil can be Super Admin.';
  END IF;
  
  -- Prevent removing super_admin role from Isaac
  IF OLD.role = 'super_admin' AND NEW.role != 'super_admin' THEN
    RAISE EXCEPTION 'Cannot remove Super Admin role. Isaac Villasmil must remain Super Admin.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_super_admin_changes ON platform_admins;
CREATE TRIGGER trigger_prevent_super_admin_changes
  BEFORE UPDATE ON platform_admins
  FOR EACH ROW
  EXECUTE FUNCTION prevent_super_admin_changes();

-- Add a trigger to prevent deleting the super_admin
CREATE OR REPLACE FUNCTION prevent_super_admin_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'super_admin' THEN
    RAISE EXCEPTION 'Cannot delete Super Admin. Isaac Villasmil must remain as platform owner.';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_super_admin_deletion ON platform_admins;
CREATE TRIGGER trigger_prevent_super_admin_deletion
  BEFORE DELETE ON platform_admins
  FOR EACH ROW
  EXECUTE FUNCTION prevent_super_admin_deletion();

-- Update the role check constraint to include new admin types
ALTER TABLE platform_admins DROP CONSTRAINT IF EXISTS platform_admins_role_check;
ALTER TABLE platform_admins ADD CONSTRAINT platform_admins_role_check 
CHECK (role IN ('super_admin', 'support_admin', 'billing_admin', 'readonly_admin'));
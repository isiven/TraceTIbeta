/*
  # Platform Admin Infrastructure

  1. New Tables
    - `platform_admins`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `email` (varchar)
      - `full_name` (varchar)
      - `role` (varchar) - super_admin, support_admin, billing_admin, readonly_admin
      - `is_active` (boolean)
      - `invited_by` (uuid, references platform_admins)
      - `created_at` (timestamptz)
      - `last_login` (timestamptz)
    
    - `platform_activity_log`
      - `id` (uuid, primary key)
      - `actor_id` (uuid)
      - `actor_type` (varchar) - platform_admin or user
      - `actor_email` (varchar)
      - `action` (varchar)
      - `target_type` (varchar) - organization, user, subscription
      - `target_id` (uuid)
      - `target_name` (varchar)
      - `details` (jsonb)
      - `ip_address` (varchar)
      - `created_at` (timestamptz)

  2. Views
    - `platform_stats` - aggregated platform statistics

  3. Functions
    - `is_platform_admin` - helper to check if user is platform admin
    - `log_platform_activity` - helper to log activities

  4. Security
    - Enable RLS on platform_admins table
    - Enable RLS on platform_activity_log table
    - Add policies for platform admin access
*/

-- Create platform_admins table
CREATE TABLE IF NOT EXISTS platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'support_admin', 'billing_admin', 'readonly_admin')),
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES platform_admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Create platform_activity_log table
CREATE TABLE IF NOT EXISTS platform_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_type VARCHAR(50),
  actor_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  target_name VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_created ON platform_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_actor ON platform_activity_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_target ON platform_activity_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_platform_admins_user ON platform_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_admins_email ON platform_admins(email);

-- Create view for platform statistics
CREATE OR REPLACE VIEW platform_stats AS
SELECT
  (SELECT COUNT(*) FROM organizations) as total_organizations,
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM organizations WHERE subscription_plan != 'free') as paid_organizations,
  (SELECT COUNT(*) FROM organizations WHERE subscription_plan = 'free') as free_organizations,
  (SELECT COUNT(*) FROM organizations WHERE subscription_status = 'trialing') as trial_organizations,
  (SELECT 
    COALESCE(SUM(
      CASE 
        WHEN subscription_plan = 'pro' THEN 29
        WHEN subscription_plan = 'enterprise' THEN 99
        ELSE 0
      END
    ), 0)
  FROM organizations WHERE subscription_status = 'active') as mrr;

-- Helper function to check if user is platform admin
CREATE OR REPLACE FUNCTION is_platform_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM platform_admins
    WHERE platform_admins.user_id = is_platform_admin.user_id
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get platform admin role
CREATE OR REPLACE FUNCTION get_platform_admin_role(user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  admin_role VARCHAR;
BEGIN
  SELECT role INTO admin_role
  FROM platform_admins
  WHERE platform_admins.user_id = get_platform_admin_role.user_id
  AND is_active = true;
  
  RETURN admin_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log platform activity
CREATE OR REPLACE FUNCTION log_platform_activity(
  p_actor_id UUID,
  p_actor_type VARCHAR,
  p_actor_email VARCHAR,
  p_action VARCHAR,
  p_target_type VARCHAR DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_target_name VARCHAR DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO platform_activity_log (
    actor_id,
    actor_type,
    actor_email,
    action,
    target_type,
    target_id,
    target_name,
    details,
    ip_address
  ) VALUES (
    p_actor_id,
    p_actor_type,
    p_actor_email,
    p_action,
    p_target_type,
    p_target_id,
    p_target_name,
    p_details,
    p_ip_address
  )
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for platform_admins
CREATE POLICY "Platform admins can view all platform admins"
  ON platform_admins FOR SELECT
  TO authenticated
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "Super admins can insert platform admins"
  ON platform_admins FOR INSERT
  TO authenticated
  WITH CHECK (
    is_platform_admin(auth.uid()) AND
    get_platform_admin_role(auth.uid()) = 'super_admin'
  );

CREATE POLICY "Super admins can update platform admins"
  ON platform_admins FOR UPDATE
  TO authenticated
  USING (
    is_platform_admin(auth.uid()) AND
    get_platform_admin_role(auth.uid()) = 'super_admin'
  );

CREATE POLICY "Super admins can delete platform admins"
  ON platform_admins FOR DELETE
  TO authenticated
  USING (
    is_platform_admin(auth.uid()) AND
    get_platform_admin_role(auth.uid()) = 'super_admin'
  );

-- RLS Policies for platform_activity_log
CREATE POLICY "Platform admins can view activity log"
  ON platform_activity_log FOR SELECT
  TO authenticated
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can insert activity log"
  ON platform_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (is_platform_admin(auth.uid()));

-- Update profiles table to add platform admin support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_platform_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_platform_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Function to sync profile role with platform_admins
CREATE OR REPLACE FUNCTION sync_platform_admin_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile to mark as platform admin
  UPDATE profiles
  SET 
    role = 'super_admin',
    is_platform_admin = true
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync platform admin status
DROP TRIGGER IF EXISTS on_platform_admin_created ON platform_admins;
CREATE TRIGGER on_platform_admin_created
  AFTER INSERT ON platform_admins
  FOR EACH ROW
  EXECUTE FUNCTION sync_platform_admin_profile();

-- Insert the first super admin (Isaac Villasmil)
DO $$
DECLARE
  isaac_user_id UUID;
BEGIN
  -- Get Isaac's user ID
  SELECT id INTO isaac_user_id
  FROM auth.users
  WHERE email = 'isaac.villasmil@nextcomsystems.com'
  LIMIT 1;
  
  -- Insert as platform admin if found and not already exists
  IF isaac_user_id IS NOT NULL THEN
    INSERT INTO platform_admins (user_id, email, full_name, role)
    VALUES (isaac_user_id, 'isaac.villasmil@nextcomsystems.com', 'Isaac Villasmil', 'super_admin')
    ON CONFLICT (email) DO NOTHING;
  END IF;
END $$;

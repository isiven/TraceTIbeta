/*
  # Fix Platform Stats View - Remove SECURITY DEFINER

  1. Problem
    - View platform_stats may have SECURITY DEFINER attribute
    - This is a security risk as it executes with elevated privileges
    
  2. Solution
    - Drop and recreate view without any security attributes
    - View will execute with caller's permissions (default behavior)
    
  3. Security Impact
    - Removes privilege escalation risk
    - View requires proper RLS policies on underlying tables
*/

-- Drop the existing view
DROP VIEW IF EXISTS platform_stats CASCADE;

-- Recreate without SECURITY DEFINER (will use SECURITY INVOKER by default)
CREATE OR REPLACE VIEW platform_stats AS
SELECT 
  (SELECT count(*) FROM organizations) AS total_organizations,
  (SELECT count(*) FROM profiles) AS total_users,
  (SELECT count(*) FROM organizations WHERE subscription_plan != 'free') AS paid_organizations,
  (SELECT count(*) FROM organizations WHERE subscription_plan = 'free') AS free_organizations,
  (SELECT count(*) FROM organizations WHERE subscription_status = 'trialing') AS trial_organizations,
  (
    SELECT COALESCE(
      sum(
        CASE 
          WHEN subscription_plan = 'pro' THEN 29
          WHEN subscription_plan = 'enterprise' THEN 99
          ELSE 0
        END
      ), 0
    )
    FROM organizations
    WHERE subscription_status = 'active'
  ) AS mrr;

-- Grant appropriate permissions
GRANT SELECT ON platform_stats TO authenticated;

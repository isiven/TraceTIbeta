/*
  # Fix Security Definer View and Function Search Path

  1. Problems
    - View platform_stats is defined with SECURITY DEFINER (security risk)
    - Function update_notification_recipients_updated_at has mutable search_path
    
  2. Solutions
    - Recreate platform_stats view without SECURITY DEFINER
    - Recreate function with explicit search_path setting for security
    
  3. Security Impact
    - View will execute with caller's permissions (more secure)
    - Function has stable search_path (prevents search_path injection attacks)
*/

-- Drop and recreate the platform_stats view without SECURITY DEFINER
DROP VIEW IF EXISTS platform_stats;

CREATE VIEW platform_stats AS
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

-- Drop and recreate the function with explicit search_path
DROP FUNCTION IF EXISTS update_notification_recipients_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_notification_recipients_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Recreate the trigger since we dropped the function with CASCADE
DROP TRIGGER IF EXISTS update_notification_recipients_updated_at ON notification_recipients;

CREATE TRIGGER update_notification_recipients_updated_at
  BEFORE UPDATE ON notification_recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_recipients_updated_at();

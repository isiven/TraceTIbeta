/*
  # Optimize RLS Policies - Auth Function Initialization

  1. Problem
    - Multiple RLS policies call auth.uid() for each row
    - This causes repeated function evaluation and poor performance at scale
    
  2. Solution
    - Replace auth.uid() with (select auth.uid())
    - This evaluates the function once and reuses the result
    
  3. Tables Affected
    - profiles
    - notification_preferences (4 policies)
    - notification_recipients (4 policies)
    - email_log
    
  4. Performance Impact
    - Significantly improves query performance on large datasets
    - Reduces database load by evaluating auth functions once per query
*/

-- Profiles: Update read policy
DROP POLICY IF EXISTS "Users can read accessible profiles" ON profiles;
CREATE POLICY "Users can read accessible profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = (select auth.uid())
    OR organization_id IN (
      SELECT organization_id FROM profiles WHERE id = (select auth.uid())
    )
    OR is_platform_admin = true
  );

-- Notification Preferences: Optimize all policies
DROP POLICY IF EXISTS "Users can view own preferences" ON notification_preferences;
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own preferences" ON notification_preferences;
CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own preferences" ON notification_preferences;
CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Notification Recipients: Optimize all policies
DROP POLICY IF EXISTS "Users can view own recipients" ON notification_recipients;
CREATE POLICY "Users can view own recipients"
  ON notification_recipients FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own recipients" ON notification_recipients;
CREATE POLICY "Users can insert own recipients"
  ON notification_recipients FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own recipients" ON notification_recipients;
CREATE POLICY "Users can update own recipients"
  ON notification_recipients FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own recipients" ON notification_recipients;
CREATE POLICY "Users can delete own recipients"
  ON notification_recipients FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Email Log: Optimize insert policy
DROP POLICY IF EXISTS "Service can insert email logs" ON email_log;
CREATE POLICY "Service can insert email logs"
  ON email_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
        AND profiles.role = 'super_admin'
        AND profiles.is_platform_admin = true
    )
  );

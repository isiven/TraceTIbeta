/*
  # Fix Insecure Email Log Policy

  1. Problem
    - The "System can insert email logs" policy uses `WITH CHECK (true)`
    - This allows anyone to insert records into email_log without validation
    - This is a security risk

  2. Solution
    - Drop the insecure policy
    - Create a secure policy that only allows:
      - Edge functions using service role key
      - Platform admins to insert logs
    
  3. Security
    - Email logs can only be inserted by authorized services
    - Regular users cannot insert fake email logs
*/

-- Drop the insecure policy
DROP POLICY IF EXISTS "System can insert email logs" ON email_log;

-- Create a secure policy for inserting email logs
-- Only allow service role (used by edge functions) to insert
-- This policy will be bypassed by service role, but enforced for regular users
CREATE POLICY "Service can insert email logs"
  ON email_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only platform admins can manually insert logs
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
        AND profiles.is_platform_admin = true
    )
  );

-- Note: Edge functions using SUPABASE_SERVICE_ROLE_KEY will bypass RLS
-- and can insert logs without this policy restriction

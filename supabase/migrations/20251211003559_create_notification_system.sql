/*
  # Create Notification System

  This migration creates the complete notification system infrastructure for TraceTI.

  ## 1. New Tables
    - `notification_preferences` - User notification preferences
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `email_enabled` (boolean, default true)
      - `preferences` (jsonb, stores individual notification settings)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `email_log` - Log of all emails sent
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `email_to` (varchar)
      - `subject` (varchar)
      - `template` (varchar)
      - `status` (varchar) - sent, failed, bounced
      - `resend_id` (varchar)
      - `error_message` (text)
      - `created_at` (timestamptz)

  ## 2. Modifications to Existing Tables
    - Add notification tracking columns to licenses, hardware, contracts, support_contracts
    - Track when notifications have been sent to avoid duplicates

  ## 3. Security
    - Enable RLS on all new tables
    - Users can only view/update their own notification preferences
    - Platform admins can view email logs

  ## 4. Indexes
    - Add indexes for frequently queried columns
*/

-- ============================================================================
-- PART 1: CREATE NOTIFICATION PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email_enabled BOOLEAN DEFAULT true NOT NULL,
  preferences JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
  ON notification_preferences(user_id);

-- ============================================================================
-- PART 2: CREATE EMAIL LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_to VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  template VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'sent',
  resend_id VARCHAR(255),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only platform admins can view email logs
CREATE POLICY "Platform admins can view email logs"
  ON email_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "System can insert email logs"
  ON email_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Indexes for email log
CREATE INDEX IF NOT EXISTS idx_email_log_user_id ON email_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_log_status ON email_log(status);
CREATE INDEX IF NOT EXISTS idx_email_log_created_at ON email_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_template ON email_log(template);

-- ============================================================================
-- PART 3: ADD NOTIFICATION TRACKING TO LICENSES
-- ============================================================================

-- Add notification tracking columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'licenses' AND column_name = 'notification_30_sent'
  ) THEN
    ALTER TABLE licenses ADD COLUMN notification_30_sent BOOLEAN DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'licenses' AND column_name = 'notification_7_sent'
  ) THEN
    ALTER TABLE licenses ADD COLUMN notification_7_sent BOOLEAN DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'licenses' AND column_name = 'notification_expired_sent'
  ) THEN
    ALTER TABLE licenses ADD COLUMN notification_expired_sent BOOLEAN DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'licenses' AND column_name = 'last_notification_date'
  ) THEN
    ALTER TABLE licenses ADD COLUMN last_notification_date TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- PART 4: ADD NOTIFICATION TRACKING TO HARDWARE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hardware' AND column_name = 'notification_30_sent'
  ) THEN
    ALTER TABLE hardware ADD COLUMN notification_30_sent BOOLEAN DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hardware' AND column_name = 'notification_7_sent'
  ) THEN
    ALTER TABLE hardware ADD COLUMN notification_7_sent BOOLEAN DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hardware' AND column_name = 'notification_expired_sent'
  ) THEN
    ALTER TABLE hardware ADD COLUMN notification_expired_sent BOOLEAN DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hardware' AND column_name = 'last_notification_date'
  ) THEN
    ALTER TABLE hardware ADD COLUMN last_notification_date TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- PART 5: ADD NOTIFICATION TRACKING TO CONTRACTS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'notification_30_sent'
  ) THEN
    ALTER TABLE contracts ADD COLUMN notification_30_sent BOOLEAN DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'notification_7_sent'
  ) THEN
    ALTER TABLE contracts ADD COLUMN notification_7_sent BOOLEAN DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'notification_expired_sent'
  ) THEN
    ALTER TABLE contracts ADD COLUMN notification_expired_sent BOOLEAN DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'last_notification_date'
  ) THEN
    ALTER TABLE contracts ADD COLUMN last_notification_date TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- PART 6: ADD NOTIFICATION TRACKING TO SUPPORT_CONTRACTS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_contracts' AND column_name = 'notification_30_sent'
  ) THEN
    ALTER TABLE support_contracts ADD COLUMN notification_30_sent BOOLEAN DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_contracts' AND column_name = 'notification_7_sent'
  ) THEN
    ALTER TABLE support_contracts ADD COLUMN notification_7_sent BOOLEAN DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_contracts' AND column_name = 'notification_expired_sent'
  ) THEN
    ALTER TABLE support_contracts ADD COLUMN notification_expired_sent BOOLEAN DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_contracts' AND column_name = 'last_notification_date'
  ) THEN
    ALTER TABLE support_contracts ADD COLUMN last_notification_date TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- PART 7: CREATE TRIGGER TO UPDATE updated_at
-- ============================================================================

CREATE OR REPLACE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 8: CREATE HELPER FUNCTION TO RESET NOTIFICATION FLAGS
-- ============================================================================

-- Function to reset notification flags when expiration date is extended
CREATE OR REPLACE FUNCTION reset_notification_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If expiration date is extended, reset notification flags
  IF NEW.expiration_date > OLD.expiration_date THEN
    NEW.notification_30_sent := false;
    NEW.notification_7_sent := false;
    NEW.notification_expired_sent := false;
    NEW.last_notification_date := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Apply trigger to licenses
DROP TRIGGER IF EXISTS reset_license_notification_flags ON licenses;
CREATE TRIGGER reset_license_notification_flags
  BEFORE UPDATE ON licenses
  FOR EACH ROW
  WHEN (OLD.expiration_date IS DISTINCT FROM NEW.expiration_date)
  EXECUTE FUNCTION reset_notification_flags();

-- Apply trigger to contracts
DROP TRIGGER IF EXISTS reset_contract_notification_flags ON contracts;
CREATE TRIGGER reset_contract_notification_flags
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  WHEN (OLD.end_date IS DISTINCT FROM NEW.end_date)
  EXECUTE FUNCTION reset_notification_flags();

-- ============================================================================
-- PART 9: CREATE FUNCTION TO GET USER NOTIFICATION PREFERENCES
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_notification_preference(
  p_user_id UUID,
  p_notification_type VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email_enabled BOOLEAN;
  v_preferences JSONB;
  v_enabled BOOLEAN;
BEGIN
  -- Get user preferences
  SELECT email_enabled, preferences
  INTO v_email_enabled, v_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id;
  
  -- If no preferences found, return true (default enabled)
  IF NOT FOUND THEN
    RETURN true;
  END IF;
  
  -- If email is disabled globally, return false
  IF NOT v_email_enabled THEN
    RETURN false;
  END IF;
  
  -- Check specific notification preference
  v_enabled := COALESCE(
    (v_preferences->p_notification_type)::boolean,
    true
  );
  
  RETURN v_enabled;
END;
$$;

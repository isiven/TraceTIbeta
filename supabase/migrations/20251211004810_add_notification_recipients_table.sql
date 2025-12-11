/*
  # Add Notification Recipients Table
  
  1. New Tables
    - `notification_recipients`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `email` (text) - recipient email address
      - `name` (text, optional) - recipient name
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `notification_recipients` table
    - Users can only manage their own recipients
    - Policies for authenticated users to CRUD their own recipients
  
  3. Constraints
    - Unique constraint on (user_id, email) to prevent duplicates
    - Validate email format
*/

-- Create notification recipients table
CREATE TABLE IF NOT EXISTS notification_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  name text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, email)
);

-- Enable RLS
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;

-- Policies for notification_recipients
CREATE POLICY "Users can view own recipients"
  ON notification_recipients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipients"
  ON notification_recipients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipients"
  ON notification_recipients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipients"
  ON notification_recipients
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_recipients_user_id 
  ON notification_recipients(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_notification_recipients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_recipients_updated_at
  BEFORE UPDATE ON notification_recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_recipients_updated_at();

/*
  # Add scope column to invitations table

  1. Changes
    - Add 'scope' column to invitations table
      - Type: varchar
      - Values: 'all', 'assigned', 'department'
      - Default: 'assigned'
      - Not nullable with default value
  
  2. Notes
    - This column is required by the frontend TeamManagement component
    - Matches the scope field in the profiles table for consistency
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invitations' AND column_name = 'scope'
  ) THEN
    ALTER TABLE invitations 
    ADD COLUMN scope varchar NOT NULL DEFAULT 'assigned';
  END IF;
END $$;

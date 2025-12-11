/*
  # Fix licenses table name column

  1. Problem
    - The `licenses` table has a `name` column that is NOT NULL
    - The frontend uses `software_name` instead
    - This causes insert failures because `name` is required but not being sent

  2. Solution
    - Make the `name` column nullable
    - OR set a default value that uses `software_name`
    - We'll use a trigger to sync `name` from `software_name` for compatibility

  3. Changes
    - Make `name` column nullable
    - Add a trigger to auto-populate `name` from `software_name`
*/

-- Make the name column nullable
ALTER TABLE licenses 
ALTER COLUMN name DROP NOT NULL;

-- Create a trigger function to sync name from software_name
CREATE OR REPLACE FUNCTION sync_license_name()
RETURNS TRIGGER AS $$
BEGIN
  -- If name is not provided but software_name is, use software_name
  IF NEW.name IS NULL AND NEW.software_name IS NOT NULL THEN
    NEW.name := NEW.software_name;
  END IF;
  
  -- If software_name is not provided but name is, use name
  IF NEW.software_name IS NULL AND NEW.name IS NOT NULL THEN
    NEW.software_name := NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync the fields
DROP TRIGGER IF EXISTS sync_license_name_trigger ON licenses;
CREATE TRIGGER sync_license_name_trigger
  BEFORE INSERT OR UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION sync_license_name();

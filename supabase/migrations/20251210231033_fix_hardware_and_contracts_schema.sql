/*
  # Fix hardware and support_contracts schema issues

  1. Hardware Table Issues
    - The `name` column is NOT NULL but frontend doesn't send it
    - Frontend uses specific fields like `hardware_type`, `manufacturer`, `model`

  2. Support Contracts Issues
    - Check constraint expects 'Active', 'Expiring', 'Expired' (capitalized)
    - But the trigger now sets 'active', 'expiring', 'expired' (lowercase)

  3. Changes
    - Make hardware `name` column nullable
    - Add trigger to auto-generate `name` from hardware_type and manufacturer
    - Update support_contracts status check constraint to use lowercase
*/

-- Fix hardware table: make name nullable
ALTER TABLE hardware 
ALTER COLUMN name DROP NOT NULL;

-- Create trigger function to auto-generate hardware name
CREATE OR REPLACE FUNCTION generate_hardware_name()
RETURNS TRIGGER AS $$
BEGIN
  -- If name is not provided, generate it from hardware_type and manufacturer
  IF NEW.name IS NULL THEN
    NEW.name := COALESCE(NEW.hardware_type, 'Hardware') || 
                CASE 
                  WHEN NEW.manufacturer IS NOT NULL THEN ' - ' || NEW.manufacturer
                  ELSE ''
                END ||
                CASE 
                  WHEN NEW.model IS NOT NULL THEN ' ' || NEW.model
                  ELSE ''
                END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for hardware name generation
DROP TRIGGER IF EXISTS generate_hardware_name_trigger ON hardware;
CREATE TRIGGER generate_hardware_name_trigger
  BEFORE INSERT OR UPDATE ON hardware
  FOR EACH ROW
  EXECUTE FUNCTION generate_hardware_name();

-- Fix support_contracts status check constraint to match lowercase values from trigger
ALTER TABLE support_contracts 
DROP CONSTRAINT IF EXISTS support_contracts_status_check;

ALTER TABLE support_contracts
ADD CONSTRAINT support_contracts_status_check 
CHECK (status = ANY (ARRAY['active'::text, 'expiring'::text, 'expired'::text]));

/*
  # Fix status case in update_asset_status trigger

  1. Problem
    - The trigger function sets status as 'Active', 'Expiring', 'Expired' (capitalized)
    - The check constraint expects 'active', 'expiring', 'expired' (lowercase)
    - This causes constraint violation errors

  2. Solution
    - Update the trigger function to use lowercase status values

  3. Changes
    - Modify update_asset_status() to use lowercase status values
*/

CREATE OR REPLACE FUNCTION update_asset_status()
RETURNS TRIGGER AS $$
DECLARE
  exp_date date;
  days_until_exp integer;
BEGIN
  -- Determine the expiration date based on the table
  IF TG_TABLE_NAME = 'hardware' THEN
    -- Hardware uses warranty_expiration
    exp_date := NEW.warranty_expiration;
  ELSIF TG_TABLE_NAME = 'licenses' THEN
    -- Licenses use expiration_date
    exp_date := NEW.expiration_date;
  ELSIF TG_TABLE_NAME = 'support_contracts' THEN
    -- Support contracts use expiration_date
    exp_date := NEW.expiration_date;
  ELSE
    -- For any other table, try expiration_date if it exists
    exp_date := NEW.expiration_date;
  END IF;

  -- Only update status if we have an expiration date
  IF exp_date IS NOT NULL THEN
    days_until_exp := exp_date - CURRENT_DATE;

    IF days_until_exp < 0 THEN
      NEW.status := 'expired';
    ELSIF days_until_exp <= 30 THEN
      NEW.status := 'expiring';
    ELSE
      NEW.status := 'active';
    END IF;
  END IF;

  -- Update the updated_at timestamp
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

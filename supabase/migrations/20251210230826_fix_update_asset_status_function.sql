/*
  # Fix update_asset_status function

  1. Problem
    - The function was trying to access `warranty_expiration` on all tables
    - This field only exists on the `hardware` table
    - This caused errors when inserting into `licenses` and `support_contracts`

  2. Solution
    - Update the function to check which table is calling it
    - Only access `warranty_expiration` for the `hardware` table
    - Use `expiration_date` for `licenses` and `support_contracts` tables

  3. Changes
    - Replace the `update_asset_status()` function with a table-aware version
    - Function now uses `TG_TABLE_NAME` to determine which fields to check
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
      NEW.status := 'Expired';
    ELSIF days_until_exp <= 30 THEN
      NEW.status := 'Expiring';
    ELSE
      NEW.status := 'Active';
    END IF;
  END IF;

  -- Update the updated_at timestamp
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

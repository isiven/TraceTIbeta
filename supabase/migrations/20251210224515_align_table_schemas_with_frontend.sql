/*
  # Align Database Schema with Frontend Expectations

  1. Problem
    - Frontend expects columns like software_name, annual_cost, hardware_type, etc.
    - Database has different column names (name, cost, etc.)
    - This mismatch prevents creating and displaying items correctly

  2. Solution
    - Add missing columns to licenses, hardware, and support_contracts tables
    - Keep existing columns for backwards compatibility
    - Map data appropriately

  3. Changes
    - Add software_name, annual_cost, client_name, client_contact to licenses
    - Add hardware_type, manufacturer, serial_number, warranty_expiration, purchase_cost to hardware  
    - Ensure all tables have the columns the frontend expects
*/

-- Update licenses table
DO $$ 
BEGIN
  -- Add software_name if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'licenses' AND column_name = 'software_name') THEN
    ALTER TABLE licenses ADD COLUMN software_name text;
  END IF;
  
  -- Add annual_cost if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'licenses' AND column_name = 'annual_cost') THEN
    ALTER TABLE licenses ADD COLUMN annual_cost numeric(10,2) DEFAULT 0;
  END IF;
  
  -- Add client_name if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'licenses' AND column_name = 'client_name') THEN
    ALTER TABLE licenses ADD COLUMN client_name text;
  END IF;
  
  -- Add client_contact if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'licenses' AND column_name = 'client_contact') THEN
    ALTER TABLE licenses ADD COLUMN client_contact text;
  END IF;
  
  -- Add provider if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'licenses' AND column_name = 'provider') THEN
    ALTER TABLE licenses ADD COLUMN provider text;
  END IF;
  
  -- Add quantity/seats mapping
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'licenses' AND column_name = 'quantity') THEN
    ALTER TABLE licenses ADD COLUMN quantity integer DEFAULT 1;
  END IF;
  
  -- Add contract_number if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'licenses' AND column_name = 'contract_number') THEN
    ALTER TABLE licenses ADD COLUMN contract_number text;
  END IF;
  
  -- Add support fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'licenses' AND column_name = 'support_included') THEN
    ALTER TABLE licenses ADD COLUMN support_included boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'licenses' AND column_name = 'support_name') THEN
    ALTER TABLE licenses ADD COLUMN support_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'licenses' AND column_name = 'support_expiration') THEN
    ALTER TABLE licenses ADD COLUMN support_expiration date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'licenses' AND column_name = 'support_cost') THEN
    ALTER TABLE licenses ADD COLUMN support_cost numeric(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'licenses' AND column_name = 'responsible_name') THEN
    ALTER TABLE licenses ADD COLUMN responsible_name text;
  END IF;
END $$;

-- Update hardware table
DO $$ 
BEGIN
  -- Add hardware_type if it doesn't exist (map from category)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hardware' AND column_name = 'hardware_type') THEN
    ALTER TABLE hardware ADD COLUMN hardware_type text;
  END IF;
  
  -- Add manufacturer if it doesn't exist (map from brand)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hardware' AND column_name = 'manufacturer') THEN
    ALTER TABLE hardware ADD COLUMN manufacturer text;
  END IF;
  
  -- Add warranty_expiration if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hardware' AND column_name = 'warranty_expiration') THEN
    ALTER TABLE hardware ADD COLUMN warranty_expiration date;
  END IF;
  
  -- Add purchase_cost if it doesn't exist (map from cost)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hardware' AND column_name = 'purchase_cost') THEN
    ALTER TABLE hardware ADD COLUMN purchase_cost numeric(10,2) DEFAULT 0;
  END IF;
  
  -- Add quantity if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hardware' AND column_name = 'quantity') THEN
    ALTER TABLE hardware ADD COLUMN quantity integer DEFAULT 1;
  END IF;
  
  -- Add provider if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hardware' AND column_name = 'provider') THEN
    ALTER TABLE hardware ADD COLUMN provider text;
  END IF;
  
  -- Add support fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hardware' AND column_name = 'support_included') THEN
    ALTER TABLE hardware ADD COLUMN support_included boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hardware' AND column_name = 'support_provider') THEN
    ALTER TABLE hardware ADD COLUMN support_provider text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hardware' AND column_name = 'support_expiration') THEN
    ALTER TABLE hardware ADD COLUMN support_expiration date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hardware' AND column_name = 'support_cost') THEN
    ALTER TABLE hardware ADD COLUMN support_cost numeric(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hardware' AND column_name = 'responsible_name') THEN
    ALTER TABLE hardware ADD COLUMN responsible_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hardware' AND column_name = 'client_name') THEN
    ALTER TABLE hardware ADD COLUMN client_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hardware' AND column_name = 'client_contact') THEN
    ALTER TABLE hardware ADD COLUMN client_contact text;
  END IF;
END $$;

-- Copy data from old columns to new columns where applicable
UPDATE licenses SET 
  software_name = COALESCE(software_name, name),
  annual_cost = COALESCE(annual_cost, cost),
  quantity = COALESCE(quantity, seats)
WHERE software_name IS NULL OR annual_cost IS NULL OR quantity IS NULL;

UPDATE hardware SET
  hardware_type = COALESCE(hardware_type, category),
  manufacturer = COALESCE(manufacturer, brand),
  purchase_cost = COALESCE(purchase_cost, cost)
WHERE hardware_type IS NULL OR manufacturer IS NULL OR purchase_cost IS NULL;

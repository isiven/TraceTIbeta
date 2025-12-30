/*
  # Update Asset Tables with Relations - Phase 2
  
  1. Updates to LICENSES Table
    - Add product_id reference to products catalog
    - Add vendor_id reference (kept for historical tracking even though product has vendor)
    - Add provider_id reference to providers catalog
    - Add contact_id reference to contacts
    - Add assigned_to_user_id for user assignment
    - Add department for budget allocation
    - Add renewal_cost (different from purchase_cost)
    - Ensure purchase_cost exists
  
  2. Updates to HARDWARE Table
    - Add product_id reference
    - Add manufacturer_id (vendor) reference
    - Add provider_id reference
    - Add contact_id reference
    - Add assigned_to_user_id
    - Add department
    - Ensure purchase_cost exists
  
  3. Updates to SUPPORT_CONTRACTS Table
    - Add contact_id reference
    - Add provider_id reference
    - Add vendor_id reference
    - Add renewal_date
    - Add department
    - Create contract_covered_assets junction table
  
  4. Add Triggers
    - Update product costs when licenses/hardware are purchased
    - Auto-calculate product average cost
  
  5. Indexes
    - Foreign key indexes for performance
    - Date indexes for expiration queries
*/

-- =====================================================
-- UPDATE LICENSES TABLE
-- =====================================================

-- Add missing columns to licenses
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES providers(id) ON DELETE SET NULL;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS purchase_cost DECIMAL;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS renewal_cost DECIMAL;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS department TEXT;

-- Create indexes for licenses
CREATE INDEX IF NOT EXISTS idx_licenses_product ON licenses(product_id);
CREATE INDEX IF NOT EXISTS idx_licenses_vendor ON licenses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_licenses_provider ON licenses(provider_id);
CREATE INDEX IF NOT EXISTS idx_licenses_contact ON licenses(contact_id);
CREATE INDEX IF NOT EXISTS idx_licenses_assigned_user ON licenses(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_expiration ON licenses(expiration_date);
CREATE INDEX IF NOT EXISTS idx_licenses_department ON licenses(department);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);

-- =====================================================
-- UPDATE HARDWARE TABLE
-- =====================================================

-- Add missing columns to hardware
ALTER TABLE hardware ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE hardware ADD COLUMN IF NOT EXISTS manufacturer_id UUID REFERENCES vendors(id) ON DELETE SET NULL;
ALTER TABLE hardware ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES providers(id) ON DELETE SET NULL;
ALTER TABLE hardware ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE hardware ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE hardware ADD COLUMN IF NOT EXISTS department TEXT;

-- purchase_cost already exists, but let's ensure it's there
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hardware' AND column_name = 'purchase_cost'
  ) THEN
    ALTER TABLE hardware ADD COLUMN purchase_cost DECIMAL;
  END IF;
END $$;

-- Create indexes for hardware
CREATE INDEX IF NOT EXISTS idx_hardware_product ON hardware(product_id);
CREATE INDEX IF NOT EXISTS idx_hardware_manufacturer ON hardware(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_hardware_provider ON hardware(provider_id);
CREATE INDEX IF NOT EXISTS idx_hardware_contact ON hardware(contact_id);
CREATE INDEX IF NOT EXISTS idx_hardware_assigned_user ON hardware(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_hardware_warranty ON hardware(warranty_expiration);
CREATE INDEX IF NOT EXISTS idx_hardware_department ON hardware(department);
CREATE INDEX IF NOT EXISTS idx_hardware_status ON hardware(status);

-- =====================================================
-- UPDATE SUPPORT_CONTRACTS TABLE
-- =====================================================

-- Add missing columns to support_contracts
ALTER TABLE support_contracts ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE support_contracts ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES providers(id) ON DELETE SET NULL;
ALTER TABLE support_contracts ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL;
ALTER TABLE support_contracts ADD COLUMN IF NOT EXISTS renewal_date DATE;
ALTER TABLE support_contracts ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE support_contracts ADD COLUMN IF NOT EXISTS end_date DATE;

-- Create indexes for support_contracts
CREATE INDEX IF NOT EXISTS idx_support_contracts_contact ON support_contracts(contact_id);
CREATE INDEX IF NOT EXISTS idx_support_contracts_provider ON support_contracts(provider_id);
CREATE INDEX IF NOT EXISTS idx_support_contracts_vendor ON support_contracts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_support_contracts_renewal ON support_contracts(renewal_date);
CREATE INDEX IF NOT EXISTS idx_support_contracts_expiration ON support_contracts(expiration_date);
CREATE INDEX IF NOT EXISTS idx_support_contracts_department ON support_contracts(department);
CREATE INDEX IF NOT EXISTS idx_support_contracts_status ON support_contracts(status);

-- =====================================================
-- CONTRACT COVERED ASSETS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS contract_covered_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES support_contracts(id) ON DELETE CASCADE NOT NULL,
  asset_type TEXT CHECK (asset_type IN ('license', 'hardware')) NOT NULL,
  asset_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_covered_assets_contract ON contract_covered_assets(contract_id);
CREATE INDEX IF NOT EXISTS idx_covered_assets_type_id ON contract_covered_assets(asset_type, asset_id);

ALTER TABLE contract_covered_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View covered assets policy" ON contract_covered_assets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM support_contracts 
    WHERE id = contract_covered_assets.contract_id 
    AND organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Manage covered assets policy" ON contract_covered_assets FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM support_contracts 
    WHERE id = contract_covered_assets.contract_id 
    AND organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
);

-- =====================================================
-- TRIGGERS: UPDATE PRODUCT COSTS FROM PURCHASES
-- =====================================================

-- Function to update product costs when license is created/updated
CREATE OR REPLACE FUNCTION update_product_costs_from_license()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS NOT NULL AND NEW.purchase_cost IS NOT NULL AND NEW.purchase_cost > 0 THEN
    UPDATE products
    SET 
      last_purchase_cost = NEW.purchase_cost,
      last_purchase_date = NEW.purchase_date,
      last_purchase_provider_id = NEW.provider_id,
      average_cost = (
        SELECT AVG(purchase_cost) 
        FROM licenses 
        WHERE product_id = NEW.product_id 
        AND purchase_cost IS NOT NULL
        AND purchase_cost > 0
      ),
      updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_product_costs_trigger ON licenses;
CREATE TRIGGER update_product_costs_trigger
AFTER INSERT OR UPDATE ON licenses
FOR EACH ROW
EXECUTE FUNCTION update_product_costs_from_license();

-- Function to update product costs from hardware
CREATE OR REPLACE FUNCTION update_product_costs_from_hardware()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS NOT NULL AND NEW.purchase_cost IS NOT NULL AND NEW.purchase_cost > 0 THEN
    UPDATE products
    SET 
      last_purchase_cost = NEW.purchase_cost,
      last_purchase_date = NEW.purchase_date,
      last_purchase_provider_id = NEW.provider_id,
      average_cost = (
        SELECT AVG(purchase_cost) 
        FROM hardware 
        WHERE product_id = NEW.product_id 
        AND purchase_cost IS NOT NULL
        AND purchase_cost > 0
      ),
      updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_product_costs_from_hardware_trigger ON hardware;
CREATE TRIGGER update_product_costs_from_hardware_trigger
AFTER INSERT OR UPDATE ON hardware
FOR EACH ROW
EXECUTE FUNCTION update_product_costs_from_hardware();
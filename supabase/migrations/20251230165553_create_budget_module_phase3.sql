/*
  # Create Budget Module - Phase 3
  
  1. New Tables
    - `budget_plans` - Annual budget planning and forecasting
      * Columns: fiscal_year, name, status, total_amount
      * Statuses: draft, submitted, approved, rejected, active
    
    - `budget_items` - Line items in a budget plan
      * Columns: category, item_type, vendor, provider, product
      * Relations to licenses/hardware/contracts for renewals
      * Auto-calculates total_cost from quantity * unit_cost
  
  2. Triggers
    - Auto-update budget_plan total when items change
  
  3. Security
    - Enable RLS with organization isolation
    - Integrators can view all, end users only their org
  
  4. Indexes
    - Foreign key indexes
    - Status and date indexes for queries
*/

-- =====================================================
-- BUDGET PLANS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS budget_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  fiscal_year INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  status TEXT CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'active')) DEFAULT 'draft',
  
  total_amount DECIMAL DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budget_plans_org ON budget_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_budget_plans_year ON budget_plans(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_budget_plans_status ON budget_plans(status);
CREATE INDEX IF NOT EXISTS idx_budget_plans_org_year ON budget_plans(organization_id, fiscal_year);

ALTER TABLE budget_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View budget plans policy" ON budget_plans FOR SELECT
USING (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND account_type = 'integrator'
  )
);

CREATE POLICY "Manage budget plans policy" ON budget_plans FOR ALL
USING (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- =====================================================
-- BUDGET ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS budget_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_plan_id UUID REFERENCES budget_plans(id) ON DELETE CASCADE NOT NULL,
  
  category TEXT CHECK (category IN ('software', 'hardware', 'service', 'cloud', 'other')) NOT NULL,
  item_type TEXT CHECK (item_type IN ('renewal', 'new_purchase', 'replacement', 'upgrade', 'other')) DEFAULT 'new_purchase',
  
  department TEXT,
  
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  related_license_id UUID REFERENCES licenses(id) ON DELETE SET NULL,
  related_hardware_id UUID REFERENCES hardware(id) ON DELETE SET NULL,
  related_contract_id UUID REFERENCES support_contracts(id) ON DELETE SET NULL,
  
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_cost DECIMAL NOT NULL,
  total_cost DECIMAL GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  
  frequency TEXT CHECK (frequency IN ('one-time', 'monthly', 'yearly')) DEFAULT 'one-time',
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budget_items_plan ON budget_items(budget_plan_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_category ON budget_items(category);
CREATE INDEX IF NOT EXISTS idx_budget_items_type ON budget_items(item_type);
CREATE INDEX IF NOT EXISTS idx_budget_items_vendor ON budget_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_provider ON budget_items(provider_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_product ON budget_items(product_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_department ON budget_items(department);

ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View budget items policy" ON budget_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM budget_plans 
    WHERE id = budget_items.budget_plan_id 
    AND organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND account_type = 'integrator'
  )
);

CREATE POLICY "Manage budget items policy" ON budget_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM budget_plans 
    WHERE id = budget_items.budget_plan_id 
    AND organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
);

-- =====================================================
-- TRIGGERS: UPDATE BUDGET PLAN TOTALS
-- =====================================================

-- Function to update budget plan total when items change
CREATE OR REPLACE FUNCTION update_budget_plan_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE budget_plans
  SET 
    total_amount = (
      SELECT COALESCE(SUM(total_cost), 0)
      FROM budget_items
      WHERE budget_plan_id = COALESCE(NEW.budget_plan_id, OLD.budget_plan_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.budget_plan_id, OLD.budget_plan_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_budget_plan_total_trigger ON budget_items;
CREATE TRIGGER update_budget_plan_total_trigger
AFTER INSERT OR UPDATE OR DELETE ON budget_items
FOR EACH ROW
EXECUTE FUNCTION update_budget_plan_total();

-- =====================================================
-- UPDATE TIMESTAMP TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_budget_plans_updated_at ON budget_plans;
CREATE TRIGGER update_budget_plans_updated_at
  BEFORE UPDATE ON budget_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_items_updated_at ON budget_items;
CREATE TRIGGER update_budget_items_updated_at
  BEFORE UPDATE ON budget_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
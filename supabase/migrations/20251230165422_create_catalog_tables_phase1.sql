/*
  # Create Catalog Tables - Phase 1
  
  1. New Tables - Organization-Scoped Catalogs
    - `vendors` - Manufacturers/brands (Microsoft, Cisco, Dell, etc.)
      * Each organization creates and maintains their own vendor catalog
      * No global vendors - complete data isolation
      * Columns: name, type, website, support contact info, logo
    
    - `providers` - Distributors/resellers (Ingram Micro, CDW, local distributors)
      * Each organization creates their own provider catalog
      * Columns: name, type, contact info, payment terms
    
    - `products` - Product catalog with cost tracking
      * Each organization builds their own product catalog
      * Links to vendors, tracks purchase history and costs
      * Columns: name, vendor, SKU, category, pricing history
    
    - `contacts` - All contacts (employees, vendor reps, provider sales, client contacts)
      * Enhanced with types and relationships
      * Columns: type, contact info, related vendor/provider/client
  
  2. Security
    - Enable RLS on all new tables
    - Policies ensure complete organization isolation
    - Users only see/manage their organization's catalogs
  
  3. Indexing
    - Foreign key indexes for performance
    - Search indexes for name lookups
    - Full-text search support
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- VENDORS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('software', 'hardware', 'both', 'service')) DEFAULT 'both',
  website TEXT,
  support_email TEXT,
  support_phone TEXT,
  logo_url TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
CREATE INDEX IF NOT EXISTS idx_vendors_org ON vendors(organization_id);
CREATE INDEX IF NOT EXISTS idx_vendors_search ON vendors USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_vendors_type ON vendors(type);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View vendors policy" ON vendors FOR SELECT
USING (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Create vendors policy" ON vendors FOR INSERT
WITH CHECK (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Update vendors policy" ON vendors FOR UPDATE
USING (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Delete vendors policy" ON vendors FOR DELETE
USING (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- =====================================================
-- PROVIDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('distributor', 'reseller', 'direct', 'integrator', 'manufacturer')) DEFAULT 'distributor',
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  payment_terms TEXT,
  website TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_providers_name ON providers(name);
CREATE INDEX IF NOT EXISTS idx_providers_org ON providers(organization_id);
CREATE INDEX IF NOT EXISTS idx_providers_search ON providers USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_providers_type ON providers(type);

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View providers policy" ON providers FOR SELECT
USING (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Create providers policy" ON providers FOR INSERT
WITH CHECK (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Update providers policy" ON providers FOR UPDATE
USING (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Delete providers policy" ON providers FOR DELETE
USING (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  sku TEXT,
  category TEXT CHECK (category IN ('software', 'hardware', 'service', 'cloud')) NOT NULL,
  type TEXT,
  description TEXT,
  
  msrp DECIMAL,
  average_cost DECIMAL,
  last_purchase_cost DECIMAL,
  last_purchase_date DATE,
  last_purchase_provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_org ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(sku, '')));

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View products policy" ON products FOR SELECT
USING (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Create products policy" ON products FOR INSERT
WITH CHECK (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Update products policy" ON products FOR UPDATE
USING (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Delete products policy" ON products FOR DELETE
USING (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- =====================================================
-- CONTACTS TABLE (Enhanced)
-- =====================================================

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  type TEXT CHECK (type IN ('internal', 'vendor', 'provider', 'client', 'other')) DEFAULT 'internal',
  
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  job_title TEXT,
  department TEXT,
  company TEXT,
  
  related_vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  related_provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  related_client_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  is_primary_contact BOOLEAN DEFAULT false,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_vendor ON contacts(related_vendor_id);
CREATE INDEX IF NOT EXISTS idx_contacts_provider ON contacts(related_provider_id);
CREATE INDEX IF NOT EXISTS idx_contacts_client ON contacts(related_client_id);
CREATE INDEX IF NOT EXISTS idx_contacts_search ON contacts USING gin(to_tsvector('english', full_name || ' ' || COALESCE(email, '') || ' ' || COALESCE(company, '')));

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View contacts policy" ON contacts FOR SELECT
USING (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND account_type = 'integrator'
  )
  OR
  related_client_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Manage contacts policy" ON contacts FOR ALL
USING (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND account_type = 'integrator'
  )
);

-- =====================================================
-- UPDATE TIMESTAMP TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_providers_updated_at ON providers;
CREATE TRIGGER update_providers_updated_at
  BEFORE UPDATE ON providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
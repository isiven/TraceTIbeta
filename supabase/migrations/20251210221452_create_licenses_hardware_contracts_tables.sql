/*
  # Create IT Asset Management Tables

  1. New Tables
    - `licenses`
      - Software license tracking with expiration dates
      - Links to organizations and clients
    - `hardware`
      - Hardware asset tracking with warranty information
      - Location and purchase details
    - `support_contracts`
      - Support contract management
      - Multi-asset coverage tracking
    - `clients` (for integrators)
      - Client management for IT integrators
      - Contact information and notes
  
  2. Security
    - Enable RLS on all tables
    - Policies for organization-scoped access
    - Admin users can manage all data in their organization
*/

-- Clients table (for integrators to manage their end clients)
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view clients in their organization"
  ON clients FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage clients"
  ON clients FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Licenses table
CREATE TABLE IF NOT EXISTS licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  software_name text NOT NULL,
  vendor text NOT NULL,
  provider text,
  quantity integer NOT NULL DEFAULT 1,
  expiration_date date NOT NULL,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Expiring', 'Expired')),
  annual_cost numeric(10,2) DEFAULT 0,
  contract_number text,
  support_included boolean DEFAULT false,
  support_name text,
  support_expiration date,
  support_cost numeric(10,2),
  notes text,
  responsible_name text,
  client_name text,
  client_contact text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view licenses in their organization"
  ON licenses FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage licenses in their organization"
  ON licenses FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Hardware table
CREATE TABLE IF NOT EXISTS hardware (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  hardware_type text NOT NULL,
  manufacturer text NOT NULL,
  model text NOT NULL,
  serial_number text NOT NULL,
  provider text,
  quantity integer NOT NULL DEFAULT 1,
  purchase_date date,
  warranty_expiration date NOT NULL,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Expiring', 'Expired')),
  purchase_cost numeric(10,2) DEFAULT 0,
  location text,
  support_included boolean DEFAULT false,
  support_provider text,
  support_expiration date,
  support_cost numeric(10,2),
  notes text,
  responsible_name text,
  client_name text,
  client_contact text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hardware ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hardware in their organization"
  ON hardware FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage hardware in their organization"
  ON hardware FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Support Contracts table
CREATE TABLE IF NOT EXISTS support_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  contract_id text NOT NULL,
  vendor_contract_number text,
  contract_name text NOT NULL,
  provider text NOT NULL,
  type text NOT NULL,
  assets_description text DEFAULT 'No assets linked',
  start_date date,
  expiration_date date NOT NULL,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Expiring', 'Expired')),
  annual_cost numeric(10,2) DEFAULT 0,
  billing_frequency text DEFAULT 'Annual' CHECK (billing_frequency IN ('Annual', 'Quarterly', 'Monthly', 'One-time')),
  auto_renewal boolean DEFAULT false,
  responsible_name text,
  provider_contact text,
  notes text,
  client_name text,
  client_contact text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE support_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contracts in their organization"
  ON support_contracts FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage contracts in their organization"
  ON support_contracts FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_licenses_organization ON licenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_licenses_expiration ON licenses(expiration_date);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_hardware_organization ON hardware(organization_id);
CREATE INDEX IF NOT EXISTS idx_hardware_warranty ON hardware(warranty_expiration);
CREATE INDEX IF NOT EXISTS idx_contracts_organization ON support_contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contracts_expiration ON support_contracts(expiration_date);
CREATE INDEX IF NOT EXISTS idx_clients_organization ON clients(organization_id);

-- Function to auto-update status based on expiration dates
CREATE OR REPLACE FUNCTION update_asset_status()
RETURNS trigger AS $$
BEGIN
  IF NEW.expiration_date IS NOT NULL OR NEW.warranty_expiration IS NOT NULL THEN
    DECLARE
      exp_date date;
      days_until_exp integer;
    BEGIN
      exp_date := COALESCE(NEW.expiration_date, NEW.warranty_expiration);
      days_until_exp := exp_date - CURRENT_DATE;
      
      IF days_until_exp < 0 THEN
        NEW.status := 'Expired';
      ELSIF days_until_exp <= 30 THEN
        NEW.status := 'Expiring';
      ELSE
        NEW.status := 'Active';
      END IF;
    END;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update status
CREATE TRIGGER update_license_status
  BEFORE INSERT OR UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_asset_status();

CREATE TRIGGER update_hardware_status
  BEFORE INSERT OR UPDATE ON hardware
  FOR EACH ROW
  EXECUTE FUNCTION update_asset_status();

CREATE TRIGGER update_contract_status
  BEFORE INSERT OR UPDATE ON support_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_asset_status();

/*
  # Create invitations table for team management

  1. New Tables
    - `invitations`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key to organizations)
      - `email` (varchar, email of invited user)
      - `role` (varchar, role to assign)
      - `scope` (varchar, visibility scope)
      - `department` (varchar, optional department)
      - `token` (varchar, unique invitation token)
      - `status` (varchar, invitation status)
      - `invited_by` (uuid, foreign key to profiles)
      - `expires_at` (timestamptz, expiration date)
      - `created_at` (timestamptz, creation timestamp)

  2. Security
    - Enable RLS on `invitations` table
    - Add policy for organization members to view invitations
    - Add policy for admins to create invitations
    - Add policy for admins to delete invitations

  3. Indexes
    - Add index on token for fast lookup
    - Add index on organization_id for filtering
*/

CREATE TABLE IF NOT EXISTS invitations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    email varchar(255) NOT NULL,
    role varchar(50) DEFAULT 'user',
    scope varchar(50) DEFAULT 'assigned',
    department varchar(100),
    token varchar(255) UNIQUE NOT NULL,
    status varchar(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    invited_by uuid REFERENCES profiles(id),
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Organization members can view invitations
CREATE POLICY "Organization members can view invitations" ON invitations
    FOR SELECT 
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy: Admins can create invitations
CREATE POLICY "Admins can create invitations" ON invitations
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND organization_id = invitations.organization_id
            AND role IN ('super_admin', 'admin')
        )
    );

-- Policy: Admins can update invitations
CREATE POLICY "Admins can update invitations" ON invitations
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND organization_id = invitations.organization_id
            AND role IN ('super_admin', 'admin')
        )
    );

-- Policy: Admins can delete invitations
CREATE POLICY "Admins can delete invitations" ON invitations
    FOR DELETE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND organization_id = invitations.organization_id
            AND role IN ('super_admin', 'admin')
        )
    );

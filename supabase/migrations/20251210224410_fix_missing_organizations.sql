/*
  # Fix Missing Organizations for Existing Users

  1. Problem
    - Some users have null organization_id
    - This prevents them from creating licenses, hardware, or contracts
    - All asset tables require organization_id

  2. Solution
    - Create default organizations for users without one
    - Update profiles to link to the new organizations
    - Set appropriate roles and permissions

  3. Security
    - Each user gets their own organization
    - Maintains data isolation
    - RLS policies will work correctly after this fix
*/

-- Create organizations for users without one
INSERT INTO organizations (name, account_type, subscription_plan, subscription_status, max_users, max_assets)
SELECT 
  COALESCE(p.full_name || '''s Organization', 'Organization ' || p.id::text),
  'end_user',
  'free',
  'active',
  1,
  50
FROM profiles p
WHERE p.organization_id IS NULL
ON CONFLICT DO NOTHING;

-- Update profiles to link to their new organizations
DO $$
DECLARE
  profile_record RECORD;
  new_org_id uuid;
BEGIN
  FOR profile_record IN 
    SELECT id, email, full_name FROM profiles WHERE organization_id IS NULL
  LOOP
    -- Get or create organization for this user
    SELECT id INTO new_org_id
    FROM organizations
    WHERE name = COALESCE(profile_record.full_name || '''s Organization', 'Organization ' || profile_record.id::text)
    LIMIT 1;
    
    -- If no organization found, create one
    IF new_org_id IS NULL THEN
      INSERT INTO organizations (name, account_type, subscription_plan, subscription_status, max_users, max_assets)
      VALUES (
        COALESCE(profile_record.full_name || '''s Organization', 'Organization ' || profile_record.id::text),
        'end_user',
        'free',
        'active',
        1,
        50
      )
      RETURNING id INTO new_org_id;
    END IF;
    
    -- Update the profile with the organization_id and set as admin
    UPDATE profiles
    SET 
      organization_id = new_org_id,
      role = 'admin',
      scope = 'all',
      updated_at = now()
    WHERE id = profile_record.id;
  END LOOP;
END $$;

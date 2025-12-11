/*
  # Add Missing Foreign Key Indexes

  1. Problem
    - Several foreign keys lack covering indexes
    - This causes suboptimal query performance on JOIN operations
    
  2. Changes
    - Add index on activity_log.organization_id
    - Add index on contracts.organization_id
    - Add index on platform_admins.user_id
    
  3. Performance Impact
    - Improves JOIN performance
    - Speeds up foreign key constraint checks
    - Better query optimization for WHERE clauses on these columns
*/

-- Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_activity_log_organization_id 
  ON activity_log(organization_id);

CREATE INDEX IF NOT EXISTS idx_contracts_organization_id 
  ON contracts(organization_id);

CREATE INDEX IF NOT EXISTS idx_platform_admins_user_id 
  ON platform_admins(user_id);

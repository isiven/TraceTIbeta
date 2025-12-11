/*
  # Remove Unused Indexes

  1. Analysis
    - 22 indexes reported as unused
    - Some are necessary for foreign key performance (kept)
    - Others are redundant or for rarely-queried columns (removed)
    
  2. Indexes to KEEP (necessary for foreign keys and common queries)
    - idx_activity_log_organization_id (FK performance)
    - idx_contracts_organization_id (FK performance)
    - idx_platform_admins_user_id (FK performance)
    - idx_alert_rules_organization_id (FK performance)
    - idx_licenses_client_id (FK performance)
    - idx_hardware_client_id (FK performance)
    - idx_contracts_client_id (FK performance)
    - idx_support_contracts_client_id (FK performance)
    
  3. Indexes to REMOVE (audit/logging columns, rarely queried)
    - assigned_to columns (audit trail, rarely filtered)
    - created_by columns (audit trail, rarely filtered)
    - invited_by columns (audit trail, rarely filtered)
    - email_log indexes (logging table, analytics not primary use)
    - owner_id (rarely queried directly)
    - activity_log user_id (rarely queried by user)
    
  4. Impact
    - Reduces storage overhead
    - Improves INSERT/UPDATE/DELETE performance
    - Maintains query performance for critical paths
*/

-- Remove audit trail indexes (rarely used in queries)
DROP INDEX IF EXISTS idx_clients_assigned_to;
DROP INDEX IF EXISTS idx_contracts_assigned_to;
DROP INDEX IF EXISTS idx_contracts_created_by;
DROP INDEX IF EXISTS idx_hardware_assigned_to;
DROP INDEX IF EXISTS idx_hardware_created_by;
DROP INDEX IF EXISTS idx_licenses_created_by;
DROP INDEX IF EXISTS idx_invitations_invited_by;
DROP INDEX IF EXISTS idx_platform_admins_invited_by;

-- Remove logging table indexes (email_log is for audit, not frequent queries)
DROP INDEX IF EXISTS idx_email_log_user_id;
DROP INDEX IF EXISTS idx_email_log_status;
DROP INDEX IF EXISTS idx_email_log_created_at;
DROP INDEX IF EXISTS idx_email_log_template;

-- Remove rarely-queried organizational indexes
DROP INDEX IF EXISTS idx_organizations_owner_id;
DROP INDEX IF EXISTS idx_activity_log_user_id;

-- Note: The following indexes are KEPT for foreign key performance:
-- - idx_activity_log_organization_id
-- - idx_contracts_organization_id
-- - idx_platform_admins_user_id
-- - idx_alert_rules_organization_id
-- - idx_licenses_client_id
-- - idx_hardware_client_id
-- - idx_contracts_client_id
-- - idx_support_contracts_client_id

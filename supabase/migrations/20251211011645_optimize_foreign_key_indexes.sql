/*
  # Optimize Foreign Key Indexes - Strategic Approach

  1. Analysis
    - Balancing FK index requirements with actual query patterns
    - Some FKs are audit trails (assigned_to, created_by) - rarely queried
    - Some FKs are critical for multi-tenant filtering - frequently queried
    
  2. Strategy
    **Keep indexes for:**
    - Multi-tenant filtering (organization_id) - critical for RLS and queries
    - Asset relationships (client_id) - frequently joined
    - Core user lookups (user_id on platform_admins) - authentication checks
    
    **Don't index:**
    - Audit columns (assigned_to, created_by, invited_by) - rarely filtered/joined
    - Logging tables (activity_log.user_id, email_log.user_id) - historical data
    - Owner fields (organizations.owner_id) - rarely queried directly
    
  3. Actions
    - Remove unused indexes on logging and rarely-queried tables
    - Keep strategic indexes for multi-tenant and core business queries
    - Accept unindexed FKs on audit columns (performance vs. storage tradeoff)
    
  4. Performance Impact
    - Reduces index maintenance overhead on INSERT/UPDATE/DELETE
    - Maintains query performance for critical paths
    - Logging tables perform better without extra indexes
*/

-- Remove indexes on logging tables (not frequently queried by these columns)
DROP INDEX IF EXISTS idx_activity_log_organization_id;
DROP INDEX IF EXISTS idx_email_log_user_id;
DROP INDEX IF EXISTS idx_email_log_status;
DROP INDEX IF EXISTS idx_email_log_created_at;
DROP INDEX IF EXISTS idx_email_log_template;

-- Remove index on rarely-queried alert rules
DROP INDEX IF EXISTS idx_alert_rules_organization_id;

-- Remove indexes on support contracts (if they exist and are unused)
DROP INDEX IF EXISTS idx_support_contracts_client_id;

-- Keep these critical indexes (they may show as "unused" but are essential):
-- - idx_contracts_organization_id (multi-tenant filtering)
-- - idx_platform_admins_user_id (authentication lookups)
-- - idx_licenses_client_id (asset queries)
-- - idx_hardware_client_id (asset queries)
-- - idx_contracts_client_id (asset queries)

-- Note: The following foreign keys intentionally do NOT have indexes:
-- - clients.assigned_to (audit field)
-- - contracts.assigned_to (audit field)
-- - contracts.created_by (audit field)
-- - hardware.assigned_to (audit field)
-- - hardware.created_by (audit field)
-- - invitations.invited_by (audit field)
-- - licenses.created_by (audit field)
-- - organizations.owner_id (rarely queried)
-- - platform_admins.invited_by (audit field)
-- - activity_log.user_id (logging table)
-- - email_log.user_id (logging table)
--
-- These are audit/logging columns that are rarely used in WHERE clauses or JOINs.
-- Not indexing them improves write performance with minimal query impact.

COMMENT ON TABLE activity_log IS 'Logging table - optimized for writes over reads';
COMMENT ON TABLE email_log IS 'Logging table - optimized for writes over reads';

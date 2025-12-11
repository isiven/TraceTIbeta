/*
  # Fix Function Search Paths

  This migration fixes the "Function Search Path Mutable" security issue by setting
  an explicit search_path for all functions.

  ## Security Issue
    - Functions with a role mutable search_path can be vulnerable to schema attacks
    - Setting an explicit search_path prevents malicious actors from manipulating
      function behavior by creating objects in different schemas

  ## Solution
    - Set search_path to 'public' for all affected functions
    - This ensures functions only reference objects in the public schema
*/

-- Set search_path for all functions with correct signatures
ALTER FUNCTION update_updated_at_column() SET search_path = public;
ALTER FUNCTION is_platform_admin(uuid) SET search_path = public;
ALTER FUNCTION get_platform_admin_role(uuid) SET search_path = public;
ALTER FUNCTION accept_invitation(text, uuid) SET search_path = public;
ALTER FUNCTION create_organization_with_admin(text, uuid, text, text, text) SET search_path = public;
ALTER FUNCTION promote_to_super_admin(text) SET search_path = public;
ALTER FUNCTION get_role_info() SET search_path = public;
ALTER FUNCTION check_user_permissions() SET search_path = public;
ALTER FUNCTION update_asset_status() SET search_path = public;
ALTER FUNCTION get_user_organization() SET search_path = public;
ALTER FUNCTION sync_license_name() SET search_path = public;
ALTER FUNCTION generate_hardware_name() SET search_path = public;
ALTER FUNCTION is_user_admin() SET search_path = public;
ALTER FUNCTION get_user_role() SET search_path = public;
ALTER FUNCTION get_user_scope() SET search_path = public;
ALTER FUNCTION user_has_role(text[]) SET search_path = public;
ALTER FUNCTION log_platform_activity(uuid, character varying, character varying, character varying, character varying, uuid, character varying, jsonb, character varying) SET search_path = public;
ALTER FUNCTION sync_platform_admin_profile() SET search_path = public;
ALTER FUNCTION handle_new_user() SET search_path = public;

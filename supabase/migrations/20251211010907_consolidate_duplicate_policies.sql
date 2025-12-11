/*
  # Consolidate Duplicate Permissive Policies

  1. Problem
    - Table alert_rules has multiple permissive SELECT policies
    - "Manage alert rules" (ALL) and "View alert rules" (SELECT)
    - Having multiple permissive policies can cause confusion and maintenance issues
    
  2. Solution
    - Remove the redundant "View alert rules" policy
    - Keep "Manage alert rules" which already covers SELECT via ALL
    
  3. Security Impact
    - No change in access control
    - Simplifies policy management
*/

-- Remove the redundant SELECT policy since ALL already covers it
DROP POLICY IF EXISTS "View alert rules" ON alert_rules;

-- The "Manage alert rules" policy with ALL command already handles SELECT
-- No need to recreate it

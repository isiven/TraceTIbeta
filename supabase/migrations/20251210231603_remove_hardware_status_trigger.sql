/*
  # Remove automatic status updates for hardware table

  1. Problem
    - Hardware status should be manually managed (active, in_use, maintenance, retired)
    - The update_asset_status trigger is trying to auto-update hardware status
    - This conflicts with the manual status management needed for hardware

  2. Solution
    - Remove the update_hardware_status trigger
    - Hardware status will be set manually by users
    - Licenses and support_contracts will continue to use automatic status updates

  3. Changes
    - Drop the update_hardware_status trigger
    - Keep the generate_hardware_name_trigger and update_hardware_updated_at triggers
*/

-- Drop the automatic status update trigger for hardware
DROP TRIGGER IF EXISTS update_hardware_status ON hardware;

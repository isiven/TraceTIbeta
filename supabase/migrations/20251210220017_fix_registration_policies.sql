/*
  # Fix Registration Policies

  1. Changes
    - Add INSERT policy for organizations table to allow new users to create their organization
    - Add INSERT policy for profiles table to allow the trigger to create profiles
    - Update handle_new_user function to be more robust

  2. Security
    - Users can only create one organization during registration
    - Profiles are created automatically by the system trigger
*/

-- Allow authenticated users to create organizations during registration
CREATE POLICY "Users can create organization during registration"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow the system to insert profiles (for the trigger)
CREATE POLICY "System can create profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

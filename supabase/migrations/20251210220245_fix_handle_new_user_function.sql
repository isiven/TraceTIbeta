/*
  # Fix handle_new_user Function

  1. Changes
    - Update handle_new_user function to bypass RLS since it runs as SECURITY DEFINER
    - This allows the trigger to create profiles successfully during user registration

  2. Security
    - Function is secure as it only runs during user creation
    - RLS is bypassed only within the function scope
*/

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "System can create profiles" ON profiles;

-- Update the handle_new_user function to set local configuration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Temporarily disable RLS for this function execution
  SET LOCAL row_security = off;
  
  -- Insert basic profile for new user
  INSERT INTO profiles (id, email, full_name, auth_provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
  )
  ON CONFLICT (id) DO UPDATE SET
    last_login = NOW(),
    auth_provider = COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  
  RETURN NEW;
END;
$$;

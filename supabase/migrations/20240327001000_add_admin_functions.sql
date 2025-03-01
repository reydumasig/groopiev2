-- Create function to update user role
CREATE OR REPLACE FUNCTION update_user_role(user_id UUID, new_role TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update auth.users
  UPDATE auth.users
  SET role = new_role
  WHERE id = user_id;

  -- Update profiles
  UPDATE profiles
  SET role = new_role,
      updated_at = now()
  WHERE id = user_id;
END;
$$; 
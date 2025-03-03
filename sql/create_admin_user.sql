-- First, create the user in auth.users
-- Note: Password will be handled by Supabase Auth UI, this is just for reference
INSERT INTO auth.users (
  email,
  raw_user_meta_data,
  created_at
) VALUES (
  'tech@joingroopie.com',
  jsonb_build_object(
    'full_name', 'Rey Dumasig'
  ),
  now()
)
ON CONFLICT (email) DO NOTHING;

-- Then update the profile to be an admin
UPDATE public.profiles
SET 
  role = 'admin',
  full_name = 'Rey Dumasig',
  updated_at = now()
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'tech@joingroopie.com'
); 
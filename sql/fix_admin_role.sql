-- Update the profile role
UPDATE public.profiles
SET 
  role = 'admin',
  updated_at = now()
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'tech@joingroopie.com'
);

-- Update the user metadata
UPDATE auth.users
SET 
  raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', 'admin')
WHERE email = 'tech@joingroopie.com'; 
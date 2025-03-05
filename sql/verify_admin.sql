-- First verify if the user exists and their role
SELECT p.id, p.role, p.full_name, u.email
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'tech@joingroopie.com';

-- If not admin, update to admin role
UPDATE public.profiles
SET 
  role = 'admin',
  updated_at = now()
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'tech@joingroopie.com'
)
AND role != 'admin'
RETURNING id, role; 
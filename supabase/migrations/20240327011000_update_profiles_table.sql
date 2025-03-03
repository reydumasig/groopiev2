-- Update profiles table with new fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS role text DEFAULT 'subscriber',
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Drop and recreate the role constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS role_check;
ALTER TABLE public.profiles ADD CONSTRAINT role_check CHECK (role IN ('subscriber', 'creator', 'admin'));

-- Update profiles for existing users
UPDATE public.profiles p
SET 
  full_name = u.raw_user_meta_data->>'full_name',
  role = COALESCE(NULLIF(u.raw_user_meta_data->>'role', ''), 'subscriber'),
  created_at = u.created_at,
  updated_at = u.updated_at
FROM auth.users u
WHERE p.id = u.id;

-- Add RLS policies if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" ON public.profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role; 
-- Drop existing role constraint if it exists
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS role_check;

-- Add standardized role constraint
ALTER TABLE public.profiles 
  ADD CONSTRAINT role_check 
  CHECK (role IN ('subscriber', 'creator', 'admin'));

-- Set default role to 'subscriber'
ALTER TABLE public.profiles 
  ALTER COLUMN role SET DEFAULT 'subscriber';

-- Update any existing 'user' roles to 'subscriber'
UPDATE public.profiles 
SET role = 'subscriber' 
WHERE role = 'user';

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;

-- Create standardized policies
CREATE POLICY "Enable read access for own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Enable insert for own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Update or recreate the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'subscriber',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY; 
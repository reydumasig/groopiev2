-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a more robust trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    _now timestamp with time zone;
    _role text;
BEGIN
    -- Get current timestamp
    _now := now();
    
    -- Set default role
    _role := 'subscriber';

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
            _role,
            _now,
            _now
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user: % %', SQLERRM, NEW;
        RETURN NEW;
    END;

    RETURN NEW;
END;
$$;

-- Ensure the function has proper ownership and permissions
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Recreate trigger with proper permissions
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Ensure profiles table has proper permissions
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Add insert policy for service role
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
    ON public.profiles
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Add policy for trigger function
DROP POLICY IF EXISTS "Trigger can insert profiles" ON public.profiles;
CREATE POLICY "Trigger can insert profiles"
    ON public.profiles
    FOR INSERT
    TO postgres
    WITH CHECK (true); 
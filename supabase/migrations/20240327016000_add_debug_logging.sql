-- Create debug logging function
CREATE OR REPLACE FUNCTION public.log_debug(
    log_type text,
    message text,
    details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE LOG 'DEBUG % - %: %', log_type, message, details;
END;
$$;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a more robust trigger function with detailed logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    _now timestamp with time zone;
    _role text;
    _debug_info jsonb;
BEGIN
    -- Log trigger start
    _debug_info := jsonb_build_object(
        'user_id', NEW.id,
        'metadata', NEW.raw_user_meta_data,
        'trigger_pid', pg_backend_pid(),
        'transaction_id', txid_current()
    );
    PERFORM log_debug('TRIGGER_START', 'handle_new_user triggered', _debug_info);

    -- Get current timestamp
    _now := now();
    
    -- Set default role
    _role := 'subscriber';

    -- Log pre-insert state
    _debug_info := jsonb_build_object(
        'user_id', NEW.id,
        'full_name', COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'role', _role,
        'timestamp', _now
    );
    PERFORM log_debug('PRE_INSERT', 'Preparing to insert profile', _debug_info);

    BEGIN
        -- Check if auth user exists
        IF NOT EXISTS (
            SELECT 1 FROM auth.users WHERE id = NEW.id
        ) THEN
            PERFORM log_debug('ERROR', 'Auth user not found', jsonb_build_object('user_id', NEW.id));
            RETURN NEW;
        END IF;

        -- Attempt profile insert
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

        -- Log successful insert
        PERFORM log_debug('SUCCESS', 'Profile created successfully', _debug_info);

    EXCEPTION WHEN OTHERS THEN
        -- Log detailed error
        _debug_info := jsonb_build_object(
            'error', SQLERRM,
            'error_detail', SQLSTATE,
            'user_id', NEW.id,
            'context', pg_context_info()
        );
        PERFORM log_debug('ERROR', 'Profile creation failed', _debug_info);
        RAISE LOG 'Error in handle_new_user: % %', SQLERRM, _debug_info;
        RETURN NEW;
    END;

    RETURN NEW;
END;
$$;

-- Recreate trigger with proper permissions
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.log_debug(text, text, jsonb) TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres; 
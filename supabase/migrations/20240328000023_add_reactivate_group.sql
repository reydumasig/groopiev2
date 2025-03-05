-- Description: Add reactivate_group function for admin use
-- Version: v2.1.5

-- Create reactivate group function
CREATE OR REPLACE FUNCTION public.reactivate_group(group_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    is_admin boolean;
BEGIN
    -- Check if user is admin
    SELECT (role = 'admin') INTO is_admin
    FROM profiles
    WHERE id = auth.uid();

    IF NOT is_admin THEN
        RAISE EXCEPTION 'Only admins can reactivate groups';
    END IF;

    -- Update group status
    UPDATE public.groups
    SET 
        status = 'active',
        updated_at = NOW()
    WHERE id = group_id
    AND status = 'inactive';

    RETURN FOUND;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.reactivate_group(uuid) TO authenticated; 
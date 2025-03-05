-- Create function to update user role on group approval
CREATE OR REPLACE FUNCTION public.update_creator_role()
RETURNS TRIGGER AS $$
BEGIN
    -- If the group status is being changed to 'active'
    IF NEW.status = 'active' AND OLD.status = 'pending' THEN
        -- Update the creator's role to 'creator'
        UPDATE public.profiles
        SET role = 'creator'
        WHERE id = NEW.creator_id
        AND role = 'subscriber';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires when a group is updated
DROP TRIGGER IF EXISTS on_group_approval ON public.groups;
CREATE TRIGGER on_group_approval
    AFTER UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.update_creator_role();

-- Update approve_group function to ensure it only works for pending groups
CREATE OR REPLACE FUNCTION public.approve_group(group_id uuid)
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
        RAISE EXCEPTION 'Only admins can approve groups';
    END IF;

    -- Update group status
    UPDATE public.groups
    SET 
        status = 'active',
        updated_at = NOW()
    WHERE id = group_id
    AND status = 'pending';

    RETURN FOUND;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.approve_group(uuid) TO authenticated; 
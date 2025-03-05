-- Drop existing policies
DROP POLICY IF EXISTS "unified_groups_access" ON public.groups;
DROP POLICY IF EXISTS "Groups can be updated by admins" ON public.groups;

-- Create separate policies for different operations
CREATE POLICY "Groups viewable by creator" ON public.groups
    FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Groups viewable by members" ON public.groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_members gm
            WHERE gm.group_id = id 
            AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "Groups viewable by admins" ON public.groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Groups updatable by admins" ON public.groups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create function for group approval
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
GRANT SELECT ON public.groups TO authenticated;
GRANT UPDATE ON public.groups TO authenticated; 
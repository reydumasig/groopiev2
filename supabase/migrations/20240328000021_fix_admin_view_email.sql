-- Drop existing admin-related objects
DROP VIEW IF EXISTS admin_group_details;
DROP FUNCTION IF EXISTS public.suspend_group(uuid);
DROP FUNCTION IF EXISTS public.update_group_slack(uuid, text);

-- Create admin group details view with security check in the view definition
CREATE OR REPLACE VIEW admin_group_details AS
SELECT 
    g.*,
    p.full_name as creator_name,
    p.avatar_url as creator_avatar,
    u.email as creator_email,
    COUNT(DISTINCT gm.user_id) as member_count
FROM public.groups g
LEFT JOIN public.profiles p ON g.creator_id = p.id
LEFT JOIN auth.users u ON g.creator_id = u.id
LEFT JOIN public.group_members gm ON g.id = gm.group_id
WHERE EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
)
GROUP BY g.id, p.id, p.full_name, p.avatar_url, u.email;

-- Create suspend group function
CREATE OR REPLACE FUNCTION public.suspend_group(group_id uuid)
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
        RAISE EXCEPTION 'Only admins can suspend groups';
    END IF;

    -- Update group status
    UPDATE public.groups
    SET 
        status = 'inactive',
        updated_at = NOW()
    WHERE id = group_id;

    RETURN FOUND;
END;
$$;

-- Create update slack URL function
CREATE OR REPLACE FUNCTION public.update_group_slack(group_id uuid, slack_url text)
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
        RAISE EXCEPTION 'Only admins can update group Slack settings';
    END IF;

    -- Update slack URL
    UPDATE public.groups
    SET 
        slack_channel_url = slack_url,
        updated_at = NOW()
    WHERE id = group_id;

    RETURN FOUND;
END;
$$;

-- Update groups policies to allow full admin access
DROP POLICY IF EXISTS "Groups manageable by admins" ON public.groups;
CREATE POLICY "Groups manageable by admins" ON public.groups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT SELECT ON admin_group_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.suspend_group(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_group_slack(uuid, text) TO authenticated; 
-- Drop existing policies and functions
DROP POLICY IF EXISTS "unified_groups_access" ON public.groups;
DROP FUNCTION IF EXISTS public.check_group_access(groups);
DROP FUNCTION IF EXISTS public.is_admin_simple(uuid);

-- Create admin check function
CREATE OR REPLACE FUNCTION public.is_admin_simple(check_user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = check_user_id 
        AND role = 'admin'
    );
END;
$$;

-- Create simple policy
CREATE POLICY "unified_groups_access" ON public.groups
    FOR ALL
    USING (
        public.is_admin_simple(auth.uid())
        OR creator_id = auth.uid()
        OR status = 'active'
        OR EXISTS (
            SELECT 1 
            FROM group_members gm
            WHERE gm.group_id = groups.id 
            AND gm.user_id = auth.uid()
        )
    );

-- Recreate the group_details view
DROP VIEW IF EXISTS public.group_details;
CREATE OR REPLACE VIEW public.group_details AS
SELECT 
    g.*,
    p.full_name as creator_name,
    p.avatar_url as creator_avatar,
    COUNT(DISTINCT gm.user_id) as member_count
FROM public.groups g
LEFT JOIN public.profiles p ON g.creator_id = p.id
LEFT JOIN public.group_members gm ON g.id = gm.group_id
GROUP BY g.id, p.id;

-- Ensure RLS is enabled
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_admin_simple(uuid) TO authenticated;
GRANT SELECT ON public.groups TO authenticated;
GRANT SELECT ON public.group_details TO authenticated; 
-- Drop existing policies
DROP POLICY IF EXISTS "Groups viewable by creator" ON public.groups;
DROP POLICY IF EXISTS "Groups viewable by members" ON public.groups;
DROP POLICY IF EXISTS "Groups viewable by admins" ON public.groups;
DROP POLICY IF EXISTS "groups_base_policy" ON public.groups;
DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- Create a secure view for admin access that bypasses RLS
DROP VIEW IF EXISTS admin_access;
CREATE VIEW admin_access WITH (security_barrier) AS
SELECT id 
FROM public.profiles 
WHERE role = 'admin';

-- Grant access to the view
GRANT SELECT ON admin_access TO authenticated;

-- Create the base policy for groups
CREATE POLICY "Groups access policy" ON public.groups
    FOR SELECT 
    USING (
        -- Admin access through secure view
        EXISTS (SELECT 1 FROM admin_access WHERE id = auth.uid())
        OR
        -- Creator access
        creator_id = auth.uid()
        OR
        -- Member access
        EXISTS (
            SELECT 1 
            FROM group_members 
            WHERE group_members.group_id = id 
            AND group_members.user_id = auth.uid()
        )
        OR
        -- Active groups are visible
        status = 'active'
    );

-- Ensure RLS is enabled
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON public.groups TO authenticated; 
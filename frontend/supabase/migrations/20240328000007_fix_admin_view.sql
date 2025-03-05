-- Drop existing policies and functions
DROP POLICY IF EXISTS "Groups viewable by creator" ON public.groups;
DROP POLICY IF EXISTS "Groups viewable by members" ON public.groups;
DROP POLICY IF EXISTS "Groups viewable by admins" ON public.groups;
DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- Create admin view
CREATE OR REPLACE VIEW admin_users AS
SELECT id 
FROM public.profiles 
WHERE role = 'admin';

-- Create a single, comprehensive policy for groups
CREATE POLICY "groups_access_policy" ON public.groups
    FOR ALL
    USING (
        creator_id = auth.uid() 
        OR EXISTS (
            SELECT 1 
            FROM group_members 
            WHERE group_members.group_id = id 
            AND group_members.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 
            FROM admin_users 
            WHERE admin_users.id = auth.uid()
        )
    );

-- Ensure RLS is enabled
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_groups_status ON public.groups(status); 
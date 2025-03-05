-- Drop all existing policies on groups
DROP POLICY IF EXISTS "Anyone can view active groups" ON public.groups;
DROP POLICY IF EXISTS "Creators can manage their groups" ON public.groups;
DROP POLICY IF EXISTS "groups_access_policy" ON public.groups;

-- Drop and recreate admin_users view without RLS dependency
DROP VIEW IF EXISTS admin_users;
CREATE VIEW admin_users AS
SELECT id 
FROM auth.users
WHERE id IN (
    SELECT id 
    FROM profiles 
    WHERE role = 'admin'
);

-- Create a single unified policy for groups
CREATE POLICY "unified_groups_policy" ON public.groups
    FOR ALL
    USING (
        status = 'active'
        OR creator_id = auth.uid()
        OR EXISTS (
            SELECT 1 
            FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.id IN (SELECT id FROM admin_users)
        )
    );

-- Ensure RLS is enabled
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Create necessary indexes
CREATE INDEX IF NOT EXISTS idx_groups_creator_id ON public.groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_groups_status ON public.groups(status);

-- Grant necessary permissions
GRANT SELECT ON admin_users TO authenticated;
GRANT SELECT ON groups TO authenticated; 
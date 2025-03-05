-- Drop all existing policies and functions
DROP POLICY IF EXISTS "groups_visibility_policy" ON public.groups;
DROP POLICY IF EXISTS "unified_groups_policy" ON public.groups;
DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- Create materialized view for admin users
DROP MATERIALIZED VIEW IF EXISTS admin_users;
CREATE MATERIALIZED VIEW admin_users AS
SELECT id FROM profiles WHERE role = 'admin';

CREATE UNIQUE INDEX ON admin_users (id);

-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_admin_users()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY admin_users;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh materialized view
DROP TRIGGER IF EXISTS refresh_admin_users_trigger ON profiles;
CREATE TRIGGER refresh_admin_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_admin_users();

-- Initial refresh
REFRESH MATERIALIZED VIEW admin_users;

-- Simple policy for groups
CREATE POLICY "groups_base_policy" ON public.groups
    FOR ALL
    USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
        OR (status = 'active')
        OR (creator_id = auth.uid())
        OR (
            id IN (
                SELECT group_id 
                FROM group_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Ensure RLS is enabled
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON admin_users TO authenticated;
GRANT SELECT ON groups TO authenticated; 
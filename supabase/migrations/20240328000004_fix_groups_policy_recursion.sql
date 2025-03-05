-- Drop all existing policies on groups to start fresh
DROP POLICY IF EXISTS "Groups are viewable by creator and members" ON public.groups;

-- Create a materialized view to cache admin users for better performance
CREATE MATERIALIZED VIEW IF NOT EXISTS admin_users AS
SELECT id FROM profiles WHERE role = 'admin';

CREATE INDEX IF NOT EXISTS idx_admin_users_id ON admin_users(id);

-- Create separate policies for different access patterns
CREATE POLICY "Groups viewable by creators" ON public.groups
    FOR SELECT
    USING (creator_id = auth.uid());

CREATE POLICY "Groups viewable by members" ON public.groups
    FOR SELECT
    USING (
        id IN (
            SELECT group_id 
            FROM group_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Groups viewable by admins" ON public.groups
    FOR SELECT
    USING (
        auth.uid() IN (SELECT id FROM admin_users)
    );

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW admin_users;

-- Create a function to refresh admin users view
CREATE OR REPLACE FUNCTION refresh_admin_users()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY admin_users;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh admin users view when profiles are updated
DROP TRIGGER IF EXISTS refresh_admin_users_trigger ON profiles;
CREATE TRIGGER refresh_admin_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_admin_users(); 
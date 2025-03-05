-- Drop all existing policies on groups
DROP POLICY IF EXISTS "Groups are viewable by creator and members" ON public.groups;
DROP POLICY IF EXISTS "Groups viewable by creators" ON public.groups;
DROP POLICY IF EXISTS "Groups viewable by members" ON public.groups;
DROP POLICY IF EXISTS "Groups viewable by admins" ON public.groups;

-- Drop materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS admin_users;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS refresh_admin_users_trigger ON profiles;

-- Drop function if it exists
DROP FUNCTION IF EXISTS refresh_admin_users();

-- Create the exact policy as documented in DATABASE_SCHEMA.md
CREATE POLICY "Groups are viewable by creator and members" ON public.groups
    FOR SELECT
    USING (
        creator_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = id 
            AND group_members.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Ensure RLS is enabled
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Verify indexes as per schema documentation
CREATE INDEX IF NOT EXISTS idx_groups_creator_id ON public.groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_groups_status ON public.groups(status); 
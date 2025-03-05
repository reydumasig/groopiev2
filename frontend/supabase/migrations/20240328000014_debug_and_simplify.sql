-- Drop ALL existing policies
DROP POLICY IF EXISTS "Groups viewable by creator" ON public.groups;
DROP POLICY IF EXISTS "Groups viewable by members" ON public.groups;
DROP POLICY IF EXISTS "Groups viewable by admins" ON public.groups;
DROP POLICY IF EXISTS "groups_base_policy" ON public.groups;
DROP POLICY IF EXISTS "Groups access policy" ON public.groups;
DROP POLICY IF EXISTS "Anyone can view active groups" ON public.groups;
DROP POLICY IF EXISTS "Owners can update their groups" ON public.groups;
DROP POLICY IF EXISTS "Owners can delete their groups" ON public.groups;
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;

-- Drop existing functions and views
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP VIEW IF EXISTS admin_access;
DROP VIEW IF EXISTS group_details;

-- Create debug function
CREATE OR REPLACE FUNCTION public.debug_log() RETURNS trigger AS $$
BEGIN
    RAISE NOTICE 'RLS Debug - Table: %, Operation: %, User: %', TG_TABLE_NAME, TG_OP, auth.uid();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create debug trigger
DROP TRIGGER IF EXISTS debug_groups_rls ON public.groups;
CREATE TRIGGER debug_groups_rls
    AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.groups
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.debug_log();

-- Create simple admin check function
CREATE OR REPLACE FUNCTION public.is_admin_simple(user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    RETURN (
        SELECT role = 'admin'
        FROM profiles
        WHERE id = user_id
    );
END;
$$;

-- Create single, simple policy
CREATE POLICY "unified_groups_access" ON public.groups
    FOR ALL
    USING (
        public.is_admin_simple(auth.uid())
        OR creator_id = auth.uid()
        OR status = 'active'
        OR EXISTS (
            SELECT 1 
            FROM group_members 
            WHERE group_id = id 
            AND user_id = auth.uid()
        )
    );

-- Ensure RLS is enabled
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_admin_simple(uuid) TO authenticated;
GRANT SELECT ON public.groups TO authenticated; 
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
    RAISE NOTICE 'RLS Debug - Operation: %, User: %', TG_OP, auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create debug triggers for each operation
DROP TRIGGER IF EXISTS debug_groups_select ON public.groups;
DROP TRIGGER IF EXISTS debug_groups_insert ON public.groups;
DROP TRIGGER IF EXISTS debug_groups_update ON public.groups;
DROP TRIGGER IF EXISTS debug_groups_delete ON public.groups;

CREATE TRIGGER debug_groups_select
    BEFORE SELECT ON public.groups
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.debug_log();

CREATE TRIGGER debug_groups_insert
    BEFORE INSERT ON public.groups
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.debug_log();

CREATE TRIGGER debug_groups_update
    BEFORE UPDATE ON public.groups
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.debug_log();

CREATE TRIGGER debug_groups_delete
    BEFORE DELETE ON public.groups
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.debug_log();

-- Create simple admin check function
CREATE OR REPLACE FUNCTION public.is_admin_simple(user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    is_admin boolean;
BEGIN
    -- Direct query to check admin status
    SELECT (role = 'admin')
    INTO is_admin
    FROM profiles
    WHERE id = user_id;
    
    -- Log the check
    RAISE NOTICE 'Admin check for user %: %', user_id, is_admin;
    
    RETURN COALESCE(is_admin, false);
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
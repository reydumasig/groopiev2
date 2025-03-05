-- Drop existing policies
DROP POLICY IF EXISTS "Groups viewable by creator" ON public.groups;
DROP POLICY IF EXISTS "Groups viewable by members" ON public.groups;
DROP POLICY IF EXISTS "Groups viewable by admins" ON public.groups;
DROP POLICY IF EXISTS "groups_base_policy" ON public.groups;

-- Drop existing admin function
DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- Create admin check function with exact naming from docs
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    -- Direct query without RLS to avoid recursion
    RETURN (
        SELECT EXISTS (
            SELECT 1 
            FROM profiles 
            WHERE id = user_id 
            AND role = 'admin'
        )
    );
END;
$$;

-- Create policies with exact names from documentation
CREATE POLICY "Groups viewable by creator" ON public.groups
    FOR SELECT 
    USING (creator_id = auth.uid());

CREATE POLICY "Groups viewable by members" ON public.groups
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 
            FROM group_members 
            WHERE group_members.group_id = id 
            AND group_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Groups viewable by admins" ON public.groups
    FOR SELECT 
    USING (
        -- Use the secure function for admin check
        public.is_admin(auth.uid())
        OR
        -- Allow viewing pending groups specifically for admins
        (status = 'pending' AND public.is_admin(auth.uid()))
    );

-- Ensure RLS is enabled
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT SELECT ON public.groups TO authenticated; 
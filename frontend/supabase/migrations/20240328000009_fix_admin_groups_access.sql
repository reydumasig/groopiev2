-- Drop existing policies
DROP POLICY IF EXISTS "unified_groups_policy" ON public.groups;

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role = 'admin'
  );
$$;

-- Create a policy that allows:
-- 1. Admins to see all groups
-- 2. Creators to see their own groups
-- 3. Members to see groups they're part of
-- 4. Active groups to be visible to all
CREATE POLICY "groups_visibility_policy" ON public.groups
    FOR SELECT
    USING (
        public.is_admin(auth.uid())
        OR creator_id = auth.uid()
        OR EXISTS (
            SELECT 1 
            FROM group_members 
            WHERE group_members.group_id = id 
            AND group_members.user_id = auth.uid()
        )
        OR (status = 'active')
    );

-- Ensure RLS is enabled
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT SELECT ON public.groups TO authenticated; 
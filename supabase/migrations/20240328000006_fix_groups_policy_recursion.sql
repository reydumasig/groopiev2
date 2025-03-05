-- Drop existing policy
DROP POLICY IF EXISTS "Groups are viewable by creator and members" ON public.groups;

-- Create separate policies for different access patterns
CREATE POLICY "Groups viewable by creator" ON public.groups
    FOR SELECT
    USING (creator_id = auth.uid());

CREATE POLICY "Groups viewable by members" ON public.groups
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = id 
            AND group_members.user_id = auth.uid()
        )
    );

-- Create a secure function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin policy using the secure function
CREATE POLICY "Groups viewable by admins" ON public.groups
    FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Ensure RLS is enabled
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY; 
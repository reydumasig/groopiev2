-- Drop existing policies
DROP POLICY IF EXISTS "Groups viewable by creator" ON public.groups;
DROP POLICY IF EXISTS "Groups viewable by members" ON public.groups;
DROP POLICY IF EXISTS "Groups viewable by admins" ON public.groups;
DROP POLICY IF EXISTS "Groups updatable by admins" ON public.groups;
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;

-- Create comprehensive policies for groups table
CREATE POLICY "Enable insert for authenticated users"
ON public.groups FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Groups viewable by creator"
ON public.groups FOR SELECT
USING (creator_id = auth.uid());

CREATE POLICY "Groups viewable by members"
ON public.groups FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = id
        AND group_members.user_id = auth.uid()
    )
);

CREATE POLICY "Groups viewable by admins"
ON public.groups FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

CREATE POLICY "Groups updatable by admins"
ON public.groups FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Ensure RLS is enabled
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.groups TO authenticated; 
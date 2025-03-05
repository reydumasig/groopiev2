-- Drop existing policy
DROP POLICY IF EXISTS "Groups are viewable by creator and members" ON public.groups;

-- Create simplified policy to avoid recursion
CREATE POLICY "Groups are viewable by creator and members" ON public.groups
    FOR SELECT
    USING (
        creator_id = auth.uid()
        OR id IN (
            SELECT group_id 
            FROM group_members 
            WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 
            FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create index for performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_groups_creator_id ON public.groups(creator_id);

-- Verify foreign key constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'groups_creator_id_fkey'
    ) THEN
        ALTER TABLE public.groups
        ADD CONSTRAINT groups_creator_id_fkey
        FOREIGN KEY (creator_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;
    END IF;
END $$; 
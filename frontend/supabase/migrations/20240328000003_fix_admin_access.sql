-- Create secure view for auth.users access
CREATE OR REPLACE VIEW public.users AS
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE auth.uid() = id OR EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role = 'admin'
);

-- Grant access to the view
GRANT SELECT ON public.users TO authenticated;

-- Update groups table to ensure creator_id relationship
ALTER TABLE public.groups
DROP CONSTRAINT IF EXISTS groups_creator_id_fkey;

ALTER TABLE public.groups
ADD CONSTRAINT groups_creator_id_fkey
FOREIGN KEY (creator_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_groups_creator_id ON public.groups(creator_id);

-- Update RLS policy for groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Groups are viewable by creator and members" ON public.groups;

-- Simplified policy to avoid recursion
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
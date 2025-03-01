-- Update the foreign key to reference auth.users instead of profiles
ALTER TABLE groups
DROP CONSTRAINT IF EXISTS groups_creator_id_fkey,
ADD CONSTRAINT groups_creator_id_fkey 
FOREIGN KEY (creator_id) 
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Create index for the relationship if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_groups_creator_id 
ON groups(creator_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON groups;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON groups;
DROP POLICY IF EXISTS "Enable update for group creators" ON groups;
DROP POLICY IF EXISTS "Enable delete for group creators" ON groups;
DROP POLICY IF EXISTS "Admins can update approval status" ON groups;

-- Recreate policies with auth.users checks
CREATE POLICY "Enable read access for all users"
ON groups FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON groups FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Enable update for group creators"
ON groups FOR UPDATE
USING (creator_id = auth.uid());

CREATE POLICY "Enable delete for group creators"
ON groups FOR DELETE
USING (creator_id = auth.uid());

CREATE POLICY "Admins can update approval status"
ON groups FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
); 
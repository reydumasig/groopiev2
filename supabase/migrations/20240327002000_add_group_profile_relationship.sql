-- Add foreign key relationship between groups and profiles
ALTER TABLE groups
DROP CONSTRAINT IF EXISTS groups_creator_id_fkey,
ADD CONSTRAINT groups_creator_id_fkey 
FOREIGN KEY (creator_id) 
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Create index for the relationship
CREATE INDEX IF NOT EXISTS idx_groups_creator_id 
ON groups(creator_id);

-- Update RLS policies to use profiles relationship
DROP POLICY IF EXISTS "Enable read access for all users" ON groups;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON groups;
DROP POLICY IF EXISTS "Enable update for group creators" ON groups;
DROP POLICY IF EXISTS "Enable delete for group creators" ON groups;
DROP POLICY IF EXISTS "Admins can update approval status" ON groups;

-- Recreate policies with proper profile checks
CREATE POLICY "Enable read access for all users"
ON groups FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON groups FOR INSERT
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Enable update for group creators"
ON groups FOR UPDATE
USING (creator_id IN (SELECT id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Enable delete for group creators"
ON groups FOR DELETE
USING (creator_id IN (SELECT id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can update approval status"
ON groups FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
); 
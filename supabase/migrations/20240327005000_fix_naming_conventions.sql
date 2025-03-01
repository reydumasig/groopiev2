-- Ensure consistent column naming in profiles
ALTER TABLE profiles
RENAME COLUMN full_name TO fullname;

-- Ensure consistent column naming in groups
ALTER TABLE groups
RENAME COLUMN creator_id TO user_id;

-- Drop and recreate the foreign key with the new column name
ALTER TABLE groups
DROP CONSTRAINT IF EXISTS groups_creator_id_fkey;

ALTER TABLE groups
ADD CONSTRAINT groups_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Drop and recreate the index with the new column name
DROP INDEX IF EXISTS idx_groups_creator_id;
CREATE INDEX idx_groups_user_id ON groups(user_id);

-- Update RLS policies with new column names
DROP POLICY IF EXISTS "Enable read access for all users" ON groups;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON groups;
DROP POLICY IF EXISTS "Enable update for group creators" ON groups;
DROP POLICY IF EXISTS "Enable delete for group creators" ON groups;
DROP POLICY IF EXISTS "Admins can update approval status" ON groups;

-- Recreate policies with consistent naming
CREATE POLICY "Enable read access for all users"
ON groups FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON groups FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for group creators"
ON groups FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Enable delete for group creators"
ON groups FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Admins can update approval status"
ON groups FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
); 
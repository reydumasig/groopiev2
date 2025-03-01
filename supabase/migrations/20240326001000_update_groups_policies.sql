-- Create groups table if it doesn't exist
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending',
    slack_channel_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON groups;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON groups;
DROP POLICY IF EXISTS "Enable update for group creators" ON groups;

-- Create new policies
CREATE POLICY "Enable read access for all users"
ON groups FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON groups FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for group creators"
ON groups FOR UPDATE
USING (auth.uid() = creator_id);

CREATE POLICY "Enable delete for group creators"
ON groups FOR DELETE
USING (auth.uid() = creator_id);

-- Create plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    features TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for plans
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Create policies for plans
CREATE POLICY "Enable read access for all users"
ON plans FOR SELECT
USING (true);

CREATE POLICY "Enable insert for group creators"
ON plans FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM groups
        WHERE groups.id = group_id
        AND groups.creator_id = auth.uid()
    )
);

CREATE POLICY "Enable update for group creators"
ON plans FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM groups
        WHERE groups.id = group_id
        AND groups.creator_id = auth.uid()
    )
); 
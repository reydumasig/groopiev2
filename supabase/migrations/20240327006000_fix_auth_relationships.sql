-- Drop existing foreign key
ALTER TABLE groups
DROP CONSTRAINT IF EXISTS groups_user_id_fkey;

-- Create secure view to expose auth.users data
CREATE OR REPLACE VIEW public.users AS
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE auth.uid() = id OR (
    SELECT raw_user_meta_data->>'role' = 'admin'
    FROM auth.users
    WHERE id = auth.uid()
);

-- Add foreign key referencing auth.users directly
ALTER TABLE groups
ADD CONSTRAINT groups_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Grant necessary permissions
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon; 
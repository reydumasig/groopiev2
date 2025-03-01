-- Add Slack-related fields to groups table
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS slack_channel_id TEXT,
ADD COLUMN IF NOT EXISTS slack_invite_link TEXT,
ADD COLUMN IF NOT EXISTS slack_channel_name TEXT;

-- Add approval_status field
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending'
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Create index for approval status
CREATE INDEX IF NOT EXISTS idx_groups_approval_status ON groups(approval_status);

-- Update RLS policies for admin access
CREATE POLICY "Admins can update approval status"
ON groups
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role = 'admin'
    )
); 
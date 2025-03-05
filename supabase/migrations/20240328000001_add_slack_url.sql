-- Add slack_channel_url column to groups table
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS slack_channel_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN groups.slack_channel_url IS 'Optional Slack channel URL for group communication';

-- Update existing records to have null value
UPDATE groups SET slack_channel_url = NULL WHERE slack_channel_url IS NOT NULL; 
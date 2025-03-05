-- Add new slack_channel_url column
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS slack_channel_url TEXT;

-- Comment on deprecated columns
COMMENT ON COLUMN groups.slack_channel_id IS 'Deprecated: Use slack_channel_url instead';
COMMENT ON COLUMN groups.slack_channel_name IS 'Deprecated: Use slack_channel_url instead';

-- Update existing records to move slack channel URL to new column
UPDATE groups
SET slack_channel_url = 'https://app.slack.com/client/T08F9JLQWJW/' || slack_channel_id
WHERE slack_channel_id IS NOT NULL; 
-- Add Slack-related columns to groups table
ALTER TABLE groups
ADD COLUMN slack_channel_id text,
ADD COLUMN slack_channel_url text,
ADD COLUMN slack_channel_name text;

-- Add indexes for performance
CREATE INDEX idx_groups_slack_channel_id ON groups(slack_channel_id);
CREATE INDEX idx_groups_status ON groups(status); 
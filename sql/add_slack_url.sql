-- Add slack_channel_url column to groups table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'groups' 
        AND column_name = 'slack_channel_url'
    ) THEN
        ALTER TABLE groups
        ADD COLUMN slack_channel_url TEXT;

        -- Add comment for documentation
        COMMENT ON COLUMN groups.slack_channel_url IS 'Optional Slack channel URL for group communication';
    END IF;
END $$; 
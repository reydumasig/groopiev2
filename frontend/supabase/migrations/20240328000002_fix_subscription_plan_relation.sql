-- Add plan_id column to subscriptions if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'plan_id'
    ) THEN
        ALTER TABLE subscriptions
        ADD COLUMN plan_id UUID REFERENCES plans(id) ON DELETE CASCADE;

        -- Add comment for documentation
        COMMENT ON COLUMN subscriptions.plan_id IS 'References the plan that the user subscribed to';
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);

-- First ensure RLS is enabled on plans table
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DO $$ 
BEGIN 
    DROP POLICY IF EXISTS "Enable read access for users" ON plans;
EXCEPTION
    WHEN undefined_object THEN 
        NULL;
END $$;

-- Create new RLS policy
CREATE POLICY "Enable read access for users" ON plans
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = plans.group_id 
            AND (
                groups.creator_id = auth.uid() 
                OR 
                EXISTS (
                    SELECT 1 FROM subscriptions 
                    WHERE subscriptions.group_id = groups.id 
                    AND subscriptions.user_id = auth.uid()
                )
            )
        )
    ); 
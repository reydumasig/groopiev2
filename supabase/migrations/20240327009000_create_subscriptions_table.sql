-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    stripe_subscription_id VARCHAR(255),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    CONSTRAINT subscriptions_status_check 
        CHECK (status IN ('pending', 'active', 'cancelled', 'suspended'))
);

-- Add RLS policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
    ON public.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to create their own subscriptions
CREATE POLICY "Users can create their own subscriptions"
    ON public.subscriptions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own subscriptions
CREATE POLICY "Users can update their own subscriptions"
    ON public.subscriptions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow group creators to view subscriptions for their groups
CREATE POLICY "Group creators can view subscriptions for their groups"
    ON public.subscriptions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM plans p
            JOIN groups g ON g.id = p.group_id
            WHERE p.id = plan_id AND g.user_id = auth.uid()
        )
    );

-- Allow group creators to update subscriptions for their groups
CREATE POLICY "Group creators can update subscriptions for their groups"
    ON public.subscriptions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM plans p
            JOIN groups g ON g.id = p.group_id
            WHERE p.id = plan_id AND g.user_id = auth.uid()
        )
    );

-- Add indexes for performance
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Grant necessary permissions
GRANT ALL ON public.subscriptions TO authenticated; 
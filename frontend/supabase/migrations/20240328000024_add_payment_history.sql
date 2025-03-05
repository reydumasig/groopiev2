-- Create payment_history table
CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    creator_share DECIMAL(10,2) NOT NULL,
    status payment_status NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payout_batch_id UUID,
    CONSTRAINT payment_history_platform_fee_check CHECK (platform_fee = amount * 0.20),
    CONSTRAINT payment_history_creator_share_check CHECK (creator_share = amount * 0.80)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON public.payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON public.payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON public.payment_history(created_at);

-- Enable RLS
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Policies for payment_history
CREATE POLICY "Creators can view payments for their groups" ON public.payment_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM subscriptions s
            JOIN groups g ON s.group_id = g.id
            WHERE s.id = payment_history.subscription_id
            AND g.creator_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own payments" ON public.payment_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM subscriptions s
            WHERE s.id = payment_history.subscription_id
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert payments" ON public.payment_history
    FOR INSERT
    WITH CHECK (true);  -- We'll control this through application logic

-- Grant permissions
GRANT SELECT ON public.payment_history TO authenticated;
GRANT INSERT ON public.payment_history TO authenticated;

-- Create view for easier querying
CREATE OR REPLACE VIEW public.payment_history_details AS
SELECT 
    ph.*,
    s.group_id,
    s.user_id as subscriber_id,
    g.creator_id,
    g.name as group_name
FROM payment_history ph
JOIN subscriptions s ON ph.subscription_id = s.id
JOIN groups g ON s.group_id = g.id; 
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set up storage for profile pictures
INSERT INTO storage.buckets (id, name) VALUES ('profiles', 'profiles') ON CONFLICT DO NOTHING;

-- Create custom types
CREATE TYPE user_role AS ENUM ('subscriber', 'creator', 'admin');
CREATE TYPE group_status AS ENUM ('pending', 'active', 'inactive');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'incomplete');

-- Update the built-in auth.users table with custom fields
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'subscriber';
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- Groups table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status group_status DEFAULT 'pending',
    slack_channel_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(name)
);

-- Plans table
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    features JSONB,
    stripe_price_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    status subscription_status DEFAULT 'incomplete',
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, plan_id)
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    creator_amount DECIMAL(10,2) NOT NULL,
    platform_amount DECIMAL(10,2) NOT NULL,
    stripe_payment_intent_id TEXT,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX idx_groups_creator ON groups(creator_id);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX idx_plans_group ON plans(group_id);
CREATE INDEX idx_transactions_subscription ON transactions(subscription_id);

-- Set up Row Level Security (RLS)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Groups policies
CREATE POLICY "Groups are viewable by everyone"
    ON groups FOR SELECT
    USING (true);

CREATE POLICY "Groups can be created by creators and admins"
    ON groups FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.role = 'creator' OR auth.users.role = 'admin')
        )
    );

CREATE POLICY "Groups can be updated by their creators and admins"
    ON groups FOR UPDATE
    USING (
        creator_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.role = 'admin'
        )
    );

-- Plans policies
CREATE POLICY "Plans are viewable by everyone"
    ON plans FOR SELECT
    USING (true);

CREATE POLICY "Plans can be managed by group creators and admins"
    ON plans FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM groups
            WHERE groups.id = plans.group_id
            AND (
                groups.creator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM auth.users
                    WHERE auth.users.id = auth.uid()
                    AND auth.users.role = 'admin'
                )
            )
        )
    );

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Creators can view subscriptions to their groups"
    ON subscriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM plans
            JOIN groups ON plans.group_id = groups.id
            WHERE plans.id = subscriptions.plan_id
            AND groups.creator_id = auth.uid()
        )
    );

-- Transactions policies
CREATE POLICY "Users can view their own transactions"
    ON transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM subscriptions
            WHERE subscriptions.id = transactions.subscription_id
            AND subscriptions.user_id = auth.uid()
        )
    );

-- Functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 
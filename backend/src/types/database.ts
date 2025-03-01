export type UserRole = 'subscriber' | 'creator' | 'admin';
export type GroupStatus = 'pending' | 'active' | 'inactive';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'incomplete';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  stripe_account_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  status: GroupStatus;
  slack_channel_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  group_id: string;
  name: string;
  description: string | null;
  price: number;
  features: Record<string, any> | null;
  stripe_price_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  subscription_id: string;
  amount: number;
  creator_amount: number;
  platform_amount: number;
  stripe_payment_intent_id: string | null;
  status: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      groups: Group;
      plans: Plan;
      subscriptions: Subscription;
      transactions: Transaction;
    };
    Views: {
      [key: string]: unknown;
    };
    Functions: {
      [key: string]: unknown;
    };
    Enums: {
      user_role: UserRole;
      group_status: GroupStatus;
      subscription_status: SubscriptionStatus;
    };
  };
} 
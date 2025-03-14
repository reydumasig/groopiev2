# Groopie Database Schema Documentation

## Version History

### v2.1.7 (Update) - Add Payment History and Dashboard Stats - 2024-03-28
- Added payment_history table with proper RLS policies
- Implemented 20/80 revenue split tracking
- Added payment_history_details view for easier querying
- Enhanced dashboard with earnings and subscriber stats
- Added $500 payout threshold tracking

### v2.1.6 (Update) - Add Group Settings Management - 2024-03-28
- Added ability for creators to update group details
- Added functionality to modify subscription tiers
- Enhanced plan management capabilities
- Updated group and plan update policies

### v2.1.5 (Update) - Add Group Reactivation - 2024-03-28
- Added `reactivate_group` function for admin use
- Added ability to reactivate suspended groups
- Updated admin interface to show suspended groups
- Enhanced group management capabilities

### v2.1.4 (Update) - Fix Admin View Security - 2024-03-28
- Removed RLS from admin_group_details view
- Implemented security through view definition
- Updated view permissions model
- Maintained admin-only access through WHERE clause

### v2.1.3 (Update) - Fix Admin Access and Group Relationships - 2024-03-28
- Fixed relationship between groups and auth.users through creator_id
- Added secure view for auth.users access
- Updated RLS policies for admin access
- Fixed group approval flow

### v2.1.2 (Update) - Subscription Plan Relationship - 2024-03-28
- Added `plan_id` column to subscriptions table
- Created foreign key relationship between subscriptions and plans
- Added index on subscriptions.plan_id
- Updated RLS policies for plan access

### v2.1.1 (Update) - Slack URL Field - 2024-03-28
- Added `slack_channel_url` column to groups table
- Made Slack integration optional and manual
- Updated group creation to support Slack URL input

### v2.1.0 (New Addition) - Manual Slack Integration - 2024-03-28
- Changed Slack channel handling to manual input
- Removed automatic Slack channel creation
- Added slack_channel_url field to groups table
- Deprecated slack_channel_id and slack_channel_name fields (kept for backward compatibility)

### v2.0.0 (Current) - Marketplace Removal - 2024-03-27
- Removed marketplace functionality
- Simplified group discovery process
- Groups are now private by default
- Updated RLS policies to reflect private-first approach

### v1.0.0 - Initial Release - 2024-03-26
- Initial database schema
- Marketplace functionality
- Public group discovery

## Overview
This document outlines the database structure for the Groopie platform. Always reference this when making changes that affect the database schema.

## Enums

### User Roles (`user_role`)
```sql
ENUM:
- 'subscriber' (default)
- 'creator'
- 'admin'
```

### Status Types
```sql
group_status ENUM:
- 'active'
- 'inactive'
- 'pending'

subscription_status ENUM:
- 'active'
- 'inactive'
- 'pending'

member_role ENUM:
- 'member'
- 'admin'
```

## Tables

### `public.profiles`
```sql
- id: UUID (PK, refs auth.users)
- full_name: TEXT
- role: user_role ENUM
- avatar_url: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### `public.groups`
```sql
- id: UUID (PK)
- name: TEXT (NOT NULL)
- description: TEXT
- creator_id: UUID (refs auth.users)
- slack_channel_url: TEXT
- slack_channel_id: TEXT (deprecated)
- slack_channel_name: TEXT (deprecated)
- status: group_status ENUM
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### `public.group_members`
```sql
- group_id: UUID (refs groups.id)
- user_id: UUID (refs auth.users)
- role: member_role ENUM
- created_at: TIMESTAMPTZ
PRIMARY KEY: (group_id, user_id)
```

### `public.subscriptions`
```sql
- id: UUID (PK)
- user_id: UUID (refs auth.users)
- group_id: UUID (refs groups.id)
- plan_id: UUID (refs plans.id)
- status: subscription_status ENUM
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### `public.plans`
```sql
- id: UUID (PK)
- group_id: UUID (refs groups.id)
- name: TEXT (NOT NULL)
- description: TEXT
- price: DECIMAL(10,2) (NOT NULL, >= 0)
- features: TEXT[]
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### `public.payment_history`
```sql
- id: UUID (PK)
- subscription_id: UUID (refs subscriptions.id)
- amount: DECIMAL(10,2)
- platform_fee: DECIMAL(10,2) (20% of amount)
- creator_share: DECIMAL(10,2) (80% of amount)
- status: payment_status ENUM
- created_at: TIMESTAMPTZ
- payout_batch_id: UUID
```

## Views

### `public.users`
```sql
Secure view over auth.users with columns:
- id: UUID
- email: TEXT
- raw_user_meta_data: JSONB
Access limited to:
- Own user data
- Admin users can see all
```

### `public.group_details`
```sql
Columns returned:
- All columns from groups
- creator_name (from profiles.full_name)
- creator_avatar (from profiles.avatar_url)
- member_count (COUNT of group_members)
```

### `public.admin_group_details`
```sql
Secure view for admin dashboard that returns:
- All columns from groups
- creator_name (from profiles.full_name)
- creator_avatar (from profiles.avatar_url)
- creator_email (from auth.users.email)
- member_count (COUNT of group_members)
- created_at
- updated_at

Security:
- Access controlled through underlying tables' RLS
- Direct grant to authenticated users
- Admin check in view definition
```

### `public.payment_history_details`
```sql
Columns returned:
- All columns from payment_history
- group_id (from subscriptions)
- subscriber_id (from subscriptions.user_id)
- creator_id (from groups)
- group_name (from groups)
```

## Indexes
```sql
- profiles: role
- groups: creator_id, status
- group_members: user_id
- subscriptions: user_id, group_id
- plans: group_id
```

## Functions

### `public.reactivate_group(group_id uuid)`
```sql
SECURITY DEFINER function that:
- Checks if the calling user is an admin
- Updates group status from 'inactive' to 'active'
- Updates the updated_at timestamp
- Returns boolean indicating success
```

### `public.approve_group(group_id uuid)`
```sql
SECURITY DEFINER function that:
- Checks if the calling user is an admin
- Updates group status from 'pending' to 'active'
- Updates the updated_at timestamp
- Returns boolean indicating success
```

### `public.suspend_group(group_id uuid)`
```sql
SECURITY DEFINER function that:
- Checks if the calling user is an admin
- Updates group status to 'inactive'
- Updates the updated_at timestamp
- Returns boolean indicating success
```

### `public.update_group_slack(group_id uuid, slack_url text)`
```sql
SECURITY DEFINER function that:
- Checks if the calling user is an admin
- Updates slack_channel_url
- Updates the updated_at timestamp
- Returns boolean indicating success
```

## Row Level Security (RLS) Policies

### Profiles
```sql
- SELECT: auth.uid() = id
- UPDATE: auth.uid() = id
```

### Groups Table

The groups table has separate policies for different operations:

1. Creator Access:
```sql
CREATE POLICY "Groups viewable by creator" ON public.groups
    FOR SELECT USING (creator_id = auth.uid());
```

2. Member Access:
```sql
CREATE POLICY "Groups viewable by members" ON public.groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = id 
            AND group_members.user_id = auth.uid()
        )
    );
```

3. Admin Access:
```sql
CREATE POLICY "Groups viewable by admins" ON public.groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Groups updatable by admins" ON public.groups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );
```

4. Admin Management:
```sql
CREATE POLICY "Groups manageable by admins" ON public.groups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );
```

### Group Members
```sql
- SELECT: user_id = auth.uid()
- ALL: Group creator can manage
```

### Subscriptions
```sql
- SELECT: user_id = auth.uid()
- ALL: user_id = auth.uid()
```

### Plans
```sql
- SELECT: Group is active
- ALL: Group creator can manage
```

### Payment History
```sql
- SELECT: Creators can view payments for their groups
- SELECT: Users can view their own payments
- INSERT: System can insert payments
```

## Cascade Rules
```sql
- profiles: ON DELETE CASCADE from auth.users
- groups: ON DELETE CASCADE from creator
- group_members: ON DELETE CASCADE from both group and user
- subscriptions: ON DELETE CASCADE from both group and user
- plans: ON DELETE CASCADE from group
```

## Trigger Functions

### `handle_new_user()`
```sql
Triggered: AFTER INSERT ON auth.users
Action: Creates profile with:
- id: NEW.id
- full_name: from metadata or email
- role: 'subscriber'
```

## Important Notes

### Role Progression
- Users start as 'subscriber'
- Can be upgraded to 'creator'
- 'admin' is special role

### Group Creation and Management
- Only 'creator' or 'admin' can create groups
- Groups start as 'pending'
- Must be activated to be visible
- Creators can update group details and subscription tiers
- Changes to subscription tiers don't affect existing subscriptions

### Subscriptions
- Start as 'pending'
- Must be activated
- One per user per group
- Tied to specific subscription tier/plan

### Plans
- Belong to a group
- Price must be >= 0
- Features stored as array
- Can be updated by group creator
- Changes don't affect existing subscriptions

### Security
- All tables have RLS enabled
- Policies enforce access control
- Cascading deletes maintain referential integrity

## Making Changes

When making changes to the database schema:

1. **Document First**: Update this document with your proposed changes
2. **Review Impact**: Check all affected tables and relationships
3. **Migration Strategy**: Plan how to handle existing data
4. **Security Check**: Ensure RLS policies are updated
5. **Test**: Verify all cascade behaviors work as expected

## Validation Checklist

Before implementing features that affect the database:

- [ ] Does it follow our naming conventions?
- [ ] Are appropriate indexes in place?
- [ ] Are RLS policies adequate?
- [ ] Are cascade rules appropriate?
- [ ] Is enum usage consistent?
- [ ] Are constraints properly defined?
- [ ] Is documentation updated? 
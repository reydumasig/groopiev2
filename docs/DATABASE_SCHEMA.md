# Groopie Database Schema Documentation

## Version History

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

## Indexes
```sql
- profiles: role
- groups: creator_id, status
- group_members: user_id
- subscriptions: user_id, group_id
- plans: group_id
```

## Row Level Security (RLS) Policies

### Profiles
```sql
- SELECT: auth.uid() = id
- UPDATE: auth.uid() = id
```

### Groups
```sql
- SELECT: creator_id = auth.uid() OR EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = groups.id 
    AND group_members.user_id = auth.uid()
  )
- ALL: creator_id = auth.uid()
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

### Group Creation
- Only 'creator' or 'admin' can create groups
- Groups start as 'pending'
- Must be activated to be visible

### Subscriptions
- Start as 'pending'
- Must be activated
- One per user per group

### Plans
- Belong to a group
- Price must be >= 0
- Features stored as array

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
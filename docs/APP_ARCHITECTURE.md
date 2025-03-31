# Groopie Application Architecture

## Overview
Groopie is a platform that enables creators to monetize their Slack communities through subscription-based access. The platform handles group creation, subscription management, and automated Slack channel access.

## Tech Stack

### Frontend
- **Framework**: Next.js 14.1.0 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn/UI
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **API Client**: Supabase Client

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Email Service**: SendGrid
- **Payment Processing**: Stripe

### Infrastructure
- **Database & Auth**: Supabase
- **Hosting**: Vercel (Frontend), Railway (Backend)
- **Community Platform**: Slack API
- **Version Control**: Git
- **CI/CD**: GitHub Actions

## Core Entities

### User Roles
1. **Subscriber**
   - Default role for new users
   - Can browse and join groups
   - Access subscribed group content

2. **Creator**
   - Can create and manage groups
   - Set subscription tiers
   - Monitor member activity
   - View earnings

3. **Admin**
   - Approve/reject groups
   - Manage all users
   - Access platform metrics
   - Handle support issues

### Data Models

```typescript
interface User {
  id: string;
  email: string;
  role: 'subscriber' | 'creator' | 'admin';
  profile: {
    full_name: string;
    avatar_url?: string;
  };
}

interface Group {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  slack_channel_url: string;
  status: 'pending' | 'active' | 'inactive';
}

interface Plan {
  id: string;
  group_id: string;
  name: string;
  price: number;
  features: string[];
}

interface Subscription {
  id: string;
  user_id: string;
  group_id: string;
  plan_id: string;
  status: 'active' | 'inactive';
}
```

## User Flows

### Subscriber Flow
1. **Authentication**
   ```
   Login/Register → Email Verification → Profile Setup
   ```

2. **Group Discovery**
   ```
   Browse Groups → View Group Details → Select Plan
   ```

3. **Subscription Process**
   ```
   Select Plan → Payment → Receive Slack Invite → Access Content
   ```

### Creator Flow
1. **Become Creator**
   ```
   Request Creator Status → Admin Approval → Creator Dashboard Access
   ```

2. **Group Creation**
   ```
   Create Group → Configure Plans → Submit for Review → Group Approval
   ```

3. **Group Management**
   ```
   Monitor Members → View Analytics → Process Payouts
   ```

### Admin Flow
1. **Group Approval**
   ```
   Review Submissions → Verify Details → Approve/Reject → Notify Creator
   ```

2. **User Management**
   ```
   Monitor Users → Handle Reports → Manage Roles → Support Issues
   ```

3. **Platform Oversight**
   ```
   View Analytics → Process Payouts → System Maintenance
   ```

## Authentication & Authorization

### Authentication Flow
1. User signs up/logs in via Supabase Auth
2. JWT token generated and stored
3. Token used for subsequent API requests
4. Refresh token handling for session persistence

### Authorization Rules
```sql
-- Row Level Security (RLS) Policies
-- Groups
CREATE POLICY "Users can view groups they're members of"
  ON groups FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = id AND user_id = auth.uid()
  ));

-- Subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());
```

## API Architecture

### RESTful Endpoints
```typescript
// Group Management
POST   /api/groups            // Create group
GET    /api/groups            // List groups
PUT    /api/groups/:id        // Update group
DELETE /api/groups/:id        // Delete group

// Subscriptions
POST   /api/subscriptions     // Create subscription
GET    /api/subscriptions     // List subscriptions
PUT    /api/subscriptions/:id // Update subscription

// Admin Routes
POST   /api/admin/groups/:id/approve  // Approve group
POST   /api/admin/groups/:id/reject   // Reject group
GET    /api/admin/analytics           // Get platform analytics
```

## Integration Points

### Slack Integration
1. **Channel Creation**
   ```typescript
   async function createSlackChannel(group: Group) {
     const channel = await slackClient.conversations.create({
       name: normalizeChannelName(group.name),
       is_private: true
     });
     return channel.id;
   }
   ```

2. **Member Management**
   ```typescript
   async function inviteToChannel(email: string, channelId: string) {
     const user = await slackClient.users.lookupByEmail({ email });
     await slackClient.conversations.invite({
       channel: channelId,
       users: user.id
     });
   }
   ```

### Payment Processing
1. **Stripe Integration**
   ```typescript
   async function createSubscription(userId: string, planId: string) {
     const customer = await stripe.customers.create({
       metadata: { userId }
     });
     const subscription = await stripe.subscriptions.create({
       customer: customer.id,
       items: [{ price: planId }]
     });
     return subscription;
   }
   ```

## Error Handling

### Frontend Error Handling
```typescript
try {
  await api.createSubscription(planId);
} catch (error) {
  if (error.code === 'insufficient_funds') {
    showPaymentError();
  } else {
    showGeneralError();
  }
}
```

### Backend Error Handling
```typescript
app.use((error: Error, req: Request, res: Response) => {
  logger.error(error);
  res.status(500).json({
    error: 'Internal Server Error',
    requestId: req.id
  });
});
```

## Monitoring & Analytics

### Key Metrics
1. **Business Metrics**
   - Active subscribers
   - Revenue per group
   - Conversion rate
   - Churn rate

2. **Technical Metrics**
   - API response times
   - Error rates
   - Database performance
   - Integration health

### Logging
```typescript
logger.info('Subscription created', {
  userId,
  groupId,
  planId,
  timestamp: new Date()
});
```

## Deployment Strategy

### Frontend (Vercel)
1. Push to main triggers deployment
2. Preview deployments for PRs
3. Automatic branch deployments

### Backend (Railway)
1. Containerized deployment
2. Environment variable management
3. Automatic scaling

## Security Measures

1. **Authentication**
   - JWT token validation
   - Secure session management
   - Rate limiting

2. **Data Protection**
   - Row Level Security
   - Input validation
   - SQL injection prevention

3. **API Security**
   - CORS configuration
   - Request validation
   - Error sanitization 
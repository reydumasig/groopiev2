# Groopie Platform Documentation

## Table of Contents
1. [Platform Overview](#platform-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Database Schema](#database-schema)
5. [Component Library](#component-library)
6. [API Documentation](#api-documentation)
7. [Integration Points](#integration-points)
8. [Development Workflow](#development-workflow)

## Platform Overview

Groopie is a subscription-based Slack community platform that enables:

### Core Features
1. **Community Monetization**
   - Create paid Slack communities
   - Multiple subscription tiers
   - Automated access management

2. **Payment Processing**
   - Secure payment handling
   - Subscription management
   - Revenue sharing (80/20 split)

3. **Access Control**
   - Automated Slack invites
   - Role-based permissions
   - Member management

### User Types
1. **Subscribers**
   - Join communities
   - Manage subscriptions
   - Access content

2. **Creators**
   - Create communities
   - Set pricing tiers
   - Monitor analytics

3. **Administrators**
   - Platform oversight
   - Community approval
   - User management

## Frontend Architecture

### Tech Stack
- Next.js 14.1.0 with App Router
- TypeScript
- Tailwind CSS + Shadcn/UI
- Zustand for state management

### Component Structure
```
/src
├── app/                    # Next.js app router pages
├── components/            
│   ├── admin/             # Admin dashboard components
│   ├── auth/              # Authentication components
│   ├── checkout/          # Payment & subscription components
│   ├── creator/           # Creator dashboard components
│   ├── group/             # Group management components
│   ├── layout/            # Layout components
│   ├── providers/         # Context providers
│   ├── settings/          # User settings components
│   └── ui/                # Base UI components
├── lib/                   # Utility functions
├── store/                 # State management
└── types/                 # TypeScript definitions
```

### Key Components

#### Admin Components
- `AdminDashboard`: Platform oversight dashboard
- `GroupApproval`: Community approval interface
- `UserManagement`: User administration tools
- `Analytics`: Platform metrics and reporting

#### Creator Components
- `CreatorDashboard`: Creator management interface
- `GroupCreation`: Community setup wizard
- `SubscriptionTiers`: Pricing tier management
- `MembershipAnalytics`: Member tracking and analytics

#### Authentication Components
- `SignIn`: User login interface
- `SignUp`: Registration flow
- `PasswordReset`: Password recovery
- `EmailVerification`: Email verification handling

#### Checkout Components
- `SubscriptionCheckout`: Payment processing
- `PlanSelection`: Subscription tier selection
- `PaymentConfirmation`: Transaction confirmation
- `InvoiceGeneration`: Receipt handling

### State Management
```typescript
// Auth Store
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Subscription Store
interface SubscriptionState {
  subscriptions: Subscription[];
  activePlan: Plan | null;
}
```

## Backend Architecture

### Tech Stack
- Node.js with Express
- TypeScript
- Supabase for database and auth
- SendGrid for email
- Stripe for payments

### API Structure
```typescript
// Route Organization
/api
├── auth/           # Authentication endpoints
├── groups/         # Group management
├── subscriptions/  # Subscription handling
├── admin/          # Admin operations
└── webhooks/       # External service webhooks
```

### Key Services

#### Authentication Service
```typescript
class AuthService {
  async signUp(email: string, password: string): Promise<User>;
  async signIn(email: string, password: string): Promise<Session>;
  async resetPassword(email: string): Promise<void>;
  async verifyEmail(token: string): Promise<void>;
}
```

#### Group Service
```typescript
class GroupService {
  async createGroup(data: GroupInput): Promise<Group>;
  async approveGroup(groupId: string): Promise<void>;
  async inviteMembers(groupId: string, emails: string[]): Promise<void>;
  async updateSettings(groupId: string, settings: GroupSettings): Promise<Group>;
}
```

#### Subscription Service
```typescript
class SubscriptionService {
  async createSubscription(userId: string, planId: string): Promise<Subscription>;
  async cancelSubscription(subscriptionId: string): Promise<void>;
  async updatePlan(subscriptionId: string, newPlanId: string): Promise<Subscription>;
  async processPayment(subscriptionId: string): Promise<Payment>;
}
```

### Middleware
```typescript
// Authentication Middleware
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  // Token verification logic
};

// Role Validation
const requireRole = (role: UserRole) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
```

## Integration Points

### Slack Integration
```typescript
class SlackService {
  // Channel Management
  async createChannel(group: Group): Promise<string>;
  async archiveChannel(channelId: string): Promise<void>;
  async updateChannelSettings(channelId: string, settings: ChannelSettings): Promise<void>;

  // Member Management
  async inviteMember(email: string, channelId: string): Promise<void>;
  async removeMember(userId: string, channelId: string): Promise<void>;
}
```

### Payment Integration
```typescript
class StripeService {
  // Customer Management
  async createCustomer(user: User): Promise<string>;
  async updatePaymentMethod(customerId: string, paymentMethodId: string): Promise<void>;

  // Subscription Management
  async createSubscription(customerId: string, priceId: string): Promise<Subscription>;
  async cancelSubscription(subscriptionId: string): Promise<void>;
}
```

### Email Integration
```typescript
class EmailService {
  // Transactional Emails
  async sendWelcomeEmail(user: User): Promise<void>;
  async sendInviteEmail(email: string, group: Group): Promise<void>;
  async sendPaymentConfirmation(user: User, payment: Payment): Promise<void>;
}
```

## Development Workflow

### Local Development
```bash
# Frontend Development
cd frontend
npm install
npm run dev

# Backend Development
cd backend
npm install
npm run dev
```

### Environment Setup
```env
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key

# Backend (.env)
SUPABASE_SERVICE_ROLE_KEY=your_service_key
STRIPE_SECRET_KEY=your_stripe_secret
SENDGRID_API_KEY=your_sendgrid_key
SLACK_BOT_TOKEN=your_slack_token
```

### Testing
```bash
# Run Frontend Tests
npm run test:frontend

# Run Backend Tests
npm run test:backend

# Run E2E Tests
npm run test:e2e
```

### Deployment
```bash
# Frontend (Vercel)
git push origin main  # Triggers automatic deployment

# Backend (Railway)
railway up  # Deploy backend services
```

## Security Considerations

### Data Protection
- Row Level Security (RLS) in Supabase
- JWT token validation
- Input sanitization
- XSS prevention

### API Security
- Rate limiting
- CORS configuration
- Request validation
- Error handling

### Payment Security
- PCI compliance
- Secure webhook handling
- Payment information encryption

## Monitoring & Logging

### Performance Monitoring
```typescript
// API Performance Logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.path,
      duration: Date.now() - start,
      status: res.statusCode
    });
  });
  next();
});
```

### Error Tracking
```typescript
// Global Error Handler
app.use((error: Error, req: Request, res: Response) => {
  logger.error({
    error: error.message,
    stack: error.stack,
    requestId: req.id,
    user: req.user?.id
  });
  res.status(500).json({ error: 'Internal Server Error' });
});
```

### Analytics
- User engagement metrics
- Revenue tracking
- Performance monitoring
- Error rate tracking 
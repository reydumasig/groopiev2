# Groopie - Slack Community Platform

Groopie is a platform that helps you create and manage monetized Slack communities. Create groups, set up subscription tiers, and automatically manage Slack channel access for your members.

## Features

- Create and manage Slack community groups
- Set up multiple subscription tiers with customizable pricing
- Automated Slack channel creation and management
- Member invitation system with email notifications
- Admin dashboard for group approvals
- Secure authentication and authorization
- Email notifications for key events
- Stripe integration for payment processing

## Tech Stack

### Frontend
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Shadcn/UI Components
- React Hook Form
- Zod for validation
- Zustand for state management

### Backend
- Node.js
- Express
- TypeScript
- SendGrid for email services
- Slack Web API

### Database & Authentication
- Supabase (PostgreSQL)
- Supabase Auth
- Row Level Security (RLS)

### Third-Party Services
- SendGrid - Email service provider
- Slack API - Community management
  - Bot Token for automated actions
  - User Token for admin operations
  - Channel management
  - Invitation system
- Stripe - Payment processing
- Supabase - Database and authentication

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Slack workspace with admin access
- SendGrid account
- Stripe account (for payments)

## Environment Variables

### Backend (.env)
```bash
# Server Configuration
PORT=8000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_USER_TOKEN=xoxp-your-user-token
SLACK_SIGNING_SECRET=your_signing_secret
SLACK_CLIENT_ID=your_client_id
SLACK_CLIENT_SECRET=your_client_secret
SLACK_APP_TOKEN=your_app_token
SLACK_BOT_USER_ID=your_bot_user_id
SLACK_WORKSPACE_INVITE=your_workspace_invite_link

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_from_email

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/groopieslack.git
cd groopieslack
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables:
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your credentials
```

4. Set up the database:
```bash
# Run Supabase migrations
npx supabase db push
```

5. Start the development servers:
```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory)
npm run dev
```

## Available Scripts

### Backend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run test:email` - Test email service
- `npm run test:slack` - Test Slack integration
- `npm run create-admin` - Create admin user

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linter

## API Services

### Email Service
- Welcome emails for new users
- Group approval notifications
- Slack invite notifications
- Uses SendGrid for reliable delivery

### Slack Service
- Channel creation and management
- Member invitations
- Channel access control
- Workspace integration

### Admin Service
- Group approval/rejection
- User role management
- Platform monitoring

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
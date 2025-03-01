# Groopie - Slack Community Platform

Groopie is a platform that helps you create and manage monetized Slack communities. Create groups, set up subscription tiers, and automatically manage Slack channel access for your members.

## Features

- Create and manage Slack community groups
- Set up multiple subscription tiers
- Automated Slack channel creation and management
- Member invitation system
- Admin dashboard for group approvals

## Tech Stack

- Frontend: Next.js 14, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: Supabase (PostgreSQL)
- Integration: Slack API

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Slack workspace with admin access
- SMTP server for emails

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

## Environment Variables

### Backend
- `PORT`: Server port (default: 8000)
- `NODE_ENV`: Environment (development/production)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `SLACK_*`: Various Slack API credentials
- `SMTP_*`: Email server configuration

### Frontend
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `NEXT_PUBLIC_BACKEND_URL`: Backend API URL

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
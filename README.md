# FlowPilot - AI-Powered Productivity Assistant

FlowPilot is an intelligent productivity assistant that combines calendar integration, AI-powered task management, and behavioral analytics to help you focus on the right tasks at the right time.

## 🚀 Features

- **Smart Task Management** - AI-powered task prioritization and scheduling
- **Calendar Integration** - Google Calendar & Outlook sync
- **Daily Planner** - Timeline and focus views for optimal productivity
- **AI Assistant** - Chat-based productivity guidance
- **Behavioral Analytics** - Track productive hours and completion patterns
- **Micro Nudges** - Gentle insights to improve productivity habits

## 🛠️ Tech Stack

- **Frontend**: Next.js 13 (App Router), TypeScript, TailwindCSS
- **UI Components**: shadcn/ui, Radix UI, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI**: OpenAI GPT-4o for task analysis and assistant
- **Calendar APIs**: Google Calendar API, Microsoft Graph API
- **Payments**: Stripe
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key
- Google Cloud Console project (for Calendar API)
- Microsoft Azure app (for Outlook integration)
- Stripe account (for payments)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd flowpilot
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Google Calendar API
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Microsoft Graph API
MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret_here

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```

### 3. Database Setup

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database-schema.sql`
4. Run the SQL to create all tables and policies

### 4. Supabase Configuration

1. **Authentication Setup**:
   - Go to Authentication > Settings
   - Add your domain to "Site URL"
   - Configure Google OAuth provider
   - Configure Microsoft OAuth provider

2. **Storage Setup** (if needed):
   - Create a storage bucket for user uploads
   - Set up RLS policies

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
flowpilot/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── progress/          # Analytics & progress
│   ├── settings/          # User settings
│   └── upgrade/           # Payment/upgrade flow
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard-specific components
│   ├── landing/          # Landing page components
│   ├── ui/               # Reusable UI components
│   └── theme-provider.tsx
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── supabase.ts       # Supabase client & types
│   ├── tasks.ts          # Task management service
│   └── utils.ts          # General utilities
├── public/               # Static assets
└── database-schema.sql   # Database schema
```

## 🔧 Development

### Adding New Features

1. **Database Changes**: Update `database-schema.sql` and run in Supabase
2. **Types**: Update `lib/supabase.ts` with new table types
3. **Services**: Create service files in `lib/` for business logic
4. **Components**: Add components in appropriate `components/` subdirectory
5. **Pages**: Create pages in `app/` following Next.js 13 conventions

### Code Style

- Use TypeScript for all new code
- Follow the existing component patterns
- Use shadcn/ui components when possible
- Implement proper error handling
- Add loading states for async operations

### Testing

```bash
# Run linting
npm run lint

# Run type checking
npx tsc --noEmit
```

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

Make sure to set all environment variables in your production environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

## 📊 Analytics & Monitoring

- **Task Completion Rates**: Tracked in `task_logs` table
- **Productive Hours**: Calculated from completed task timestamps
- **User Engagement**: Daily active users and feature usage
- **Error Tracking**: Implement error boundaries and logging

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- OAuth authentication via Supabase
- Secure token storage for calendar integrations
- Input validation and sanitization
- CORS configuration for API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@flowpilot.com or join our Discord community.

## 🗺️ Roadmap

### Phase 1 (MVP) ✅
- [x] Basic task management
- [x] User authentication
- [x] Daily planner interface
- [x] AI assistant chat
- [x] Landing page

### Phase 2 (Calendar Integration)
- [ ] Google Calendar sync
- [ ] Outlook integration
- [ ] Smart scheduling
- [ ] Free time detection

### Phase 3 (Advanced Features)
- [ ] Voice input for tasks
- [ ] Advanced analytics
- [ ] Team collaboration
- [ ] Mobile apps

### Phase 4 (AI Enhancement)
- [ ] GPT-based coaching
- [ ] Predictive task scheduling
- [ ] Behavioral insights
- [ ] Personalized recommendations 
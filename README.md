# Client Onboarding OS

A SaaS platform that helps freelancers, consultants, and small agencies create structured client onboarding flows with branded portals, AI-assisted flow generation, and automated reminders.

## Features

### For Service Providers
- **Onboarding Flow Builder** - Create step-by-step onboarding flows with drag-and-drop reordering
- **Step Types**: Welcome, Form, File Upload, Contract, Schedule
- **AI Flow Generator** - Describe your service and get a suggested flow structure
- **Client Management** - Track clients and their onboarding progress
- **Workspace Branding** - Custom logo and brand colors for client portals
- **Automated Reminders** - Email notifications for inactive clients
- **Progress Dashboard** - Overview of all client onboarding statuses

### For Clients
- **Branded Portal** - Clean, professional onboarding experience
- **Progress Tracking** - Visual progress bar and step completion
- **No Account Required** - Access via unique link
- **Mobile Responsive** - Complete onboarding on any device

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **UI Components**: shadcn/ui, Radix UI, Lucide Icons
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **Email**: Resend (or mock in development)
- **AI**: OpenAI API (stubbed for development)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account (free tier works)
- Resend account for emails (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/client-onboarding-os.git
cd client-onboarding-os
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file:
```bash
cp .env.example .env.local
```

4. Configure environment variables in `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Provider (Resend)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=onboarding@yourdomain.com

# AI/LLM Configuration (optional - uses mock in development)
OPENAI_API_KEY=your-openai-api-key

# Cron Secret (for automated reminders)
CRON_SECRET=your-cron-secret
```

5. Set up the database:
   - Go to your Supabase project
   - Navigate to SQL Editor
   - Run the migration file: `supabase/migrations/001_initial_schema.sql`

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── api/              # API routes
│   │   ├── generate-flow/
│   │   ├── portal/
│   │   ├── send-reminder/
│   │   └── cron/
│   ├── c/[token]/        # Public client portal
│   └── dashboard/        # Provider dashboard
│       ├── clients/
│       ├── flows/
│       └── settings/
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard components
│   ├── flows/            # Flow builder components
│   ├── clients/          # Client management components
│   └── portal/           # Client portal components
│       └── steps/        # Step type components
├── lib/
│   ├── database.types.ts # TypeScript types
│   ├── email.ts          # Email utilities
│   ├── supabase/         # Supabase clients
│   └── utils.ts          # Helper functions
└── middleware.ts         # Auth middleware
```

## Database Schema

### Core Entities

- **profiles** - User profiles (extends Supabase auth)
- **workspaces** - Provider workspaces with branding
- **onboarding_flows** - Reusable onboarding templates
- **onboarding_steps** - Steps within flows (WELCOME, FORM, FILE_UPLOAD, CONTRACT, SCHEDULE)
- **clients** - Client records
- **client_onboardings** - Assigned onboarding instances
- **client_step_progress** - Individual step completion data
- **notification_logs** - Email notification history

## API Routes

### AI Flow Generator
```
POST /api/generate-flow
Body: { serviceDescription, clientType?, tone? }
Returns: { name, description, steps[] }
```

### Portal Endpoints
```
POST /api/portal/complete-step
Body: { token, stepProgressId, data }

POST /api/portal/upload-file
FormData: file, token, stepProgressId
```

### Notifications
```
POST /api/send-reminder
Body: { clientId }

GET /api/cron/send-reminders
Header: Authorization: Bearer {CRON_SECRET}
```

## Extending the Application

### Adding a New Step Type

1. Add the type to `src/lib/database.types.ts`:
```typescript
export type StepType = 'WELCOME' | 'FORM' | ... | 'YOUR_TYPE'
```

2. Create a step component in `src/components/portal/steps/`:
```typescript
export function YourTypeStep({ stepProgress, token, onComplete }) {
  // Implementation
}
```

3. Add to `src/components/portal/client-portal.tsx`:
```typescript
case 'YOUR_TYPE':
  return <YourTypeStep {...commonProps} />
```

4. Update the flow editor to support the new type

### Integrating Real AI

Replace the mock in `src/app/api/generate-flow/route.ts`:

```typescript
// Example with OpenAI
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function generateFlowWithAI(serviceDescription: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an onboarding flow designer..." },
      { role: "user", content: serviceDescription }
    ],
  })
  return JSON.parse(completion.choices[0].message.content)
}
```

### Configuring Email Provider

The app uses Resend by default. To use a different provider, update `src/lib/email.ts`:

```typescript
// Example with SendGrid
import sgMail from '@sendgrid/mail'

export async function sendEmail({ to, subject, html }) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  await sgMail.send({ to, from: process.env.EMAIL_FROM, subject, html })
}
```

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

### Cron Jobs

For automated reminders, set up a cron job:

**Vercel Cron (vercel.json)**:
```json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**External Cron**:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/send-reminders
```

## License

MIT License - see LICENSE file

## Contributing

Contributions are welcome! Please read our contributing guidelines first.

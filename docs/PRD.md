# PRD – Client Onboarding OS

## 1.1 Product overview

**Product name (working):** Client Onboarding OS

**One‑liner:** A simple, beautiful SaaS that gives freelancers, consultants, and small agencies a branded client onboarding portal with automation and AI‑generated onboarding flows.

### Problem
Onboarding new clients is chaotic: scattered emails, missing files, unclear expectations, manual chasing. It feels unprofessional and costs time, energy, and trust.

### Solution
A web app where:
- Service providers configure onboarding flows once.
- Clients get a clear, guided, branded portal to complete everything.
- Automations remind, nudge, and schedule.
- AI helps generate messaging and steps so setup is fast.

## 1.2 Target users & personas

### Persona 1 – Solo Consultant / Coach
- 1–10 active clients
- Onboards manually via email + docs
- Hates admin, wants to look "premium"
- Tools: Gmail, Calendly, Notion, Stripe

### Persona 2 – Micro‑agency Owner (2–10 people)
- Multiple clients per month
- Juggles different onboarding processes
- Wants consistency and delegation
- Tools: Slack, ClickUp, Google Drive, GSuite

## 1.3 Goals & success metrics

### Primary goals
- Reduce provider onboarding time per client by at least 5 hours.
- Increase client onboarding completion rate and speed.
- Make providers look more organized and professional.

### Key metrics
- Time to fully onboard a client (from invite to completion).
- % of onboardings completed without manual chasing.
- # of active onboarding flows per account.
- NPS / satisfaction for both providers and clients.

## 1.4 Core features (v1 scope)

### Provider side
- Account & workspace setup (signup, login, branding).
- **Onboarding Flow Builder:** step‑based flows with types:
  - Welcome message (text + video)
  - Forms (questions, fields)
  - File uploads
  - Contract / document acknowledgment (link or upload)
  - Schedule a call (link to Calendly or similar)
- **AI Onboarding Flow Generator:** given service description, generate a draft flow.
- **Client management:** list of clients, their onboarding status, access to each portal.
- **Notifications:** automatic email reminders when client inactive / incomplete.
- **Templates library:**
  - Coaching
  - Consulting
  - Agency services
  - Freelance creative
  - Generic "service" template

### Client side
- **Client portal (no login if possible):**
  - Personalized welcome
  - Clear multi‑step checklist
  - Forms, uploads, confirmations
  - Progress indicator
- **Email link access (magic link style):** client clicks email link → portal opens.

## 1.5 Out‑of‑scope for v1 (but future)
- Built‑in payments / invoicing.
- In‑app chat / messaging.
- Multi‑team roles & permissions.
- Deep integrations marketplace.
- White‑label domains.

## 1.6 Functional requirements

### FR‑1: Account & auth
- Provider can sign up with email + password.
- Provider can sign in/out.
- Provider can update profile and workspace branding (logo, colors, name).

### FR‑2: Onboarding flow management
- Provider can create, edit, duplicate, archive flows.
- Flow is composed of ordered steps (each step has a type and config).
- Supported step types:
  - Welcome (title, body, video URL)
  - Form (fields, validation)
  - File upload (instructions, required/optional)
  - Contract (description, link or upload, "I agree" checkbox)
  - Schedule (title, description, scheduling link)
- Flow can be saved as draft or published.

### FR‑3: AI flow generator
- Provider inputs: service type/description, preferred steps, tone.
- System generates a proposed flow outline and step content.
- Provider can edit generated content before publishing.

### FR‑4: Client management & invitations
- Provider can create a client record (name, email, service, assigned flow).
- System generates unique onboarding link per client.
- Provider can send invite email from app (or copy link).
- System tracks client onboarding progress and last activity.

### FR‑5: Client portal
- Client opens onboarding link without needing an account.
- Client sees:
  - Welcome area (provider branding)
  - Steps list with progress indicator
- Client can:
  - Fill forms
  - Upload files
  - Check contract acknowledgment
  - Mark steps complete
- Progress is stored and resumable.

### FR‑6: Notifications
- Provider receives notification when onboarding completes.
- Client receives automated reminder email if inactive for N days and not completed.

## 1.7 Non‑functional requirements
- **Performance:** portal loads under 2s on average broadband.
- **Security:** secure storage of files and PII (Supabase / equivalent best practices).
- **Reliability:** onboarding links must work reliably; handle partial progress gracefully.
- **Usability:** non‑technical users can create a basic flow in <10 minutes.
- **Brandability:** provider branding appears on client portal.

---

## 2. User flows & wireframes (end‑to‑end)

### 2.1 Flow A – Provider signs up and creates first onboarding flow with AI

**Steps:**
1. Provider lands on marketing site → clicks "Get Started".
2. Creates account (email, password).
3. Guided "first‑time setup" → enter business name, logo, colours.
4. Prompt: "Describe your service" → AI generates onboarding flow.
5. Provider reviews/edit flow steps.
6. Saves & publishes.

### 2.2 Flow B – Provider creates client & sends onboarding invite

**Steps:**
1. From dashboard, provider clicks "New Client".
2. Fills basic client info and selects flow.
3. System generates client onboarding link.
4. Provider sends email via app or copies link.
5. Client receives email and clicks link.

### 2.3 Flow C – Client completes onboarding via portal

**Steps:**
1. Client opens email.
2. Clicks "Start onboarding" → portal opens.
3. Sees welcome and list of steps.
4. Completes each step; progress updates.
5. On completion, sees "You're all set" and provider is notified.

### 2.4 Flow D – Provider tracks progress & nudges clients

**Steps:**
1. Provider logs into dashboard.
2. Sees list of clients with progress.
3. Clicks into a client to see step‑by‑step view.
4. Optionally triggers manual reminder or edits flow.

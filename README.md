# Used Car Deal Shield

AI-powered car deal analyzer that detects hidden fees, inflated markups, and provides negotiation scripts to help buyers save money.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite + TailwindCSS (CDN) |
| **Backend** | Supabase Edge Functions (Deno + Hono) |
| **Database** | Supabase PostgreSQL |
| **Auth** | Custom OTP via Resend + Supabase Auth |
| **AI** | Google Gemini 2.0 Flash |
| **Payments** | Stripe Checkout |
| **Storage** | Supabase Storage |
| **Deploy** | Vercel (frontend) + Supabase (backend) |

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────┐
│   React UI  │────▶│ Supabase Edge Fn │────▶│  Supabase DB  │
│  (Vite SPA) │     │  (Hono Router)   │     │  (PostgreSQL) │
└─────────────┘     └──────────────────┘     └───────────────┘
       │                    │ │
       │                    │ └──▶ Supabase Storage
       │                    │
       │                    ├──▶ Gemini AI (Parse/Analyze)
       │                    ├──▶ Stripe (Checkout/Webhook)
       └──▶ Supabase Auth   └──▶ Resend (Email OTP)
```

## User Flow

1. **Landing** → Upload deal sheet (PDF/photo)
2. **Upload** → File goes to Supabase Storage → Gemini AI parses document
3. **Preview** → Shows extracted vehicle info + risk alert
4. **Paywall** → $9.99 via Stripe Checkout
5. **Report** → Full analysis with red flags + negotiation scripts
6. **History** → View all past scans

## Setup Instructions

### 1. Frontend Environment

Create `.env.local`:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Database Setup

Run these SQL scripts in your Supabase SQL Editor (in order):

1. `schema.sql` — Creates tables (profiles, deals, reports, verification_codes) + RLS policies
2. `schema_patch.sql` — Adds verification_codes table
3. `schema_stripe_patch.sql` — Adds UNIQUE constraint on reports.deal_id + indexes

### 3. Storage Setup

Create a bucket named `deal_files` in Supabase Storage with authenticated upload access.

### 4. Backend Secrets

Set these in Supabase Edge Function secrets (`supabase secrets set`):

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_test_...) |
| `STRIPE_PRICE_ID` | Stripe Price ID for the $9.99 report |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `GEMINI_API_KEY` | Google AI Gemini API key |
| `RESEND_API_KEY` | Resend email API key |
| `FRONTEND_ORIGIN` | Your frontend URL (e.g. https://your-app.vercel.app) |
| `BACKEND_USER_PASSWORD` | Password for OTP-created user accounts |

### 5. Deploy Edge Functions

```bash
supabase functions deploy api
```

### 6. Stripe Webhook Setup

1. In Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://YOUR_PROJECT.supabase.co/functions/v1/api/stripe/webhook`
3. Listen for event: `checkout.session.completed`

### 7. Run Locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/otp/send` | No | Send OTP code to email |
| POST | `/auth/otp/verify` | No | Verify OTP and get session |
| POST | `/auth/admin/login` | No | Admin login |
| GET | `/me` | Yes | Get current user |
| POST | `/files/presign` | Yes | Get upload URL |
| POST | `/files/confirm` | Yes | Confirm file upload |
| POST | `/deals/parse` | Yes | Parse deal with Gemini |
| POST | `/deals/analyze` | Yes | Generate full analysis |
| POST | `/billing/checkout` | Yes | Create Stripe checkout |
| GET | `/billing/status` | No | Check payment status |
| POST | `/stripe/webhook` | Stripe | Handle payment events |

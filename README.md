# Used Car Deal Shield - Frontend & Backend

This project is a React frontend application integrated with Supabase for backend services (Auth, Database, Storage, Edge Functions).

## Setup Instructions

### 1. Environment Variables

Create `.env.local` in the root directory and add your Supabase project credentials:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Setup

Run the SQL script provided in `schema.sql` in your Supabase SQL Editor to creating the necessary tables and policies.

### 3. Storage Setup

Create a public bucket named `deal_files` in your Supabase Storage. You may need to configure RLS policies for uploads if not using public access.

### 4. Edge Functions

Deploy the Edge Functions located in `supabase/functions`:

```bash
supabase functions deploy parse-deal
supabase functions deploy analyze-deal
```

Make sure to set necessary environment secrets for your functions if required (e.g., OPENAI_API_KEY if you implement real AI analysis).

### 5. Running the App

```bash
npm install
npm run dev
```

## Features

- **Auth**: Magic Link login via Supabase Auth.
- **Upload**: Upload deal sheets to Supabase Storage.
- **Analysis**: Backend processing via Supabase Edge Functions.
- **History**: View past deals stored in Supabase Database.

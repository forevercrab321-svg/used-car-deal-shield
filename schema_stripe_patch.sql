-- Schema Patch: Stripe & Reports Integration
-- Run this in your Supabase SQL Editor

-- 1. Add UNIQUE constraint on reports.deal_id for upsert support
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reports_deal_id_key'
  ) THEN
    ALTER TABLE public.reports ADD CONSTRAINT reports_deal_id_key UNIQUE (deal_id);
  END IF;
END $$;

-- 2. Add index on deals.stripe_session_id for webhook lookups
CREATE INDEX IF NOT EXISTS idx_deals_stripe_session_id ON public.deals(stripe_session_id);

-- 3. Add index on deals.user_id for faster history queries
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON public.deals(user_id);

-- 4. Add insert policy for reports (Edge Function uses service role, but just in case)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Service can insert reports'
  ) THEN
    CREATE POLICY "Service can insert reports" ON public.reports
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

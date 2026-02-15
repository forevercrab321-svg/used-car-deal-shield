-- Create Verification Codes table if it doesn't exist
create table if not exists public.verification_codes (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  code text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default timezone('utc'::text, now() + interval '15 minutes') not null
);

-- Enable RLS
alter table public.verification_codes enable row level security;
-- No policies needed as we only access via Service Role in Edge Function

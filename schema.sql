-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Extends auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  credits integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using ( auth.uid() = id );
create policy "Users can update own profile" on public.profiles for update using ( auth.uid() = id );

-- Handle new user creation
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, credits)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 0);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- DEALS
create table public.deals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  file_path text,
  file_name text,
  vehicle_type text check (vehicle_type in ('new', 'used', 'lease')),
  zip_code text,
  status text check (status in ('uploaded', 'parsed', 'analyzed')) default 'uploaded',
  extracted_fields jsonb,
  preview_data jsonb,
  
  -- Payment fields
  paid boolean default false,
  paid_at timestamp with time zone,
  amount_cents integer,
  stripe_session_id text,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.deals enable row level security;
create policy "Users can view own deals" on public.deals for select using ( auth.uid() = user_id );
create policy "Users can insert own deals" on public.deals for insert with check ( auth.uid() = user_id );
create policy "Users can update own deals" on public.deals for update using ( auth.uid() = user_id );

-- REPORTS
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  deal_id uuid references public.deals(id) not null,
  score integer,
  category text,
  red_flags jsonb,
  negotiation_script jsonb,
  summary text,
  target_otd_range jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.reports enable row level security;
create policy "Users can view reports for their deals" on public.reports for select using ( exists ( select 1 from public.deals where deals.id = reports.deal_id and deals.user_id = auth.uid() ) );

-- Verification Codes for Custom Auth
create table if not exists public.verification_codes (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  code text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default timezone('utc'::text, now() + interval '15 minutes') not null
);

-- RLS for verification codes (Only service role should access usually, but for safety)
alter table public.verification_codes enable row level security;
-- No public access policies, strictly backend accessed

-- STORAGE (Uncomment if running in Editor)
-- insert into storage.buckets (id, name, public) values ('deal_files', 'deal_files', true);
-- create policy "Authenticated users can upload" on storage.objects for insert to authenticated with check ( bucket_id = 'deal_files' and auth.uid() = owner );
-- create policy "Users can view own files" on storage.objects for select to authenticated using ( bucket_id = 'deal_files' and auth.uid() = owner );

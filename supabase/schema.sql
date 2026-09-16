-- M_Tracker database schema.
-- Paste this into the Supabase SQL editor and run it once.
--
-- Privacy model: this is a private two-person app whose "secret" is the project
-- URL + anon key. RLS is enabled with open policies so the app works without a
-- login screen. If you want stronger protection later, add Supabase Auth and
-- restrict these policies to authenticated users.

create extension if not exists "pgcrypto";

-- People being tracked (typically two).
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#e11d48',
  -- Which person this is in the shared account: 'tracked' (the cycle shown as
  -- "her view") or 'partner' (the follower, "his view"). The app keys the two
  -- views off this, never off row order — profiles seeded together can tie on
  -- created_at, whose ordering SQL does not define.
  role text,
  default_cycle_length int not null default 28,
  default_period_length int not null default 5,
  luteal_length int not null default 14,
  created_at timestamptz not null default now()
);

-- Idempotent for installs created before the role column existed.
alter table public.profiles add column if not exists role text;

-- One row per logged period. A "cycle" spans one start_date to the next.
create table if not exists public.cycles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  end_date date,
  note text,
  created_at timestamptz not null default now(),
  unique (profile_id, start_date)
);

create index if not exists cycles_profile_start_idx
  on public.cycles (profile_id, start_date);

-- Enable RLS + open policies (see privacy note above).
alter table public.profiles enable row level security;
alter table public.cycles enable row level security;

drop policy if exists "profiles open" on public.profiles;
create policy "profiles open" on public.profiles
  for all using (true) with check (true);

drop policy if exists "cycles open" on public.cycles;
create policy "cycles open" on public.cycles
  for all using (true) with check (true);

-- Realtime: let the client subscribe to cycle changes.
alter publication supabase_realtime add table public.cycles;

-- Seed the two people (edit names / colors to taste).
insert into public.profiles (name, color, role, default_cycle_length, default_period_length, luteal_length)
values
  ('Partner A', '#e11d48', 'tracked', 28, 5, 14),
  ('Partner B', '#6366f1', 'partner', 30, 4, 14)
on conflict do nothing;

-- Backfill roles for installs seeded before the role column existed.
update public.profiles set role = 'tracked' where name = 'Partner A' and role is null;
update public.profiles set role = 'partner' where name = 'Partner B' and role is null;

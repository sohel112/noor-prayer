-- Noor cloud backup schema.
-- Run in Supabase: SQL Editor, or `supabase db push` with the Supabase CLI.
-- Privacy: Row Level Security ensures a user can ONLY read/write their own rows.

-- 1. Profiles (one row per user, mirrors auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

-- 2. Prayer logs (one row per user per day)
create table if not exists public.prayer_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  prayers jsonb not null default '{}'::jsonb,  -- { fajr: true, dhuhr: false, ... }
  uzr boolean not null default false,          -- excused day (e.g. menstruation)
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- 3. Quran bookmarks
create table if not exists public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  surah int not null,
  ayah int not null,
  created_at timestamptz not null default now(),
  primary key (user_id, surah, ayah)
);

-- 4. Tasbih counters
create table if not exists public.tasbih (
  user_id uuid primary key references auth.users(id) on delete cascade,
  counts jsonb not null default '{}'::jsonb,   -- { dhikrId: count }
  updated_at timestamptz not null default now()
);

-- 5. App settings snapshot
create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security: users see only their own data. Never shared, never sold.
alter table public.profiles   enable row level security;
alter table public.prayer_logs enable row level security;
alter table public.bookmarks  enable row level security;
alter table public.tasbih      enable row level security;
alter table public.settings    enable row level security;

create policy "own profile"      on public.profiles   for all using (auth.uid() = id)               with check (auth.uid() = id);
create policy "own prayer_logs"  on public.prayer_logs for all using (auth.uid() = user_id)          with check (auth.uid() = user_id);
create policy "own bookmarks"    on public.bookmarks  for all using (auth.uid() = user_id)          with check (auth.uid() = user_id);
create policy "own tasbih"       on public.tasbih      for all using (auth.uid() = user_id)          with check (auth.uid() = user_id);
create policy "own settings"     on public.settings    for all using (auth.uid() = user_id)          with check (auth.uid() = user_id);

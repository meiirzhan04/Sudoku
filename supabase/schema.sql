create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  username text unique,
  city text,
  avatar_url text,
  language text not null default 'en' check (language in ('en', 'ru', 'kk')),
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  is_pro boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  puzzle jsonb not null,
  solution jsonb not null,
  entries jsonb not null,
  notes jsonb not null default '{}'::jsonb,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard', 'expert')),
  elapsed_seconds integer not null default 0,
  mistakes integer not null default 0,
  accuracy numeric not null default 100,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_puzzles (
  puzzle_date date primary key,
  seed text not null,
  puzzle jsonb not null,
  solution jsonb not null,
  difficulty text not null default 'medium',
  created_at timestamptz not null default now()
);

create table if not exists public.daily_results (
  id uuid primary key default gen_random_uuid(),
  puzzle_date date not null references public.daily_puzzles(puzzle_date) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  username text not null default 'Guest',
  city text,
  elapsed_seconds integer not null,
  mistakes integer not null,
  accuracy numeric not null,
  is_pro boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_hint_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  game_id uuid,
  locale text not null check (locale in ('en', 'ru', 'kk')),
  prompt jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists games_user_created_idx on public.games(user_id, created_at desc);
create index if not exists daily_results_date_rank_idx
  on public.daily_results(puzzle_date, elapsed_seconds asc, mistakes asc, accuracy desc);
create index if not exists daily_results_city_idx on public.daily_results(city);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists games_set_updated_at on public.games;
create trigger games_set_updated_at
before update on public.games
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, username, city, avatar_url, language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'city',
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(new.raw_user_meta_data ->> 'language', 'en')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.daily_puzzles enable row level security;
alter table public.daily_results enable row level security;
alter table public.ai_hint_events enable row level security;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);

drop policy if exists "games own all" on public.games;
create policy "games own all" on public.games for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "daily puzzles readable" on public.daily_puzzles;
create policy "daily puzzles readable" on public.daily_puzzles for select using (true);

drop policy if exists "daily results readable" on public.daily_results;
create policy "daily results readable" on public.daily_results for select using (true);

drop policy if exists "daily results insert own" on public.daily_results;
create policy "daily results insert own" on public.daily_results for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "ai hint events insert own" on public.ai_hint_events;
create policy "ai hint events insert own" on public.ai_hint_events for insert with check (auth.uid() = user_id or user_id is null);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatar read public" on storage.objects;
create policy "avatar read public" on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists "avatar upload own" on storage.objects;
create policy "avatar upload own" on storage.objects
for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "avatar update own" on storage.objects;
create policy "avatar update own" on storage.objects
for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- MedDraw initial schema
create extension if not exists "pgcrypto";

-- Profiles mirror of auth.users for display data
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  nickname     text not null,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- One row per player per completed game (guests allowed: user_id may be null)
create table if not exists public.leaderboard_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete set null,
  nickname     text not null,
  score        int  not null,
  room_name    text,
  played_at    timestamptz not null default now()
);

create index if not exists leaderboard_entries_user_idx on public.leaderboard_entries(user_id);
create index if not exists leaderboard_entries_played_at_idx on public.leaderboard_entries(played_at desc);

-- Aggregate view for the leaderboard page
create or replace view public.leaderboard_all_time as
select
  coalesce(user_id::text, 'guest:' || nickname) as player_key,
  nickname,
  sum(score)::int as total_score,
  count(*)::int   as games_played,
  max(score)::int as best_single_game
from public.leaderboard_entries
group by player_key, nickname
order by total_score desc
limit 100;

-- RLS
alter table public.profiles enable row level security;
alter table public.leaderboard_entries enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "Leaderboard entries are viewable by everyone" on public.leaderboard_entries;
create policy "Leaderboard entries are viewable by everyone"
  on public.leaderboard_entries for select using (true);

-- updated_at trigger
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Player')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

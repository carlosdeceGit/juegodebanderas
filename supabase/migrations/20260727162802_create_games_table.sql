create table public.games (
  id uuid primary key default gen_random_uuid(),
  player text not null,
  level text not null check (level in ('nene','principiante','experto','dios')),
  score int not null,
  rounds int not null,
  errors int not null default 0,
  daily boolean not null default false,
  daily_date date,
  created_at timestamptz not null default now()
);

create index games_player_idx on public.games (player);
create index games_level_idx on public.games (level);
create index games_daily_idx on public.games (daily_date) where daily;

alter table public.games enable row level security;
-- Sin políticas para anon/authenticated: solo el backend (service role) puede leer/escribir.

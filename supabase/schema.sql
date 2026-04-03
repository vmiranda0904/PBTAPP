create extension if not exists "pgcrypto";

create table if not exists athletes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position text,
  score numeric default 0,
  highlight_url text
);

create table if not exists stats (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes(id) on delete cascade,
  spikes int default 0,
  sets int default 0,
  serves int default 0,
  errors int default 0
);

create index if not exists stats_athlete_id_idx on stats (athlete_id);

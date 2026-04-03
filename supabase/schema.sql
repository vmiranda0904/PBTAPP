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

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_email text not null,
  plan_key text not null,
  status text not null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  price_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists subscriptions_customer_email_idx on subscriptions (customer_email);

create table if not exists jobs (
  id uuid primary key,
  user_id text not null,
  team_id text not null,
  status text not null,
  processing_stage text,
  sport text not null,
  team_name text not null default 'Opponent team',
  file_name text not null,
  content_type text,
  file_size_bytes int default 0,
  storage_path text,
  video_url text,
  report_storage_path text,
  pdf_storage_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  completed_at timestamptz,
  last_error_at timestamptz,
  video_hash text,
  error text,
  retry_count int not null default 0,
  max_retries int not null default 0,
  timings_ms jsonb not null default '{}'::jsonb,
  result jsonb,
  result_url text,
  download_url text,
  pdf_report_url text
);

create index if not exists jobs_user_id_idx on jobs (user_id);
create index if not exists jobs_team_id_idx on jobs (team_id);
create index if not exists jobs_status_idx on jobs (status);

alter table if exists jobs add column if not exists progress int not null default 0;

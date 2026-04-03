create extension if not exists pgcrypto;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  team_id text not null,
  status text not null check (status in ('queued', 'processing', 'completed', 'failed')),
  processing_stage text not null default 'accepted',
  sport text not null,
  team_name text not null,
  file_name text not null,
  content_type text not null default 'application/octet-stream',
  file_size_bytes bigint not null default 0,
  storage_path text,
  video_url text,
  report_storage_path text,
  pdf_storage_path text,
  video_hash text,
  error text,
  retry_count integer not null default 0,
  max_retries integer not null default 0,
  timings_ms jsonb not null default '{}'::jsonb,
  result jsonb,
  result_url text,
  download_url text,
  pdf_report_url text,
  started_at timestamptz,
  completed_at timestamptz,
  last_error_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_status_idx on public.jobs (status, created_at desc);
create index if not exists jobs_owner_idx on public.jobs (user_id, team_id, created_at desc);
create index if not exists jobs_video_hash_idx on public.jobs (video_hash) where video_hash is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

 drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;

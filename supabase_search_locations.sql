-- Google Places search cache for Charter Keke Lagos booking search.
-- Run this in the Supabase SQL editor.

create extension if not exists pg_trgm;

create table if not exists public.search_locations (
  id uuid primary key default gen_random_uuid(),
  place_id text not null unique,
  name text not null,
  formatted_address text not null,
  latitude double precision not null,
  longitude double precision not null,
  search_keywords text not null default '',
  usage_count integer not null default 0,
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists search_locations_keywords_trgm_idx
  on public.search_locations using gin (search_keywords gin_trgm_ops);

create index if not exists search_locations_name_trgm_idx
  on public.search_locations using gin (name gin_trgm_ops);

create index if not exists search_locations_address_trgm_idx
  on public.search_locations using gin (formatted_address gin_trgm_ops);

create index if not exists search_locations_usage_idx
  on public.search_locations (usage_count desc, last_used_at desc);

create or replace function public.increment_search_location_usage(target_place_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.search_locations
  set
    usage_count = usage_count + 1,
    last_used_at = now()
  where place_id = target_place_id;
end;
$$;

alter table public.search_locations enable row level security;

drop policy if exists "Anyone can read cached search locations" on public.search_locations;
create policy "Anyone can read cached search locations"
  on public.search_locations
  for select
  using (true);

drop policy if exists "Anyone can cache search locations" on public.search_locations;
create policy "Anyone can cache search locations"
  on public.search_locations
  for insert
  with check (true);

drop policy if exists "Anyone can refresh cached search locations" on public.search_locations;
create policy "Anyone can refresh cached search locations"
  on public.search_locations
  for update
  using (true)
  with check (true);

grant execute on function public.increment_search_location_usage(text) to anon, authenticated;

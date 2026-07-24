create table public.template_entries (
  id text primary key,
  source text not null check (source in ('built-in', 'added')),
  enabled boolean not null default true,
  weight numeric,
  time_of_day text[],
  template_json jsonb,
  added_at timestamptz not null default now()
);

alter table public.template_entries enable row level security;

create policy "Public read access"
  on public.template_entries
  for select
  to anon, authenticated
  using (true);

grant usage on schema public to anon, authenticated;
grant select on public.template_entries to anon, authenticated;

-- service_role bypasses RLS but still needs the base table grant.
grant usage on schema public to service_role;
grant select, insert, update, delete on public.template_entries to service_role;

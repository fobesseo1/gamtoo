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

-- ============================================================
-- Posters (see docs/gamtoo-item-system.md 4.0) — Google-login-only,
-- replaces the old browser-local IndexedDB store. Every row/object is
-- owned by exactly one auth.users row; RLS restricts each user to their
-- own rows and their own Storage folder.
-- ============================================================

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  created_at timestamptz not null default now(),
  has_photo boolean not null default false,
  template_id text not null,
  category text not null,
  user_text text,
  location text,
  image_path text not null       -- path inside the "posters" Storage bucket
);

alter table public.posts enable row level security;

create policy "Users can read own posts"
  on public.posts for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own posts"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own posts"
  on public.posts for delete
  to authenticated
  using (auth.uid() = user_id);

grant usage on schema public to authenticated;
grant select, insert, delete on public.posts to authenticated;

-- Private bucket (not public) -- images are only ever served via short-lived
-- signed URLs generated for the owning user, not by guessable public path.
insert into storage.buckets (id, name, public)
values ('posters', 'posters', false)
on conflict (id) do nothing;

-- Objects are stored at "{user_id}/{post_id}.png" -- storage.foldername(name)
-- splits that path, so [1] is the user_id segment.
create policy "Users can read own poster images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'posters' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload own poster images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'posters' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own poster images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'posters' and (storage.foldername(name))[1] = auth.uid()::text);

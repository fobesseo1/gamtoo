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

-- ============================================================
-- Item system, Phase 1 step (1) (see docs/gamtoo-item-system.md 4/9) --
-- items master + user_items collection + profiles (main character,
-- amaze_count, last_drop_date). Drop probability/Edge Function come in a
-- later step; this is just the tables + one seeded item (the crown).
-- ============================================================

create table public.items (
  id           text primary key,        -- 'hat_crown'
  name         text not null,           -- '왕관'
  category     text not null,           -- 'hat' (room for 'glasses', 'scarf' later)
  rarity       text not null check (rarity in ('common', 'rare', 'legendary', 'hidden')),
  is_colorable boolean not null,
  svg_path     text not null,
  sort_order   int
);

alter table public.items enable row level security;

create policy "Authenticated users can read items"
  on public.items for select
  to authenticated
  using (true);

grant usage on schema public to authenticated;
grant select on public.items to authenticated;

insert into public.items (id, name, category, rarity, is_colorable, svg_path, sort_order)
values ('hat_crown', '왕관', 'hat', 'legendary', false, '/hats/hat_crown.svg', 1);

create table public.user_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  item_id     text references public.items not null,
  color_hex   text,                      -- null when items.is_colorable = false
  acquired_at timestamptz not null default now(),
  post_id     uuid references public.posts,  -- which record this dropped from
  unique (user_id, item_id, color_hex)
);

alter table public.user_items enable row level security;

create policy "Users can read own items"
  on public.user_items for select
  to authenticated
  using (auth.uid() = user_id);

-- No client-side insert policy: user_items rows are only ever written by
-- the drop Edge Function (service_role), never directly by the client --
-- see the drop-logic step of this same Phase 1 plan.
grant select on public.user_items to authenticated;

create table public.profiles (
  id             uuid primary key references auth.users on delete cascade,
  main_character text not null default 'bear'
                 check (main_character in ('seal', 'panda', 'bichon', 'bear', 'mochi')),
  amaze_count    int not null default 0,
  last_drop_date date,
  created_at     timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Belt-and-suspenders alongside the trigger below: the client upserts
-- rather than assumes a row always exists, in case the trigger hasn't run
-- yet for some reason.
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

grant select, insert, update on public.profiles to authenticated;

-- Auto-creates a profiles row the moment a new auth.users row appears (i.e.
-- on first Google login) -- security definer because inserting into
-- public.profiles from a trigger owned by the auth schema needs elevated
-- privilege; nothing about this is reachable from the client.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill for any auth.users rows created before this trigger existed
-- (e.g. accounts from testing the Google login step earlier).
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

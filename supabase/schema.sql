-- =========================================================
--  Mubas Group — Supabase schema
--  Run this in your Supabase SQL Editor.
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------- USER ROLES ----------
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role    text not null check (role in ('admin'))
);
alter table public.user_roles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

drop policy if exists "user_roles read own" on public.user_roles;
create policy "user_roles read own" on public.user_roles
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------- TEAM ----------
create table if not exists public.team (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  role        text,
  bio         text,
  photo       text
);
alter table public.team enable row level security;

drop policy if exists "team read all" on public.team;
create policy "team read all" on public.team
  for select using (true);

drop policy if exists "team write admin" on public.team;
create policy "team write admin" on public.team
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- JOBS ----------
create table if not exists public.jobs (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  type        text,
  location    text,
  deadline    date,
  description text,
  created_at  timestamptz not null default now()
);
alter table public.jobs enable row level security;

drop policy if exists "jobs read all" on public.jobs;
create policy "jobs read all" on public.jobs
  for select using (true);

drop policy if exists "jobs write admin" on public.jobs;
create policy "jobs write admin" on public.jobs
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- GALLERY ----------
create table if not exists public.gallery (
  id          uuid primary key default gen_random_uuid(),
  asset       text,
  caption     text,
  credit      text,
  is_official boolean not null default false,
  status      text not null default 'approved' check (status in ('pending', 'approved')),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
alter table public.gallery enable row level security;

drop policy if exists "gallery read all" on public.gallery;
drop policy if exists "gallery read approved" on public.gallery;
create policy "gallery read approved" on public.gallery
  for select using (status = 'approved' or public.is_admin());

drop policy if exists "gallery write admin" on public.gallery;
drop policy if exists "gallery insert authed" on public.gallery;
create policy "gallery insert authed" on public.gallery
  for insert to authenticated with check (
    public.is_admin()
    or (
      uploaded_by = (select auth.uid())
      and status = 'pending'
      and is_official = false
    )
  );

drop policy if exists "gallery update admin" on public.gallery;
create policy "gallery update admin" on public.gallery
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "gallery delete admin" on public.gallery;
create policy "gallery delete admin" on public.gallery
  for delete using (public.is_admin());

-- ---------- APPLICATIONS ----------
create table if not exists public.applications (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  job_id      uuid references public.jobs(id) on delete cascade,
  job_title   text not null,
  message     text not null,
  status      text not null default 'pending' check (status in ('pending', 'received')),
  user_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
alter table public.applications enable row level security;

drop policy if exists "applications insert anyone" on public.applications;
create policy "applications insert anyone" on public.applications
  for insert with check (
    status = 'pending'
    and (user_id is null or user_id = (select auth.uid()))
  );

drop policy if exists "applications read admin" on public.applications;
create policy "applications read admin" on public.applications
  for select using (public.is_admin());

drop policy if exists "applications delete admin" on public.applications;
create policy "applications delete admin" on public.applications
  for delete using (public.is_admin());

-- ---------- GRANTS (Required for simple users & admins) ----------
grant usage on schema public to anon, authenticated;

-- Public (anon & authenticated) read access
grant select on public.jobs to anon, authenticated;
grant select on public.team to anon, authenticated;
grant select on public.gallery to anon, authenticated;
grant insert on public.applications to anon, authenticated;

-- Authenticated write access (controlled by RLS policies above)
grant all on public.jobs to authenticated;
grant all on public.team to authenticated;
grant all on public.gallery to authenticated;
grant all on public.applications to authenticated;
grant select on public.user_roles to authenticated;

-- ---------- STORAGE BUCKET & POLICIES ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery',
  'gallery',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set public = true;

drop policy if exists "gallery bucket public read" on storage.objects;
create policy "gallery bucket public read" on storage.objects
  for select using (bucket_id = 'gallery');

drop policy if exists "gallery bucket admin write" on storage.objects;
drop policy if exists "gallery bucket authed write" on storage.objects;
create policy "gallery bucket authed write" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'gallery'
    and (public.is_admin() or name like 'gallery/user-%')
  );

drop policy if exists "gallery bucket admin update" on storage.objects;
create policy "gallery bucket admin update" on storage.objects
  for update using (bucket_id = 'gallery' and public.is_admin())
  with check (bucket_id = 'gallery' and public.is_admin());

drop policy if exists "gallery bucket admin delete" on storage.objects;
create policy "gallery bucket admin delete" on storage.objects
  for delete using (bucket_id = 'gallery' and public.is_admin());

-- ---------- PROMOTE ADMIN USER ----------
-- To promote any registered user to admin, run:
-- insert into public.user_roles (user_id, role)
-- select id, 'admin' from auth.users where email = 'YOUR_EMAIL@HERE.COM'
-- on conflict (user_id) do update set role = excluded.role;

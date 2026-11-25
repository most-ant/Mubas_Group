-- =========================================================
-- Migration: Collaborators Table & Permissions
-- Run this script in your Supabase SQL Editor.
-- =========================================================

create table if not exists public.collaborators (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  caption     text,
  image       text,
  created_at  timestamptz not null default now()
);

alter table public.collaborators enable row level security;

-- Read policy: Anyone (anon and authenticated) can view collaborators
drop policy if exists "collaborators read all" on public.collaborators;
create policy "collaborators read all" on public.collaborators
  for select using (true);

-- Write policy: Only admins can insert, update, or delete collaborators
drop policy if exists "collaborators write admin" on public.collaborators;
create policy "collaborators write admin" on public.collaborators
  for all using (public.is_admin()) with check (public.is_admin());

-- Grants
grant select on public.collaborators to anon, authenticated;
grant all on public.collaborators to authenticated;

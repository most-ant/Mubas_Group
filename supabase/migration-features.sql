-- =========================================================
--  Migration: Messages, Notifications, Application status
--  Run this in your Supabase SQL Editor AFTER schema.sql.
-- =========================================================

-- ---------- 1. APPLICATION STATUS ----------
alter table public.applications
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'received')),
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- Allow admin to update applications (for marking received)
drop policy if exists "applications update admin" on public.applications;
create policy "applications update admin" on public.applications
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------- 2. MESSAGES ----------
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  user_email  text not null,
  content     text not null,
  admin_reply text,
  created_at  timestamptz not null default now(),
  replied_at  timestamptz
);
alter table public.messages enable row level security;

-- Users can insert messages when authenticated
drop policy if exists "messages insert authed" on public.messages;
create policy "messages insert authed" on public.messages
  for insert to authenticated with check (user_id = (select auth.uid()));

-- Users can read their own messages, admin can read all
drop policy if exists "messages read own or admin" on public.messages;
create policy "messages read own or admin" on public.messages
  for select using (user_id = (select auth.uid()) or public.is_admin());

-- Admin can update messages (for replies)
drop policy if exists "messages update admin" on public.messages;
create policy "messages update admin" on public.messages
  for update using (public.is_admin()) with check (public.is_admin());

-- Admin can delete messages
drop policy if exists "messages delete admin" on public.messages;
create policy "messages delete admin" on public.messages
  for delete using (public.is_admin());

-- ---------- 3. NOTIFICATIONS ----------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  type       text not null,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;

-- Users can read their own notifications
drop policy if exists "notifications read own" on public.notifications;
create policy "notifications read own" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));

-- Admin can insert notifications (server actions run as authenticated admin)
drop policy if exists "notifications insert admin" on public.notifications;
create policy "notifications insert admin" on public.notifications
  for insert to authenticated with check (public.is_admin());

-- Users can update their own notifications (to mark as read)
drop policy if exists "notifications update own" on public.notifications;
create policy "notifications update own" on public.notifications
  for update to authenticated using (user_id = (select auth.uid()));

-- Admin can also insert notifications for any user
drop policy if exists "notifications delete own" on public.notifications;
create policy "notifications delete own" on public.notifications
  for delete to authenticated using (user_id = (select auth.uid()) or public.is_admin());

-- ---------- GRANTS ----------
grant all on public.messages to authenticated;
grant all on public.notifications to authenticated;
grant all on public.applications to authenticated;

-- Public application submissions cannot set privileged state or another user's ID.
drop policy if exists "applications insert anyone" on public.applications;
create policy "applications insert anyone" on public.applications
  for insert with check (
    status = 'pending'
    and (user_id is null or user_id = (select auth.uid()))
  );

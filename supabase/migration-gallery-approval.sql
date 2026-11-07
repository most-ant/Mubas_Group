-- =========================================================
--  Gallery approval workflow migration
--  Run this in your Supabase SQL Editor AFTER schema.sql.
--  Adds status + uploaded_by columns and updates RLS policies
--  so signed-in users can upload photos pending admin approval.
-- =========================================================

-- 1. Add new columns
alter table public.gallery
  add column if not exists status text not null default 'approved'
    check (status in ('pending', 'approved')),
  add column if not exists uploaded_by uuid references auth.users(id) on delete set null;

-- 2. Mark all existing rows as approved (they were admin-uploaded)
update public.gallery set status = 'approved' where status is null;

-- 3. Update RLS policies

-- Everyone can read approved images
drop policy if exists "gallery read all" on public.gallery;
create policy "gallery read approved" on public.gallery
  for select using (status = 'approved' or public.is_admin());

-- Authenticated users can insert (status will be set by the app)
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

-- Only admin can update (for approving / rejecting)
drop policy if exists "gallery update admin" on public.gallery;
create policy "gallery update admin" on public.gallery
  for update using (public.is_admin()) with check (public.is_admin());

-- Only admin can delete
drop policy if exists "gallery delete admin" on public.gallery;
create policy "gallery delete admin" on public.gallery
  for delete using (public.is_admin());

-- 4. Update storage policies so authenticated users can upload to the gallery bucket
drop policy if exists "gallery bucket admin write" on storage.objects;
drop policy if exists "gallery bucket authed write" on storage.objects;
create policy "gallery bucket authed write" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'gallery'
    and (public.is_admin() or name like 'gallery/user-%')
  );

-- Admin-only update and delete remain
drop policy if exists "gallery bucket admin update" on storage.objects;
create policy "gallery bucket admin update" on storage.objects
  for update using (bucket_id = 'gallery' and public.is_admin())
  with check (bucket_id = 'gallery' and public.is_admin());

drop policy if exists "gallery bucket admin delete" on storage.objects;
create policy "gallery bucket admin delete" on storage.objects
  for delete using (bucket_id = 'gallery' and public.is_admin());

-- 5. Grant insert on gallery to authenticated (if not already)
grant insert on public.gallery to authenticated;

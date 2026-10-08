-- V4 media migration: video/image thumbnails
alter table public.content add column if not exists thumbnail_path text;
insert into storage.buckets(id,name,public) values('content-thumbnails','content-thumbnails',true) on conflict(id) do update set public=true;
drop policy if exists content_thumbnails_public_read on storage.objects;
create policy content_thumbnails_public_read on storage.objects for select to public using(bucket_id='content-thumbnails');
drop policy if exists content_thumbnails_admin_insert on storage.objects;
create policy content_thumbnails_admin_insert on storage.objects for insert to authenticated with check(bucket_id='content-thumbnails' and public.is_admin());
drop policy if exists content_thumbnails_admin_update on storage.objects;
create policy content_thumbnails_admin_update on storage.objects for update to authenticated using(bucket_id='content-thumbnails' and public.is_admin()) with check(bucket_id='content-thumbnails' and public.is_admin());
drop policy if exists content_thumbnails_admin_delete on storage.objects;
create policy content_thumbnails_admin_delete on storage.objects for delete to authenticated using(bucket_id='content-thumbnails' and public.is_admin());

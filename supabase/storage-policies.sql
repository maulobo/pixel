-- Pixel: uploader de imagenes para admin
-- Bucket esperado: pixel-gallery
-- Admin habilitado: maurolobo.ml@gmail.com

-- 1. Tabla simple de admins por email
create table if not exists public.admin_users (
  email text primary key
);

insert into public.admin_users (email)
values ('maurolobo.ml@gmail.com')
on conflict (email) do nothing;

-- 2. Policies para Storage
-- Nota: estas policies aplican sobre storage.objects
-- y asumen que ya existe un bucket llamado `pixel-gallery`.
-- Importante: las tablas publicas de la app (config, categorias, modelos, unidades)
-- tambien deben permitir SELECT para `authenticated`, porque al loguearte en /admin/upload
-- el cliente deja de consultar como `anon`.

create policy "Public can read pixel gallery"
on storage.objects
for select
to public
using (bucket_id = 'pixel-gallery');

create policy "Admin can upload pixel gallery"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'pixel-gallery'
  and exists (
    select 1
    from public.admin_users
    where lower(email) = lower(auth.jwt()->>'email')
  )
);

create policy "Admin can update pixel gallery"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'pixel-gallery'
  and exists (
    select 1
    from public.admin_users
    where lower(email) = lower(auth.jwt()->>'email')
  )
)
with check (
  bucket_id = 'pixel-gallery'
  and exists (
    select 1
    from public.admin_users
    where lower(email) = lower(auth.jwt()->>'email')
  )
);

create policy "Admin can delete pixel gallery"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'pixel-gallery'
  and exists (
    select 1
    from public.admin_users
    where lower(email) = lower(auth.jwt()->>'email')
  )
);

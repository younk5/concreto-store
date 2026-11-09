create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric null,
  category text null,
  image_url text not null,
  image_path text not null,
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint products_price_check check (price is null or price >= 0)
);

alter table public.products enable row level security;

drop policy if exists "products_public_read_active" on public.products;
drop policy if exists "products_auth_read_all" on public.products;
drop policy if exists "products_auth_insert" on public.products;
drop policy if exists "products_auth_update" on public.products;
drop policy if exists "products_auth_delete" on public.products;

create policy "products_public_read_active"
on public.products
for select
using (active = true);

create policy "products_auth_read_all"
on public.products
for select
to authenticated
using (true);

create policy "products_auth_insert"
on public.products
for insert
to authenticated
with check (true);

create policy "products_auth_update"
on public.products
for update
to authenticated
using (true)
with check (true);

create policy "products_auth_delete"
on public.products
for delete
to authenticated
using (true);

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

create index if not exists products_active_created_idx
on public.products (active, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 5242880, array['image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "products_storage_public_read" on storage.objects;
drop policy if exists "products_storage_auth_insert" on storage.objects;
drop policy if exists "products_storage_auth_update" on storage.objects;
drop policy if exists "products_storage_auth_delete" on storage.objects;

create policy "products_storage_public_read"
on storage.objects
for select
using (bucket_id = 'products');

create policy "products_storage_auth_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'products');

create policy "products_storage_auth_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'products')
with check (bucket_id = 'products');

create policy "products_storage_auth_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'products');

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@loja.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
where not exists (
  select 1 from auth.users where email = 'admin@loja.com'
);

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  u.id::text,
  now(),
  now(),
  now()
from auth.users u
where u.email = 'admin@loja.com'
and not exists (
  select 1
  from auth.identities i
  where i.user_id = u.id
  and i.provider = 'email'
);

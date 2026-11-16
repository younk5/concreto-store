-- ============================================================
-- VG STORE — banco e bucket de fotos
-- Cole este arquivo inteiro no Supabase: SQL Editor > New query > Run.
-- Pode rodar mais de uma vez: ele não apaga nem duplica nada.
--
-- O painel do site (admin.html) NÃO usa login do Supabase: a senha
-- fica no js/config.js. Por isso as regras abaixo liberam leitura e
-- gravação com a chave pública (anon). Quem tiver a chave consegue
-- escrever direto na API — é o preço de não ter login no banco.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- tabela de produtos ----------
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

-- ---------- regras de acesso (leitura pública, escrita pela chave pública) ----------
drop policy if exists "products_public_read_active" on public.products;
drop policy if exists "products_public_read_all" on public.products;
drop policy if exists "products_public_insert" on public.products;
drop policy if exists "products_public_update" on public.products;
drop policy if exists "products_public_delete" on public.products;

create policy "products_public_read_all"
on public.products
for select
to anon, authenticated
using (true);

create policy "products_public_insert"
on public.products
for insert
to anon, authenticated
with check (true);

create policy "products_public_update"
on public.products
for update
to anon, authenticated
using (true)
with check (true);

create policy "products_public_delete"
on public.products
for delete
to anon, authenticated
using (true);

grant select, insert, update, delete on public.products to anon, authenticated;

create index if not exists products_active_created_idx
on public.products (active, created_at desc);

-- ---------- bucket de fotos ----------
-- aceita jpg, png, webp, avif e gif até 15 MB (a foto sobe como está)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'products',
  'products',
  true,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "products_storage_public_read" on storage.objects;
drop policy if exists "products_storage_public_insert" on storage.objects;
drop policy if exists "products_storage_public_update" on storage.objects;
drop policy if exists "products_storage_public_delete" on storage.objects;

create policy "products_storage_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'products');

create policy "products_storage_public_insert"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'products');

create policy "products_storage_public_update"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'products')
with check (bucket_id = 'products');

create policy "products_storage_public_delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'products');

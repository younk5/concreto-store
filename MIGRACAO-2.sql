-- ============================================================================
-- VG STORE - migracao 2
-- 1) galeria: varias fotos por produto (coluna images)
-- 2) escrita do catalogo protegida pela chave do painel (header x-store-key)
-- Cole no SQL Editor do Supabase e clique em Run. Pode rodar mais de uma vez.
-- ============================================================================

alter table public.products
  add column if not exists images jsonb not null default '[]'::jsonb;

create index if not exists products_active_created_idx
  on public.products (active, created_at desc);

-- a chave fica no painel (js/config.js) e viaja no header x-store-key.
-- quem nao mandar o header continua lendo o catalogo, mas nao escreve.
create or replace function public.store_write_allowed()
returns boolean
language sql
stable
as $fn$
  select coalesce(
    nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-store-key',
    ''
  ) = 'vg-6a00377d9d93c1993e53ed939a8ab8a2';
$fn$;

drop policy if exists "products_public_insert" on public.products;
drop policy if exists "products_public_update" on public.products;
drop policy if exists "products_public_delete" on public.products;
drop policy if exists "products_key_insert" on public.products;
drop policy if exists "products_key_update" on public.products;
drop policy if exists "products_key_delete" on public.products;

create policy "products_key_insert"
on public.products for insert
to anon, authenticated
with check (public.store_write_allowed());

create policy "products_key_update"
on public.products for update
to anon, authenticated
using (public.store_write_allowed())
with check (public.store_write_allowed());

create policy "products_key_delete"
on public.products for delete
to anon, authenticated
using (public.store_write_allowed());

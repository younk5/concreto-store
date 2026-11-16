# AGENTS.md — VG STORE

## Visão geral
Loja de eletrônicos com compra via WhatsApp. O catálogo é público; o painel usa Supabase Auth. O visual é streetwear editorial, mobile-first, sem build e sem framework.

## Stack
- HTML + CSS + JavaScript vanilla com ES modules.
- Supabase Postgres, Storage e Auth via `@supabase/supabase-js` carregado do esm.sh.
- Deploy estático em Vercel ou Netlify.

## Estrutura
- `index.html`: loja, hero, destaques, busca, chips de categoria e grid de produtos.
- `produto.html`: produto por `?id=UUID`, metatags dinâmicas, WhatsApp e relacionados.
- `admin.html`: login e painel na mesma página.
- `style.css`: todo o estilo.
- `js/config.js`: URL/chave do Supabase, WhatsApp e nome da loja.
- `js/api.js`: acesso ao Supabase e upload/remoção de imagens.
- `schema.sql`: tabela, RLS, bucket e usuário admin.
- `seed.sql`: 6 produtos de exemplo.
- `img/`: fotos locais usadas pelo seed.
- `CREDITOS.txt`: origem das fotos de exemplo.

## Rodar localmente
Na raiz do projeto, rode `python -m http.server 5500` e abra `http://localhost:5500`.
Não existe etapa de build, `npm install` ou variável de ambiente no frontend.

## Configuração
1. Crie o projeto no Supabase e execute `schema.sql` no SQL Editor.
2. Execute `seed.sql` para carregar os produtos de exemplo.
3. Preencha `SUPABASE_URL` e `SUPABASE_ANON_KEY` em `js/config.js`.
4. Ajuste `WHATSAPP_NUMBER` e `STORE_NAME`.
5. Acesse `/admin.html` com usuário `admin` e senha `admin123`.
6. Troque a senha no Supabase Auth depois do primeiro acesso.

## Banco e segurança
- Tabela `public.products` com `id`, `name`, `description`, `price`, `category`, `image_url`, `image_path`, `featured`, `active` e `created_at`.
- RLS: público lê apenas `active = true`; usuários autenticados leem tudo e fazem insert/update/delete.
- Bucket público `products`; escrita apenas autenticada; imagens em WebP.
- Use somente a chave `anon` no navegador. Nunca coloque `service_role` no frontend nem no repositório.
- Não versione `.env`, tokens ou credenciais reais.

## Regras funcionais
- Compra sempre por `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`.
- Mensagem do produto: `Olá! Tenho interesse em: {nome}. Link: {url atual}`.
- A loja só mostra produtos com `active = true`; produto inativo ou inexistente retorna 404 amigável.
- O admin redimensiona fotos para no máximo 1200 px, converte para WebP com qualidade 0.82 e envia ao bucket com nome único.
- Ao trocar ou excluir um produto, remova também o arquivo antigo do Storage.
- O login converte usuário `admin` para `admin@loja.com` e usa `signInWithPassword`.
- Sessão do admin é persistente; sempre ofereça o botão sair.
- Não adicione carrinho, checkout, pagamento, categorias fixas no código ou cadastro público.

## Design
- Marca: VG STORE, tagline "tecnologia ao seu alcance"; logo em `img/logo.png` e favicon em `img/favicon.svg`.
- Lockup da marca no CSS (`.brand`): "VG" em gradiente cromado + "STORE" em laranja, ambos itálicos, com o arco em SVG (`.brand-swoosh`). Não recrie o logo como texto simples.
- Paleta: fundo `#08080A`, superfícies `#0E0F13`/`#14161C`, texto `#F2F4F7`, apoio `#A8B0BD`, laranja `#FF4A00` (`--orange-hi` `#FF8C00`, `--orange-soft` `#FFB05C`).
- Fontes: Archivo 800/900 itálico nos títulos, Inter no texto, JetBrains Mono em rótulos e microcopy.
- Permanecem: cromo (gradiente claro em títulos), sombras difusas, cantos 12–24 px, bordas de 1 px brancas translúcidas.
- Referência de tom: fundo preto profundo, um único acento laranja, tipografia itálica grande e muito espaço; nada de roxo, azul ou gradientes arco-íris.
- Mantenha transições entre 150 e 300 ms, foco visível laranja, contraste AA e `alt` nas imagens.

## Código
- Mantenha o projeto sem build, sem frameworks e sem dependências além do CDN do Supabase e do Google Fonts.
- Centralize chamadas ao Supabase em `js/api.js` e configurações em `js/config.js`.
- Use ES modules e mantenha a separação entre loja, produto e admin.
- Evite comentários no código; nomes e mensagens devem ser claros por si.
- Textos em português do Brasil, com voz curta e direta.
- Antes de concluir, abra as três páginas, confira o console, teste busca/filtros, login, CRUD e o link do WhatsApp.

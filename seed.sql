insert into public.products (id, name, description, price, category, image_url, image_path, featured, active, created_at)
values
  ('11111111-1111-4111-8111-111111111111', 'Notebook 15,6” — 8 GB / 512 GB', 'Tela Full HD de 15,6”, 8 GB de RAM e SSD de 512 GB. Liga rápido, aguenta o dia e não faz drama. Windows 11.', 3299.00, 'notebook', 'img/notebook.webp', '', true, true, now()),
  ('22222222-2222-4222-8222-222222222222', 'TV Box 4K — 4 GB / 64 GB', 'Android TV em 4K, 4 GB de RAM e 64 GB de armazenamento. Wi-Fi, Bluetooth e controle com atalhos. Plugou, funcionou.', 449.00, 'tv box', 'img/tv-box.jpg', '', false, true, now() - interval '1 day'),
  ('33333333-3333-4333-8333-333333333333', 'Fone Bluetooth ANC', 'Bluetooth 5.3, cancelamento ativo de ruído e até 40 h de bateria. Dobra plano e some na mochila.', 349.00, 'áudio', 'img/fone.webp', '', true, true, now() - interval '2 days'),
  ('44444444-4444-4444-8444-444444444444', 'Teclado Mecânico 65%', 'Layout 65%, switches lineares hot-swap e cabo USB-C removível. RGB tem, mas ninguém precisa saber.', 399.00, 'setup', 'img/teclado.webp', '', false, true, now() - interval '3 days'),
  ('55555555-5555-4555-8555-555555555555', 'Carregador GaN 65 W', 'Três saídas para carregar notebook, celular e fone sem ocupar a tomada inteira. Compacto e sem barulho.', 189.00, 'carregador', 'img/carregador.webp', '', false, true, now() - interval '4 days'),
  ('66666666-6666-4666-8666-666666666666', 'Carregador sem Fio 15 W', 'Carregamento por indução em base de alumínio, com cabo USB-C. Deixa na mesa e esquece.', 149.90, 'acessório', 'img/carregador-sem-fio.webp', '', true, true, now() - interval '5 days')
on conflict (id) do nothing;

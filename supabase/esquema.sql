-- JF Gestión · base de datos en Supabase
-- Pegalo en Supabase → SQL Editor → New query y tocá Run.
-- Se puede correr más de una vez sin romper nada.

-- Todos los datos del sistema (productos, clientes, pedidos, visitas y ajustes)
-- se guardan como documentos: col = colección, id = identificador, data = contenido.
create table if not exists public.docs (
  col text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (col, id)
);

-- Lista de emails que pueden entrar al sistema.
create table if not exists public.miembros (email text primary key);

alter table public.docs enable row level security;
alter table public.miembros enable row level security;

create or replace function public.es_miembro() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.miembros m
    where lower(m.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
$$;

drop policy if exists "miembros leen" on public.docs;
drop policy if exists "miembros crean" on public.docs;
drop policy if exists "miembros editan" on public.docs;
drop policy if exists "miembros borran" on public.docs;
create policy "miembros leen" on public.docs for select to authenticated using (public.es_miembro());
create policy "miembros crean" on public.docs for insert to authenticated with check (public.es_miembro());
create policy "miembros editan" on public.docs for update to authenticated using (public.es_miembro()) with check (public.es_miembro());
create policy "miembros borran" on public.docs for delete to authenticated using (public.es_miembro());

-- Cambios en tiempo real entre dispositivos.
alter table public.docs replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

-- Cambiá estos emails por los reales antes de correrlo.
insert into public.miembros (email) values
  ('TU-EMAIL@gmail.com'),
  ('EMAIL-DE-JONAH@gmail.com')
on conflict do nothing;

-- Para sumar a alguien más adelante:
--   insert into public.miembros (email) values ('nuevo@gmail.com');
-- y crealo en Authentication → Users → Add user (con "Auto Confirm User").
-- Para sacarle el acceso:
--   delete from public.miembros where email = 'nuevo@gmail.com';

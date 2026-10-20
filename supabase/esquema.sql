-- JG Gestión · base de datos en Supabase (con roles)
-- Pegalo en Supabase → SQL Editor → New query y tocá Run.
-- Se puede correr más de una vez sin romper nada ni borrar datos.

-- 1. Datos del sistema: productos, clientes, pedidos, visitas y ajustes,
--    guardados como documentos (col = colección, id = identificador, data = contenido).
create table if not exists public.docs (
  col text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (col, id)
);

-- 2. Usuarios con acceso y su rol.
create table if not exists public.miembros (email text primary key);
alter table public.miembros add column if not exists nombre text;
alter table public.miembros add column if not exists rol text;
update public.miembros set email = lower(email) where email <> lower(email);
update public.miembros set rol = 'admin' where rol is null;  -- los que ya tenían acceso quedan como administradores
alter table public.miembros alter column rol set default 'vendedor';
alter table public.miembros alter column rol set not null;
alter table public.miembros drop constraint if exists miembros_rol_check;
alter table public.miembros add constraint miembros_rol_check check (rol in ('admin', 'vendedor', 'deposito', 'repartidor'));

alter table public.docs enable row level security;
alter table public.miembros enable row level security;

-- 3. Funciones de permisos.
create or replace function public.mi_rol() returns text
language sql stable security definer set search_path = public as $$
  select m.rol from public.miembros m
  where m.email = lower(coalesce(auth.jwt() ->> 'email', '')) limit 1
$$;

create or replace function public.es_miembro() returns boolean
language sql stable security definer set search_path = public as $$
  select public.mi_rol() is not null
$$;

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.mi_rol() = 'admin', false)
$$;

-- Qué puede hacer cada rol en cada colección.
--   admin:      todo
--   vendedor:   crea y edita pedidos, clientes y visitas; actualiza stock al confirmar; borra visitas
--   deposito:   edita pedidos (estado) y productos (stock)
--   repartidor: edita pedidos (entregado y cobros)
create or replace function public.puede_escribir(c text, accion text) returns boolean
language sql stable security definer set search_path = public as $$
  select case public.mi_rol()
    when 'admin' then true
    when 'vendedor' then
         (accion = 'crear'  and c in ('pedidos', 'clientes', 'visitas'))
      or (accion = 'editar' and c in ('pedidos', 'clientes', 'visitas', 'productos'))
      or (accion = 'borrar' and c = 'visitas')
    when 'deposito' then accion = 'editar' and c in ('pedidos', 'productos')
    when 'repartidor' then accion = 'editar' and c = 'pedidos'
    else false
  end
$$;

-- 4. Reglas de acceso a los datos.
drop policy if exists "miembros leen" on public.docs;
drop policy if exists "miembros crean" on public.docs;
drop policy if exists "miembros editan" on public.docs;
drop policy if exists "miembros borran" on public.docs;
drop policy if exists "leer" on public.docs;
drop policy if exists "crear" on public.docs;
drop policy if exists "editar" on public.docs;
drop policy if exists "borrar" on public.docs;
create policy "leer"   on public.docs for select to authenticated using (public.es_miembro());
create policy "crear"  on public.docs for insert to authenticated with check (public.puede_escribir(col, 'crear'));
create policy "editar" on public.docs for update to authenticated using (public.puede_escribir(col, 'editar')) with check (public.puede_escribir(col, 'editar'));
create policy "borrar" on public.docs for delete to authenticated using (public.puede_escribir(col, 'borrar'));

-- 5. Reglas de la lista de usuarios: todos los miembros la ven, solo el administrador la cambia.
drop policy if exists "ver miembros" on public.miembros;
drop policy if exists "admin agrega" on public.miembros;
drop policy if exists "admin edita" on public.miembros;
drop policy if exists "admin quita" on public.miembros;
create policy "ver miembros" on public.miembros for select to authenticated using (public.es_miembro());
create policy "admin agrega" on public.miembros for insert to authenticated with check (public.es_admin());
create policy "admin edita"  on public.miembros for update to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "admin quita"  on public.miembros for delete to authenticated using (public.es_admin());

-- Emails siempre en minúscula, y nunca quedarse sin administrador.
create or replace function public.miembros_normalizar() returns trigger
language plpgsql as $$
begin
  new.email := lower(trim(new.email));
  return new;
end $$;
drop trigger if exists miembros_normalizar on public.miembros;
create trigger miembros_normalizar before insert or update on public.miembros
  for each row execute function public.miembros_normalizar();

create or replace function public.proteger_ultimo_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'DELETE' and old.rol = 'admin')
     or (tg_op = 'UPDATE' and old.rol = 'admin' and new.rol <> 'admin') then
    if (select count(*) from public.miembros where rol = 'admin' and email <> old.email) = 0 then
      raise exception 'Tiene que quedar al menos un administrador';
    end if;
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists proteger_ultimo_admin on public.miembros;
create trigger proteger_ultimo_admin before update or delete on public.miembros
  for each row execute function public.proteger_ultimo_admin();

-- 6. Cambios en tiempo real entre dispositivos.
alter table public.docs replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

-- 7. Administrador inicial (si ya existe, no se toca).
insert into public.miembros (email, nombre, rol) values ('jfdist008@gmail.com', 'Jona', 'admin')
on conflict (email) do nothing;

notify pgrst, 'reload schema';

-- Los demás usuarios se agregan desde la app: Ajustes → Usuarios y roles.

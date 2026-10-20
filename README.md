# JG Gestión

Sistema de gestión de **JG Distribuidora**: catálogo con costos y precios, cartera de clientes con cuenta corriente, armador de pedidos con envío por WhatsApp, etiqueta para el depósito, boleta en PDF, agenda de visitas y estadísticas.

Funciona en la compu y en el celular, y se puede instalar en la pantalla de inicio como una app.

## Cómo está armado

| Parte | Qué es |
|---|---|
| `index.html` | La página que se publica. Carga las librerías, `config.js` y el código de `src/`. |
| `config.js` | URL y clave pública de Supabase. Sin estos datos, el sistema guarda todo solo en el navegador. |
| `src/` | Código de la app (React con `htm`, sin paso de compilación). |
| `supabase/esquema.sql` | Tabla de datos, seguridad por login y lista de miembros. |
| `icons/`, `manifest.webmanifest` | Ícono y datos para instalarla en el celular. |
| `scripts/artefacto.sh` | Arma la versión de un solo archivo que se publica como artefacto de Claude. |

## Puesta en marcha

### 1. Base de datos (Supabase)
1. Creá un proyecto en [supabase.com](https://supabase.com) (región São Paulo).
2. En **SQL Editor**, corré `supabase/esquema.sql` (al final está el email del administrador inicial).
3. Entrá a la app con ese email (Crear cuenta la primera vez) y sumá al resto desde Ajustes → Usuarios y roles.
4. En **Project Settings → API**, copiá la **Project URL** y la clave **anon public** (o *publishable*) en `config.js`.

> La clave anon/publishable es pública por diseño. Nunca pongas la clave `service_role` ni la `secret` en este repositorio.

### 2. Publicación (GitHub Pages)
1. En el repositorio: **Settings → Pages → Build and deployment → Deploy from a branch**.
2. Rama `main`, carpeta `/ (root)`, **Save**.
3. En un par de minutos queda en `https://<tu-usuario>.github.io/jf-gestion/`.

### 3. Pasar los datos que ya estaban cargados
En la versión anterior: **Ajustes → Descargar respaldo**. En la nueva: **Ajustes → Restaurar respaldo**.

## Roles

| Rol | Qué puede hacer |
|---|---|
| Administrador | Todo: costos y ganancias, estadísticas, productos y precios, usuarios, ajustes, eliminar. |
| Vendedor | Arma pedidos y presupuestos, edita pedidos hasta que pasan a armado, gestiona clientes, agenda y cobros. No ve costos ni estadísticas. |
| Depósito | Ve los pedidos para armar, los pasa a armado y a listos, ajusta stock. No ve costos. |
| Repartidor | Ve las entregas, marca pedidos entregados y registra cobros. No ve costos. |

Los permisos se controlan en la app y también en la base de datos (`supabase/esquema.sql`, función `puede_escribir`).
Los usuarios se agregan desde **Ajustes → Usuarios y roles**; la primera vez, cada persona toca **Crear cuenta** con su email.

Para que los emails de confirmación y de recuperar contraseña vuelvan a la app:
Supabase → **Authentication → URL Configuration → Site URL** = `https://jonadist.github.io/jf-gestion/`.

## Instalar en el celular
- **Android (Chrome):** menú ⋮ → **Agregar a la pantalla principal** / **Instalar app**.
- **iPhone (Safari):** botón compartir → **Agregar a inicio**.

## Atajos de teclado (compu)
`⌘K` o `Ctrl+K` paleta de comandos · `N` nuevo pedido · `/` buscar · `↑ ↓` moverse · `↵` abrir · `esc` volver · `?` todos los atajos.

## Cómo se guardan los datos
Todo vive en la tabla `docs` como documentos JSON (`col` = productos, clientes, pedidos, visitas o config). Los cambios se sincronizan en tiempo real entre dispositivos. Solo pueden leer y escribir los usuarios logueados cuyo email esté en `miembros`.

## Próximo paso: Android
La app ya se instala desde el navegador. Para una app de Play Store, el mismo código y la misma base de datos se pueden empaquetar con Capacitor, sin rehacer el sistema.

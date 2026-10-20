# JF Gestión

Sistema de gestión de **JF Distribuidora**: catálogo con costos y precios, cartera de clientes con cuenta corriente, armador de pedidos con envío por WhatsApp, etiqueta para el depósito, boleta en PDF, agenda de visitas y estadísticas.

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
2. En **SQL Editor**, corré `supabase/esquema.sql` con los emails reales en la lista de miembros.
3. En **Authentication → Users → Add user**, creá cada usuario con **Auto Confirm User** tildado.
4. En **Project Settings → API**, copiá la **Project URL** y la clave **anon public** (o *publishable*) en `config.js`.

> La clave anon/publishable es pública por diseño. Nunca pongas la clave `service_role` ni la `secret` en este repositorio.

### 2. Publicación (GitHub Pages)
1. En el repositorio: **Settings → Pages → Build and deployment → Deploy from a branch**.
2. Rama `main`, carpeta `/ (root)`, **Save**.
3. En un par de minutos queda en `https://<tu-usuario>.github.io/jf-gestion/`.

### 3. Pasar los datos que ya estaban cargados
En la versión anterior: **Ajustes → Descargar respaldo**. En la nueva: **Ajustes → Restaurar respaldo**.

## Instalar en el celular
- **Android (Chrome):** menú ⋮ → **Agregar a la pantalla principal** / **Instalar app**.
- **iPhone (Safari):** botón compartir → **Agregar a inicio**.

## Atajos de teclado (compu)
`⌘K` o `Ctrl+K` paleta de comandos · `N` nuevo pedido · `/` buscar · `↑ ↓` moverse · `↵` abrir · `esc` volver · `?` todos los atajos.

## Cómo se guardan los datos
Todo vive en la tabla `docs` como documentos JSON (`col` = productos, clientes, pedidos, visitas o config). Los cambios se sincronizan en tiempo real entre dispositivos. Solo pueden leer y escribir los usuarios logueados cuyo email esté en `miembros`.

## Próximo paso: Android
La app ya se instala desde el navegador. Para una app de Play Store, el mismo código y la misma base de datos se pueden empaquetar con Capacitor, sin rehacer el sistema.

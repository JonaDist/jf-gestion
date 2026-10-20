#!/bin/bash
# Arma una versión de un solo archivo (dist/artefacto.html) para publicar como artefacto de Claude.
# La versión publicada en GitHub Pages usa index.html + config.js y no necesita este paso.
set -e
cd "$(dirname "$0")/.."
mkdir -p dist
OUT=dist/artefacto.html
{
  cat <<'HEAD'
<title>JG Gestión</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Sistema de gestión de JG Distribuidora: productos, clientes, pedidos, agenda de visitas y estadísticas.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
HEAD
  cat src/style.css
  cat <<'MID'
</style>
<div id="root"><div class="loading"><div class="spinner"></div><span>Abriendo JG Gestión…</span></div></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htm@3.1.1/dist/htm.umd.js"></script>
<script>if (!(window.React && window.ReactDOM && window.htm)) { document.getElementById('root').innerHTML = '<div class="err-box"><strong>No se pudo abrir el sistema.</strong><span>Revisá la conexión a internet y volvé a cargar la página.</span></div>'; }</script>
<script>
MID
  for f in src/*.js; do cat "$f"; echo; done
  echo '</script>'
} > "$OUT"
for f in src/*.js; do cat "$f"; echo; done > dist/.check.js
node --check dist/.check.js && rm dist/.check.js && echo "sintaxis OK"
wc -c "$OUT"

'use strict';
/* =========================================================
   JG Gestión — núcleo: utilidades, formato, cálculos y datos
   ========================================================= */
const { useState, useEffect, useMemo, useRef, useCallback, useSyncExternalStore, Fragment } = React;
const html = htm.bind(React.createElement);

/* ---------- utilidades ---------- */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const pad = (n, l = 2) => String(n).padStart(l, '0');
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => isoDate(new Date());
const parseISO = (s) => { if (!s) return null; const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const addISO = (s, n) => isoDate(addDays(parseISO(s), n));
const startOfWeek = (d) => { const x = new Date(d); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); x.setHours(0, 0, 0, 0); return x; };
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_C = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const fmtCorta = (s) => { const d = parseISO(s); return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : '—'; };
const fmtDia = (s) => { const d = parseISO(s); return d ? `${DIAS_C[d.getDay()].toLowerCase()} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}` : '—'; };
const fmtLarga = (s) => { const d = parseISO(s); return d ? `${DIAS[d.getDay()].toLowerCase()} ${d.getDate()} de ${MESES[d.getMonth()]}` : '—'; };
const diasEntre = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
const haceTxt = (s) => {
  if (!s) return 'Nunca';
  const n = diasEntre(s, todayISO());
  if (n <= 0) return 'Hoy';
  if (n === 1) return 'Ayer';
  if (n < 30) return `Hace ${n} días`;
  const m = Math.floor(n / 30);
  return m === 1 ? 'Hace 1 mes' : `Hace ${m} meses`;
};
const relDia = (s) => {
  const n = diasEntre(todayISO(), s);
  if (n === 0) return 'Hoy';
  if (n === 1) return 'Mañana';
  if (n === -1) return 'Ayer';
  return fmtDia(s);
};

const nf0 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf1 = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
const nfq = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 3 });
const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const money = (v) => { const r = round2(v); const neg = r < 0; const a = Math.abs(r); return (neg ? '−$ ' : '$ ') + (Number.isInteger(a) ? nf0.format(a) : nf2.format(a)); };
const moneyK = (v) => { const a = Math.abs(v); if (a >= 1e6) return '$ ' + nf1.format(v / 1e6) + ' M'; if (a >= 1e4) return '$ ' + nf0.format(v / 1e3) + ' mil'; return money(v); };
const qty = (v) => nfq.format(Number(v) || 0);
const pct = (v) => (isFinite(v) ? nf1.format(v) : '0') + '%';
const parseNum = (s) => {
  if (typeof s === 'number') return s;
  let t = String(s == null ? '' : s).replace(/[\s$%]/g, '');
  if (!t) return 0;
  const neg = t.startsWith('-');
  t = t.replace(/^-/, '');
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if ((t.match(/\./g) || []).length > 1) t = t.replace(/\./g, '');
  else if (/^\d{1,3}\.\d{3}$/.test(t)) t = t.replace('.', '');
  const n = parseFloat(t);
  return isFinite(n) ? (neg ? -n : n) : 0;
};
const norm = (s) => (s == null ? '' : String(s)).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const matches = (q, ...fields) => {
  const words = norm(q).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = norm(fields.filter(Boolean).join(' '));
  return words.every((w) => hay.includes(w));
};
const initials = (s) => (s || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const byText = (k) => (a, b) => String(a[k] || '').localeCompare(String(b[k] || ''), 'es', { sensitivity: 'base' });
const clean = (o) => JSON.parse(JSON.stringify(o));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function runPool(tasks, n = 4, onProgress) {
  let i = 0, done = 0; const errors = [];
  async function worker() {
    while (i < tasks.length) {
      const k = i++;
      try { await tasks[k](); } catch (e) { errors.push(e); }
      done++; onProgress && onProgress(done, tasks.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, tasks.length) }, worker));
  return errors;
}

/* ---------- teléfonos y WhatsApp (Argentina) ---------- */
function telWa(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (!d) return '';
  d = d.replace(/^00/, '');
  if (d.startsWith('54')) { d = d.slice(2); if (d.startsWith('9')) d = d.slice(1); }
  d = d.replace(/^0/, '');
  if (d.length === 12) {
    for (const al of [2, 3, 4]) { if (d.substr(al, 2) === '15') { d = d.slice(0, al) + d.slice(al + 2); break; } }
  }
  if (d.length < 8) return '';
  return '549' + d;
}
const waLink = (tel, text) => {
  const n = telWa(tel);
  const t = encodeURIComponent(text || '');
  return n ? `https://wa.me/${n}?text=${t}` : `https://api.whatsapp.com/send?text=${t}`;
};
const mapsLink = (dir, loc) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([dir, loc, 'Argentina'].filter(Boolean).join(', '));

/* ---------- dominio ---------- */
const ESTADOS = {
  presupuesto: { label: 'Presupuesto', tone: '', corto: 'Presup.' },
  confirmado: { label: 'Confirmado', tone: 't-carbon', corto: 'Confirm.' },
  preparando: { label: 'En armado', tone: 't-kraft', corto: 'Armado' },
  listo: { label: 'Listo para entregar', tone: 't-violet', corto: 'Listo' },
  entregado: { label: 'Entregado', tone: 't-ok', corto: 'Entregado' },
  cancelado: { label: 'Cancelado', tone: 't-bad', corto: 'Cancel.' },
};
const FLUJO = ['presupuesto', 'confirmado', 'preparando', 'listo', 'entregado'];
const CUENTA = new Set(['confirmado', 'preparando', 'listo', 'entregado']);
const A_PREPARAR = new Set(['confirmado', 'preparando', 'listo']);
const PAGO = { pendiente: { label: 'Impago', tone: 't-warn' }, parcial: { label: 'Pago parcial', tone: 't-warn' }, pagado: { label: 'Pagado', tone: 't-ok' } };
const MEDIOS = ['Efectivo', 'Transferencia', 'Mercado Pago', 'Cheque', 'Tarjeta', 'Otro'];
const UNIDADES = ['Unidad', 'Caja', 'Bulto', 'Pack', 'Docena', 'Display', 'Kg', 'Litro'];
const COND_IVA = ['Consumidor final', 'Responsable inscripto', 'Monotributo', 'Exento'];
const VISITA = { pendiente: 'Pendiente', visitado: 'Visitado', ausente: 'No atendió' };

const DEFAULT_CONFIG = {
  nombre: 'JG Distribuidora', razonSocial: '', cuit: '', condIva: 'Responsable inscripto', direccion: '', localidad: '', telefono: '', email: '',
  admin: 'Jonah', waDeposito: '', nombreDeposito: 'Depósito', puntoVenta: '0001', validez: 7,
  leyenda: 'Gracias por su compra.', diasInactivo: 30,
};

function calcPedido(p) {
  let subtotal = 0, costo = 0, unidades = 0;
  for (const it of p.items || []) {
    const c = Number(it.cant) || 0, pr = Number(it.precio) || 0, d = Number(it.desc) || 0;
    subtotal += c * pr * (1 - d / 100); costo += c * (Number(it.costo) || 0); unidades += c;
  }
  subtotal = round2(subtotal);
  const descMonto = round2(subtotal * (Number(p.descGeneral) || 0) / 100);
  const neto = round2(subtotal - descMonto);
  const envio = round2(p.envio);
  const total = round2(neto + envio);
  const pagado = round2((p.pagos || []).reduce((a, x) => a + (Number(x.monto) || 0), 0));
  const cuenta = CUENTA.has(p.estado);
  const saldo = cuenta ? Math.max(0, round2(total - pagado)) : 0;
  costo = round2(costo);
  const ganancia = round2(neto - costo);
  const pago = !cuenta ? null : pagado <= 0.009 && total > 0 ? 'pendiente' : saldo > 0.009 ? 'parcial' : 'pagado';
  return { subtotal, descMonto, neto, envio, total, costo, ganancia, margen: neto > 0 ? ganancia / neto * 100 : 0, pagado, saldo, unidades, lineas: (p.items || []).length, cuenta, pago };
}
const numCorto = (p) => '#' + pad(p.numero || 0, 4);
const numLargo = (p, cfg) => `${pad(Number((cfg && cfg.puntoVenta) || 1), 4)}-${pad(p.numero || 0, 8)}`;
const margenDe = (costo, precio) => precio > 0 ? (precio - costo) / precio * 100 : 0;
const recargoDe = (costo, precio) => costo > 0 ? (precio - costo) / costo * 100 : 0;
const consumeStock = (estado) => CUENTA.has(estado);

const ESTADO_ICO = { presupuesto: '', confirmado: 'c-blue', preparando: 'c-orange', listo: 'c-purple', entregado: 'c-green', cancelado: 'c-red' };
const TONOS = ['c-red', 'c-orange', 'c-yellow', 'c-green', 'c-blue', 'c-purple'];
const colorFor = (s) => { let h = 0; const t = String(s || ''); for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return TONOS[h % TONOS.length]; };

/* ---------- avisos (toasts), confirmaciones, paleta y acciones de contexto ---------- */
const ui = { toasts: [], confirm: null, listeners: new Set(), modals: 0, palette: false, global: null };
const ctx = { actions: [], label: '', sig: '' };
const uiEmit = () => ui.listeners.forEach((f) => f());
function toast(msg, opts = {}) {
  const t = { id: uid(), msg, tone: opts.tone || '', action: opts.action };
  ui.toasts = [...ui.toasts, t]; uiEmit();
  setTimeout(() => { ui.toasts = ui.toasts.filter((x) => x.id !== t.id); uiEmit(); }, opts.ms || (opts.action ? 6500 : 3200));
}
function confirmar(o) {
  return new Promise((resolve) => { ui.confirm = { ...o, resolve }; uiEmit(); });
}

/* ---------- capacidades de la plataforma ---------- */
const capCache = {};
function getCap(name) {
  if (!(name in capCache)) {
    capCache[name] = (async () => {
      try { if (window.claude && typeof window.claude.use === 'function') return await window.claude.use(name); } catch (e) { /* sin capacidad */ }
      return null;
    })();
  }
  return capCache[name];
}

/* ---------- almacén de datos ---------- */
const COLS = ['productos', 'clientes', 'pedidos', 'visitas'];
const LS_KEY = 'jf-gestion-datos-v1';
const store = {
  mode: 'cargando', readOnly: false, db: null, backend: null, error: '', rol: null, rolesActivos: false,
  data: { productos: new Map(), clientes: new Map(), pedidos: new Map(), visitas: new Map() },
  config: { ...DEFAULT_CONFIG },
  loaded: { productos: false, clientes: false, pedidos: false, visitas: false, config: false },
  listeners: new Set(), version: 0, snap: null,
};
function storeEmit() { store.version++; store.snap = null; store.listeners.forEach((f) => f()); }
function storeSubscribe(fn) { store.listeners.add(fn); return () => store.listeners.delete(fn); }

function buildSnapshot() {
  const productos = [...store.data.productos.values()].sort(byText('nombre'));
  const clientes = [...store.data.clientes.values()].sort(byText('nombre'));
  const pedidos = [...store.data.pedidos.values()].sort((a, b) => (b.numero || 0) - (a.numero || 0));
  const visitas = [...store.data.visitas.values()].sort((a, b) => (a.fecha + (a.hora || '99')).localeCompare(b.fecha + (b.hora || '99')));
  const calc = new Map();
  const cliStats = new Map();
  let maxNum = 0;
  for (const p of pedidos) {
    const c = calcPedido(p); calc.set(p.id, c);
    if ((p.numero || 0) > maxNum) maxNum = p.numero;
    if (!p.clienteId) continue;
    let cs = cliStats.get(p.clienteId);
    if (!cs) { cs = { total: 0, pedidos: 0, ultima: '', saldo: 0, presupuestos: 0 }; cliStats.set(p.clienteId, cs); }
    if (c.cuenta) { cs.total += c.total; cs.pedidos++; cs.saldo += c.saldo; if (!cs.ultima || p.fecha > cs.ultima) cs.ultima = p.fecha; }
    else if (p.estado === 'presupuesto') cs.presupuestos++;
  }
  const cats = [...new Set(productos.map((p) => p.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  const marcas = [...new Set(productos.map((p) => p.marca).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  const zonas = [...new Set(clientes.map((c) => c.zona || c.localidad).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  const ready = store.mode === 'local' || ((store.mode === 'nube' || store.mode === 'supa') && Object.values(store.loaded).every(Boolean));
  const hayDemo = productos.some((p) => p.demo) || clientes.some((c) => c.demo);
  return {
    version: store.version, mode: store.mode, readOnly: store.readOnly, ready, config: store.config, error: store.error || '',
    usuario: SUPA.user ? SUPA.user.email : '', rol: store.rol || 'admin', rolesActivos: !!store.rolesActivos, nombreUsuario: store.nombreUsuario || '',
    productos, clientes, pedidos, visitas, calc, cliStats, maxNum, cats, marcas, zonas, hayDemo,
    prodMap: store.data.productos, cliMap: store.data.clientes, pedMap: store.data.pedidos,
  };
}
function storeSnapshot() { if (!store.snap) store.snap = buildSnapshot(); return store.snap; }
const useStore = () => useSyncExternalStore(storeSubscribe, storeSnapshot);

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const j = JSON.parse(raw);
    for (const c of COLS) { store.data[c] = new Map(Object.entries(j[c] || {}).map(([id, v]) => [id, { ...v, id }])); }
    store.config = { ...DEFAULT_CONFIG, ...(j.config || {}) };
  } catch (e) { /* almacenamiento no disponible */ }
}
let saveLocalTimer = null;
function saveLocal() {
  clearTimeout(saveLocalTimer);
  saveLocalTimer = setTimeout(() => {
    try {
      const j = { config: store.config };
      for (const c of COLS) { j[c] = Object.fromEntries([...store.data[c].entries()].map(([id, v]) => { const o = { ...v }; delete o.id; return [id, o]; })); }
      localStorage.setItem(LS_KEY, JSON.stringify(j));
    } catch (e) { toast('No se pudo guardar en este navegador', { tone: 'bad' }); }
  }, 250);
}

function dbErr(e) {
  const code = e && e.code;
  if (code === 'quota_exceeded') toast('La base de datos está llena. Borrá pedidos viejos o datos de ejemplo.', { tone: 'bad', ms: 7000 });
  else if (code === 'revoked' || code === 'not_granted') { store.readOnly = true; storeEmit(); }
  else if (code === 'resource_exhausted') toast('Demasiadas operaciones seguidas. Esperá unos segundos.', { tone: 'bad' });
  else if (code === 'PGRST205' || code === 'PGRST202' || code === '42P01' || code === '42883') toast('La base de datos todavía no está preparada: falta correr el script esquema.sql en Supabase (SQL Editor → New query → Run).', { tone: 'bad', ms: 12000 });
  else if (code === '42501' && store.rol && store.rol !== 'admin') toast('Tu rol no tiene permiso para esta acción.', { tone: 'bad', ms: 6000 });
  else if (code === '42501' || code === 'PGRST301') toast('Tu usuario no tiene permiso para guardar. Revisá que tu email esté en la lista de miembros.', { tone: 'bad', ms: 7000 });
  else if (code === 'sin-sesion') toast('Se cerró la sesión. Volvé a entrar con tu email y contraseña.', { tone: 'bad', ms: 7000 });
  else toast('No se pudo guardar. Revisá la conexión a internet' + (code ? ` (${code})` : '') + '.', { tone: 'bad', ms: 6000 });
}

/* ---------- destino: base de datos de Claude ---------- */
function backendClaude(db) {
  return {
    write: (col, id, body) => db.collection(col).doc(id).set(body),
    remove: (col, id) => db.collection(col).doc(id).delete(),
    writeConfig: (body) => db.doc('config/negocio').set(body),
  };
}

/* ---------- destino: Supabase (versión publicada con su propio link) ---------- */
const SUPA = { client: null, user: null, channel: null, lastFetch: 0, fetching: null };
const supaCfg = () => { const c = window.JF_CONFIG || {}; return c.supabaseUrl && c.supabaseKey ? c : null; };
function supaThrow(error) { if (error) { const e = new Error(error.message || 'Error de Supabase'); e.code = error.code || (error.status ? String(error.status) : ''); throw e; } }
function supaApply(row, removed) {
  if (!row || !row.col) return;
  if (row.col === 'config') { if (row.id === 'negocio' && !removed) store.config = { ...DEFAULT_CONFIG, ...(row.data || {}) }; return; }
  if (!store.data[row.col]) return;
  const m = new Map(store.data[row.col]);
  if (removed) m.delete(row.id); else m.set(row.id, { ...(row.data || {}), id: row.id });
  store.data[row.col] = m;
}
async function supaFetchAll() {
  if (SUPA.fetching) return SUPA.fetching;
  SUPA.fetching = (async () => {
    const sb = SUPA.client; const rows = []; const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await sb.from('docs').select('col,id,data').order('col').order('id').range(from, from + PAGE - 1);
      supaThrow(error);
      rows.push(...(data || []));
      if (!data || data.length < PAGE) break;
    }
    const next = { productos: new Map(), clientes: new Map(), pedidos: new Map(), visitas: new Map() };
    let cfg = null;
    for (const r of rows) {
      if (r.col === 'config' && r.id === 'negocio') cfg = r.data;
      else if (next[r.col]) next[r.col].set(r.id, { ...(r.data || {}), id: r.id });
    }
    store.data = next; store.config = { ...DEFAULT_CONFIG, ...(cfg || {}) };
    for (const k of Object.keys(store.loaded)) store.loaded[k] = true;
    SUPA.lastFetch = Date.now(); storeEmit();
  })();
  try { await SUPA.fetching; } finally { SUPA.fetching = null; }
}
function supaSubscribe() {
  const sb = SUPA.client;
  if (SUPA.channel) { try { sb.removeChannel(SUPA.channel); } catch (e) { /* ya cerrado */ } }
  SUPA.channel = sb.channel('jf-docs')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'docs' }, (pl) => {
      if (pl.eventType === 'DELETE') supaApply(pl.old, true); else supaApply(pl.new, false);
      storeEmit();
    })
    .subscribe((status) => { if (status === 'SUBSCRIBED' && Date.now() - SUPA.lastFetch > 5000) safe(supaFetchAll()); });
}
function backendSupabase() {
  const up = async (col, id, body) => {
    const { error } = await SUPA.client.from('docs').upsert({ col, id, data: body, updated_at: new Date().toISOString() }, { onConflict: 'col,id' });
    supaThrow(error);
  };
  return {
    write: up,
    remove: async (col, id) => { const { error } = await SUPA.client.from('docs').delete().eq('col', col).eq('id', id); supaThrow(error); },
    writeConfig: (body) => up('config', 'negocio', body),
  };
}
/* ---------- roles y permisos ---------- */
const ROLES = {
  admin: { label: 'Administrador', desc: 'Acceso completo: costos, estadísticas, productos, usuarios y ajustes.' },
  vendedor: { label: 'Vendedor', desc: 'Arma pedidos y presupuestos, gestiona clientes, agenda y cobros. No ve costos ni estadísticas.' },
  deposito: { label: 'Depósito', desc: 'Ve los pedidos para armar, los pasa a armado y a listos, y ajusta stock. No ve costos.' },
  repartidor: { label: 'Repartidor', desc: 'Ve las entregas, marca pedidos entregados y registra cobros. No ve costos.' },
};
const PERMISOS = {
  vendedor: ['ver.pedidos', 'ver.agenda', 'ver.clientes', 'ver.productos', 'pedido.crear', 'pedido.editar', 'pedido.confirmar', 'pedido.cancelar', 'cobro.registrar', 'cliente.editar', 'visita.editar'],
  deposito: ['ver.pedidos', 'ver.productos', 'pedido.armar', 'producto.stock'],
  repartidor: ['ver.pedidos', 'ver.agenda', 'ver.clientes', 'pedido.entregar', 'cobro.registrar'],
};
/* admin (y el modo de un solo usuario, fuera de Supabase) puede todo */
function puede(perm) {
  const r = store.rol || 'admin';
  if (r === 'admin') return true;
  return (PERMISOS[r] || []).includes(perm);
}
/* quién puede pasar un pedido a cada estado */
const PERM_ESTADO = { confirmado: 'pedido.confirmar', preparando: 'pedido.armar', listo: 'pedido.armar', entregado: 'pedido.entregar', cancelado: 'pedido.cancelar' };
const puedeEstado = (estado) => puede(PERM_ESTADO[estado] || 'admin.todo');

async function supaRol() {
  const r = await SUPA.client.rpc('mi_rol');
  if (!r.error) return { rol: r.data || null, roles: true };
  /* base sin la actualización de roles: se usa la lista de miembros como antes */
  const m = await SUPA.client.rpc('es_miembro');
  if (m.error) return { rol: 'admin', roles: false };
  return { rol: m.data === false ? null : 'admin', roles: false };
}
async function supaDespuesDeEntrar(user) {
  SUPA.user = user;
  const { rol, roles } = await supaRol();
  if (!rol) { store.mode = 'sin-acceso'; storeEmit(); return; }
  store.rol = rol; store.rolesActivos = roles; store.nombreUsuario = '';
  if (roles) { try { const r = await SUPA.client.from('miembros').select('nombre').eq('email', (user.email || '').toLowerCase()).maybeSingle(); if (r.data && r.data.nombre) store.nombreUsuario = r.data.nombre; } catch (e) { /* sin nombre */ } }
  store.mode = 'supa'; store.backend = backendSupabase(); storeEmit();
  try { await supaFetchAll(); } catch (e) { for (const k of Object.keys(store.loaded)) store.loaded[k] = true; storeEmit(); dbErr(e); }
  supaSubscribe();
  /* el negocio pasó a llamarse JG */
  if (store.config.nombre === 'JF Distribuidora' && rol === 'admin') safe(putConfig({ nombre: 'JG Distribuidora' }));
}
const urlApp = () => location.origin + location.pathname;
function mensajeAuth(error) {
  const m = (error && error.message) || '';
  if (/invalid login|invalid credentials/i.test(m)) return 'Email o contraseña incorrectos.';
  if (/not confirmed/i.test(m)) return 'Todavía no confirmaste tu email. Buscá el correo de confirmación (revisá también spam).';
  if (/already registered|already exists/i.test(m)) return 'Ese email ya tiene cuenta. Entrá con tu contraseña o usá "Olvidé mi contraseña".';
  if (/password should be|at least/i.test(m)) return 'La contraseña tiene que tener al menos 6 caracteres.';
  if (/rate limit|too many/i.test(m)) return 'Demasiados intentos seguidos. Esperá unos minutos y probá de nuevo.';
  if (/signups not allowed|signup is disabled/i.test(m)) return 'La creación de cuentas está desactivada. Pedile al administrador que te cree el usuario.';
  return m || 'No se pudo completar. Probá de nuevo.';
}
async function supaLogin(email, password) {
  const { data, error } = await SUPA.client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw new Error(mensajeAuth(error));
  store.mode = 'cargando'; storeEmit();
  await supaDespuesDeEntrar(data.user);
}
async function supaRegistro(email, password) {
  const { data, error } = await SUPA.client.auth.signUp({ email: email.trim().toLowerCase(), password, options: { emailRedirectTo: urlApp() } });
  if (error) throw new Error(mensajeAuth(error));
  if (data && data.session) { store.mode = 'cargando'; storeEmit(); await supaDespuesDeEntrar(data.user); return 'ok'; }
  return 'confirmar';
}
async function supaRecuperar(email) {
  const { error } = await SUPA.client.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: urlApp() });
  if (error) throw new Error(mensajeAuth(error));
}
async function supaNuevaClave(password) {
  const { data, error } = await SUPA.client.auth.updateUser({ password });
  if (error) throw new Error(mensajeAuth(error));
  try { history.replaceState(null, '', urlApp()); } catch (e) { /* sin historial */ }
  store.mode = 'cargando'; storeEmit();
  await supaDespuesDeEntrar(data.user);
}
async function supaLogout() {
  try { if (SUPA.channel) SUPA.client.removeChannel(SUPA.channel); await SUPA.client.auth.signOut(); } catch (e) { /* sin conexión */ }
  SUPA.user = null; SUPA.channel = null; store.rol = null;
  store.data = { productos: new Map(), clientes: new Map(), pedidos: new Map(), visitas: new Map() };
  store.config = { ...DEFAULT_CONFIG }; store.mode = 'login';
  for (const k of Object.keys(store.loaded)) store.loaded[k] = false;
  storeEmit();
}
/* usuarios del sistema (tabla miembros) */
const usuarios = {
  async listar() { const { data, error } = await SUPA.client.from('miembros').select('email,nombre,rol').order('email'); supaThrow(error); return data || []; },
  async guardar(u) {
    const row = { email: u.email.trim().toLowerCase(), nombre: (u.nombre || '').trim() || null, rol: u.rol };
    const { error } = await SUPA.client.from('miembros').upsert(row, { onConflict: 'email' }); supaThrow(error);
  },
  async quitar(email) { const { error } = await SUPA.client.from('miembros').delete().eq('email', email); supaThrow(error); },
};
async function initSupabase(cfg) {
  if (!window.supabase || !window.supabase.createClient) { store.mode = 'error'; store.error = 'No se pudo cargar la conexión con la base de datos. Revisá internet y recargá la página.'; storeEmit(); return; }
  const recuperando = /type=recovery/.test(location.hash || '') || /type=recovery/.test(location.search || '');
  SUPA.client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'jf-gestion-sesion' } });
  SUPA.client.auth.onAuthStateChange((ev) => {
    if (ev === 'PASSWORD_RECOVERY') { store.mode = 'nueva-clave'; storeEmit(); }
    else if (ev === 'SIGNED_OUT' && store.mode === 'supa') { store.mode = 'login'; storeEmit(); }
  });
  const { data } = await SUPA.client.auth.getSession();
  if (store.mode === 'nueva-clave' || (recuperando && data && data.session)) { store.mode = 'nueva-clave'; storeEmit(); }
  else if (data && data.session) await supaDespuesDeEntrar(data.session.user);
  else { store.mode = 'login'; storeEmit(); }
  const refrescar = () => { if (store.mode === 'supa' && document.visibilityState === 'visible' && Date.now() - SUPA.lastFetch > 45000) { safe(supaFetchAll()); supaSubscribe(); } };
  document.addEventListener('visibilitychange', refrescar);
  window.addEventListener('online', () => { SUPA.lastFetch = 0; refrescar(); });
}

async function initStore() {
  const cfg = supaCfg();
  if (cfg) { await initSupabase(cfg); return; }
  const db = await getCap('db');
  if (!db) { store.mode = 'local'; loadLocal(); storeEmit(); return; }
  store.db = db; store.mode = 'nube'; store.backend = backendClaude(db);
  try {
    const user = await getCap('user');
    if (user && typeof user.can === 'function') { const ok = await user.can('data.write'); if (ok === false) store.readOnly = true; }
  } catch (e) { /* sin datos de usuario */ }
  storeEmit();
  for (const col of COLS) {
    db.collection(col).onSnapshot((snap) => {
      const m = new Map();
      for (const d of snap.docs) if (d.exists) m.set(d.id, { ...d.data(), id: d.id });
      store.data[col] = m; store.loaded[col] = true; storeEmit();
    }, (e) => { store.loaded[col] = true; storeEmit(); dbErr(e); });
  }
  db.doc('config/negocio').onSnapshot((d) => {
    store.config = { ...DEFAULT_CONFIG, ...(d.exists ? d.data() : {}) }; store.loaded.config = true; storeEmit();
  }, (e) => { store.loaded.config = true; storeEmit(); dbErr(e); });
}

const remoto = () => store.mode === 'nube' || store.mode === 'supa';
async function dbWrite(fn) {
  try { return await fn(); }
  catch (e) {
    const transitorio = e && (e.code === 'unavailable' || /fetch|network|Failed to fetch/i.test(e.message || ''));
    if (transitorio) { await sleep(500 + Math.random() * 700); return await fn(); }
    if (store.mode === 'nube' && e && e.code === 'invalid_argument' && store.readOnly === false) {
      const user = await getCap('user');
      const ok = user && user.can ? await user.can('data.write').catch(() => null) : null;
      if (ok !== true) { store.readOnly = true; storeEmit(); }
    }
    throw e;
  }
}
function assertWritable() {
  if (store.readOnly) { toast('Tenés acceso de solo lectura. Pedile al dueño que te comparta como editor.', { tone: 'bad', ms: 6000 }); throw new Error('solo-lectura'); }
}
async function put(col, obj) {
  assertWritable();
  const id = obj.id || uid();
  const body = clean({ ...obj, actualizado: Date.now() }); delete body.id;
  if (!body.creado) body.creado = Date.now();
  if (remoto()) {
    const prev = store.data[col].get(id);
    store.data[col] = new Map(store.data[col]).set(id, { ...body, id }); storeEmit();
    try { await dbWrite(() => store.backend.write(col, id, body)); }
    catch (e) {
      const m = new Map(store.data[col]); if (prev) m.set(id, prev); else m.delete(id); store.data[col] = m; storeEmit();
      dbErr(e); throw e;
    }
  } else {
    store.data[col].set(id, { ...body, id }); saveLocal(); storeEmit();
  }
  return id;
}
async function del(col, id) {
  assertWritable();
  if (remoto()) {
    const prev = store.data[col].get(id);
    const m0 = new Map(store.data[col]); m0.delete(id); store.data[col] = m0; storeEmit();
    try { await dbWrite(() => store.backend.remove(col, id)); }
    catch (e) { if (prev) { store.data[col] = new Map(store.data[col]).set(id, prev); storeEmit(); } dbErr(e); throw e; }
  } else { store.data[col].delete(id); saveLocal(); storeEmit(); }
}
async function putConfig(patch) {
  assertWritable();
  const next = clean({ ...store.config, ...patch });
  if (remoto()) {
    const prev = store.config; store.config = { ...DEFAULT_CONFIG, ...next }; storeEmit();
    try { await dbWrite(() => store.backend.writeConfig(next)); }
    catch (e) { store.config = prev; storeEmit(); dbErr(e); throw e; }
  } else { store.config = next; saveLocal(); storeEmit(); }
}
const safe = (p) => p.catch((e) => { if (e && e.message !== 'solo-lectura') console.warn(e); return null; });

/* ---------- stock ---------- */
async function aplicarStock(anterior, nuevo) {
  const delta = new Map();
  const add = (items, sign) => { for (const it of items || []) { if (!it.pid) continue; delta.set(it.pid, (delta.get(it.pid) || 0) + sign * (Number(it.cant) || 0)); } };
  if (anterior && anterior.stockAplicado) add(anterior.items, +1);
  if (nuevo && consumeStock(nuevo.estado)) add(nuevo.items, -1);
  for (const [pid, d] of delta) {
    if (Math.abs(d) < 1e-9) continue;
    const pr = store.data.productos.get(pid);
    if (!pr) continue;
    await put('productos', { ...pr, stock: round2((Number(pr.stock) || 0) + d) });
  }
  return nuevo ? consumeStock(nuevo.estado) : false;
}
async function guardarPedido(nuevo, anterior) {
  const p = { ...nuevo };
  p.stockAplicado = await aplicarStock(anterior, p);
  return put('pedidos', p);
}
async function cambiarEstado(p, estado) {
  const n = { ...p, estado, historial: [...(p.historial || []), { ts: Date.now(), estado }] };
  if (estado === 'entregado' && !n.entrega) n.entrega = todayISO();
  await guardarPedido(n, p);
}
async function borrarPedido(p) {
  await aplicarStock(p, null);
  await del('pedidos', p.id);
}

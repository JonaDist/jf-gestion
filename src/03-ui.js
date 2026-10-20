/* =========================================================
   Componentes de interfaz, atajos y paleta de comandos
   ========================================================= */
const ICONS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  receipt: 'M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21z M9 8h6 M9 12h6 M9 16h3',
  calendar: 'M4 6h16v15H4z M4 10h16 M8 3v4 M16 3v4',
  users: 'M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20 M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35 M15.5 4.15a3.5 3.5 0 0 1 0 6.7',
  user: 'M18 20v-1.5a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4V20 M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  box: 'M21 8 12 3 3 8v8l9 5 9-5z M3 8l9 5 9-5 M12 13v8 M7.5 5.5l9 5',
  chart: 'M3 3v18h18 M7 16v-3 M11 16V9 M15 16v-5 M19 16V6',
  settings: 'M4 7h9 M17 7h3 M15 5v4 M4 17h3 M11 17h9 M9 15v4 M4 12h14 M20 12h0',
  plus: 'M12 5v14 M5 12h14',
  minus: 'M5 12h14',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M20 20l-4-4',
  x: 'M6 6l12 12 M18 6 6 18',
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  back: 'M19 12H5 M11 6l-6 6 6 6',
  wa: 'M4 20l1.3-3.9A8 8 0 1 1 8 19.3z M9.2 8.6c.2-.4.5-.5.8-.5h.4c.2 0 .4.1.5.4l.6 1.4c.1.2 0 .5-.1.7l-.5.6c.6 1.2 1.5 2.1 2.7 2.7l.6-.5c.2-.2.5-.2.7-.1l1.4.6c.3.1.4.3.4.5v.4c0 .3-.1.6-.5.8-.6.3-1.3.4-2 .2a8 8 0 0 1-5.2-5.2c-.2-.7-.1-1.4.2-2z',
  file: 'M14 3H6v18h12V7z M14 3v4h4 M9 13h6 M9 17h6',
  tag: 'M3 12V4h8l10 10-8 8z M7.5 8.5h.01',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 14h10l1-14 M10 11v6 M14 11v6',
  edit: 'M4 20h4L19 9l-4-4L4 16z M14 6l4 4',
  copy: 'M9 9h11v11H9z M15 9V4H4v11h5',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A17 17 0 0 1 4 5a1 1 0 0 1 1-1z',
  pin: 'M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z M12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  checkc: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M8.5 12.2l2.4 2.4 4.6-4.8',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff: 'M3 3l18 18 M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.4 3.2 M6.5 6.6C3.8 8.3 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4.5-1.1 M9.9 9.9a3 3 0 0 0 4.2 4.2',
  download: 'M12 4v11 M7 10l5 5 5-5 M4 20h16',
  upload: 'M12 16V5 M7 10l5-5 5 5 M4 20h16',
  alert: 'M12 3 2 20h20z M12 10v4 M12 17h.01',
  truck: 'M2 6h12v10H2z M14 10h4l4 4v2h-8z M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  cash: 'M2 7h20v10H2z M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M6 10v4 M18 10v4',
  percent: 'M19 5 5 19 M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  route: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z M9 4v14 M15 6v14',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
  up: 'M7 17 17 7 M8 7h9v9',
  down: 'M7 7l10 10 M17 8v9H8',
  dup: 'M8 8h12v12H8z M4 16V4h12 M14 11v6 M11 14h6',
  sparkle: 'M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2.5 2.5 M15.5 15.5 18 18 M6 18l2.5-2.5 M15.5 8.5 18 6',
  more: 'M5 12h.01 M12 12h.01 M19 12h.01',
  command: 'M9 6v12 M15 6v12 M6 9h12 M6 15h12 M9 6a3 3 0 1 0-3 3 M15 6a3 3 0 1 1 3 3 M9 18a3 3 0 1 1-3-3 M15 18a3 3 0 1 0 3-3',
  keyboard: 'M3 6h18v12H3z M7 10h.01 M11 10h.01 M15 10h.01 M7 14h10',
  arrowR: 'M5 12h14 M13 6l6 6-6 6',
  ban: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M5.6 5.6l12.8 12.8',
};
function Icon({ n, s = 16, w = 1.8, cls }) {
  return html`<svg className=${cls} width=${s} height=${s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth=${n === 'more' ? 3 : w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d=${ICONS[n] || ''} /></svg>`;
}
const Ico = ({ n, tone, text, lg }) => html`<span className=${'ico ' + (tone || '') + (lg ? ' lg' : '')}>${text != null ? text : html`<${Icon} n=${n} s=${lg ? 17 : 14} w=${2} />`}</span>`;

/* ---------- atajos de teclado ---------- */
const IS_MAC = /Mac|iPhone|iPad|iPod/.test((navigator.platform || '') + ' ' + (navigator.userAgent || ''));
const KEYNAMES = { mod: IS_MAC ? '⌘' : 'Ctrl', shift: '⇧', alt: IS_MAC ? '⌥' : 'Alt', enter: '↵', esc: 'esc', backspace: '⌫', up: '↑', down: '↓', left: '←', right: '→', space: 'Espacio' };
const keyParts = (k) => String(k).split('+').map((p) => KEYNAMES[p] || p.toUpperCase());
function Kbd({ k }) { if (!k) return null; return html`<span className="kbds">${keyParts(k).map((p, i) => html`<span key=${i} className="kbd">${p}</span>`)}</span>`; }
function eventKey(e) {
  const parts = [];
  if (e.metaKey || e.ctrlKey) parts.push('mod');
  if (e.altKey) parts.push('alt');
  let k = e.key || '';
  const named = { Enter: 'enter', Escape: 'esc', Backspace: 'backspace', ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', ' ': 'space', Tab: 'tab' };
  if (named[k]) { if (e.shiftKey) parts.push('shift'); k = named[k]; } else k = k.toLowerCase();
  if (e.altKey && /^Digit\d$/.test(e.code || '')) k = e.code.slice(5);
  else if (e.altKey && /^Key[A-Z]$/.test(e.code || '')) k = e.code.slice(3).toLowerCase();
  return [...parts, k].join('+');
}
/* Cada pantalla publica sus acciones: aparecen en la paleta, en la barra inferior y responden a su atajo */
function useCtx(label, actions) {
  useEffect(() => {
    const list = (actions || []).filter(Boolean);
    const sig = label + '|' + list.map((a) => a.id + ':' + a.title + ':' + (a.key || '') + ':' + (a.disabled ? 1 : 0) + ':' + (a.href || '')).join('|');
    ctx.actions = list; ctx.label = label;
    if (sig !== ctx.sig) { ctx.sig = sig; uiEmit(); }
  });
  useEffect(() => () => { ctx.actions = []; ctx.label = ''; ctx.sig = ''; uiEmit(); }, []);
}
function openHref(href) {
  const a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
}
function runAction(a) {
  if (!a || a.disabled) return;
  if (a.href) openHref(a.href);
  if (a.run) a.run();
}
const openGlobal = (t, extra) => { ui.global = { t, ...(extra || {}) }; ui.palette = false; uiEmit(); };
const openPalette = () => { ui.palette = true; uiEmit(); };
function moveFocus(dir) {
  const root = document.querySelector('.page'); if (!root) return;
  const rows = [...root.querySelectorAll('[data-row]')].filter((el) => el.offsetParent !== null);
  if (!rows.length) return;
  const i = rows.indexOf(document.activeElement);
  if (dir < 0 && i === 0) { const sb = root.querySelector('[data-search]'); if (sb) { sb.focus(); return; } }
  const n = i < 0 ? (dir > 0 ? 0 : rows.length - 1) : Math.max(0, Math.min(rows.length - 1, i + dir));
  rows[n].focus({ preventScroll: true }); rows[n].scrollIntoView({ block: 'nearest' });
}

function useUI() {
  const [, setV] = useState(0);
  useEffect(() => { const f = () => setV((v) => v + 1); ui.listeners.add(f); return () => ui.listeners.delete(f); }, []);
  return ui;
}
function Toasts() {
  const u = useUI();
  return html`<div className="toasts" role="status" aria-live="polite">
    ${u.toasts.map((t) => html`<div key=${t.id} className=${'toast ' + (t.tone || '')}>
      <span className="t-ico"><${Icon} n=${t.tone === 'bad' ? 'alert' : 'checkc'} s=${16} w=${2} /></span>
      <span className="t-msg">${t.msg}</span>
      ${t.action && html`<button onClick=${() => { t.action.fn(); ui.toasts = ui.toasts.filter((x) => x.id !== t.id); uiEmit(); }}>${t.action.label}</button>`}
    </div>`)}
  </div>`;
}
function ConfirmHost() {
  const u = useUI();
  const c = u.confirm;
  const [typed, setTyped] = useState('');
  useEffect(() => setTyped(''), [c]);
  if (!c) return null;
  const close = (v) => { const r = c.resolve; ui.confirm = null; uiEmit(); r(v); };
  const blocked = c.typeToConfirm && typed.trim().toUpperCase() !== c.typeToConfirm;
  return html`<${Modal} title=${c.title || '¿Confirmás?'} onClose=${() => close(false)} onSubmit=${() => { if (!blocked) close(true); }}
    footer=${html`<button className="btn ghost" onClick=${() => close(false)}>${c.cancelLabel || 'Cancelar'} <${Kbd} k="esc" /></button>
      <button className=${'btn ' + (c.danger ? 'danger solid' : 'primary')} disabled=${blocked} onClick=${() => close(true)} autoFocus=${!c.typeToConfirm}>${c.okLabel || 'Confirmar'} <${Kbd} k="enter" /></button>`}>
    ${c.message && html`<p className="soft">${c.message}</p>`}
    ${c.typeToConfirm && html`<div className="field"><label htmlFor="cf-typed">Escribí ${c.typeToConfirm} para confirmar</label><input id="cf-typed" className="input" value=${typed} onChange=${(e) => setTyped(e.target.value)} autoFocus /></div>`}
  <//>`;
}

/* Ventana modal: esc cierra, ⌘↵ confirma */
function Modal({ title, onClose, children, footer, wide, onSubmit }) {
  const subRef = useRef(onSubmit); subRef.current = onSubmit;
  const closeRef = useRef(onClose); closeRef.current = onClose;
  const myId = useRef(uid());
  useEffect(() => {
    ui.stack = [...(ui.stack || []), myId.current]; ui.modals++;
    const k = (e) => {
      const key = eventKey(e);
      if (ui.palette || ui.stack[ui.stack.length - 1] !== myId.current) return;
      if (key === 'esc') { e.preventDefault(); closeRef.current && closeRef.current(); }
      else if (key === 'mod+enter' && subRef.current) { e.preventDefault(); subRef.current(); }
    };
    document.addEventListener('keydown', k);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { ui.stack = ui.stack.filter((x) => x !== myId.current); ui.modals = Math.max(0, ui.modals - 1); document.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, []);
  return ReactDOM.createPortal(html`<div className="scrim" onMouseDown=${(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}>
    <div className=${'modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label=${title}>
      <div className="modal-h"><h2>${title}</h2><button className="iconbtn" onClick=${onClose} aria-label="Cerrar"><${Icon} n="x" /></button></div>
      <div className="modal-b">${children}</div>
      ${footer && html`<div className="modal-f">${onSubmit && html`<span className="grow small muted hint-keys">${keyParts('mod+enter').join(' ')} para confirmar</span>`}${footer}</div>`}
    </div>
  </div>`, document.body);
}

function PageHead({ title, sub, actions }) {
  return html`<div className="phead">
    <div className="ph-text"><h1>${title}</h1>${sub && html`<span className="ph-sub">${sub}</span>`}</div>
    ${actions && html`<div className="ph-actions">${actions}</div>`}
  </div>`;
}
const TONE_ICO = { 't-carbon': 'c-blue', 't-kraft': 'c-orange', 't-violet': 'c-purple', 't-ok': 'c-green', 't-bad': 'c-red', 't-warn': 'c-yellow' };
const Pill = ({ tone, children, plain }) => html`<span className=${'pill ' + (tone || '') + (plain ? ' plain' : '')}>${children}</span>`;
const EstadoPill = ({ estado }) => { const e = ESTADOS[estado] || ESTADOS.presupuesto; return html`<${Pill} tone=${e.tone}>${e.label}<//>`; };
const PagoPill = ({ pago }) => pago ? html`<${Pill} tone=${PAGO[pago].tone}>${PAGO[pago].label}<//>` : null;

function Empty({ icon = 'box', title, sub, children }) {
  return html`<div className="empty"><div className="e-ico"><${Icon} n=${icon} s=${20} /></div>
    <div className="e-t">${title}</div>${sub && html`<div className="e-s">${sub}</div>`}
    ${children && html`<div className="e-a">${children}</div>`}</div>`;
}
function Field({ label, hint, children, cls, id }) {
  return html`<div className=${'field ' + (cls || '')}>${label && html`<label htmlFor=${id}>${label}</label>`}${children}${hint && html`<div className="hint">${hint}</div>`}</div>`;
}
/* Campo numérico que acepta coma o punto y no pierde lo que se tipea */
function NumInput({ value, onChange, id, prefix, suffix, placeholder, cls, decimals = 2, autoFocus, onKeyDown, mini }) {
  const fmt = (v) => (v === '' || v == null || (v === 0 && placeholder)) ? '' : String(round2(v)).replace('.', ',');
  const [txt, setTxt] = useState(fmt(value));
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setTxt(fmt(value)); }, [value]);
  const inp = html`<input id=${id} className=${(mini ? 'mini-input ' : 'input num ') + (suffix ? 'has-post ' : '') + (cls || '')} inputMode="decimal" autoComplete="off"
    value=${txt} placeholder=${placeholder} autoFocus=${autoFocus} onKeyDown=${onKeyDown}
    onFocus=${(e) => { focused.current = true; e.target.select(); }}
    onBlur=${() => { focused.current = false; setTxt(fmt(value)); }}
    onChange=${(e) => { const t = e.target.value.replace(/[^\d.,-]/g, ''); setTxt(t); onChange(decimals === 0 ? Math.round(parseNum(t)) : parseNum(t)); }} />`;
  if (!prefix && !suffix) return inp;
  return html`<div className="input-wrap">${prefix && html`<span className="pre">${prefix}</span>`}${inp}${suffix && html`<span className="post">${suffix}</span>`}</div>`;
}
function Toggle({ checked, onChange, label, id }) {
  return html`<label className="toggle" htmlFor=${id}><input id=${id} type="checkbox" checked=${!!checked} onChange=${(e) => onChange(e.target.checked)} /><span className="sw"></span><span>${label}</span></label>`;
}
function Search({ value, onChange, placeholder, id, autoFocus, onKeyDown, inputRef, page }) {
  return html`<div className="search"><${Icon} n="search" s=${15} />
    <input id=${id} ref=${inputRef} className="input" type="search" value=${value} placeholder=${placeholder || 'Buscar'} autoFocus=${autoFocus} onKeyDown=${onKeyDown}
      data-search=${page ? '' : undefined} onChange=${(e) => onChange(e.target.value)} autoComplete="off" />
    ${page && !value && html`<span className="s-kbd"><${Kbd} k="/" /></span>`}</div>`;
}
function Chips({ options, value, onChange }) {
  return html`<div className="chips" role="tablist">${options.map((o) => html`<button key=${o.v} role="tab" aria-selected=${value === o.v} className=${'chip' + (value === o.v ? ' on' : '')} onClick=${() => onChange(o.v)}>${o.l}${o.ct != null && html`<span className="ct">${o.ct}</span>`}</button>`)}</div>`;
}
function Seg({ options, value, onChange }) {
  return html`<div className="seg">${options.map((o) => html`<button key=${o.v} className=${value === o.v ? 'on' : ''} onClick=${() => onChange(o.v)}>${o.l}</button>`)}</div>`;
}
function Kpi({ label, value, sub, hl, onClick, trend }) {
  const T = onClick ? 'button' : 'div';
  return html`<${T} className=${'kpi' + (hl ? ' hl' : '')} onClick=${onClick}>
    <span className="k-l">${label}</span><span className="k-v">${value}</span>
    ${(sub || trend != null) && html`<span className="k-s">${trend != null && isFinite(trend) && html`<span className=${'trend ' + (trend >= 0 ? 'ok-t' : 'bad-t')}><${Icon} n=${trend >= 0 ? 'up' : 'down'} s=${12} w=${2.2} />${pct(Math.abs(trend))}</span>`}${sub}</span>`}
  <//>`;
}
function Panel({ title, count, actions, children, flush, cls }) {
  return html`<section className=${'panel ' + (cls || '')}>
    ${title && html`<div className="panel-h"><h2>${title}${count != null && html`<span className="ct">${count}</span>`}</h2>${actions}</div>`}
    <div className=${'panel-b' + (flush ? ' flush' : '')}>${children}</div></section>`;
}
const SecH = ({ children, count }) => html`<div className="sec-h">${children}${count != null && html`<span className="ct">${count}</span>`}</div>`;

/* Botón con su atajo visible */
const KBtn = ({ k, icon, children, cls, onClick, disabled, title }) => html`<button className=${'btn ' + (cls || '')} onClick=${onClick} disabled=${disabled} title=${title}>${icon && html`<${Icon} n=${icon} s=${15} />`}${children}${k && html`<${Kbd} k=${k} />`}</button>`;

/* Selector de cliente con búsqueda y teclado */
function ClienteSelect({ s, value, onChange, onNuevo }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [kb, setKb] = useState(0);
  const cli = value ? s.cliMap.get(value) : null;
  const hits = useMemo(() => s.clientes.filter((c) => c.activo !== false && matches(q, c.nombre, c.contacto, c.localidad, c.zona, c.telefono)).slice(0, 30), [q, s.version]);
  useEffect(() => setKb(0), [q]);
  const pick = (c) => { onChange(c.id); setOpen(false); setQ(''); };
  const onKey = (e) => {
    const k = eventKey(e);
    if (k === 'down') { e.preventDefault(); setKb((x) => Math.min(x + 1, hits.length - 1)); }
    else if (k === 'up') { e.preventDefault(); setKb((x) => Math.max(x - 1, 0)); }
    else if (k === 'enter' && hits[kb]) { e.preventDefault(); pick(hits[kb]); }
  };
  if (cli && !open) {
    const st = s.cliStats.get(cli.id);
    return html`<div className="row-flex">
      <${Ico} tone=${colorFor(cli.nombre)} text=${initials(cli.nombre)} lg />
      <div className="grow"><div className="strong ellipsis">${cli.nombre}</div>
        <div className="small muted ellipsis">${[cli.direccion, cli.localidad].filter(Boolean).join(', ') || 'Sin dirección'}${st && st.saldo > 0.5 ? ' · ' : ''}${st && st.saldo > 0.5 && html`<span className="warn-t strong">Debe ${money(st.saldo)}</span>`}</div></div>
      <button className="btn sm" onClick=${() => { setOpen(true); setQ(''); }}>Cambiar</button>
    </div>`;
  }
  return html`<div className="stack-sm">
    <div className="row-flex"><${Search} value=${q} onChange=${setQ} onKeyDown=${onKey} placeholder="Buscar cliente por nombre, zona o teléfono" autoFocus=${open} />
      ${onNuevo && html`<button className="btn icon" title="Nuevo cliente" aria-label="Nuevo cliente" onClick=${onNuevo}><${Icon} n="plus" /></button>`}
      ${cli && html`<button className="btn ghost sm" onClick=${() => setOpen(false)}>Cancelar</button>`}</div>
    <div className="panel" style=${{ maxHeight: '244px', overflowY: 'auto', padding: '4px 0' }}>
      ${hits.length === 0 ? html`<div className="li muted-row" style=${{ padding: '6px 14px' }}>${s.clientes.length ? 'No hay clientes con esa búsqueda.' : 'Todavía no cargaste clientes.'}</div>` :
      html`<div className="list">${hits.map((c, i) => html`<button key=${c.id} className="li" style=${i === kb && q ? { background: 'var(--sel)' } : null} onClick=${() => pick(c)}>
        <${Ico} tone=${colorFor(c.nombre)} text=${initials(c.nombre)} />
        <div className="li-main"><span className="li-t">${c.nombre}</span><span className="li-s">${[c.zona || c.localidad, c.contacto].filter(Boolean).join(' · ')}</span></div>
      </button>`)}</div>`}
    </div>
  </div>`;
}

/* ---------- paleta de comandos ---------- */
function comandos(s, go) {
  const PERM_CMD = { np: 'pedido.crear', nc: 'cliente.editar', npr: 'producto.editar', nv: 'visita.editar', ruta: 'visita.editar', imp: 'producto.editar', pre: 'producto.editar', arm: 'ver.pedidos', deu: 'ver.clientes', sb: 'ver.productos', bk: 'producto.editar' };
  return comandosTodos(s, go).filter((c) => (PERM_CMD[c.id] ? puede(PERM_CMD[c.id]) : true) && (!c.id.startsWith('go-') || puedeVista(c.id.slice(3))));
}
function comandosTodos(s, go) {
  return [
    { id: 'np', title: 'Nuevo pedido', sub: 'Armar pedido o presupuesto', icon: 'receipt', tone: 'c-red', key: 'n', kw: 'armar venta presupuesto', run: () => go('armador', {}) },
    { id: 'nc', title: 'Nuevo cliente', sub: 'Agregar a la cartera', icon: 'user', tone: 'c-blue', kw: 'agregar comercio', run: () => openGlobal('cliente') },
    { id: 'npr', title: 'Nuevo producto', sub: 'Agregar al catálogo', icon: 'box', tone: 'c-orange', kw: 'agregar articulo', run: () => openGlobal('producto') },
    { id: 'nv', title: 'Agendar visita', icon: 'calendar', tone: 'c-purple', kw: 'agenda ruta', run: () => openGlobal('visita') },
    { id: 'ruta', title: 'Cargar ruta de la semana', sub: 'Según el día de visita de cada cliente', icon: 'route', tone: 'c-purple', kw: 'agenda visitas', run: () => cargarRutaSemana(storeSnapshot(), new Date()) },
    { id: 'imp', title: 'Importar productos desde Excel', icon: 'upload', tone: 'c-orange', kw: 'csv pegar lista', run: () => openGlobal('importar') },
    { id: 'pre', title: 'Actualizar precios por porcentaje', sub: 'Aumentos de proveedor', icon: 'percent', tone: 'c-orange', kw: 'aumento inflacion', run: () => openGlobal('precios') },
    { id: 'arm', title: 'Pedidos para armar', icon: 'truck', tone: 'c-yellow', kw: 'deposito pendientes', run: () => go('pedidos', { estado: 'activos' }) },
    { id: 'deu', title: 'Clientes con deuda', icon: 'cash', tone: 'c-yellow', kw: 'cobrar saldo cuenta corriente', run: () => go('clientes', { filtro: 'deuda' }) },
    { id: 'sb', title: 'Productos con stock bajo', icon: 'alert', tone: 'c-yellow', kw: 'reponer faltantes', run: () => go('productos', { filtro: 'bajo' }) },
    ...navVisible().map((n, i) => ({ id: 'go-' + n.v, title: n.l, sub: 'Ir a la sección', icon: n.i, key: 'alt+' + (i + 1), kw: 'ir abrir', run: () => go(n.v, {}) })),
    { id: 'bk', title: 'Descargar respaldo', sub: 'Todo el sistema en un archivo', icon: 'download', kw: 'backup exportar', run: () => descargarRespaldo(storeSnapshot()) },
    { id: 'help', title: 'Atajos de teclado', icon: 'keyboard', key: '?', kw: 'ayuda teclas', run: () => openGlobal('atajos') },
  ];
}
function Palette({ s, go }) {
  const u = useUI();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const listRef = useRef(null);
  const close = () => { ui.palette = false; uiEmit(); };
  const secs = [];
  const ca = ctx.actions.filter((a) => !a.disabled && matches(q, a.title, a.kw));
  if (ca.length) secs.push({ title: ctx.label || 'Acciones', items: ca.map((a) => ({ ...a, typ: 'Acción' })) });
  if (q.trim()) {
    const cl = !puede('ver.clientes') ? [] : s.clientes.filter((c) => matches(q, c.nombre, c.contacto, c.zona, c.localidad, c.telefono, c.cuit)).slice(0, 5)
      .map((c) => ({ id: 'c-' + c.id, text: initials(c.nombre), tone: colorFor(c.nombre), title: c.nombre, sub: [c.zona || c.localidad, c.contacto].filter(Boolean).join(' · '), typ: 'Cliente', run: () => go('cliente', { id: c.id }) }));
    const pr = !puede('ver.productos') ? [] : s.productos.filter((p) => matches(q, p.nombre, p.codigo, p.marca, p.categoria)).slice(0, 5)
      .map((p) => ({ id: 'p-' + p.id, icon: 'box', tone: colorFor(p.categoria || 'x'), title: p.nombre, sub: `${p.codigo || 's/c'} · ${money(p.precio)} · stock ${qty(p.stock)}`, typ: 'Producto', run: () => go('productos', { open: p.id }) }));
    const pe = !puede('ver.pedidos') ? [] : s.pedidos.filter((p) => matches(q, numCorto(p), String(p.numero), p.clienteSnap && p.clienteSnap.nombre)).slice(0, 5)
      .map((p) => ({ id: 'o-' + p.id, icon: 'receipt', tone: ESTADO_ICO[p.estado], title: `${numCorto(p)} · ${(p.clienteSnap || {}).nombre || 'Sin cliente'}`, sub: `${fmtDia(p.fecha)} · ${money(s.calc.get(p.id).total)} · ${ESTADOS[p.estado].label}`, typ: 'Pedido', run: () => go('pedido', { id: p.id }) }));
    if (pe.length) secs.push({ title: 'Pedidos', items: pe });
    if (cl.length) secs.push({ title: 'Clientes', items: cl });
    if (pr.length) secs.push({ title: 'Productos', items: pr });
  } else if (s.pedidos.length && puede('ver.pedidos')) {
    secs.push({ title: 'Pedidos recientes', items: s.pedidos.slice(0, 3).map((p) => ({ id: 'r-' + p.id, icon: 'receipt', tone: ESTADO_ICO[p.estado], title: `${numCorto(p)} · ${(p.clienteSnap || {}).nombre || 'Sin cliente'}`, sub: `${fmtDia(p.fecha)} · ${money(s.calc.get(p.id).total)}`, typ: ESTADOS[p.estado].label, run: () => go('pedido', { id: p.id }) })) });
  }
  const cmds = comandos(s, go).filter((c) => matches(q, c.title, c.sub, c.kw));
  if (cmds.length) secs.push({ title: 'Comandos', items: cmds.map((c) => ({ ...c, typ: c.typ || 'Comando' })) });
  const flat = secs.flatMap((x) => x.items);
  useEffect(() => setSel(0), [q]);
  useEffect(() => { const el = listRef.current && listRef.current.querySelector('.pal-item.on'); if (el) el.scrollIntoView({ block: 'nearest' }); }, [sel, q]);
  const exec = (it) => { if (!it) return; close(); setTimeout(() => runAction(it), 0); };
  const onKey = (e) => {
    const k = eventKey(e);
    if (k === 'down' || k === 'mod+j') { e.preventDefault(); setSel((x) => Math.min(x + 1, flat.length - 1)); }
    else if (k === 'up') { e.preventDefault(); setSel((x) => Math.max(x - 1, 0)); }
    else if (k === 'enter') { e.preventDefault(); const it = flat[sel]; if (it && it.href) { const el = listRef.current.querySelector('.pal-item.on'); close(); el && el.click(); } else exec(it); }
    else if (k === 'esc') { e.preventDefault(); if (q) setQ(''); else close(); }
  };
  let idx = -1;
  return ReactDOM.createPortal(html`<div className="scrim pal-scrim" onMouseDown=${(e) => { if (e.target === e.currentTarget) close(); }}>
    <div className="pal" role="dialog" aria-modal="true" aria-label="Paleta de comandos">
      <div className="pal-in"><${Icon} n="search" s=${17} />
        <input autoFocus value=${q} onChange=${(e) => setQ(e.target.value)} onKeyDown=${onKey} placeholder="Buscar pedidos, clientes, productos o comandos…" aria-label="Buscar" />
        ${ctx.label && html`<span className="pal-ctx">${ctx.label}</span>`}
      </div>
      <div className="pal-list" ref=${listRef}>
        ${flat.length === 0 ? html`<div className="pal-empty">Nada coincide con “${q}”.</div>` : secs.map((sec) => html`<div key=${sec.title}>
          <div className="sec-h">${sec.title}</div>
          ${sec.items.map((it) => { idx++; const my = idx; const T = it.href ? 'a' : 'button'; return html`<${T} key=${it.id} className=${'pal-item' + (my === sel ? ' on' : '')} href=${it.href} target=${it.href ? '_blank' : undefined} rel=${it.href ? 'noopener' : undefined}
              onMouseMove=${() => sel !== my && setSel(my)} onClick=${(e) => { if (it.href) { close(); if (it.run) it.run(); return; } e.preventDefault(); exec(it); }}>
            <${Ico} n=${it.icon || 'arrowR'} tone=${it.tone} text=${it.text} />
            <span className="pi-t">${it.title}</span><span className="pi-s">${it.sub || ''}</span>
            ${it.key ? html`<${Kbd} k=${it.key} />` : html`<span className="pi-type">${it.typ}</span>`}
          <//>`; })}
        </div>`)}
      </div>
      <div className="pal-foot hint-keys"><span><${Kbd} k="enter" />Ejecutar</span><span><${Kbd} k="up" /><${Kbd} k="down" />Moverse</span><span><${Kbd} k="esc" />Cerrar</span><span className="grow"></span><span><${Kbd} k="mod+k" />Abrir y cerrar</span></div>
    </div>
  </div>`, document.body);
}

function AtajosModal({ onClose }) {
  const G = [
    ['General', [['Paleta de comandos', 'mod+k'], ['Nuevo pedido', 'n'], ['Buscar en la pantalla', '/'], ['Moverse por la lista', 'up', 'down'], ['Abrir el elemento', 'enter'], ['Volver / cerrar', 'esc'], ['Esta ayuda', '?']]],
    ['Ir a', [['Inicio', 'alt+1'], ['Pedidos', 'alt+2'], ['Agenda', 'alt+3'], ['Clientes', 'alt+4'], ['Productos', 'alt+5'], ['Estadísticas', 'alt+6'], ['Ajustes', 'alt+7'], ['O tocá G y después I, P, A, C, R, E o S', 'g']]],
    ['En un pedido', [['Avanzar estado', 'a'], ['WhatsApp al depósito', 'd'], ['WhatsApp al cliente', 'w'], ['Etiqueta', 'e'], ['Boleta PDF', 'b'], ['Registrar cobro', 'c'], ['Editar', 'm'], ['Repetir pedido', 'r']]],
    ['Armando un pedido', [['Buscar producto', '/'], ['Elegir producto', 'up', 'down'], ['Agregar el resaltado', 'enter'], ['Guardar', 'mod+enter']]],
    ['En las secciones', [['Agregar cliente o producto', 'a'], ['Importar productos', 'i'], ['Actualizar precios', 'p'], ['Nueva visita', 'v'], ['Cargar ruta de la semana', 'r'], ['Día anterior / siguiente', 'left', 'right'], ['Ir a hoy en la agenda', 't'], ['Período en estadísticas', '1', '6'], ['Guardar ajustes', 'mod+s']]],
    ['En formularios', [['Confirmar', 'mod+enter'], ['Cerrar', 'esc']]],
  ];
  return html`<${Modal} wide title="Atajos de teclado" onClose=${onClose}>
    <div className="keys-grid">${G.map(([h, rows]) => html`<${Fragment} key=${h}><div className="kg-h">${h}</div>
      ${rows.map(([l, ...ks]) => html`<div key=${l} className="keys-row"><span className="soft">${l}</span><span className="row-flex" style=${{ gap: '4px' }}>${ks.map((k) => html`<${Kbd} key=${k} k=${k} />`)}</span></div>`)}<//>`)}</div>
    <p className="small muted">En el celular, tocá la lupa de arriba para abrir la paleta de comandos.</p>
  <//>`;
}

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error(err, info); }
  render() {
    if (this.state.err) {
      return html`<div className="err-box"><strong>Algo falló al mostrar esta pantalla.</strong>
        <span>Tus datos están a salvo. Probá volver al inicio; si se repite, pasale este mensaje a quien te armó el sistema.</span>
        <pre>${String(this.state.err && (this.state.err.stack || this.state.err.message || this.state.err)).slice(0, 900)}</pre>
        <button className="btn" onClick=${() => { this.setState({ err: null }); this.props.onReset && this.props.onReset(); }}>Volver al inicio</button></div>`;
    }
    return this.props.children;
  }
}

/* =========================================================
   Aplicación: ventana, navegación, atajos y paleta
   ========================================================= */
const MAIN = ['inicio', 'pedidos', 'agenda', 'clientes', 'productos', 'estadisticas', 'ajustes'];
const NAV = [
  { v: 'inicio', l: 'Inicio', i: 'home' }, { v: 'pedidos', l: 'Pedidos', i: 'receipt' }, { v: 'agenda', l: 'Agenda', i: 'calendar' },
  { v: 'clientes', l: 'Clientes', i: 'users' }, { v: 'productos', l: 'Productos', i: 'box' }, { v: 'estadisticas', l: 'Estadísticas', i: 'chart' }, { v: 'ajustes', l: 'Ajustes', i: 'settings' },
];
const G_KEYS = { i: 'inicio', p: 'pedidos', a: 'agenda', c: 'clientes', r: 'productos', e: 'estadisticas', s: 'ajustes' };
const PERM_VISTA = { pedidos: 'ver.pedidos', pedido: 'ver.pedidos', armador: 'ver.pedidos', agenda: 'ver.agenda', clientes: 'ver.clientes', cliente: 'ver.clientes', productos: 'ver.productos', estadisticas: 'ver.estadisticas' };
const puedeVista = (v) => !PERM_VISTA[v] || puede(PERM_VISTA[v]);
const navVisible = () => NAV.filter((n) => puedeVista(n.v));
const TITULOS = { inicio: 'Inicio', pedidos: 'Pedidos', agenda: 'Agenda', clientes: 'Clientes', productos: 'Productos', estadisticas: 'Estadísticas', ajustes: 'Ajustes', pedido: 'Pedido', armador: 'Armar pedido', cliente: 'Cliente' };
const TAB_DE = { pedido: 'pedidos', armador: 'pedidos', cliente: 'clientes' };

function ActBar({ go, tab }) {
  useUI();
  const prim = ctx.actions.find((a) => a.primary && !a.disabled);
  const navItem = NAV.find((n) => n.v === tab) || NAV[0];
  return html`<footer className="actbar">
    <div className="ab-left"><${Ico} n=${navItem.i} /><span className="ellipsis">${ctx.label || navItem.l}</span></div>
    ${prim && html`<button onClick=${() => runAction(prim)}>${prim.title}<${Kbd} k=${prim.key} /></button><span className="ab-sep"></span>`}
    <button onClick=${openPalette}>Acciones<${Kbd} k="mod+k" /></button>
  </footer>`;
}
function Crumbs({ isSub, parent, title }) {
  useUI();
  return html`<div className="crumbs">
    ${isSub && html`<span className="c-par desk-only">${parent}</span><span className="c-sep desk-only">›</span>`}
    <span className="c-cur">${isSub ? (ctx.label || title) : title}</span>
  </div>`;
}
function GlobalModals({ s, go }) {
  const u = useUI();
  const g = u.global;
  if (!g) return null;
  const close = () => { ui.global = null; uiEmit(); };
  if (g.t === 'cliente') return html`<${ClienteForm} s=${s} onClose=${close} onSaved=${(id) => { close(); go('cliente', { id }); }} />`;
  if (g.t === 'producto') return html`<${ProductoForm} s=${s} init=${{}} onClose=${close} />`;
  if (g.t === 'visita') return html`<${VisitaForm} s=${s} init=${{ fecha: todayISO() }} onClose=${close} />`;
  if (g.t === 'importar') return html`<${ImportarModal} s=${s} onClose=${close} />`;
  if (g.t === 'precios') return html`<${PreciosModal} s=${s} onClose=${close} />`;
  if (g.t === 'atajos') return html`<${AtajosModal} onClose=${close} />`;
  return null;
}
function PaletteHost({ s, go }) {
  const u = useUI();
  return u.palette ? html`<${Palette} s=${s} go=${go} />` : null;
}

function Login({ s }) {
  const [modo, setModo] = useState('entrar');
  const [email, setEmail] = useState(() => lsGet('jf-ultimo-email', ''));
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [ver, setVer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [aviso, setAviso] = useState('');
  const sinAcceso = s.mode === 'sin-acceso';
  const cambiar = (m) => { setModo(m); setErr(''); setAviso(''); };
  const enviar = async (e) => {
    e.preventDefault(); if (busy) return;
    if (!email.trim()) { setErr('Escribí tu email.'); return; }
    if (modo !== 'recuperar' && !pass) { setErr('Escribí la contraseña.'); return; }
    if (modo === 'crear' && pass.length < 6) { setErr('La contraseña tiene que tener al menos 6 caracteres.'); return; }
    if (modo === 'crear' && pass !== pass2) { setErr('Las dos contraseñas no coinciden.'); return; }
    setBusy(true); setErr(''); setAviso('');
    try {
      lsSet('jf-ultimo-email', email.trim());
      if (modo === 'entrar') { await supaLogin(email, pass); return; }
      if (modo === 'crear') {
        const r = await supaRegistro(email, pass);
        if (r === 'confirmar') { setModo('entrar'); setPass2(''); setAviso(`Te mandamos un email a ${email.trim()} para confirmar la cuenta. Abrilo, tocá el enlace y después entrá con tu contraseña.`); }
      }
      if (modo === 'recuperar') { await supaRecuperar(email); setAviso(`Si ${email.trim()} tiene cuenta, te llega un email con un enlace para elegir una contraseña nueva.`); }
    } catch (x) { setErr(x.message || 'No se pudo completar.'); }
    setBusy(false);
  };
  const ojo = html`<button type="button" className="iconbtn" style=${{ position: 'absolute', right: '2px' }} aria-label=${ver ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick=${() => setVer(!ver)}><${Icon} n=${ver ? 'eyeOff' : 'eye'} s=${16} /></button>`;
  const titulo = { entrar: 'Entrar', crear: 'Crear cuenta', recuperar: 'Recuperar contraseña' }[modo];
  return html`<div className="login">
    <form className="login-card" onSubmit=${enviar}>
      <div className="row-flex" style=${{ gap: '10px' }}><div className="mark" style=${{ width: '34px', height: '34px', fontSize: '13px', borderRadius: '9px' }}>JG</div>
        <div><div className="strong" style=${{ fontSize: '16px' }}>${s.config.nombre || 'JG Distribuidora'}</div><div className="small muted">Gestión comercial</div></div></div>
      ${sinAcceso ? html`<${Fragment}>
        <div className="banner warn"><${Icon} n="alert" s=${16} /><span className="grow">Tu cuenta (${s.usuario}) está creada, pero todavía no tiene acceso. Pedile al administrador que te agregue en Ajustes → Usuarios y roles.</span></div>
        <button type="button" className="btn block" onClick=${() => location.reload()}>Ya me agregaron, volver a probar</button>
        <button type="button" className="btn ghost block" onClick=${() => supaLogout()}>Entrar con otro usuario</button><//>`
      : html`<${Fragment}>
        <div className="strong" style=${{ fontSize: '15px' }}>${titulo}</div>
        ${aviso && html`<div className="banner info"><${Icon} n="checkc" s=${16} /><span className="grow">${aviso}</span></div>`}
        <${Field} label="Email" id="lg-email"><input id="lg-email" className="input" type="email" autoComplete="username" inputMode="email" value=${email} onChange=${(e) => setEmail(e.target.value)} autoFocus=${!email} /><//>
        ${modo !== 'recuperar' && html`<${Field} label=${modo === 'crear' ? 'Elegí una contraseña' : 'Contraseña'} id="lg-pass" hint=${modo === 'crear' ? 'Al menos 6 caracteres.' : null}><div className="input-wrap"><input id="lg-pass" className="input has-post" type=${ver ? 'text' : 'password'} autoComplete=${modo === 'crear' ? 'new-password' : 'current-password'} value=${pass} onChange=${(e) => setPass(e.target.value)} autoFocus=${!!email} style=${{ paddingRight: '40px' }} />${ojo}</div><//>`}
        ${modo === 'crear' && html`<${Field} label="Repetí la contraseña" id="lg-pass2"><input id="lg-pass2" className="input" type=${ver ? 'text' : 'password'} autoComplete="new-password" value=${pass2} onChange=${(e) => setPass2(e.target.value)} /><//>`}
        ${err && html`<div className="small bad-t">${err}</div>`}
        <button type="submit" className="btn primary lg block" disabled=${busy}>${busy ? 'Un momento…' : modo === 'entrar' ? 'Entrar' : modo === 'crear' ? 'Crear cuenta' : 'Enviar enlace'}<${Kbd} k="enter" /></button>
        <div className="row-flex wrap" style=${{ justifyContent: 'space-between' }}>
          ${modo === 'entrar' ? html`<button type="button" className="btn ghost sm" onClick=${() => cambiar('crear')}>Crear cuenta</button><button type="button" className="btn ghost sm" onClick=${() => cambiar('recuperar')}>Olvidé mi contraseña</button>`
          : html`<button type="button" className="btn ghost sm" onClick=${() => cambiar('entrar')}>Volver a entrar</button>`}
        </div>
        ${modo === 'crear' && html`<p className="small muted">Usá el email que te pidió el administrador. Vas a poder entrar cuando te asigne un rol.</p>`}<//>`}
    </form>
  </div>`;
}
function NuevaClave({ s }) {
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const enviar = async (e) => {
    e.preventDefault(); if (busy) return;
    if (pass.length < 6) { setErr('La contraseña tiene que tener al menos 6 caracteres.'); return; }
    setBusy(true); setErr('');
    try { await supaNuevaClave(pass); } catch (x) { setErr(x.message); setBusy(false); }
  };
  return html`<div className="login"><form className="login-card" onSubmit=${enviar}>
    <div className="strong" style=${{ fontSize: '15px' }}>Elegí una contraseña nueva</div>
    <${Field} label="Contraseña nueva" id="nc-pass" hint="Al menos 6 caracteres."><input id="nc-pass" className="input" type="password" autoComplete="new-password" value=${pass} onChange=${(e) => setPass(e.target.value)} autoFocus /><//>
    ${err && html`<div className="small bad-t">${err}</div>`}
    <button type="submit" className="btn primary lg block" disabled=${busy}>${busy ? 'Guardando…' : 'Guardar y entrar'}</button>
  </form></div>`;
}

function App() {
  const s = useStore();
  const [nav, setNav] = useState(() => {
    let h = ''; try { h = (location.hash || '').slice(1); } catch (e) { /* sin hash */ }
    if (h === 'nuevo') return [{ view: 'inicio', params: {} }, { view: 'armador', params: {} }];
    return [{ view: MAIN.includes(h) ? h : 'inicio', params: {} }];
  });
  const scrollRef = useRef(null);
  const cur = nav[nav.length - 1];
  const toTop = () => { window.scrollTo(0, 0); if (scrollRef.current) scrollRef.current.scrollTop = 0; };
  const go = useCallback((view, params = {}, opts = {}) => {
    setNav((n) => {
      if (MAIN.includes(view)) return [{ view, params }];
      const st = opts.replace ? n.slice(0, -1) : [...n];
      st.push({ view, params });
      return st.slice(-30);
    });
    if (ui.palette) { ui.palette = false; uiEmit(); }
    toTop();
  }, []);
  const back = useCallback(() => { setNav((n) => (n.length > 1 ? n.slice(0, -1) : [{ view: 'inicio', params: {} }])); toTop(); }, []);
  useEffect(() => { if (MAIN.includes(cur.view)) { try { history.replaceState(null, '', '#' + cur.view); } catch (e) { /* sin historial */ } } }, [cur.view]);
  const isSub = !MAIN.includes(cur.view);
  /* al cambiar de usuario, siempre se arranca en Inicio */
  const ultimoUsuario = useRef(s.usuario);
  useEffect(() => { if (ultimoUsuario.current !== s.usuario) { ultimoUsuario.current = s.usuario; setNav([{ view: 'inicio', params: {} }]); toTop(); } }, [s.usuario]);
  const live = useRef({}); live.current = { isSub, go, back };

  /* Atajos globales */
  useEffect(() => {
    let gAt = 0;
    const onKey = (e) => {
      if (e.isComposing) return;
      const k = eventKey(e);
      const t = e.target;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (k === 'mod+k') { e.preventDefault(); ui.palette = !ui.palette; uiEmit(); return; }
      if (ui.palette || ui.modals > 0 || ui.confirm) return;
      const acts = ctx.actions.filter((a) => a.key && !a.disabled);
      const m = k.match(/^alt\+([1-7])$/);
      if (m) { const dest = navVisible()[Number(m[1]) - 1]; if (dest) { e.preventDefault(); if (typing) t.blur(); live.current.go(dest.v, {}); } return; }
      if (typing) {
        if (k === 'esc') { t.blur(); return; }
        if (k.startsWith('mod+')) { const a = acts.find((x) => x.key === k); if (a) { e.preventDefault(); runAction(a); } }
        else if (k === 'down' && t.hasAttribute('data-search')) { e.preventDefault(); moveFocus(1); }
        return;
      }
      if (gAt && Date.now() - gAt < 1200) { gAt = 0; const dest = G_KEYS[k]; if (dest && puedeVista(dest)) { e.preventDefault(); live.current.go(dest, {}); return; } }
      const a = acts.find((x) => x.key === k);
      if (a) { e.preventDefault(); runAction(a); return; }
      if (k === 'g') { gAt = Date.now(); return; }
      if (k === 'n') { if (puede('pedido.crear')) { e.preventDefault(); live.current.go('armador', {}); } return; }
      if (k === '/') { const el = document.querySelector('[data-search]'); if (el) { e.preventDefault(); el.focus(); if (el.select) el.select(); } return; }
      if (k === '?') { e.preventDefault(); openGlobal('atajos'); return; }
      if (k === 'down' || k === 'j') { e.preventDefault(); moveFocus(1); return; }
      if (k === 'up' || k === 'k') { e.preventDefault(); moveFocus(-1); return; }
      if (k === 'enter') { const el = document.activeElement; if (el && el.hasAttribute('data-row') && el.tagName !== 'BUTTON' && el.tagName !== 'A') { e.preventDefault(); el.click(); } return; }
      if (k === 'esc') { if (live.current.isSub) { e.preventDefault(); live.current.back(); } return; }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const tab = TAB_DE[cur.view] || cur.view;
  const badges = useMemo(() => {
    const hoy = todayISO();
    return {
      pedidos: s.pedidos.filter((p) => A_PREPARAR.has(p.estado)).length,
      agenda: s.visitas.filter((v) => v.fecha === hoy && v.estado === 'pendiente').length,
      productos: s.productos.filter(stockBajo).length,
    };
  }, [s.version]);
  const props = { s, go, back, params: cur.params || {} };
  const key = nav.length + ':' + cur.view + ':' + JSON.stringify(cur.params || {});
  const View = { inicio: Inicio, pedidos: Pedidos, pedido: PedidoDetalle, armador: Armador, clientes: Clientes, cliente: ClienteDetalle, productos: Productos, agenda: Agenda, estadisticas: Estadisticas, ajustes: Ajustes }[cur.view] || Inicio;
  const showFab = ['inicio', 'pedidos', 'agenda', 'clientes'].includes(cur.view) && puede('pedido.crear');
  const navItems = navVisible();
  const bottomItems = navItems.filter((n) => n.v !== 'ajustes' && n.v !== 'estadisticas').slice(0, 5);
  const permitida = puedeVista(cur.view) && (cur.view !== 'armador' || puede('pedido.crear') || puede('pedido.editar'));
  const [borrandoDemo, setBorrandoDemo] = useState(false);
  const parent = isSub ? TITULOS[TAB_DE[cur.view]] : null;

  if (s.mode === 'login' || s.mode === 'sin-acceso') return html`<${Fragment}><${Login} s=${s} /><${Toasts} /><//>`;
  if (s.mode === 'nueva-clave') return html`<${Fragment}><${NuevaClave} s=${s} /><${Toasts} /><//>`;
  if (s.mode === 'error') return html`<div className="err-box"><strong>No se pudo abrir el sistema.</strong><span>${s.error}</span><button className="btn" onClick=${() => location.reload()}>Recargar</button></div>`;
  return html`<div className="app"><div className="shell">
    <aside className="side">
      <div className="brand"><div className="mark">JG</div><div style=${{ minWidth: 0 }}><div className="b-name">${s.config.nombre || 'JG Distribuidora'}</div><div className="b-sub">Gestión comercial</div></div></div>
      <div className="s-label">Secciones</div>
      <nav>${navItems.map((n, i) => html`<button key=${n.v} className=${tab === n.v ? 'on' : ''} onClick=${() => go(n.v, {})}>
        <${Icon} n=${n.i} s=${16} /><span className="grow">${n.l}</span>
        ${badges[n.v] > 0 ? html`<span className=${'badge' + (n.v === 'productos' ? ' w' : '')}>${badges[n.v]}</span>` : html`<${Kbd} k=${'alt+' + (i + 1)} />`}</button>`)}</nav>
      ${(puede('pedido.crear') || puede('cliente.editar') || puede('producto.editar')) && html`<div className="s-label">Crear</div>
      <nav>
        ${puede('pedido.crear') && html`<button onClick=${() => go('armador', {})}><${Icon} n="plus" s=${16} /><span className="grow">Nuevo pedido</span><${Kbd} k="n" /></button>`}
        ${puede('cliente.editar') && html`<button onClick=${() => openGlobal('cliente')}><${Icon} n="user" s=${16} /><span className="grow">Nuevo cliente</span></button>`}
        ${puede('producto.editar') && html`<button onClick=${() => openGlobal('producto')}><${Icon} n="box" s=${16} /><span className="grow">Nuevo producto</span></button>`}
      </nav>`}
      <div className="side-foot">
        <span className=${'sync' + (s.mode === 'local' ? ' local' : '')}><span className="dot"></span>${s.mode === 'nube' || s.mode === 'supa' ? 'Sincronizado' : s.mode === 'local' ? 'Solo en este navegador' : 'Conectando…'}${s.readOnly ? ' · solo lectura' : ''}</span>
        ${s.usuario && html`<span className="ellipsis">${s.usuario}${s.mode === 'supa' ? ' · ' + ROLES[s.rol].label : ''}</span>`}
        <button className="btn ghost sm" style=${{ justifyContent: 'flex-start', padding: '0 4px' }} onClick=${() => openGlobal('atajos')}><${Icon} n="keyboard" s=${14} />Atajos de teclado <${Kbd} k="?" /></button>
      </div>
    </aside>
    <div className="main">
      <header className="bar">
        ${isSub ? html`<button className="iconbtn" aria-label="Volver" title="Volver (esc)" onClick=${back}><${Icon} n="back" /></button>` : html`<div className="mark m-only" style=${{ margin: '0 6px 0 4px' }}>JG</div>`}
        <${Crumbs} isSub=${isSub} parent=${parent} title=${isSub ? TITULOS[cur.view] : cur.view === 'inicio' ? (s.config.nombre || 'JG Distribuidora') : TITULOS[cur.view]} />
        <button className="cmdk" onClick=${openPalette}><${Icon} n="search" s=${14} /><span className="grow">Buscar pedidos, clientes o comandos…</span><${Kbd} k="mod+k" /></button>
        <button className="iconbtn m-only" aria-label="Buscar y comandos" onClick=${openPalette}><${Icon} n="search" s=${18} /></button>
        ${puede('ver.estadisticas') && html`<button className=${'iconbtn m-only' + (cur.view === 'estadisticas' ? ' accent-t' : '')} aria-label="Estadísticas" onClick=${() => go('estadisticas', {})}><${Icon} n="chart" s=${18} /></button>`}
        <button className=${'iconbtn m-only' + (cur.view === 'ajustes' ? ' accent-t' : '')} aria-label="Ajustes" onClick=${() => go('ajustes', {})}><${Icon} n="settings" s=${18} /></button>
      </header>
      <div className="scroll" ref=${scrollRef}>
        <main className="page">
          ${s.readOnly && html`<div className="banner warn"><${Icon} n="eye" s=${16} /><span className="grow">Modo lectura: podés ver todo, pero no cargar ni modificar. Pedile al dueño que te comparta el sistema como editor.</span></div>`}
          ${s.ready && s.hayDemo && s.rol === 'admin' && cur.view !== 'armador' && html`<div className="banner kraft"><${Icon} n="sparkle" s=${16} /><span className="grow">Estás viendo datos de ejemplo. Borralos cuando empieces a cargar los tuyos.</span>
            <button className="btn sm" disabled=${borrandoDemo} onClick=${async () => { const ok = await confirmar({ title: 'Borrar datos de ejemplo', message: 'Se borran solo los productos, clientes, pedidos y visitas de ejemplo. Lo que cargaste vos queda.', okLabel: 'Borrar ejemplos', danger: true }); if (!ok) return; setBorrandoDemo(true); await borrarDemo(); setBorrandoDemo(false); }}>${borrandoDemo ? 'Borrando…' : 'Borrar ejemplos'}</button></div>`}
          ${!s.ready ? html`<div className="loading"><div className="spinner"></div><span>Cargando los datos de ${s.config.nombre || 'JG'}…</span></div>`
          : !permitida ? html`<div className="panel"><${Empty} icon="ban" title="Tu rol no tiene acceso a esta sección" sub=${'Entraste como ' + ROLES[s.rol].label + '. Si necesitás verla, pedíselo al administrador.'}><button className="btn" onClick=${() => go('inicio', {})}>Ir al inicio</button><//></div>`
          : html`<${ErrorBoundary} key=${key} onReset=${() => go('inicio', {})}><${View} ...${props} /><//>`}
        </main>
      </div>
      <${ActBar} go=${go} tab=${tab} />
    </div>
  </div>
    <nav className="bottomnav" aria-label="Secciones" style=${{ gridTemplateColumns: `repeat(${bottomItems.length}, 1fr)` }}>${bottomItems.map((n) => html`<button key=${n.v} className=${tab === n.v ? 'on' : ''} onClick=${() => go(n.v, {})} aria-current=${tab === n.v ? 'page' : null}>
      <${Icon} n=${n.i} s=${20} /><span>${n.l}</span></button>`)}</nav>
    ${showFab && s.ready && html`<button className="fab" onClick=${() => go('armador', {})}><${Icon} n="plus" s=${18} w=${2.4} />Pedido</button>`}
    <${Toasts} />
    <${ConfirmHost} />
    <${GlobalModals} s=${s} go=${go} />
    <${PaletteHost} s=${s} go=${go} />
  </div>`;
}

ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} />`);
initStore();

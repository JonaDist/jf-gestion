/* =========================================================
   Pedidos: listado, armador, detalle, cobros y documentos
   ========================================================= */
const snapCli = (c) => c ? { nombre: c.nombre || '', contacto: c.contacto || '', telefono: c.telefono || '', direccion: c.direccion || '', localidad: c.localidad || '', zona: c.zona || '', cuit: c.cuit || '', condIva: c.condIva || '' } : { nombre: 'Consumidor final' };
const lineaSub = (it) => (Number(it.cant) || 0) * (Number(it.precio) || 0) * (1 - (Number(it.desc) || 0) / 100);
function useWide(q = '(min-width: 1100px)') {
  const mq = useMemo(() => window.matchMedia(q), [q]);
  const [w, setW] = useState(mq.matches);
  useEffect(() => { const f = () => setW(mq.matches); mq.addEventListener ? mq.addEventListener('change', f) : mq.addListener(f); return () => { mq.removeEventListener ? mq.removeEventListener('change', f) : mq.removeListener(f); }; }, [mq]);
  return w;
}
function lsGet(k, def) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } }
function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
const SIG_ESTADO = { confirmado: 'Confirmar pedido', preparando: 'Pasar a armado', listo: 'Marcar listo para entregar', entregado: 'Marcar entregado' };

/* ---------- listado ---------- */
function Pedidos({ s, go, params }) {
  const [q, setQ] = useState('');
  const [f, setF] = useState(params.estado || (s.rol === 'deposito' ? 'activos' : s.rol === 'repartidor' ? 'listo' : 'todos'));
  const [per, setPer] = useState('todo');
  const [limit, setLimit] = useState(100);
  const hoy = todayISO();
  const desde = per === 'hoy' ? hoy : per === 'semana' ? isoDate(startOfWeek(new Date())) : per === 'mes' ? hoy.slice(0, 8) + '01' : '';
  const base = useMemo(() => s.pedidos.filter((p) => (!desde || p.fecha >= desde) && matches(q, p.clienteSnap && p.clienteSnap.nombre, numCorto(p), String(p.numero), p.notas, (p.items || []).map((i) => i.nombre).join(' '))), [s.version, q, desde]);
  const test = {
    todos: () => true, activos: (p) => A_PREPARAR.has(p.estado), presupuesto: (p) => p.estado === 'presupuesto',
    confirmado: (p) => p.estado === 'confirmado', preparando: (p) => p.estado === 'preparando', listo: (p) => p.estado === 'listo',
    entregado: (p) => p.estado === 'entregado', impagos: (p) => s.calc.get(p.id).saldo > 0.009, cancelado: (p) => p.estado === 'cancelado',
  };
  const lista = base.filter(test[f] || test.todos);
  const count = (k) => base.filter(test[k]).length;
  const total = lista.reduce((a, p) => a + (CUENTA.has(p.estado) || p.estado === 'presupuesto' ? s.calc.get(p.id).total : 0), 0);
  const opts = [['todos', 'Todos'], ['activos', 'Para armar'], ['presupuesto', 'Presupuestos'], ['confirmado', 'Confirmados'], ['preparando', 'En armado'], ['listo', 'Listos'], ['entregado', 'Entregados'], ['impagos', 'Impagos'], ['cancelado', 'Cancelados']].map(([v, l]) => ({ v, l, ct: count(v) }));
  const grupos = [];
  for (const p of lista.slice(0, limit)) { const g = grupos[grupos.length - 1]; if (g && g.fecha === p.fecha) g.items.push(p); else grupos.push({ fecha: p.fecha, items: [p] }); }
  useCtx('Pedidos', [
    puede('pedido.crear') && { id: 'np', title: 'Nuevo pedido', icon: 'receipt', tone: 'c-red', key: 'n', primary: true, run: () => go('armador', {}) },
    { id: 'fa', title: 'Ver pedidos para armar', icon: 'truck', tone: 'c-orange', run: () => setF('activos') },
    { id: 'fi', title: 'Ver pedidos impagos', icon: 'cash', tone: 'c-yellow', run: () => setF('impagos') },
    { id: 'ft', title: 'Ver todos los pedidos', icon: 'list', run: () => { setF('todos'); setPer('todo'); } },
  ]);
  return html`<${Fragment}>
    <${PageHead} title="Pedidos" sub=${`${lista.length} ${lista.length === 1 ? 'pedido' : 'pedidos'} · ${money(total)}`}
      actions=${puede('pedido.crear') ? html`<${KBtn} cls="primary desk-only" icon="plus" k="n" onClick=${() => go('armador', {})}>Nuevo pedido<//>` : null} />
    <div className="row-flex wrap">
      <${Search} page value=${q} onChange=${setQ} placeholder="Buscar por cliente, número o producto" />
      <${Seg} value=${per} onChange=${setPer} options=${[{ v: 'hoy', l: 'Hoy' }, { v: 'semana', l: 'Semana' }, { v: 'mes', l: 'Mes' }, { v: 'todo', l: 'Todo' }]} />
    </div>
    <${Chips} value=${f} onChange=${setF} options=${opts} />
    ${lista.length === 0 ? html`<div className="panel"><${Empty} icon="receipt" title=${s.pedidos.length ? 'No hay pedidos con estos filtros' : 'Todavía no hay pedidos'} sub=${s.pedidos.length ? 'Probá con otro estado o período.' : 'Elegís cliente, sumás productos y lo mandás al depósito.'}>
        ${!s.pedidos.length && puede('pedido.crear') && html`<${KBtn} cls="primary" icon="plus" k="n" onClick=${() => go('armador', {})}>Armar pedido<//>`}<//></div>`
    : html`<div className="panel" style=${{ paddingBottom: '6px' }}>${grupos.map((g) => { const tot = g.items.reduce((a, p) => a + s.calc.get(p.id).total, 0); return html`<div key=${g.fecha}>
        <${SecH} count=${g.items.length + ' · ' + money(tot)}>${cap(relDia(g.fecha) !== fmtDia(g.fecha) ? relDia(g.fecha) + ' · ' + fmtDia(g.fecha) : fmtLarga(g.fecha))}<//>
        <div className="list">${g.items.map((p) => html`<${PedidoRow} key=${p.id} p=${p} c=${s.calc.get(p.id)} onClick=${() => go('pedido', { id: p.id })} />`)}</div>
      </div>`; })}</div>
      ${lista.length > limit && html`<button className="btn block" onClick=${() => setLimit(limit + 150)}>Mostrar más (${lista.length - limit} restantes)</button>`}`}
  <//>`;
}

/* ---------- armador ---------- */
const BORRADOR_KEY = 'jf-borrador-pedido';
function nuevoBorrador(s, params) {
  const cli = params.clienteId ? s.cliMap.get(params.clienteId) : null;
  const b = { clienteId: params.clienteId || '', fecha: todayISO(), entrega: '', items: [], descGeneral: Number(cli && cli.descuento) || 0, envio: 0, notas: '', estado: 'confirmado' };
  const dup = params.dup ? s.pedMap.get(params.dup) : null;
  if (dup) {
    b.clienteId = dup.clienteId || ''; b.descGeneral = Number(dup.descGeneral) || 0; b.notas = '';
    b.items = (dup.items || []).map((it) => { const pr = it.pid ? s.prodMap.get(it.pid) : null; return pr ? { ...it, nombre: pr.nombre, codigo: pr.codigo || '', precio: Number(pr.precio) || 0, costo: Number(pr.costo) || 0 } : { ...it }; });
  }
  return b;
}
function Armador({ s, go, back, params }) {
  const editing = params.id ? s.pedMap.get(params.id) : null;
  const esAdmin = s.rol === 'admin';
  const wide = useWide();
  const [d, setD] = useState(() => editing ? clean({ ...editing }) : nuevoBorrador(s, params));
  const [borrador, setBorrador] = useState(() => (!editing && !params.dup && !params.clienteId) ? lsGet(BORRADOR_KEY, null) : null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [kb, setKb] = useState(0);
  const [saving, setSaving] = useState(false);
  const [verGanLS, setVerGan] = useState(() => lsGet('jf-ver-ganancia', false));
  const verGan = verGanLS && esAdmin;
  const [nuevoCli, setNuevoCli] = useState(false);
  const [nuevoProd, setNuevoProd] = useState(null);
  const dirty = useRef(false);
  const searchRef = useRef(null);
  const upd = (patch) => { dirty.current = true; setD((x) => ({ ...x, ...(typeof patch === 'function' ? patch(x) : patch) })); };

  useEffect(() => {
    if (editing || !dirty.current) return;
    const t = setTimeout(() => lsSet(BORRADOR_KEY, d.items.length ? { ...d, guardado: Date.now() } : null), 400);
    return () => clearTimeout(t);
  }, [d]);

  const c = calcPedido(d);
  const cli = d.clienteId ? s.cliMap.get(d.clienteId) : null;
  const enPedido = useMemo(() => { const m = new Map(); d.items.forEach((it) => m.set(it.pid, (m.get(it.pid) || 0) + (Number(it.cant) || 0))); return m; }, [d.items]);
  const hits = useMemo(() => {
    if (!wide && !q && !cat) return [];
    return s.productos.filter((p) => p.activo !== false && (!cat || p.categoria === cat) && matches(q, p.nombre, p.codigo, p.marca, p.categoria)).slice(0, wide ? 80 : 25);
  }, [q, cat, s.version, wide]);
  useEffect(() => setKb(0), [q, cat]);
  useEffect(() => { const el = document.querySelector('.prod-hit.kb'); if (el) el.scrollIntoView({ block: 'nearest' }); }, [kb]);

  const addItem = (pr, n = 1) => {
    upd((x) => {
      const items = [...x.items]; const i = items.findIndex((it) => it.pid === pr.id);
      if (i >= 0) items[i] = { ...items[i], cant: round2((Number(items[i].cant) || 0) + n) };
      else items.push({ pid: pr.id, codigo: pr.codigo || '', nombre: pr.nombre, unidad: pr.unidad || 'Unidad', cant: n, precio: Number(pr.precio) || 0, costo: Number(pr.costo) || 0, desc: 0 });
      return { items };
    });
  };
  const setItem = (i, patch) => upd((x) => { const items = [...x.items]; items[i] = { ...items[i], ...patch }; return { items }; });
  const delItem = (i) => upd((x) => ({ items: x.items.filter((_, k) => k !== i) }));
  const onSearchKey = (e) => {
    const k = eventKey(e);
    if (k === 'down') { e.preventDefault(); e.stopPropagation(); setKb((x) => Math.min(x + 1, hits.length - 1)); }
    else if (k === 'up') { e.preventDefault(); setKb((x) => Math.max(x - 1, 0)); }
    else if (k === 'enter') {
      e.preventDefault();
      const exact = s.productos.find((p) => p.codigo && norm(p.codigo) === norm(q));
      const pr = exact || hits[kb];
      if (pr) { addItem(pr); setQ(''); }
    }
  };
  const elegirCliente = (id) => { const cl = s.cliMap.get(id); upd({ clienteId: id, ...(cl && Number(cl.descuento) > 0 && !d.descGeneral ? { descGeneral: Number(cl.descuento) } : {}) }); };

  async function guardar() {
    if (saving) return;
    const items = d.items.filter((it) => (Number(it.cant) || 0) > 0);
    if (!items.length) { toast('Agregá al menos un producto con cantidad.', { tone: 'bad' }); return; }
    if (!d.clienteId) {
      const ok = await confirmar({ title: '¿Guardar sin cliente?', message: 'El pedido queda a nombre de "Consumidor final". Podés asignarle un cliente después editándolo.', okLabel: 'Guardar igual' });
      if (!ok) return;
    }
    const p = { ...d, items, clienteSnap: snapCli(cli) };
    delete p.guardado;
    if (!editing) { p.id = uid(); p.numero = (s.maxNum || 0) + 1; p.historial = [{ ts: Date.now(), estado: p.estado }]; p.pagos = []; if (s.usuario) p.tomadoPor = { email: s.usuario, nombre: s.nombreUsuario || '' }; }
    else if (editing.estado !== p.estado) p.historial = [...(editing.historial || []), { ts: Date.now(), estado: p.estado }];
    setSaving(true);
    try {
      const id = await guardarPedido(p, editing);
      if (params.visitaId) { const v = s.visitas.find((x) => x.id === params.visitaId); if (v) await put('visitas', { ...v, estado: 'visitado', pedidoId: id }); }
      if (!editing) lsSet(BORRADOR_KEY, null);
      dirty.current = false;
      toast(editing ? 'Cambios guardados' : `${p.estado === 'presupuesto' ? 'Presupuesto' : 'Pedido'} ${numCorto(p)} guardado`);
      go('pedido', { id }, { replace: true });
    } catch (e) { /* el aviso ya se mostró */ }
    setSaving(false);
  }
  const salir = async () => {
    if (editing && dirty.current) { const ok = await confirmar({ title: '¿Salir sin guardar?', message: 'Los cambios que hiciste en este pedido se pierden.', okLabel: 'Salir', danger: true }); if (!ok) return; }
    back();
  };
  const descartar = async () => {
    if (!d.items.length) { back(); return; }
    const ok = await confirmar({ title: '¿Descartar este pedido?', message: 'Se borran los productos cargados.', okLabel: 'Descartar', danger: true });
    if (ok) { lsSet(BORRADOR_KEY, null); dirty.current = false; back(); }
  };
  const toggleGan = () => { setVerGan(!verGan); lsSet('jf-ver-ganancia', !verGan); };
  const focusBuscar = () => { searchRef.current && searchRef.current.focus(); };
  useCtx(editing ? 'Editando ' + numCorto(editing) : 'Nuevo pedido', [
    { id: 'gu', title: editing ? 'Guardar cambios' : d.estado === 'presupuesto' ? 'Guardar presupuesto' : 'Guardar pedido', icon: 'check', tone: 'c-green', key: 'mod+enter', primary: true, run: guardar },
    { id: 'bu', title: 'Buscar producto', icon: 'search', key: '/', run: focusBuscar },
    puede('cliente.editar') && { id: 'nc', title: 'Nuevo cliente', icon: 'user', tone: 'c-blue', run: () => setNuevoCli(true) },
    puede('producto.editar') && { id: 'npr', title: 'Nuevo producto', icon: 'box', tone: 'c-orange', run: () => setNuevoProd({}) },
    !editing && { id: 'tp', title: d.estado === 'presupuesto' ? 'Cambiar a pedido' : 'Cambiar a presupuesto', icon: 'file', run: () => upd({ estado: d.estado === 'presupuesto' ? 'confirmado' : 'presupuesto' }) },
    esAdmin && { id: 'vg', title: verGan ? 'Ocultar ganancia' : 'Ver ganancia', icon: verGan ? 'eyeOff' : 'eye', run: toggleGan },
    { id: 'de', title: editing ? 'Cancelar edición' : 'Descartar pedido', icon: 'x', tone: 'c-red', run: editing ? salir : descartar },
  ]);

  const picker = html`<${Panel} title="Productos" flush actions=${puede('producto.editar') ? html`<button className="btn sm ghost" onClick=${() => setNuevoProd({})}><${Icon} n="plus" s=${14} />Nuevo</button>` : null}>
    <div className="stack-sm" style=${{ padding: '0 12px 8px' }}>
      <${Search} page inputRef=${searchRef} value=${q} onChange=${setQ} onKeyDown=${onSearchKey} placeholder="Buscar por nombre o código · ↵ agrega" />
      ${s.cats.length > 0 && html`<${Chips} value=${cat} onChange=${(v) => setCat(v === cat ? '' : v)} options=${[{ v: '', l: 'Todas' }, ...s.cats.map((x) => ({ v: x, l: x }))]} />`}
    </div>
    ${s.productos.length === 0 ? html`<${Empty} icon="box" title="No hay productos cargados" sub="Cargá tu catálogo para poder armar pedidos.">
        <button className="btn" onClick=${() => go('productos', {})}>Ir a productos</button><//>`
    : (!wide && !q && !cat) ? html`<div className="li muted-row" style=${{ padding: '4px 14px 8px' }}>Escribí para buscar o tocá una categoría.</div>`
    : hits.length === 0 ? html`<div className="li muted-row" style=${{ padding: '4px 14px 8px' }}>Ningún producto coincide con “${q}”.</div>`
    : html`<div className="picker-list">${hits.map((pr, i) => {
        const inC = enPedido.get(pr.id) || 0; const st = Number(pr.stock) || 0;
        return html`<button key=${pr.id} className=${'prod-hit' + (i === kb && (q || wide) ? ' kb' : '')} onClick=${() => addItem(pr)} onMouseMove=${() => i !== kb && setKb(i)}>
          <${Ico} n="box" tone=${colorFor(pr.categoria || 'x')} />
          <div className="grow"><div className="ellipsis" style=${{ fontWeight: 500 }}>${pr.nombre}</div>
            <div className="tiny muted ellipsis"><span className="mono">${pr.codigo || 's/c'}</span> · ${pr.unidad || 'Unidad'}${pr.porBulto > 1 ? ' x' + pr.porBulto : ''} · <span className=${st <= 0 ? 'bad-t' : st <= (Number(pr.stockMin) || 0) ? 'warn-t' : ''}>stock ${qty(st)}</span></div></div>
          ${inC > 0 && html`<span className="in-cart">×${qty(inC)}</span>`}
          <span className="amt num" style=${{ fontWeight: 500 }}>${money(pr.precio)}</span>
          <span className="ph-add"><${Icon} n="plus" s=${14} /></span></button>`;
      })}</div>`}
  <//>`;

  const lineas = d.items.length === 0 ? html`<div className="li muted-row" style=${{ padding: '4px 14px 10px' }}>Todavía no agregaste productos.</div>` :
    html`<div className="lines">${d.items.map((it, i) => {
      const pr = it.pid ? s.prodMap.get(it.pid) : null; const st = pr ? Number(pr.stock) || 0 : null;
      const yaDescontado = (editing && editing.stockAplicado) ? (editing.items || []).filter((x) => x.pid === it.pid).reduce((a, x) => a + (Number(x.cant) || 0), 0) : 0;
      const falta = pr && consumeStock(d.estado) && (Number(it.cant) || 0) > st + yaDescontado;
      return html`<div key=${it.pid || i} className="line">
        <div style=${{ minWidth: 0 }}><div className="l-name">${it.nombre}</div>
          <div className="l-meta"><span className="mono">${it.codigo || 's/c'}</span> · ${money(it.precio)} c/u${it.desc ? ` · −${nf1.format(it.desc)}%` : ''}${falta ? html` · <span className="bad-t">supera el stock (${qty(st)})</span>` : ''}</div></div>
        <div className="l-total">${money(lineaSub(it))}</div>
        <div className="l-ctrls">
          <div className="stepper">
            <button aria-label="Restar" onClick=${() => setItem(i, { cant: Math.max(0, round2((Number(it.cant) || 0) - 1)) })}><${Icon} n="minus" s=${14} /></button>
            <${NumInput} mini value=${it.cant} onChange=${(v) => setItem(i, { cant: Math.max(0, v) })} decimals=${3} />
            <button aria-label="Sumar" onClick=${() => setItem(i, { cant: round2((Number(it.cant) || 0) + 1) })}><${Icon} n="plus" s=${14} /></button>
          </div>
          ${pr && pr.porBulto > 1 && html`<button className="btn sm ghost" title="Sumar un bulto" onClick=${() => setItem(i, { cant: round2((Number(it.cant) || 0) + Number(pr.porBulto)) })}>+${pr.porBulto}</button>`}
          <span className="mini-lbl">$</span><div style=${{ width: '90px' }}>${esAdmin ? html`<${NumInput} mini value=${it.precio} onChange=${(v) => setItem(i, { precio: v })} />` : html`<input className="mini-input" value=${String(round2(it.precio)).replace('.', ',')} readOnly tabIndex="-1" title="Solo el administrador cambia precios" />`}</div>
          <span className="mini-lbl">Dto %</span><div style=${{ width: '54px' }}><${NumInput} mini value=${it.desc} placeholder="0" onChange=${(v) => setItem(i, { desc: Math.min(100, Math.max(0, v)) })} /></div>
          <span className="grow"></span>
          <button className="iconbtn" aria-label="Quitar producto" onClick=${() => delItem(i)}><${Icon} n="trash" s=${15} /></button>
        </div>
      </div>`;
    })}</div>`;

  const clienteBlock = html`<div className="panel-b stack-sm" style=${{ paddingTop: wide ? '2px' : '12px' }}>
      <span className="lbl">Cliente</span>
      <${ClienteSelect} s=${s} value=${d.clienteId} onChange=${elegirCliente} onNuevo=${puede('cliente.editar') ? () => setNuevoCli(true) : null} />
      ${cli && cli.notas && html`<div className="banner kraft small"><${Icon} n="alert" s=${15} /><span className="grow">${cli.notas}</span></div>`}
    </div>`;

  const ticket = html`<section className="panel ticket">
    <div className="panel-h"><h2>${editing ? 'Pedido ' + numCorto(editing) : 'Nuevo pedido'}</h2>
      ${!editing ? html`<${Seg} value=${d.estado === 'presupuesto' ? 'presupuesto' : 'confirmado'} onChange=${(v) => upd({ estado: v })} options=${[{ v: 'confirmado', l: 'Pedido' }, { v: 'presupuesto', l: 'Presupuesto' }]} />`
      : !esAdmin ? html`<${EstadoPill} estado=${d.estado} />` : html`<select className="select" style=${{ width: 'auto', height: '28px', fontSize: '12.5px' }} value=${d.estado} onChange=${(e) => upd({ estado: e.target.value })} aria-label="Estado">${Object.entries(ESTADOS).map(([k, v]) => html`<option key=${k} value=${k}>${v.label}</option>`)}</select>`}
    </div>
    ${wide && clienteBlock}
    <div style=${{ borderTop: '1px solid var(--line)' }}>
      <div className="row-flex" style=${{ padding: '8px 14px 2px' }}><span className="eyebrow grow">${c.lineas} ${c.lineas === 1 ? 'producto' : 'productos'} · ${qty(c.unidades)} u.</span>
        ${!wide && html`<button className="btn sm ghost" onClick=${() => { focusBuscar(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><${Icon} n="plus" s=${14} />Agregar</button>`}</div>
      ${lineas}
    </div>
    <div className="panel-b stack-sm" style=${{ borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
      <div className="grid2">
        <${Field} label="Fecha" id="ar-fecha"><input id="ar-fecha" type="date" className="input" value=${d.fecha} onChange=${(e) => upd({ fecha: e.target.value || todayISO() })} /><//>
        <${Field} label="Entrega" id="ar-entrega"><input id="ar-entrega" type="date" className="input" value=${d.entrega || ''} onChange=${(e) => upd({ entrega: e.target.value })} /><//>
        <${Field} label="Descuento general" id="ar-desc"><${NumInput} id="ar-desc" value=${d.descGeneral} placeholder="0" suffix="%" onChange=${(v) => upd({ descGeneral: Math.min(100, Math.max(0, v)) })} /><//>
        <${Field} label="Envío / flete" id="ar-envio"><${NumInput} id="ar-envio" value=${d.envio} placeholder="0" prefix="$" onChange=${(v) => upd({ envio: Math.max(0, v) })} /><//>
      </div>
      <${Field} label="Notas" id="ar-notas"><textarea id="ar-notas" className="textarea" style=${{ minHeight: '54px' }} placeholder="Ej.: entregar por la tarde, cobrar en efectivo" value=${d.notas} onChange=${(e) => upd({ notas: e.target.value })}></textarea><//>
    </div>
    <div className="totals">
      <div className="tr"><span className="soft">Subtotal</span><span>${money(c.subtotal)}</span></div>
      ${c.descMonto > 0 && html`<div className="tr"><span className="soft">Descuento ${nf1.format(d.descGeneral)}%</span><span>−${money(c.descMonto)}</span></div>`}
      ${c.envio > 0 && html`<div className="tr"><span className="soft">Envío</span><span>${money(c.envio)}</span></div>`}
      <div className="tr big"><span>Total</span><span>${money(c.total)}</span></div>
      <div className="tr small" style=${esAdmin ? null : { display: 'none' }}><button className="btn sm ghost" style=${{ padding: '0 4px', height: '24px' }} onClick=${toggleGan}><${Icon} n=${verGan ? 'eyeOff' : 'eye'} s=${14} />${verGan ? 'Ocultar ganancia' : 'Ver ganancia'}</button>
        ${verGan && html`<span className=${c.ganancia >= 0 ? 'ok-t strong' : 'bad-t strong'}>${money(c.ganancia)} · ${pct(c.margen)}</span>`}</div>
      <div className="row-flex desk-only" style=${{ marginTop: '6px', display: wide ? 'flex' : 'none' }}>
        <button className="btn ghost" onClick=${editing ? salir : descartar}>${editing ? 'Cancelar' : 'Descartar'}</button>
        <button className="btn primary lg grow" disabled=${saving} onClick=${guardar}>${saving ? 'Guardando…' : editing ? 'Guardar cambios' : d.estado === 'presupuesto' ? 'Guardar presupuesto' : 'Guardar pedido'}<${Kbd} k="mod+enter" /></button>
      </div>
    </div>
  </section>`;

  if (editing && !esAdmin && !(puede('pedido.editar') && (editing.estado === 'presupuesto' || editing.estado === 'confirmado'))) {
    return html`<div className="panel"><${Empty} icon="ban" title="Este pedido ya no se puede editar" sub="Cuando un pedido pasa a armado, solo el administrador puede modificarlo."><button className="btn" onClick=${back}>Volver</button><//></div>`;
  }
  return html`<div className="builder-page stack">
    <${PageHead} title=${editing ? 'Editar pedido ' + numCorto(editing) : 'Armar pedido'} sub=${cli ? cli.nombre : 'Elegí el cliente y sumá productos'} />
    ${borrador && borrador.items && borrador.items.length > 0 && html`<div className="banner info"><${Icon} n="clock" s=${16} />
      <span className="grow">Tenés un pedido sin guardar de ${fmtDia(isoDate(new Date(borrador.guardado || Date.now())))} con ${borrador.items.length} productos.</span>
      <button className="btn sm primary" onClick=${() => { setD({ ...nuevoBorrador(s, {}), ...borrador }); setBorrador(null); dirty.current = true; }}>Retomar</button>
      <button className="btn sm ghost" onClick=${() => { lsSet(BORRADOR_KEY, null); setBorrador(null); }}>Descartar</button></div>`}
    ${wide ? html`<div className="builder">${picker}${ticket}</div>` : html`<div className="stack"><section className="panel">${clienteBlock}</section>${picker}${ticket}</div>`}
    <div className="savebar">
      <div className="sb-total"><span className="tiny muted">${c.lineas} prod. · ${qty(c.unidades)} u.</span><b>${money(c.total)}</b></div>
      <button className="btn primary lg" disabled=${saving} onClick=${guardar}>${saving ? 'Guardando…' : 'Guardar'}</button>
    </div>
    ${nuevoCli && html`<${ClienteForm} s=${s} onClose=${() => setNuevoCli(false)} onSaved=${(id) => { elegirCliente(id); setNuevoCli(false); }} />`}
    ${nuevoProd && html`<${ProductoForm} s=${s} init=${nuevoProd} onClose=${() => setNuevoProd(null)} onSaved=${(id, pr) => { addItem({ ...pr, id }); setNuevoProd(null); }} />`}
  </div>`;
}

/* ---------- vista previa de la boleta ---------- */
function BoletaPreview({ p, cfg, precios = true }) {
  const c = calcPedido(p); const sn = p.clienteSnap || {};
  const tipo = p.estado === 'presupuesto' ? 'PRESUPUESTO' : 'NOTA DE PEDIDO';
  return html`<div className="paper-wrap"><div className="paper">
    <div className="p-top">
      <div className="p-biz"><b>${cfg.nombre}</b>${[cfg.razonSocial, [cfg.direccion, cfg.localidad].filter(Boolean).join(' · '), cfg.telefono && 'Tel: ' + cfg.telefono, cfg.cuit && 'CUIT: ' + cfg.cuit].filter(Boolean).map((t, i) => html`<div key=${i}>${t}</div>`)}</div>
      <div className="p-x"><b>X</b><small>Documento no válido como factura</small></div>
      <div className="p-doc"><b>${tipo}</b><div className="mono">N° ${numLargo(p, cfg)}</div><div>Fecha: ${fmtCorta(p.fecha)}</div>${p.entrega && html`<div>Entrega: ${fmtCorta(p.entrega)}</div>`}</div>
    </div>
    <div className="p-cli">
      <div><b>Cliente:</b> ${sn.nombre || 'Consumidor final'}</div><div><b>CUIT:</b> ${sn.cuit || '—'}</div>
      <div><b>Dirección:</b> ${dirCliente(sn) || '—'}</div><div><b>Cond. IVA:</b> ${sn.condIva || 'Consumidor final'}</div>
    </div>
    <table><thead><tr><th>Código</th><th>Descripción</th><th className="r">Cant.</th>${precios && html`<th className="r">P. unit.</th><th className="r">Dto.</th><th className="r">Importe</th>`}</tr></thead>
      <tbody>${(p.items || []).map((it, i) => html`<tr key=${i}><td className="mono">${it.codigo || ''}</td><td>${it.nombre}</td><td className="r">${qty(it.cant)}</td>
        ${precios && html`<td className="r">${money(it.precio)}</td><td className="r">${it.desc ? nf1.format(it.desc) + '%' : ''}</td><td className="r"><b>${money(lineaSub(it))}</b></td>`}</tr>`)}</tbody></table>
    ${precios && html`<div className="p-tot"><table><tbody>
      <tr><td>Subtotal</td><td className="r">${money(c.subtotal)}</td></tr>
      ${c.descMonto > 0 && html`<tr><td>Descuento ${nf1.format(p.descGeneral)}%</td><td className="r">−${money(c.descMonto)}</td></tr>`}
      ${c.envio > 0 && html`<tr><td>Envío</td><td className="r">${money(c.envio)}</td></tr>`}
      <tr className="g"><td>TOTAL</td><td className="r">${money(c.total)}</td></tr>
    </tbody></table></div>`}
    <div className="p-foot">${p.notas && html`<div>Observaciones: ${p.notas}</div>`}${p.estado === 'presupuesto' && cfg.validez ? html`<div>Presupuesto válido por ${cfg.validez} días.</div>` : null}${cfg.leyenda && html`<div>${cfg.leyenda}</div>`}</div>
  </div></div>`;
}

/* ---------- modales de documentos ---------- */
function BoletaModal({ p, cfg, onClose }) {
  const [tipo, setTipo] = useState(p.estado === 'presupuesto' ? 'presupuesto' : p.estado === 'entregado' || p.estado === 'listo' ? 'remito' : 'pedido');
  const [precios, setPrecios] = useState(true);
  const [dup, setDup] = useState(false);
  const [busy, setBusy] = useState(false);
  const nombre = `${tipo}-${pad(p.numero, 4)}-${slug((p.clienteSnap || {}).nombre)}.pdf`;
  const share = puedeCompartir('boleta.pdf');
  const gen = async (compartir) => {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await pdfBoleta(p, cfg, { tipo, precios, duplicado: dup });
      if (compartir === true) await compartirArchivo(nombre, blob, `${TIPOS_DOC[tipo]} ${numCorto(p)} · ${cfg.nombre}`);
      else await guardarArchivo(nombre, blob);
    } catch (e) { toast(e.message || 'No se pudo generar el PDF', { tone: 'bad' }); }
    setBusy(false);
  };
  return html`<${Modal} title="Boleta en PDF" onClose=${onClose} onSubmit=${gen} footer=${html`<button className="btn ghost" onClick=${onClose}>Cerrar</button>${share && html`<button className="btn wa" disabled=${busy} onClick=${() => gen(true)}><${Icon} n="wa" s=${15} />Compartir</button>`}<button className="btn primary" disabled=${busy} onClick=${gen}><${Icon} n="download" s=${15} />${busy ? 'Generando…' : 'Descargar PDF'}</button>`}>
    <${Field} label="Tipo de documento"><${Seg} value=${tipo} onChange=${setTipo} options=${[{ v: 'presupuesto', l: 'Presupuesto' }, { v: 'pedido', l: 'Nota de pedido' }, { v: 'remito', l: 'Remito' }]} /><//>
    <${Toggle} id="bo-precios" checked=${precios} onChange=${setPrecios} label="Mostrar precios e importes" />
    <${Toggle} id="bo-dup" checked=${dup} onChange=${setDup} label="Original y duplicado (dos hojas)" />
    <p className="small muted">Hoja A4 con la leyenda “Documento no válido como factura”. Guardala y abrila para imprimir o mandarla por WhatsApp como archivo.${tipo === 'remito' ? ' El remito lleva espacio para la firma de quien recibe.' : ''}</p>
  <//>`;
}
function EtiquetaModal({ p, cfg, onClose }) {
  const [src, setSrc] = useState(null);
  const [blob, setBlob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [canSave, setCanSave] = useState(true);
  useEffect(() => {
    let alive = true;
    puedeGuardar().then((d) => alive && setCanSave(!!d));
    pngEtiqueta(p, cfg).then((b) => { if (!alive || !b) return; setBlob(b); const r = new FileReader(); r.onload = () => alive && setSrc(r.result); r.readAsDataURL(b); });
    return () => { alive = false; };
  }, []);
  const pdf = async () => { setBusy(true); try { await guardarArchivo(`etiqueta-${pad(p.numero, 4)}.pdf`, await pdfEtiqueta(p, cfg)); } catch (e) { toast(e.message || 'No se pudo generar el PDF', { tone: 'bad' }); } setBusy(false); };
  const nombre = `etiqueta-${pad(p.numero, 4)}-${slug((p.clienteSnap || {}).nombre)}.png`;
  const img = () => blob && guardarArchivo(nombre, blob);
  const share = puedeCompartir('etiqueta.png');
  return html`<${Modal} title=${'Etiqueta ' + numCorto(p)} onClose=${onClose} onSubmit=${img} footer=${html`
    <button className="btn" disabled=${busy || !canSave} onClick=${pdf}><${Icon} n="file" s=${15} />${busy ? 'Generando…' : 'PDF 10×15 cm'}</button>
    ${share && html`<button className="btn wa" disabled=${!blob} onClick=${() => compartirArchivo(nombre, blob, `Armar pedido ${numCorto(p)} · ${(p.clienteSnap || {}).nombre || ''}`)}><${Icon} n="wa" s=${15} />Compartir</button>`}
    <button className="btn primary" disabled=${!blob || !canSave} onClick=${img}><${Icon} n="download" s=${15} />Guardar imagen</button>`}>
    ${src ? html`<img className="preview-img" src=${src} alt=${'Etiqueta del pedido ' + numCorto(p)} />` : html`<div className="loading"><div className="spinner"></div>Armando la etiqueta…</div>`}
    <p className="small muted">${share ? 'Tocá Compartir y elegí WhatsApp para mandarla al depósito, o usá el PDF para una impresora de etiquetas de 10×15 cm.' : canSave ? 'Guardá la imagen y mandala por WhatsApp al depósito, o usá el PDF para una impresora de etiquetas de 10×15 cm.' : 'Mantené presionada la imagen para guardarla o compartirla.'}</p>
  <//>`;
}
function TextoModal({ title, text, onClose, waHref }) {
  const ref = useRef(null);
  useEffect(() => { ref.current && ref.current.select(); }, []);
  const cp = async () => { if (!(await copiar(text))) { ref.current && ref.current.select(); toast('Seleccioná el texto y copialo a mano.'); } };
  return html`<${Modal} title=${title} onClose=${onClose} onSubmit=${cp} footer=${html`<button className="btn ghost" onClick=${onClose}>Cerrar</button>${waHref && html`<a className="btn wa" href=${waHref} target="_blank" rel="noopener"><${Icon} n="wa" s=${15} />Abrir WhatsApp</a>`}<button className="btn primary" onClick=${cp}><${Icon} n="copy" s=${15} />Copiar</button>`}>
    <textarea ref=${ref} className="textarea mono" style=${{ minHeight: '260px', fontSize: '12.5px' }} readOnly value=${text}></textarea>
  <//>`;
}
function CobroModal({ p, c, onClose }) {
  const [monto, setMonto] = useState(c.saldo);
  const [medio, setMedio] = useState('Efectivo');
  const [fecha, setFecha] = useState(todayISO());
  const [nota, setNota] = useState('');
  const [busy, setBusy] = useState(false);
  const ok = async () => {
    if (busy) return;
    if (!(monto > 0)) { toast('Ingresá un monto mayor a cero.', { tone: 'bad' }); return; }
    setBusy(true);
    try { await put('pedidos', { ...p, pagos: [...(p.pagos || []), { id: uid(), fecha, monto: round2(monto), medio, nota }] }); toast('Cobro registrado: ' + money(monto)); onClose(); } catch (e) { setBusy(false); }
  };
  return html`<${Modal} title=${'Registrar cobro ' + numCorto(p)} onClose=${onClose} onSubmit=${ok} footer=${html`<button className="btn ghost" onClick=${onClose}>Cancelar</button><button className="btn primary" disabled=${busy} onClick=${ok}>Registrar</button>`}>
    <div className="banner info"><${Icon} n="cash" s=${16} /><span className="grow">Total ${money(c.total)} · pagado ${money(c.pagado)} · <b>saldo ${money(c.saldo)}</b></span></div>
    <div className="grid2">
      <${Field} label="Monto" id="co-monto"><${NumInput} id="co-monto" value=${monto} prefix="$" autoFocus onChange=${setMonto} /><//>
      <${Field} label="Fecha" id="co-fecha"><input id="co-fecha" type="date" className="input" value=${fecha} onChange=${(e) => setFecha(e.target.value || todayISO())} /><//>
    </div>
    <${Field} label="Medio de pago"><${Chips} value=${medio} onChange=${setMedio} options=${MEDIOS.map((m) => ({ v: m, l: m }))} /><//>
    <${Field} label="Nota (opcional)" id="co-nota"><input id="co-nota" className="input" value=${nota} placeholder="Ej.: transferencia de Mercado Pago" onChange=${(e) => setNota(e.target.value)} /><//>
  <//>`;
}

/* Lista de acciones con ícono y atajo, igual que en la paleta */
function ActList({ acts }) {
  return html`<div className="actlist">${acts.filter(Boolean).map((a) => {
    const inner = html`<${Ico} n=${a.icon || 'arrowR'} tone=${a.tone} /><span className="grow">${a.title}</span><${Kbd} k=${a.key} />`;
    return a.href ? html`<a key=${a.id} className="act" href=${a.href} target="_blank" rel="noopener">${inner}</a>`
      : html`<button key=${a.id} className=${'act' + (a.danger ? ' danger' : '')} disabled=${a.disabled} onClick=${() => runAction(a)}>${inner}</button>`;
  })}</div>`;
}

/* ---------- detalle ---------- */
function PedidoDetalle({ s, go, back, params }) {
  const p = s.pedMap.get(params.id);
  const esAdmin = s.rol === 'admin';
  const [modal, setModal] = useState(null);
  const [verGanLS, setVerGan] = useState(() => lsGet('jf-ver-ganancia', false));
  const verGan = verGanLS && esAdmin;
  const [busy, setBusy] = useState(false);
  const cfg = s.config;
  let acts = [], docs = [], gestion = [], c = null, cli = null, tel = '', idx = -1, next = null, txtDep = '', txtCli = '';
  const avanzar = async (estado) => { if (busy) return; setBusy(true); try { await cambiarEstado(p, estado); toast('Pedido ' + numCorto(p) + ': ' + ESTADOS[estado].label); } catch (e) { /* aviso mostrado */ } setBusy(false); };
  const cancelar = async () => { const ok = await confirmar({ title: 'Cancelar pedido ' + numCorto(p), message: 'El stock de los productos vuelve al depósito y el pedido deja de contar en ventas y cobranzas.', okLabel: 'Cancelar pedido', cancelLabel: 'Volver', danger: true }); if (ok) avanzar('cancelado'); };
  const eliminar = async () => {
    const ok = await confirmar({ title: 'Eliminar pedido ' + numCorto(p), message: 'Se borra para siempre, con sus cobros. Si solo no se va a entregar, mejor cancelalo.', okLabel: 'Eliminar', danger: true });
    if (!ok) return;
    try { await borrarPedido(p); toast('Pedido eliminado'); back(); } catch (e) { /* aviso mostrado */ }
  };
  if (p) {
    c = s.calc.get(p.id) || calcPedido(p);
    cli = p.clienteId ? s.cliMap.get(p.clienteId) : null;
    tel = (cli && cli.telefono) || (p.clienteSnap || {}).telefono || '';
    idx = FLUJO.indexOf(p.estado);
    next = idx >= 0 && idx < FLUJO.length - 1 ? FLUJO[idx + 1] : null;
    txtDep = textoDeposito(p, cfg); txtCli = textoCliente(p, cfg);
    docs = [
      { id: 'dep', title: `Enviar al ${(cfg.nombreDeposito || 'depósito').toLowerCase()} por WhatsApp`, icon: 'wa', tone: 'c-green', key: 'd', href: waLink(cfg.waDeposito, txtDep) },
      { id: 'cli', title: 'Enviar al cliente por WhatsApp', icon: 'wa', tone: 'c-green', key: 'w', href: waLink(tel, txtCli) },
      { id: 'eti', title: 'Etiqueta para el depósito', icon: 'tag', tone: 'c-orange', key: 'e', run: () => setModal('etiqueta') },
      { id: 'bol', title: 'Boleta en PDF', icon: 'file', tone: 'c-blue', key: 'b', run: () => setModal('boleta') },
      { id: 'tdep', title: 'Copiar texto para el depósito', icon: 'copy', run: () => setModal('txtDep') },
      { id: 'tcli', title: 'Copiar texto para el cliente', icon: 'copy', run: () => setModal('txtCli') },
    ].filter((a) => s.rol !== 'deposito' || (a.id !== 'cli' && a.id !== 'tcli'));
    const temprano = p.estado === 'presupuesto' || p.estado === 'confirmado';
    gestion = [
      c.saldo > 0 && puede('cobro.registrar') ? { id: 'cob', title: 'Registrar cobro', icon: 'cash', tone: 'c-yellow', key: 'c', run: () => setModal('cobro') } : null,
      esAdmin || (puede('pedido.editar') && temprano) ? { id: 'edi', title: 'Editar pedido', icon: 'edit', tone: 'c-blue', key: 'm', run: () => go('armador', { id: p.id }) } : null,
      puede('pedido.crear') ? { id: 'rep', title: 'Repetir pedido con precios de hoy', icon: 'dup', tone: 'c-purple', key: 'r', run: () => go('armador', { dup: p.id }) } : null,
      cli && puede('ver.clientes') ? { id: 'fic', title: 'Ver ficha de ' + cli.nombre, icon: 'user', run: () => go('cliente', { id: cli.id }) } : null,
      p.estado === 'cancelado' ? (esAdmin ? { id: 'rea', title: 'Reactivar como confirmado', icon: 'check', tone: 'c-green', run: () => avanzar('confirmado') } : null)
        : (esAdmin || (puede('pedido.cancelar') && temprano)) ? { id: 'can', title: 'Cancelar pedido', icon: 'ban', tone: 'c-red', run: cancelar } : null,
      esAdmin ? { id: 'del', title: 'Eliminar pedido', icon: 'trash', tone: 'c-red', key: 'mod+backspace', danger: true, run: eliminar } : null,
    ].filter(Boolean);
    if (!puedeEstado(next)) next = null;
    acts = [next && p.estado !== 'cancelado' ? { id: 'av', title: SIG_ESTADO[next], icon: 'check', tone: 'c-green', key: 'a', primary: true, run: () => avanzar(next) } : null, ...docs, ...gestion].filter(Boolean);
  }
  useCtx(p ? 'Pedido ' + numCorto(p) : 'Pedido', acts);
  if (!p) return html`<${Fragment}><${PageHead} title="Pedido no encontrado" /><div className="panel"><${Empty} icon="receipt" title="Este pedido no existe o fue eliminado."><button className="btn" onClick=${back}>Volver</button><//></div><//>`;
  const quitarPago = async (pg) => { const ok = await confirmar({ title: 'Quitar cobro', message: `Se quita el cobro de ${money(pg.monto)} del ${fmtCorta(pg.fecha)}.`, okLabel: 'Quitar', danger: true }); if (ok) safe(put('pedidos', { ...p, pagos: (p.pagos || []).filter((x) => x.id !== pg.id) })); };
  const sn = p.clienteSnap || {};
  const toggleGan = () => { setVerGan(!verGan); lsSet('jf-ver-ganancia', !verGan); };

  return html`<${Fragment}>
    <${PageHead} title=${sn.nombre || 'Sin cliente'}
      sub=${html`<span className="mono">${numCorto(p)}</span> · ${fmtCorta(p.fecha)} · ${c.lineas} productos · <b className="num" style=${{ color: 'var(--ink)' }}>${money(c.total)}</b>${p.tomadoPor ? ' · tomado por ' + (p.tomadoPor.nombre || p.tomadoPor.email) : ''}`}
      actions=${html`<${EstadoPill} estado=${p.estado} />${c.pago && html`<${PagoPill} pago=${c.pago} />`}`} />

    <section className="panel"><div className="panel-b row-flex wrap" style=${{ paddingTop: '12px', paddingBottom: '12px', gap: '10px 14px' }}>
      ${p.estado === 'cancelado' ? html`<span className="grow bad-t" style=${{ fontWeight: 500 }}>Pedido cancelado. No cuenta en ventas ni descuenta stock.</span>
          ${esAdmin && html`<button className="btn" disabled=${busy} onClick=${() => avanzar('confirmado')}>Reactivar como confirmado</button>`}`
      : html`<div className="flow grow">${FLUJO.map((e, i) => html`<${Fragment} key=${e}>${i > 0 && html`<span className=${'bar-l' + (i <= idx ? ' done' : '')}></span>`}
          <span className=${'st' + (i < idx ? ' done' : i === idx ? ' cur' : '')}><span className="n">${i < idx ? '✓' : i + 1}</span>${ESTADOS[e].corto}</span><//>`)}</div>
        ${p.entrega && html`<span className="small soft row-flex" style=${{ gap: '5px' }}><${Icon} n="truck" s=${14} />Entrega ${relDia(p.entrega).toLowerCase()}</span>`}
        ${next && html`<${KBtn} cls="primary" icon="check" k="a" disabled=${busy} onClick=${() => avanzar(next)}>${SIG_ESTADO[next]}<//>`}`}
    </div></section>

    <div className="cols c-2-1">
      <div className="stack">
        <${Panel} title="Enviar y documentos" flush><${ActList} acts=${docs} />
          ${!cfg.waDeposito && html`<p className="small muted" style=${{ padding: '0 14px 8px' }}>Cargá el WhatsApp del depósito en Ajustes para que el pedido le llegue directo, sin elegir el contacto.</p>`}
        <//>
        <${BoletaPreview} p=${p} cfg=${cfg} />
      </div>
      <div className="stack">
        <${Panel} title="Cuenta" actions=${esAdmin ? html`<button className="btn sm ghost" onClick=${toggleGan}><${Icon} n=${verGan ? 'eyeOff' : 'eye'} s=${14} />${verGan ? 'Ocultar' : 'Costos'}</button>` : null}>
          <dl className="dl">
            <dt>Total</dt><dd className="num strong">${money(c.total)}</dd>
            ${verGan && html`<dt>Costo</dt><dd className="num">${money(c.costo)}</dd><dt>Ganancia</dt><dd className=${'num strong ' + (c.ganancia >= 0 ? 'ok-t' : 'bad-t')}>${money(c.ganancia)} · ${pct(c.margen)}</dd>`}
            ${c.cuenta && html`<dt>Pagado</dt><dd className="num">${money(c.pagado)}</dd><dt>Saldo</dt><dd className=${'num strong ' + (c.saldo > 0 ? 'warn-t' : 'ok-t')}>${money(c.saldo)}</dd>`}
          </dl>
          ${!c.cuenta && html`<p className="small muted" style=${{ marginTop: '10px' }}>${p.estado === 'presupuesto' ? 'Es un presupuesto: los cobros se registran cuando lo confirmás.' : 'Pedido cancelado.'}</p>`}
          ${c.cuenta && (p.pagos || []).length > 0 && html`<div style=${{ margin: '10px -8px 0' }}>${(p.pagos || []).map((pg) => html`<div key=${pg.id} className="li plain" style=${{ minHeight: '34px' }}>
            <${Ico} n="cash" tone="c-green" /><div className="li-main"><span className="li-t">${money(pg.monto)}</span><span className="li-s">${pg.medio} · ${fmtCorta(pg.fecha)}${pg.nota ? ' · ' + pg.nota : ''}</span></div>
            ${esAdmin && html`<button className="iconbtn" aria-label="Quitar cobro" onClick=${() => quitarPago(pg)}><${Icon} n="x" s=${14} /></button>`}</div>`)}</div>`}
        <//>
        <${Panel} title="Acciones" flush><${ActList} acts=${gestion} /><//>
        <${Panel} title="Historial">
          <div className="stack-sm small">${(p.historial || []).slice().reverse().map((h, i) => html`<div key=${i} className="row-flex"><${EstadoPill} estado=${h.estado} /><span className="muted">${new Date(h.ts).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></div>`)}
            ${!(p.historial || []).length && html`<span className="muted">Sin movimientos registrados.</span>`}</div>
        <//>
      </div>
    </div>
    ${modal === 'boleta' && html`<${BoletaModal} p=${p} cfg=${cfg} onClose=${() => setModal(null)} />`}
    ${modal === 'etiqueta' && html`<${EtiquetaModal} p=${p} cfg=${cfg} onClose=${() => setModal(null)} />`}
    ${modal === 'cobro' && html`<${CobroModal} p=${p} c=${c} onClose=${() => setModal(null)} />`}
    ${modal === 'txtDep' && html`<${TextoModal} title="Pedido para el depósito" text=${txtDep} waHref=${waLink(cfg.waDeposito, txtDep)} onClose=${() => setModal(null)} />`}
    ${modal === 'txtCli' && html`<${TextoModal} title="Pedido para el cliente" text=${txtCli} waHref=${waLink(tel, txtCli)} onClose=${() => setModal(null)} />`}
  <//>`;
}

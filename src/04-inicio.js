/* =========================================================
   Inicio + filas compartidas
   ========================================================= */
function PedidoRow({ p, c, onClick, showCli = true }) {
  const s = p.clienteSnap || {};
  return html`<button className="li" data-row="" onClick=${onClick}>
    <${Ico} n="receipt" tone=${ESTADO_ICO[p.estado]} />
    <div className="li-main">
      <span className="li-t">${showCli ? (s.nombre || 'Sin cliente') : numCorto(p)}</span>
      <span className="li-s">${showCli ? html`<span className="ordno">${numCorto(p)}</span> · ` : ''}${fmtDia(p.fecha)}${p.entrega && A_PREPARAR.has(p.estado) ? ' · entrega ' + relDia(p.entrega).toLowerCase() : ''} · ${c.lineas} prod.</span>
    </div>
    <div className="li-r">
      <span className="row-flex" style=${{ gap: '4px' }}>${c.pago && c.pago !== 'pagado' ? html`<${PagoPill} pago=${c.pago} />` : null}<${EstadoPill} estado=${p.estado} /></span>
      <span className="amt">${money(c.total)}</span>
    </div>
  </button>`;
}

function VisitaRow({ v, s, go, onEdit }) {
  const cli = s.cliMap.get(v.clienteId);
  const ped = v.pedidoId ? s.pedMap.get(v.pedidoId) : null;
  const setEstado = (estado) => safe(put('visitas', { ...v, estado: v.estado === estado ? 'pendiente' : estado }));
  return html`<div className="li" style=${{ flexWrap: 'wrap', cursor: 'default' }}>
    ${v.estado === 'visitado' ? html`<${Ico} n="check" tone="c-green" />` : v.estado === 'ausente' ? html`<${Ico} n="ban" tone="c-red" />` : html`<${Ico} tone=${cli ? colorFor(cli.nombre) : ''} text=${initials(cli ? cli.nombre : '?')} />`}
    <div className="li-main" style=${{ flex: '1 1 160px' }}>
      <button className="li-t" data-row="" style=${{ background: 'none', border: 0, padding: 0, textAlign: 'left', color: 'inherit' }} onClick=${() => cli && puede('ver.clientes') && go('cliente', { id: cli.id })}>${cli ? cli.nombre : 'Cliente eliminado'}</button>
      <span className="li-s">${[v.hora, cli && (cli.zona || cli.localidad), v.nota].filter(Boolean).join(' · ') || 'Sin horario'}</span>
    </div>
    <div className="row-flex wrap" style=${{ gap: '5px', justifyContent: 'flex-end' }}>
      ${ped ? html`<button className="btn sm" onClick=${() => go('pedido', { id: ped.id })}><${Icon} n="receipt" s=${13} />${numCorto(ped)}</button>`
      : puede('pedido.crear') ? html`<button className="btn sm primary" onClick=${() => go('armador', { clienteId: v.clienteId, visitaId: v.id })}><${Icon} n="plus" s=${13} />Pedido</button>` : null}
      ${puede('visita.editar') ? html`<div className="vstate">
        <button className=${v.estado === 'visitado' ? 'on ok' : ''} onClick=${() => setEstado('visitado')}>Visitado</button>
        <button className=${v.estado === 'ausente' ? 'on bad' : ''} onClick=${() => setEstado('ausente')}>No atendió</button>
      </div>` : html`<span className="small muted">${VISITA[v.estado]}</span>`}
      ${onEdit && puede('visita.editar') && html`<button className="iconbtn" aria-label="Editar visita" onClick=${onEdit}><${Icon} n="edit" s=${15} /></button>`}
    </div>
  </div>`;
}

function stockBajo(p) {
  const st = Number(p.stock) || 0, mn = Number(p.stockMin) || 0;
  return p.activo !== false && (mn > 0 ? st <= mn : st <= 0);
}

function Inicio({ s, go }) {
  const hoy = todayISO();
  const cfg = s.config;
  const d = useMemo(() => {
    const hd = parseISO(hoy);
    const mesIni = hoy.slice(0, 8) + '01';
    const pm = new Date(hd.getFullYear(), hd.getMonth() - 1, 1);
    const prevIni = isoDate(pm);
    const finPrevMes = new Date(hd.getFullYear(), hd.getMonth(), 0).getDate();
    const prevFin = isoDate(new Date(pm.getFullYear(), pm.getMonth(), Math.min(hd.getDate(), finPrevMes)));
    let vHoy = 0, nHoy = 0, vMes = 0, gMes = 0, nMes = 0, vPrev = 0, porCobrar = 0;
    for (const p of s.pedidos) {
      const c = s.calc.get(p.id); if (!c.cuenta) continue;
      if (p.fecha === hoy) { vHoy += c.total; nHoy++; }
      if (p.fecha >= mesIni && p.fecha <= hoy) { vMes += c.total; gMes += c.ganancia; nMes++; }
      if (p.fecha >= prevIni && p.fecha <= prevFin) vPrev += c.total;
      porCobrar += c.saldo;
    }
    const deudores = [...s.cliStats.values()].filter((x) => x.saldo > 0.5).length;
    const aPreparar = s.pedidos.filter((p) => A_PREPARAR.has(p.estado)).sort((a, b) => (a.entrega || '9999').localeCompare(b.entrega || '9999'));
    const visitasHoy = s.visitas.filter((v) => v.fecha === hoy);
    const man = addISO(hoy, 1);
    const entregas = s.pedidos.filter((p) => p.entrega && p.entrega <= man && A_PREPARAR.has(p.estado)).sort((a, b) => a.entrega.localeCompare(b.entrega));
    const bajos = s.productos.filter(stockBajo);
    const presupuestos = s.pedidos.filter((p) => p.estado === 'presupuesto');
    return { vHoy, nHoy, vMes, gMes, nMes, vPrev, porCobrar, deudores, aPreparar, visitasHoy, entregas, bajos, presupuestos, trend: vPrev > 0 ? (vMes - vPrev) / vPrev * 100 : null };
  }, [s.version, hoy]);
  const h = new Date().getHours();
  const saludo = h < 13 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
  const vacio = s.productos.length === 0 && s.clientes.length === 0 && s.pedidos.length === 0;
  const [cargandoDemo, setCargandoDemo] = useState(false);
  const [visita, setVisita] = useState(null);
  const esAdmin = s.rol === 'admin';
  useCtx('Inicio', [
    puede('pedido.crear') && { id: 'np', title: 'Nuevo pedido', icon: 'receipt', tone: 'c-red', key: 'n', primary: true, run: () => go('armador', {}) },
    puede('visita.editar') && { id: 'vi', title: 'Agendar visita para hoy', icon: 'calendar', tone: 'c-purple', key: 'v', run: () => setVisita({ fecha: hoy }) },
    puede('visita.editar') && { id: 'ru', title: 'Cargar ruta de la semana', icon: 'route', tone: 'c-purple', key: 'r', run: () => cargarRutaSemana(s, new Date()) },
    !puede('pedido.crear') && puede('ver.pedidos') && { id: 'pa', title: 'Ver pedidos para armar', icon: 'truck', tone: 'c-orange', primary: true, run: () => go('pedidos', { estado: s.rol === 'repartidor' ? 'listo' : 'activos' }) },
  ]);
  const nombre = esAdmin ? (cfg.admin || 'Jonah') : s.nombreUsuario;

  return html`<${Fragment}>
    <${PageHead} title=${nombre ? `${saludo}, ${nombre}` : saludo} sub=${cap(fmtLarga(hoy)) + (esAdmin ? '' : ' · ' + ROLES[s.rol].label)}
      actions=${puede('pedido.crear') ? html`<${KBtn} cls="primary desk-only" icon="plus" k="n" onClick=${() => go('armador', {})}>Nuevo pedido<//>` : null} />

    ${vacio && esAdmin && html`<${Panel} title="Primeros pasos" flush>
      <div className="list">
        ${[['box', 'c-orange', 'Cargá tus productos', 'Uno por uno o pegando la lista desde Excel', () => go('productos', {})],
          ['users', 'c-blue', 'Cargá tu cartera de clientes', 'Con día de visita para armar la ruta solo', () => go('clientes', {})],
          ['receipt', 'c-red', 'Armá el primer pedido', 'Mandalo al depósito por WhatsApp y sacá la boleta', () => go('armador', {})]].map(([ic, tone, t, sub, fn], i) => html`
          <button key=${i} className="li" data-row="" onClick=${fn}><${Ico} n=${ic} tone=${tone} />
            <div className="li-main"><span className="li-t">${t}</span><span className="li-s">${sub}</span></div><span className="acc">${i + 1} de 3</span></button>`)}
      </div>
      <div className="row-flex wrap" style=${{ padding: '8px 14px 8px' }}>
        <button className="btn sm" disabled=${cargandoDemo} onClick=${async () => { setCargandoDemo(true); await cargarDemo(); setCargandoDemo(false); }}><${Icon} n="sparkle" s=${14} />${cargandoDemo ? 'Cargando ejemplos…' : 'Probar con datos de ejemplo'}</button>
        <span className="small muted">Quedan marcados como ejemplo y se borran con un toque.</span>
      </div>
    <//>`}

    ${esAdmin && html`<div className="kpis">
      <${Kpi} hl label="Vendido hoy" value=${money(d.vHoy)} sub=${d.nHoy === 1 ? '1 pedido' : d.nHoy + ' pedidos'} onClick=${() => go('pedidos', {})} />
      <${Kpi} label="Vendido en el mes" value=${moneyK(d.vMes)} trend=${d.trend} sub=${d.trend != null ? 'vs. mes pasado' : d.nMes + ' pedidos'} onClick=${() => go('estadisticas', {})} />
      <${Kpi} label="Ganancia del mes" value=${moneyK(d.gMes)} sub=${'Margen ' + pct(d.vMes > 0 ? d.gMes / d.vMes * 100 : 0)} onClick=${() => go('estadisticas', {})} />
      <${Kpi} label="Por cobrar" value=${moneyK(d.porCobrar)} sub=${d.deudores === 1 ? '1 cliente debe' : d.deudores + ' clientes deben'} onClick=${() => go('clientes', { filtro: 'deuda' })} />
    </div>`}

    <div className="cols c-2-1">
      <div className="stack">
        ${puede('ver.agenda') && s.rol !== 'repartidor' && html`<${Panel} title="Visitas de hoy" count=${d.visitasHoy.length || null} flush actions=${puede('visita.editar') ? html`<${KBtn} cls="sm ghost" k="v" onClick=${() => setVisita({ fecha: hoy })}>Agendar<//>` : null}>
          ${d.visitasHoy.length ? html`<div className="list">${d.visitasHoy.map((v) => html`<${VisitaRow} key=${v.id} v=${v} s=${s} go=${go} />`)}</div>`
          : html`<${Empty} icon="route" title="No hay visitas para hoy" sub="Agendá visitas o cargá la ruta de la semana con el día de visita de cada cliente.">${puede('visita.editar') && html`<${KBtn} cls="sm" icon="route" k="r" onClick=${() => cargarRutaSemana(s, new Date())}>Cargar ruta de la semana<//>`}<//>`}
        <//>`}
        <${Panel} title="Para armar y entregar" count=${d.aPreparar.length || null} flush actions=${html`<button className="btn sm ghost" onClick=${() => go('pedidos', { estado: 'activos' })}>Ver todos</button>`}>
          ${d.aPreparar.length ? html`<div className="list">${d.aPreparar.slice(0, 8).map((p) => html`<${PedidoRow} key=${p.id} p=${p} c=${s.calc.get(p.id)} onClick=${() => go('pedido', { id: p.id })} />`)}</div>`
          : html`<${Empty} icon="receipt" title="Nada pendiente de armado" sub="Los pedidos confirmados aparecen acá hasta que se entregan." />`}
        <//>
      </div>
      <div className="stack">
        <${Panel} title="Entregas hoy y mañana" count=${d.entregas.length || null} flush>
          ${d.entregas.length ? html`<div className="list">${d.entregas.map((p) => html`<button key=${p.id} className="li" data-row="" onClick=${() => go('pedido', { id: p.id })}>
            <${Ico} n="truck" tone="c-orange" />
            <div className="li-main"><span className="li-t">${(p.clienteSnap || {}).nombre}</span><span className="li-s">${relDia(p.entrega)} · ${numCorto(p)}</span></div>
            <span className="amt">${money(s.calc.get(p.id).total)}</span></button>`)}</div>`
          : html`<div className="li muted-row" style=${{ padding: '4px 14px' }}>Sin entregas para hoy ni mañana.</div>`}
        <//>
        ${(esAdmin || puede('producto.stock')) && html`<${Panel} title="Stock bajo" count=${d.bajos.length || null} flush actions=${d.bajos.length > 0 ? html`<button className="btn sm ghost" onClick=${() => go('productos', { filtro: 'bajo' })}>Ver todo</button>` : null}>
          ${d.bajos.length ? html`<div className="list">${d.bajos.slice(0, 6).map((p) => html`<button key=${p.id} className="li" data-row="" onClick=${() => go('productos', { open: p.id })}>
            <${Ico} n="alert" tone=${(Number(p.stock) || 0) <= 0 ? 'c-red' : 'c-yellow'} />
            <div className="li-main"><span className="li-t">${p.nombre}</span><span className="li-s">${Number(p.stockMin) > 0 ? 'mínimo ' + qty(p.stockMin) : p.codigo || ''}</span></div>
            <span className="acc">${qty(p.stock)} en stock</span></button>`)}</div>`
          : html`<div className="li muted-row" style=${{ padding: '4px 14px' }}>Todo el stock está por encima del mínimo.</div>`}
        <//>`}
        ${d.presupuestos.length > 0 && puede('pedido.confirmar') && html`<${Panel} title="Presupuestos abiertos" count=${d.presupuestos.length} flush>
          <div className="list">${d.presupuestos.slice(0, 5).map((p) => html`<${PedidoRow} key=${p.id} p=${p} c=${s.calc.get(p.id)} onClick=${() => go('pedido', { id: p.id })} />`)}</div>
        <//>`}
      </div>
    </div>
    ${visita && html`<${VisitaForm} s=${s} init=${visita} onClose=${() => setVisita(null)} />`}
  <//>`;
}

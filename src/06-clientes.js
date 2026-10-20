/* =========================================================
   Clientes: cartera, ficha, cuenta corriente
   ========================================================= */
function ClienteForm({ s, init, onClose, onSaved }) {
  const editing = init && init.id;
  const [c, setC] = useState(() => ({ nombre: '', contacto: '', telefono: '', direccion: '', localidad: '', zona: '', cuit: '', condIva: 'Consumidor final', diaVisita: '', descuento: 0, notas: '', activo: true, ...(init || {}) }));
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setC((x) => ({ ...x, [k]: e && e.target ? e.target.value : e }));
  const ok = async () => {
    if (busy) return;
    if (!c.nombre.trim()) { toast('Poné el nombre del comercio o cliente.', { tone: 'bad' }); return; }
    setBusy(true);
    try { const id = await put('clientes', { ...c, nombre: c.nombre.trim(), diaVisita: c.diaVisita === '' ? '' : Number(c.diaVisita) }); toast(editing ? 'Cliente actualizado' : 'Cliente agregado'); onSaved ? onSaved(id) : onClose(); }
    catch (e) { setBusy(false); }
  };
  const tw = telWa(c.telefono);
  return html`<${Modal} title=${editing ? 'Editar cliente' : 'Nuevo cliente'} onClose=${onClose} onSubmit=${ok} footer=${html`<button className="btn ghost" onClick=${onClose}>Cancelar</button><button className="btn primary" disabled=${busy} onClick=${ok}>${editing ? 'Guardar' : 'Agregar cliente'}</button>`}>
    <${Field} label="Comercio o nombre *" id="cl-nombre"><input id="cl-nombre" className="input" value=${c.nombre} onChange=${set('nombre')} placeholder="Ej.: Kiosco La Esquina" autoFocus=${!editing} /><//>
    <div className="grid2">
      <${Field} label="Persona de contacto" id="cl-contacto"><input id="cl-contacto" className="input" value=${c.contacto} onChange=${set('contacto')} placeholder="Ej.: Marta" /><//>
      <${Field} label="WhatsApp / teléfono" id="cl-tel" hint=${c.telefono ? (tw ? 'Se envía a +' + tw : 'Revisá el número: falta el código de área') : 'Con código de área, sin 0 ni 15. Ej.: 3444 512345'}>
        <input id="cl-tel" className="input" inputMode="tel" value=${c.telefono} onChange=${set('telefono')} placeholder="3444 512345" /><//>
    </div>
    <${Field} label="Dirección" id="cl-dir"><input id="cl-dir" className="input" value=${c.direccion} onChange=${set('direccion')} placeholder="Calle y número" /><//>
    <div className="grid2">
      <${Field} label="Localidad" id="cl-loc"><input id="cl-loc" className="input" list="dl-loc" value=${c.localidad} onChange=${set('localidad')} /><datalist id="dl-loc">${[...new Set(s.clientes.map((x) => x.localidad).filter(Boolean))].map((x) => html`<option key=${x} value=${x} />`)}</datalist><//>
      <${Field} label="Zona o recorrido" id="cl-zona"><input id="cl-zona" className="input" list="dl-zona" value=${c.zona} onChange=${set('zona')} placeholder="Ej.: Centro, Ruta 12" /><datalist id="dl-zona">${[...new Set(s.clientes.map((x) => x.zona).filter(Boolean))].map((x) => html`<option key=${x} value=${x} />`)}</datalist><//>
    </div>
    <div className="grid2">
      <${Field} label="Día de visita" id="cl-dia" hint="Se usa para armar la ruta de la semana."><select id="cl-dia" className="select" value=${c.diaVisita} onChange=${set('diaVisita')}>
        <option value="">Sin día fijo</option>${[1, 2, 3, 4, 5, 6, 0].map((dd) => html`<option key=${dd} value=${dd}>${DIAS[dd]}</option>`)}</select><//>
      <${Field} label="Descuento habitual" id="cl-desc" hint="Se aplica solo al armar sus pedidos."><${NumInput} id="cl-desc" value=${c.descuento} placeholder="0" suffix="%" onChange=${(v) => setC((x) => ({ ...x, descuento: Math.min(100, Math.max(0, v)) }))} /><//>
    </div>
    <div className="grid2">
      <${Field} label="CUIT / DNI" id="cl-cuit"><input id="cl-cuit" className="input" inputMode="numeric" value=${c.cuit} onChange=${set('cuit')} placeholder="20-12345678-9" /><//>
      <${Field} label="Condición frente al IVA" id="cl-iva"><select id="cl-iva" className="select" value=${c.condIva} onChange=${set('condIva')}>${COND_IVA.map((x) => html`<option key=${x} value=${x}>${x}</option>`)}</select><//>
    </div>
    <${Field} label="Notas" id="cl-notas" hint="Aparecen al armarle un pedido."><textarea id="cl-notas" className="textarea" style=${{ minHeight: '60px' }} value=${c.notas} onChange=${set('notas')} placeholder="Ej.: abre de 8 a 13, paga los viernes"></textarea><//>
    ${editing && html`<${Toggle} id="cl-activo" checked=${c.activo !== false} onChange=${(v) => setC((x) => ({ ...x, activo: v }))} label="Cliente activo" />`}
  <//>`;
}

async function cobrarCliente(s, cliId, monto, medio, fecha, nota) {
  let resto = round2(monto);
  const pend = s.pedidos.filter((p) => p.clienteId === cliId && s.calc.get(p.id).saldo > 0.009).sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.numero - b.numero));
  for (const p of pend) {
    if (resto <= 0.009) break;
    const sal = s.calc.get(p.id).saldo; const m = round2(Math.min(sal, resto));
    await put('pedidos', { ...p, pagos: [...(p.pagos || []), { id: uid(), fecha, monto: m, medio, nota: nota || 'Cobro a cuenta' }] });
    resto = round2(resto - m);
  }
  return resto;
}
function CobroClienteModal({ s, cli, saldo, onClose }) {
  const [monto, setMonto] = useState(saldo);
  const [medio, setMedio] = useState('Efectivo');
  const [fecha, setFecha] = useState(todayISO());
  const [busy, setBusy] = useState(false);
  const ok = async () => {
    if (busy) return;
    if (!(monto > 0)) { toast('Ingresá un monto mayor a cero.', { tone: 'bad' }); return; }
    setBusy(true);
    try {
      const resto = await cobrarCliente(s, cli.id, monto, medio, fecha);
      toast(resto > 0 ? `Cobro registrado. Sobraron ${money(resto)} que no se aplicaron.` : 'Cobro registrado: ' + money(monto)); onClose();
    } catch (e) { setBusy(false); }
  };
  return html`<${Modal} title="Cobrar a cuenta" onClose=${onClose} onSubmit=${ok} footer=${html`<button className="btn ghost" onClick=${onClose}>Cancelar</button><button className="btn primary" disabled=${busy} onClick=${ok}>${busy ? 'Registrando…' : 'Registrar cobro'}</button>`}>
    <div className="banner info"><${Icon} n="cash" s=${16} /><span className="grow"><b>${cli.nombre}</b> debe ${money(saldo)}. El cobro se aplica primero a los pedidos más viejos.</span></div>
    <div className="grid2">
      <${Field} label="Monto" id="cc-monto"><${NumInput} id="cc-monto" value=${monto} prefix="$" autoFocus onChange=${setMonto} /><//>
      <${Field} label="Fecha" id="cc-fecha"><input id="cc-fecha" type="date" className="input" value=${fecha} onChange=${(e) => setFecha(e.target.value || todayISO())} /><//>
    </div>
    <${Field} label="Medio de pago"><${Chips} value=${medio} onChange=${setMedio} options=${MEDIOS.map((m) => ({ v: m, l: m }))} /><//>
  <//>`;
}

function Clientes({ s, go, params }) {
  const [q, setQ] = useState('');
  const [f, setF] = useState(params.filtro || 'todos');
  const [zona, setZona] = useState('');
  const [form, setForm] = useState(null);
  const hoy = todayISO();
  const dIn = Number(s.config.diasInactivo) || 30;
  const test = {
    todos: (c) => c.activo !== false,
    deuda: (c) => { const st = s.cliStats.get(c.id); return st && st.saldo > 0.5; },
    hoy: (c) => c.activo !== false && c.diaVisita !== '' && c.diaVisita != null && Number(c.diaVisita) === parseISO(hoy).getDay(),
    inactivos: (c) => { const st = s.cliStats.get(c.id); return c.activo !== false && (!st || !st.ultima || diasEntre(st.ultima, hoy) > dIn); },
    baja: (c) => c.activo === false,
  };
  const base = s.clientes.filter((c) => (!zona || (c.zona || c.localidad) === zona) && matches(q, c.nombre, c.contacto, c.telefono, c.direccion, c.localidad, c.zona, c.cuit));
  const lista = base.filter(test[f] || test.todos);
  const totalDeuda = lista.reduce((a, c) => a + ((s.cliStats.get(c.id) || {}).saldo || 0), 0);
  const exportar = () => guardarArchivo('clientes-jf.csv', toCSV([['Nombre', 'Contacto', 'Teléfono', 'Dirección', 'Localidad', 'Zona', 'CUIT', 'Condición IVA', 'Día de visita', 'Descuento %', 'Total comprado', 'Saldo', 'Última compra', 'Notas'],
    ...lista.map((c) => { const st = s.cliStats.get(c.id) || {}; return [c.nombre, c.contacto, c.telefono, c.direccion, c.localidad, c.zona, c.cuit, c.condIva, c.diaVisita === '' || c.diaVisita == null ? '' : DIAS[c.diaVisita], csvNum(c.descuento || 0), csvNum(st.total || 0), csvNum(st.saldo || 0), st.ultima ? fmtCorta(st.ultima) : '', c.notas]; })]));
  useCtx('Clientes', [
    { id: 'nc', title: 'Agregar cliente', icon: 'user', tone: 'c-blue', key: 'a', primary: true, run: () => setForm({}) },
    { id: 'fd', title: 'Ver clientes con deuda', icon: 'cash', tone: 'c-yellow', run: () => setF('deuda') },
    { id: 'fh', title: 'Ver clientes para visitar hoy', icon: 'calendar', tone: 'c-purple', run: () => setF('hoy') },
    { id: 'fi', title: `Ver clientes sin comprar hace +${dIn} días`, icon: 'clock', run: () => setF('inactivos') },
    lista.length ? { id: 'ex', title: 'Exportar clientes a CSV', icon: 'download', run: exportar } : null,
  ]);
  return html`<${Fragment}>
    <${PageHead} title="Clientes" sub=${`${lista.length} en la cartera${totalDeuda > 0.5 ? ' · deben ' + money(totalDeuda) : ''}`}
      actions=${html`<button className="btn" onClick=${exportar} disabled=${!lista.length}><${Icon} n="download" s=${15} /><span className="desk-only">Exportar</span></button><${KBtn} cls="primary" icon="plus" k="a" onClick=${() => setForm({})}>Cliente<//>`} />
    <div className="row-flex wrap">
      <${Search} page value=${q} onChange=${setQ} placeholder="Buscar por nombre, teléfono, dirección o CUIT" />
      ${s.zonas.length > 1 && html`<select className="select" style=${{ width: 'auto', flex: '0 1 190px' }} value=${zona} onChange=${(e) => setZona(e.target.value)} aria-label="Filtrar por zona"><option value="">Todas las zonas</option>${s.zonas.map((z) => html`<option key=${z} value=${z}>${z}</option>`)}</select>`}
    </div>
    <${Chips} value=${f} onChange=${setF} options=${[['todos', 'Activos'], ['hoy', 'Visita hoy'], ['deuda', 'Con deuda'], ['inactivos', `Sin comprar +${dIn} días`], ['baja', 'Dados de baja']].map(([v, l]) => ({ v, l, ct: base.filter(test[v]).length }))} />
    ${lista.length === 0 ? html`<div className="panel"><${Empty} icon="users" title=${s.clientes.length ? 'Ningún cliente con estos filtros' : 'Todavía no cargaste clientes'} sub=${s.clientes.length ? 'Probá con otra búsqueda o filtro.' : 'Cargá cada comercio con su dirección, WhatsApp y día de visita.'}>
        ${!s.clientes.length && html`<${KBtn} cls="primary" icon="plus" k="a" onClick=${() => setForm({})}>Agregar cliente<//>`}<//></div>`
    : html`<div className="panel" style=${{ padding: '6px 0' }}><div className="list">${lista.map((c) => { const st = s.cliStats.get(c.id) || {}; return html`<button key=${c.id} className="li" data-row="" onClick=${() => go('cliente', { id: c.id })}>
        <${Ico} tone=${colorFor(c.nombre)} text=${initials(c.nombre)} />
        <div className="li-main"><span className="li-t">${c.nombre}</span>
          <span className="li-s">${[c.zona || c.localidad, c.contacto].filter(Boolean).join(' · ')}</span></div>
        <div className="li-r">
          ${st.saldo > 0.5 ? html`<${Pill} tone="t-warn">Debe ${money(st.saldo)}<//>` : null}
          <span className="row-flex" style=${{ gap: '6px' }}>${c.diaVisita !== '' && c.diaVisita != null && html`<span className="tag-day">${DIAS_C[c.diaVisita]}</span>`}<span className="acc">${st.ultima ? haceTxt(st.ultima) : 'Sin compras'}</span></span>
        </div>
      </button>`; })}</div></div>`}
    ${form && html`<${ClienteForm} s=${s} init=${form} onClose=${() => setForm(null)} onSaved=${(id) => { setForm(null); go('cliente', { id }); }} />`}
  <//>`;
}

function ClienteDetalle({ s, go, back, params }) {
  const c = s.cliMap.get(params.id);
  const [form, setForm] = useState(false);
  const [cobro, setCobro] = useState(false);
  const [visita, setVisita] = useState(false);
  const st = (c && s.cliStats.get(c.id)) || { total: 0, pedidos: 0, ultima: '', saldo: 0 };
  const peds = c ? s.pedidos.filter((p) => p.clienteId === c.id) : [];
  const deudas = peds.filter((p) => s.calc.get(p.id).saldo > 0.009).map((p) => ({ p, c: s.calc.get(p.id) })).sort((a, b) => a.p.fecha.localeCompare(b.p.fecha));
  const eliminar = async () => {
    const ok = await confirmar({ title: 'Eliminar ' + c.nombre, message: peds.length ? `Tiene ${peds.length} pedidos. Los pedidos se conservan con sus datos, pero el cliente sale de la cartera. Si solo dejó de comprar, mejor desactivalo desde Editar.` : 'Se borra de la cartera.', okLabel: 'Eliminar', danger: true });
    if (!ok) return;
    try { await del('clientes', c.id); toast('Cliente eliminado'); back(); } catch (e) { /* aviso mostrado */ }
  };
  const waHola = c ? waLink(c.telefono, `Hola${c.contacto ? ' ' + c.contacto.split(' ')[0] : ''}, te escribo de ${s.config.nombre}.`) : '';
  const waSaldo = c && deudas.length ? waLink(c.telefono, textoCobro(c, st.saldo, deudas, s.config)) : '';
  const acts = c ? [
    { id: 'np', title: 'Nuevo pedido para ' + c.nombre, icon: 'receipt', tone: 'c-red', key: 'n', primary: true, run: () => go('armador', { clienteId: c.id }) },
    c.telefono ? { id: 'wa', title: 'Escribir por WhatsApp', icon: 'wa', tone: 'c-green', key: 'w', href: waHola } : null,
    deudas.length ? { id: 'co', title: 'Cobrar a cuenta', icon: 'cash', tone: 'c-yellow', key: 'c', run: () => setCobro(true) } : null,
    deudas.length ? { id: 'ws', title: 'Pasar el saldo por WhatsApp', icon: 'wa', tone: 'c-green', href: waSaldo } : null,
    { id: 'vi', title: 'Agendar visita', icon: 'calendar', tone: 'c-purple', key: 'v', run: () => setVisita(true) },
    { id: 'ed', title: 'Editar datos', icon: 'edit', tone: 'c-blue', key: 'm', run: () => setForm(true) },
    (c.direccion || c.localidad) ? { id: 'ma', title: 'Ver en el mapa', icon: 'pin', href: mapsLink(c.direccion, c.localidad) } : null,
    { id: 'del', title: 'Eliminar cliente', icon: 'trash', tone: 'c-red', key: 'mod+backspace', danger: true, run: eliminar },
  ].filter(Boolean) : [];
  useCtx(c ? c.nombre : 'Cliente', acts);
  if (!c) return html`<${Fragment}><${PageHead} title="Cliente no encontrado" /><div className="panel"><${Empty} icon="users" title="Este cliente no existe o fue eliminado."><button className="btn" onClick=${back}>Volver</button><//></div><//>`;
  const top = (() => {
    const m = new Map();
    for (const p of peds) { if (!CUENTA.has(p.estado)) continue; for (const it of p.items || []) { const k = it.pid || it.nombre; const x = m.get(k) || { nombre: it.nombre, cant: 0, monto: 0 }; x.cant += Number(it.cant) || 0; x.monto += lineaSub(it); m.set(k, x); } }
    return [...m.values()].sort((a, b) => b.monto - a.monto).slice(0, 6);
  })();
  const prox = s.visitas.filter((v) => v.clienteId === c.id && v.fecha >= todayISO()).slice(0, 3);
  const maxTop = top.length ? top[0].monto : 1;
  return html`<${Fragment}>
    <div className="row-flex" style=${{ gap: '12px' }}>
      <${Ico} tone=${colorFor(c.nombre)} text=${initials(c.nombre)} lg />
      <div className="grow"><${PageHead} title=${c.nombre} sub=${[c.contacto, c.zona || c.localidad, c.activo === false ? 'Dado de baja' : null].filter(Boolean).join(' · ') || 'Cliente'}
        actions=${html`<${KBtn} cls="primary" icon="plus" k="n" onClick=${() => go('armador', { clienteId: c.id })}>Pedido<//>${c.telefono && html`<a className="btn wa" href=${waHola} target="_blank" rel="noopener"><${Icon} n="wa" s=${15} />WhatsApp</a>`}`} /></div>
    </div>
    <div className="kpis">
      <${Kpi} label="Total comprado" value=${moneyK(st.total)} sub=${st.pedidos + ' pedidos'} />
      <${Kpi} label="Ticket promedio" value=${moneyK(st.pedidos ? st.total / st.pedidos : 0)} />
      <${Kpi} label="Última compra" value=${st.ultima ? haceTxt(st.ultima) : 'Nunca'} sub=${st.ultima ? fmtCorta(st.ultima) : ''} />
      <${Kpi} hl=${st.saldo > 0.5} label="Saldo de cuenta" value=${money(st.saldo)} sub=${st.saldo > 0.5 ? deudas.length + ' pedidos impagos' : 'Al día'} />
    </div>
    <div className="cols c-2-1">
      <div className="stack">
        ${deudas.length > 0 && html`<${Panel} title="Cuenta corriente" count=${deudas.length} flush actions=${html`<a className="btn sm wa" href=${waSaldo} target="_blank" rel="noopener"><${Icon} n="wa" s=${13} />Pasar saldo</a><${KBtn} cls="sm primary" k="c" onClick=${() => setCobro(true)}>Cobrar<//>`}>
          <div className="list">${deudas.map(({ p, c: cc }) => html`<button key=${p.id} className="li" data-row="" onClick=${() => go('pedido', { id: p.id })}>
            <${Ico} n="receipt" tone="c-yellow" />
            <div className="li-main"><span className="li-t"><span className="ordno">${numCorto(p)}</span> · ${fmtCorta(p.fecha)}</span><span className="li-s">Total ${money(cc.total)}${cc.pagado > 0 ? ' · pagó ' + money(cc.pagado) : ''} · hace ${diasEntre(p.fecha, todayISO())} días</span></div>
            <span className="amt warn-t">${money(cc.saldo)}</span></button>`)}</div>
        <//>`}
        <${Panel} title="Pedidos" count=${peds.length || null} flush>
          ${peds.length ? html`<div className="list">${peds.slice(0, 30).map((p) => html`<${PedidoRow} key=${p.id} p=${p} c=${s.calc.get(p.id)} showCli=${false} onClick=${() => go('pedido', { id: p.id })} />`)}</div>`
          : html`<${Empty} icon="receipt" title="Todavía no le vendiste" sub="Armale el primer pedido desde acá."><${KBtn} cls="primary" k="n" onClick=${() => go('armador', { clienteId: c.id })}>Armar pedido<//><//>`}
        <//>
      </div>
      <div className="stack">
        <${Panel} title="Acciones" flush><${ActList} acts=${acts.filter((a) => a.id !== 'np')} /><//>
        <${Panel} title="Datos">
          <dl className="dl">
            <dt>Teléfono</dt><dd>${c.telefono ? html`<span className="mono">${c.telefono}</span>` : '—'}</dd>
            <dt>Dirección</dt><dd>${dirCliente(c) || '—'}</dd>
            <dt>Zona</dt><dd>${c.zona || '—'}</dd>
            <dt>Visita</dt><dd>${c.diaVisita !== '' && c.diaVisita != null ? DIAS[c.diaVisita] : 'Sin día fijo'}</dd>
            <dt>CUIT</dt><dd>${c.cuit || '—'}</dd><dt>IVA</dt><dd>${c.condIva || '—'}</dd>
            ${Number(c.descuento) > 0 && html`<dt>Descuento</dt><dd>${pct(c.descuento)}</dd>`}
            ${c.notas && html`<dt>Notas</dt><dd>${c.notas}</dd>`}
          </dl>
        <//>
        <${Panel} title="Próximas visitas" flush actions=${html`<${KBtn} cls="sm ghost" k="v" onClick=${() => setVisita(true)}>Agendar<//>`}>
          ${prox.length ? html`<div className="list">${prox.map((v) => html`<div key=${v.id} className="li plain"><${Ico} n="calendar" tone="c-purple" /><div className="li-main"><span className="li-t">${cap(relDia(v.fecha) === fmtDia(v.fecha) ? fmtLarga(v.fecha) : relDia(v.fecha))}</span><span className="li-s">${[v.hora, v.nota, VISITA[v.estado]].filter(Boolean).join(' · ')}</span></div></div>`)}</div>`
          : html`<div className="li muted-row" style=${{ padding: '2px 14px' }}>Sin visitas agendadas.</div>`}
        <//>
        ${top.length > 0 && html`<${Panel} title="Lo que más compra">
          <div className="hbars">${top.map((t, i) => html`<div key=${i} className="hbar"><span className="hb-l">${t.nombre}</span><span className="hb-v">${qty(t.cant)} u. · ${moneyK(t.monto)}</span><div className="hb-track"><div className="hb-fill" style=${{ width: (t.monto / maxTop * 100) + '%' }}></div></div></div>`)}</div>
        <//>`}
      </div>
    </div>
    ${form && html`<${ClienteForm} s=${s} init=${c} onClose=${() => setForm(false)} onSaved=${() => setForm(false)} />`}
    ${cobro && html`<${CobroClienteModal} s=${s} cli=${c} saldo=${st.saldo} onClose=${() => setCobro(false)} />`}
    ${visita && html`<${VisitaForm} s=${s} init=${{ clienteId: c.id, fecha: todayISO() }} onClose=${() => setVisita(false)} />`}
  <//>`;
}

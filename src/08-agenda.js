/* =========================================================
   Agenda de visitas y entregas
   ========================================================= */
async function cargarRutaSemana(s, refDate) {
  try { assertWritable(); } catch (e) { return; }
  const hoy = todayISO();
  const ini = startOfWeek(refDate); const tareas = [];
  for (let i = 0; i < 7; i++) {
    const f = isoDate(addDays(ini, i)); if (f < hoy) continue; const dw = addDays(ini, i).getDay();
    for (const c of s.clientes) {
      if (c.activo === false || c.diaVisita === '' || c.diaVisita == null || Number(c.diaVisita) !== dw) continue;
      if (s.visitas.some((v) => v.clienteId === c.id && v.fecha === f)) continue;
      tareas.push({ c, f });
    }
  }
  if (!tareas.length) { toast(s.clientes.some((c) => c.diaVisita !== '' && c.diaVisita != null) ? 'La ruta de esa semana ya está cargada.' : 'Ningún cliente tiene día de visita. Cargalo en la ficha de cada cliente.'); return; }
  const ok = await confirmar({ title: 'Cargar ruta de la semana', message: `Se agendan ${tareas.length} visitas según el día de visita de cada cliente, desde hoy hasta el domingo ${fmtCorta(isoDate(addDays(ini, 6)))}.`, okLabel: 'Cargar ruta' });
  if (!ok) return;
  const errs = await runPool(tareas.map(({ c, f }) => () => put('visitas', { clienteId: c.id, fecha: f, hora: '', nota: '', estado: 'pendiente' })), 4);
  toast(errs.length ? `Cargadas con ${errs.length} errores` : `${tareas.length} visitas agendadas`);
}

function VisitaForm({ s, init, onClose }) {
  const editing = init && init.id;
  const [v, setV] = useState(() => ({ clienteId: '', fecha: todayISO(), hora: '', nota: '', estado: 'pendiente', ...(init || {}) }));
  const [repetir, setRepetir] = useState(0);
  const [fijar, setFijar] = useState(false);
  const [busy, setBusy] = useState(false);
  const cli = v.clienteId ? s.cliMap.get(v.clienteId) : null;
  const dow = parseISO(v.fecha).getDay();
  const ok = async () => {
    if (busy) return;
    if (!v.clienteId) { toast('Elegí el cliente a visitar.', { tone: 'bad' }); return; }
    setBusy(true);
    try {
      await put('visitas', v);
      for (let i = 1; i <= repetir; i++) {
        const f = addISO(v.fecha, 7 * i);
        if (!s.visitas.some((x) => x.clienteId === v.clienteId && x.fecha === f)) await put('visitas', { clienteId: v.clienteId, fecha: f, hora: v.hora, nota: v.nota, estado: 'pendiente' });
      }
      if (fijar && cli) await put('clientes', { ...cli, diaVisita: dow });
      toast(editing ? 'Visita actualizada' : repetir ? `Agendadas ${repetir + 1} visitas` : 'Visita agendada');
      onClose();
    } catch (e) { setBusy(false); }
  };
  const eliminar = async () => { try { await del('visitas', v.id); toast('Visita eliminada'); onClose(); } catch (e) { /* aviso mostrado */ } };
  return html`<${Modal} title=${editing ? 'Editar visita' : 'Agendar visita'} onClose=${onClose} onSubmit=${ok} footer=${html`${editing && html`<button className="btn ghost danger" onClick=${eliminar}><${Icon} n="trash" s=${15} />Eliminar</button>`}<button className="btn ghost" onClick=${onClose}>Cancelar</button><button className="btn primary" disabled=${busy} onClick=${ok}>${editing ? 'Guardar' : 'Agendar'}</button>`}>
    <div className="stack-sm"><span className="lbl">Cliente</span><${ClienteSelect} s=${s} value=${v.clienteId} onChange=${(id) => setV((x) => ({ ...x, clienteId: id }))} /></div>
    <div className="grid2">
      <${Field} label="Día" id="vi-fecha"><input id="vi-fecha" type="date" className="input" value=${v.fecha} onChange=${(e) => setV((x) => ({ ...x, fecha: e.target.value || todayISO() }))} /><//>
      <${Field} label="Hora (opcional)" id="vi-hora"><input id="vi-hora" type="time" className="input" value=${v.hora} onChange=${(e) => setV((x) => ({ ...x, hora: e.target.value }))} /><//>
    </div>
    <${Field} label="Nota" id="vi-nota"><input id="vi-nota" className="input" value=${v.nota} placeholder="Ej.: llevar lista nueva, cobrar saldo" onChange=${(e) => setV((x) => ({ ...x, nota: e.target.value }))} /><//>
    ${editing ? html`<${Field} label="Estado"><${Seg} value=${v.estado} onChange=${(e) => setV((x) => ({ ...x, estado: e }))} options=${Object.entries(VISITA).map(([k, l]) => ({ v: k, l }))} /><//>`
    : html`<${Field} label="Repetir"><${Seg} value=${repetir} onChange=${setRepetir} options=${[{ v: 0, l: 'Solo esta vez' }, { v: 3, l: '4 semanas' }, { v: 7, l: '8 semanas' }]} /><//>
      ${cli && (cli.diaVisita === '' || cli.diaVisita == null || Number(cli.diaVisita) !== dow) && html`<${Toggle} id="vi-fijar" checked=${fijar} onChange=${setFijar} label=${`Fijar los ${DIAS[dow].toLowerCase()} como día de visita de ${cli.nombre}`} />`}`}
  <//>`;
}

function Agenda({ s, go }) {
  const hoy = todayISO();
  const [mes, setMes] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [sel, setSel] = useState(hoy);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const dias = useMemo(() => {
    const ini = startOfWeek(mes); const out = [];
    const fin = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
    for (let d = new Date(ini); out.length < 42 && (d <= fin || out.length % 7 !== 0); d = addDays(d, 1)) out.push(isoDate(d));
    return out;
  }, [mes]);
  const porDia = useMemo(() => {
    const m = new Map(); const g = (k) => { let x = m.get(k); if (!x) { x = { v: [], e: [] }; m.set(k, x); } return x; };
    for (const v of s.visitas) g(v.fecha).v.push(v);
    for (const p of s.pedidos) if (p.entrega && p.estado !== 'cancelado') g(p.entrega).e.push(p);
    return m;
  }, [s.version]);
  const selD = parseISO(sel);
  const delDia = porDia.get(sel) || { v: [], e: [] };
  const deRuta = s.clientes.filter((c) => c.activo !== false && c.diaVisita !== '' && c.diaVisita != null && Number(c.diaVisita) === selD.getDay() && !delDia.v.some((v) => v.clienteId === c.id));
  const agendar = async (clis, fecha) => {
    setBusy(true);
    const errs = await runPool(clis.map((c) => () => put('visitas', { clienteId: c.id, fecha, hora: '', nota: '', estado: 'pendiente' })), 4);
    setBusy(false);
    if (!errs.length) toast(clis.length === 1 ? 'Visita agendada' : `${clis.length} visitas agendadas`);
  };
  const semana = useMemo(() => {
    const ini = startOfWeek(selD); let tot = 0, hechas = 0, ped = 0;
    for (let i = 0; i < 7; i++) { const x = porDia.get(isoDate(addDays(ini, i))); if (!x) continue; tot += x.v.length; hechas += x.v.filter((v) => v.estado === 'visitado').length; ped += x.v.filter((v) => v.pedidoId).length; }
    return { tot, hechas, ped };
  }, [sel, porDia]);
  const cambiarMes = (n) => { const m = new Date(mes.getFullYear(), mes.getMonth() + n, 1); setMes(m); setSel(isoDate(m)); };
  const irHoy = () => { const d = new Date(); setMes(new Date(d.getFullYear(), d.getMonth(), 1)); setSel(hoy); };
  const moverDia = (n) => { const f = addISO(sel, n); setSel(f); const d = parseISO(f); if (d.getMonth() !== mes.getMonth() || d.getFullYear() !== mes.getFullYear()) setMes(new Date(d.getFullYear(), d.getMonth(), 1)); };
  useCtx('Agenda', [
    { id: 'nv', title: 'Nueva visita', icon: 'calendar', tone: 'c-purple', key: 'v', primary: true, run: () => setForm({ fecha: sel }) },
    { id: 'ru', title: 'Cargar ruta de la semana', icon: 'route', tone: 'c-purple', key: 'r', run: () => cargarRutaSemana(s, selD) },
    { id: 'ho', title: 'Ir a hoy', icon: 'clock', key: 't', run: irHoy },
    { id: 'da', title: 'Día anterior', icon: 'left', key: 'left', run: () => moverDia(-1) },
    { id: 'ds', title: 'Día siguiente', icon: 'right', key: 'right', run: () => moverDia(1) },
    { id: 'ma', title: 'Mes anterior', icon: 'left', run: () => cambiarMes(-1) },
    { id: 'ms', title: 'Mes siguiente', icon: 'right', run: () => cambiarMes(1) },
    deRuta.length ? { id: 'ag', title: `Agendar los ${deRuta.length} clientes de ruta de este día`, icon: 'plus', tone: 'c-purple', run: () => agendar(deRuta, sel) } : null,
  ]);
  const tituloDia = cap(relDia(sel) === fmtDia(sel) ? fmtLarga(sel) : relDia(sel) + ', ' + fmtLarga(sel).split(' ').slice(1).join(' '));

  return html`<${Fragment}>
    <${PageHead} title="Agenda" sub=${`Esta semana: ${semana.tot} visitas · ${semana.hechas} hechas · ${semana.ped} con pedido`}
      actions=${html`<${KBtn} icon="route" k="r" disabled=${busy} onClick=${() => cargarRutaSemana(s, selD)}>Cargar ruta<//><${KBtn} cls="primary" icon="plus" k="v" onClick=${() => setForm({ fecha: sel })}>Visita<//>`} />
    <div className="cols c-2-1">
      <section className="panel"><div className="panel-b stack-sm" style=${{ paddingTop: '10px' }}>
        <div className="row-flex">
          <h2 style=${{ fontSize: '15px', fontWeight: 600, flex: 1 }}>${cap(MESES[mes.getMonth()])} <span className="muted" style=${{ fontWeight: 500 }}>${mes.getFullYear()}</span></h2>
          <${KBtn} cls="sm ghost" k="t" onClick=${irHoy}>Hoy<//>
          <button className="iconbtn" aria-label="Mes anterior" onClick=${() => cambiarMes(-1)}><${Icon} n="left" /></button>
          <button className="iconbtn" aria-label="Mes siguiente" onClick=${() => cambiarMes(1)}><${Icon} n="right" /></button>
        </div>
        <div className="cal">
          ${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => html`<div key=${d} className="dow">${d}</div>`)}
          ${dias.map((f) => { const x = porDia.get(f) || { v: [], e: [] }; const out = parseISO(f).getMonth() !== mes.getMonth(); const pend = x.v.filter((v) => v.estado !== 'visitado').length; const hechas = x.v.length - pend;
            return html`<button key=${f} className=${'day' + (out ? ' out' : '') + (f === hoy ? ' today' : '') + (f === sel ? ' sel' : '')} onClick=${() => setSel(f)} aria-label=${fmtLarga(f)}>
              <span className="dn">${parseISO(f).getDate()}</span>
              <span className="marks">
                ${pend > 0 && html`<span className="mk v"><i></i><span>${pend} ${pend === 1 ? 'visita' : 'visitas'}</span></span>`}
                ${hechas > 0 && html`<span className="mk h"><i></i><span>${hechas} hecha${hechas === 1 ? '' : 's'}</span></span>`}
                ${x.e.length > 0 && html`<span className="mk e"><i></i><span>${x.e.length} entrega${x.e.length === 1 ? '' : 's'}</span></span>`}
              </span></button>`; })}
        </div>
        <div className="row-flex wrap" style=${{ justifyContent: 'space-between' }}>
          <div className="legend"><span><i style=${{ background: 'var(--blue)' }}></i>Pendientes</span><span><i style=${{ background: 'var(--green)' }}></i>Visitadas</span><span><i style=${{ background: 'var(--orange)' }}></i>Entregas</span></div>
          <span className="small muted hint-keys row-flex" style=${{ gap: '4px' }}><${Kbd} k="left" /><${Kbd} k="right" />cambiar de día</span>
        </div>
      </div></section>
      <div className="stack">
        <${Panel} title=${tituloDia} count=${delDia.v.length || null} flush actions=${html`<${KBtn} cls="sm ghost" k="v" onClick=${() => setForm({ fecha: sel })}>Agendar<//>`}>
          ${delDia.v.length ? html`<div className="list">${delDia.v.map((v) => html`<${VisitaRow} key=${v.id} v=${v} s=${s} go=${go} onEdit=${() => setForm(v)} />`)}</div>`
          : html`<div className="li muted-row" style=${{ padding: '2px 14px' }}>Sin visitas este día.</div>`}
        <//>
        ${deRuta.length > 0 && html`<${Panel} title=${`De la ruta de los ${DIAS[selD.getDay()].toLowerCase()}`} count=${deRuta.length} flush actions=${html`<button className="btn sm primary" disabled=${busy} onClick=${() => agendar(deRuta, sel)}>Agendar todos</button>`}>
          <div className="list">${deRuta.map((c) => html`<div key=${c.id} className="li plain"><${Ico} tone=${colorFor(c.nombre)} text=${initials(c.nombre)} />
            <div className="li-main"><span className="li-t">${c.nombre}</span><span className="li-s">${c.zona || c.localidad || 'Sin zona'}</span></div>
            <button className="btn sm" disabled=${busy} onClick=${() => agendar([c], sel)}><${Icon} n="plus" s=${13} />Agendar</button></div>`)}</div>
        <//>`}
        <${Panel} title="Entregas" count=${delDia.e.length || null} flush>
          ${delDia.e.length ? html`<div className="list">${delDia.e.map((p) => html`<${PedidoRow} key=${p.id} p=${p} c=${s.calc.get(p.id)} onClick=${() => go('pedido', { id: p.id })} />`)}</div>`
          : html`<div className="li muted-row" style=${{ padding: '2px 14px' }}>Sin entregas programadas.</div>`}
        <//>
      </div>
    </div>
    ${form && html`<${VisitaForm} s=${s} init=${form} onClose=${() => setForm(null)} />`}
  <//>`;
}

/* =========================================================
   Estadísticas
   ========================================================= */
function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((es) => { const cw = Math.round(es[0].contentRect.width); if (cw > 0) setW(cw); });
    ro.observe(ref.current); return () => ro.disconnect();
  }, []);
  return [ref, w];
}
function niceStep(max, n = 4) {
  if (max <= 0) return 1;
  const raw = max / n; const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * mag >= raw) return m * mag;
  return 10 * mag;
}
const axisMoney = (v) => v === 0 ? '0' : v >= 1e6 ? nf1.format(v / 1e6) + ' M' : v >= 1e3 ? nf0.format(v / 1e3) + ' mil' : nf0.format(v);
function BarChart({ data, height = 230, labelFmt = (d) => d.label, tipFmt }) {
  const [ref, W] = useWidth();
  const [hi, setHi] = useState(-1);
  const padL = 46, padR = 6, padT = 10, padB = 24, H = height;
  const maxV = Math.max(0, ...data.map((d) => Math.max(d.value, d.value2 || 0)));
  const step = niceStep(maxV); const top = Math.max(step * 4, step);
  const ticks = [0, 1, 2, 3, 4].map((i) => i * step).filter((t) => t <= top + 1e-9);
  const iw = Math.max(10, W - padL - padR), ih = H - padT - padB;
  const bw = iw / Math.max(1, data.length);
  const y = (v) => padT + ih - (v / top) * ih;
  const every = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(iw / 52))));
  const two = data.some((d) => d.value2 != null);
  const cur = hi >= 0 ? data[hi] : null;
  return html`<div ref=${ref} style=${{ minWidth: 0 }}>
    <div className="chart-tip">${cur ? (tipFmt ? tipFmt(cur) : `${cur.label}: ${money(cur.value)}`) : html`<span className="muted">Tocá una barra para ver el detalle.</span>`}</div>
    <svg className="chart" width=${W} height=${H} viewBox=${`0 0 ${W} ${H}`} role="img" aria-label="Gráfico de barras" onMouseLeave=${() => setHi(-1)}>
      ${ticks.map((t) => html`<g key=${t}><line className="grid" x1=${padL} x2=${W - padR} y1=${y(t)} y2=${y(t)} /><text x=${padL - 6} y=${y(t) + 4} textAnchor="end">${axisMoney(t)}</text></g>`)}
      ${data.map((d, i) => {
        const x0 = padL + i * bw; const gap = Math.min(6, bw * 0.22); const w1 = two ? (bw - gap) / 2 : bw - gap;
        const h1 = Math.max(d.value > 0 ? 1.5 : 0, ih * d.value / top); const h2 = two ? Math.max(d.value2 > 0 ? 1.5 : 0, ih * (d.value2 || 0) / top) : 0;
        return html`<g key=${i} onMouseEnter=${() => setHi(i)} onClick=${() => setHi(i)} style=${{ cursor: 'pointer' }}>
          <rect x=${x0} y=${padT} width=${bw} height=${ih} fill="transparent" />
          <rect className=${'cbar' + (hi >= 0 && hi !== i ? ' dim' : '')} x=${x0 + gap / 2} y=${padT + ih - h1} width=${Math.max(1, w1)} height=${h1} rx=${Math.min(3, w1 / 3)} />
          ${two && html`<rect className="prof" x=${x0 + gap / 2 + w1} y=${padT + ih - h2} width=${Math.max(1, w1)} height=${h2} rx=${Math.min(3, w1 / 3)} opacity=${hi >= 0 && hi !== i ? 0.35 : 1} />`}
          ${i % every === 0 && html`<text x=${x0 + bw / 2} y=${H - 6} textAnchor="middle">${labelFmt(d)}</text>`}
        </g>`;
      })}
    </svg></div>`;
}
function HBars({ rows, fmt = money, kraft, sub }) {
  const max = Math.max(1e-9, ...rows.map((r) => r.value));
  return html`<div className="hbars">${rows.map((r, i) => html`<div key=${i} className="hbar"><span className="hb-l">${r.label}</span><span className="hb-v">${sub ? html`<span className="muted" style=${{ fontWeight: 500 }}>${sub(r)} · </span>` : ''}${fmt(r.value)}</span>
    <div className="hb-track"><div className=${'hb-fill' + (kraft ? ' k' : '')} style=${{ width: Math.max(1, r.value / max * 100) + '%' }}></div></div></div>`)}</div>`;
}

function rangoDe(per, desde, hasta) {
  const hoy = todayISO(); const d = parseISO(hoy);
  if (per === '7') return [addISO(hoy, -6), hoy];
  if (per === '30') return [addISO(hoy, -29), hoy];
  if (per === 'mes') return [hoy.slice(0, 8) + '01', hoy];
  if (per === 'mesant') { const a = new Date(d.getFullYear(), d.getMonth() - 1, 1); return [isoDate(a), isoDate(new Date(d.getFullYear(), d.getMonth(), 0))]; }
  if (per === 'anio') return [hoy.slice(0, 4) + '-01-01', hoy];
  return [desde || addISO(hoy, -29), hasta || hoy];
}
function Estadisticas({ s, go }) {
  const [per, setPer] = useState('30');
  const [desde, setDesde] = useState(addISO(todayISO(), -29));
  const [hasta, setHasta] = useState(todayISO());
  const [metric, setMetric] = useState('monto');
  const [a, b] = rangoDe(per, desde, hasta);
  const st = useMemo(() => {
    const nd = Math.max(1, diasEntre(a, b) + 1);
    const pa = addISO(a, -nd), pb = addISO(a, -1);
    const agg = nd > 400 ? 'mes' : nd > 62 ? 'semana' : 'dia';
    const keyOf = (f) => agg === 'dia' ? f : agg === 'semana' ? isoDate(startOfWeek(parseISO(f))) : f.slice(0, 7);
    const buckets = new Map();
    for (let f = a; f <= b; f = addISO(f, 1)) { const k = keyOf(f); if (!buckets.has(k)) buckets.set(k, { key: k, value: 0, value2: 0, n: 0 }); }
    let ventas = 0, gan = 0, n = 0, uni = 0, pv = 0, pg = 0, pn = 0, cobrado = 0;
    const clis = new Set(); const prods = new Map(); const clientes = new Map(); const cats = new Map(); const dow = Array.from({ length: 7 }, () => 0);
    for (const p of s.pedidos) {
      const c = s.calc.get(p.id);
      for (const pg2 of p.pagos || []) if (pg2.fecha >= a && pg2.fecha <= b) cobrado += Number(pg2.monto) || 0;
      if (!c.cuenta) continue;
      if (p.fecha >= pa && p.fecha <= pb) { pv += c.total; pg += c.ganancia; pn++; }
      if (p.fecha < a || p.fecha > b) continue;
      ventas += c.total; gan += c.ganancia; n++; uni += c.unidades; if (p.clienteId) clis.add(p.clienteId);
      const bk = buckets.get(keyOf(p.fecha)); if (bk) { bk.value += c.total; bk.value2 += c.ganancia; bk.n++; }
      dow[(parseISO(p.fecha).getDay() + 6) % 7] += c.total;
      const ck = p.clienteId || '_cf'; const cx = clientes.get(ck) || { label: (p.clienteSnap || {}).nombre || 'Consumidor final', value: 0, n: 0, id: p.clienteId }; cx.value += c.total; cx.n++; clientes.set(ck, cx);
      const f = c.subtotal > 0 ? c.neto / c.subtotal : 1;
      for (const it of p.items || []) {
        const k = it.pid || it.nombre; const sub = lineaSub(it) * f; const cst = (Number(it.cant) || 0) * (Number(it.costo) || 0);
        const x = prods.get(k) || { label: it.nombre, value: 0, cant: 0, gan: 0 }; x.value += sub; x.cant += Number(it.cant) || 0; x.gan += sub - cst; prods.set(k, x);
        const pr = it.pid ? s.prodMap.get(it.pid) : null; const cat = (pr && pr.categoria) || 'Sin categoría';
        cats.set(cat, (cats.get(cat) || 0) + sub);
      }
    }
    const hoy = todayISO(); const aging = [0, 0, 0, 0]; let porCobrar = 0;
    for (const p of s.pedidos) { const c = s.calc.get(p.id); if (c.saldo <= 0.009) continue; porCobrar += c.saldo; const dd = diasEntre(p.fecha, hoy); aging[dd <= 7 ? 0 : dd <= 30 ? 1 : dd <= 60 ? 2 : 3] += c.saldo; }
    const vis = s.visitas.filter((v) => v.fecha >= a && v.fecha <= b && v.fecha <= hoy);
    const dIn = Number(s.config.diasInactivo) || 30;
    const inactivos = s.clientes.filter((c) => c.activo !== false).map((c) => ({ c, st: s.cliStats.get(c.id) })).filter((x) => x.st && x.st.ultima && diasEntre(x.st.ultima, hoy) > dIn).sort((x, y) => x.st.ultima.localeCompare(y.st.ultima));
    const vendidos = new Set([...prods.keys()]);
    const sinVenta = s.productos.filter((p) => p.activo !== false && !vendidos.has(p.id)).length;
    return {
      nd, agg, serie: [...buckets.values()], ventas, gan, n, uni, clis: clis.size, cobrado, porCobrar, aging,
      trendV: pv > 0 ? (ventas - pv) / pv * 100 : null, trendG: pg > 0 ? (gan - pg) / pg * 100 : null, trendN: pn > 0 ? (n - pn) / pn * 100 : null,
      topP: [...prods.values()].sort((x, y) => (metric === 'cant' ? y.cant - x.cant : metric === 'gan' ? y.gan - x.gan : y.value - x.value)).slice(0, 10),
      topC: [...clientes.values()].sort((x, y) => y.value - x.value).slice(0, 10),
      cats: [...cats.entries()].map(([label, value]) => ({ label, value })).sort((x, y) => y.value - x.value),
      dow: dow.map((value, i) => ({ label: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i], value })),
      vis: { tot: vis.length, hechas: vis.filter((v) => v.estado === 'visitado').length, ped: vis.filter((v) => v.pedidoId).length },
      inactivos, sinVenta,
    };
  }, [s.version, a, b, metric]);
  const PERS = [['7', '7 días'], ['30', '30 días'], ['mes', 'Este mes'], ['mesant', 'Mes pasado'], ['anio', 'Este año'], ['custom', 'Elegir fechas']];
  useCtx('Estadísticas', PERS.map(([v, l], i) => ({ id: 'per-' + v, title: 'Período: ' + l, icon: 'calendar', key: String(i + 1), run: () => setPer(v) })));
  const lbl = (d) => st.agg === 'dia' ? (st.nd > 14 ? String(parseISO(d.key).getDate()) : fmtDia(d.key)) : st.agg === 'semana' ? fmtCorta(d.key).slice(0, 5) : cap(MESES[Number(d.key.slice(5, 7)) - 1].slice(0, 3));
  const tip = (d) => html`<b>${st.agg === 'dia' ? cap(fmtLarga(d.key)) : st.agg === 'semana' ? 'Semana del ' + fmtCorta(d.key) : cap(MESES[Number(d.key.slice(5, 7)) - 1]) + ' ' + d.key.slice(0, 4)}</b> · ventas ${money(d.value)} · ganancia ${money(d.value2)} · ${d.n} pedidos`;
  const totCat = st.cats.reduce((x, c) => x + c.value, 0) || 1;
  return html`<${Fragment}>
    <${PageHead} title="Estadísticas" sub=${`Del ${fmtCorta(a)} al ${fmtCorta(b)} · ${st.nd} días`} />
    <div className="row-flex wrap">
      <${Seg} value=${per} onChange=${setPer} options=${[{ v: '7', l: '7 días' }, { v: '30', l: '30 días' }, { v: 'mes', l: 'Este mes' }, { v: 'mesant', l: 'Mes pasado' }, { v: 'anio', l: 'Este año' }, { v: 'custom', l: 'Elegir' }]} />
      ${per === 'custom' && html`<div className="row-flex"><input type="date" className="input" style=${{ width: 'auto' }} value=${desde} max=${hasta} onChange=${(e) => setDesde(e.target.value)} aria-label="Desde" /><span className="muted">a</span><input type="date" className="input" style=${{ width: 'auto' }} value=${hasta} min=${desde} onChange=${(e) => setHasta(e.target.value)} aria-label="Hasta" /></div>`}
    </div>
    <div className="kpis k6">
      <${Kpi} hl label="Ventas" value=${moneyK(st.ventas)} trend=${st.trendV} sub="vs. período anterior" />
      <${Kpi} label="Ganancia bruta" value=${moneyK(st.gan)} trend=${st.trendG} sub=${'margen ' + pct(st.ventas > 0 ? st.gan / st.ventas * 100 : 0)} />
      <${Kpi} label="Pedidos" value=${nf0.format(st.n)} trend=${st.trendN} sub=${qty(st.uni) + ' unidades'} />
      <${Kpi} label="Ticket promedio" value=${moneyK(st.n ? st.ventas / st.n : 0)} sub=${st.clis + ' clientes compraron'} />
      <${Kpi} label="Cobrado" value=${moneyK(st.cobrado)} sub="en el período" />
      <${Kpi} label="Por cobrar" value=${moneyK(st.porCobrar)} sub="saldo total hoy" onClick=${() => go('clientes', { filtro: 'deuda' })} />
    </div>
    <${Panel} title=${st.agg === 'dia' ? 'Ventas por día' : st.agg === 'semana' ? 'Ventas por semana' : 'Ventas por mes'} actions=${html`<div className="legend"><span><i style=${{ background: 'var(--blue)' }}></i>Ventas</span><span><i style=${{ background: 'var(--green)' }}></i>Ganancia</span></div>`}>
      ${st.n ? html`<${BarChart} data=${st.serie} labelFmt=${lbl} tipFmt=${tip} />` : html`<${Empty} icon="chart" title="Sin ventas en este período" sub="Los pedidos confirmados, en armado, listos y entregados cuentan como venta." />`}
    <//>
    <div className="cols c-1-1">
      <${Panel} title="Productos más vendidos" actions=${html`<${Seg} value=${metric} onChange=${setMetric} options=${[{ v: 'monto', l: '$' }, { v: 'cant', l: 'Unid.' }, { v: 'gan', l: 'Ganancia' }]} />`}>
        ${st.topP.length ? html`<${HBars} rows=${st.topP.map((p) => ({ ...p, value: metric === 'cant' ? p.cant : metric === 'gan' ? p.gan : p.value }))} fmt=${metric === 'cant' ? (v) => qty(v) + ' u.' : moneyK} sub=${metric === 'monto' ? (r) => qty(r.cant) + ' u.' : null} />` : html`<p className="muted small">Sin ventas en el período.</p>`}
        ${st.sinVenta > 0 && html`<p className="small muted" style=${{ marginTop: '12px' }}>${st.sinVenta} productos activos no se vendieron en este período.</p>`}
      <//>
      <${Panel} title="Mejores clientes">
        ${st.topC.length ? html`<div className="hbars">${st.topC.map((c, i) => html`<button key=${i} className="hbar" style=${{ background: 'none', border: 0, padding: 0, textAlign: 'left', color: 'inherit', cursor: c.id ? 'pointer' : 'default' }} onClick=${() => c.id && go('cliente', { id: c.id })}>
          <span className="hb-l">${c.label}</span><span className="hb-v"><span className="muted" style=${{ fontWeight: 500 }}>${c.n} ped. · </span>${moneyK(c.value)}</span>
          <div className="hb-track"><div className="hb-fill k" style=${{ width: Math.max(1, c.value / st.topC[0].value * 100) + '%' }}></div></div></button>`)}</div>` : html`<p className="muted small">Sin ventas en el período.</p>`}
      <//>
      <${Panel} title="Ventas por categoría">
        ${st.cats.length ? html`<${HBars} rows=${st.cats.slice(0, 10)} fmt=${moneyK} sub=${(r) => pct(r.value / totCat * 100)} />` : html`<p className="muted small">Sin datos.</p>`}
      <//>
      <${Panel} title="Ventas por día de la semana">
        ${st.n ? html`<${BarChart} data=${st.dow} height=${190} tipFmt=${(d) => html`<b>${d.label}</b> · ${money(d.value)}`} />` : html`<p className="muted small">Sin datos.</p>`}
      <//>
      <${Panel} title="Antigüedad de la deuda">
        ${st.porCobrar > 0 ? html`<${HBars} kraft rows=${[{ label: 'Hasta 7 días', value: st.aging[0] }, { label: '8 a 30 días', value: st.aging[1] }, { label: '31 a 60 días', value: st.aging[2] }, { label: 'Más de 60 días', value: st.aging[3] }]} fmt=${money} />`
        : html`<p className="muted small">Nadie te debe. Todo cobrado.</p>`}
      <//>
      <${Panel} title="Visitas del período">
        <dl className="dl">
          <dt>Agendadas</dt><dd className="num strong">${st.vis.tot}</dd>
          <dt>Visitadas</dt><dd className="num">${st.vis.hechas} ${st.vis.tot ? html`<span className="muted">(${pct(st.vis.hechas / st.vis.tot * 100)})</span>` : ''}</dd>
          <dt>Con pedido</dt><dd className="num">${st.vis.ped} ${st.vis.tot ? html`<span className="muted">(${pct(st.vis.ped / st.vis.tot * 100)} de efectividad)</span>` : ''}</dd>
        </dl>
      <//>
    </div>
    <${Panel} title=${`Clientes que no compran hace más de ${Number(s.config.diasInactivo) || 30} días`} flush>
      ${st.inactivos.length ? html`<div className="list">${st.inactivos.slice(0, 15).map(({ c, st: cs }) => html`<button key=${c.id} className="li" onClick=${() => go('cliente', { id: c.id })}>
        <div className="avatar">${initials(c.nombre)}</div>
        <div className="li-main"><span className="li-t">${c.nombre}</span><span className="li-s">Última compra ${fmtCorta(cs.ultima)} · compró ${moneyK(cs.total)} en total</span></div>
        <${Pill} tone="t-warn">${haceTxt(cs.ultima)}<//></button>`)}</div>` : html`<div className="li muted small">Todos tus clientes compraron en los últimos ${Number(s.config.diasInactivo) || 30} días.</div>`}
    <//>
  <//>`;
}

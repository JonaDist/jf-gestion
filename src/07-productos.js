/* =========================================================
   Productos: catálogo, precios, stock, importación
   ========================================================= */
function ProductoForm({ s, init, onClose, onSaved }) {
  const editing = init && init.id;
  const [p, setP] = useState(() => ({ codigo: '', nombre: '', categoria: '', marca: '', unidad: 'Unidad', porBulto: 1, costo: 0, precio: 0, pvp: 0, stock: 0, stockMin: 0, activo: true, ...(init || {}) }));
  const [rec, setRec] = useState(() => round2(recargoDe(Number(init && init.costo) || 0, Number(init && init.precio) || 0)));
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setP((x) => ({ ...x, [k]: e && e.target ? e.target.value : e }));
  const setCosto = (v) => setP((x) => ({ ...x, costo: v, precio: rec > 0 ? round2(v * (1 + rec / 100)) : x.precio }));
  const setPrecio = (v) => { setP((x) => ({ ...x, precio: v })); setRec(round2(recargoDe(p.costo, v))); };
  const setRecargo = (v) => { setRec(v); setP((x) => ({ ...x, precio: round2(x.costo * (1 + v / 100)) })); };
  const dupCod = p.codigo && s.productos.find((x) => x.id !== p.id && x.codigo && norm(x.codigo) === norm(p.codigo));
  const ok = async () => {
    if (busy) return;
    if (!p.nombre.trim()) { toast('Poné el nombre del producto.', { tone: 'bad' }); return; }
    if (dupCod) { toast(`El código ${p.codigo} ya lo usa “${dupCod.nombre}”.`, { tone: 'bad' }); return; }
    setBusy(true);
    const body = { ...p, nombre: p.nombre.trim(), codigo: String(p.codigo || '').trim(), porBulto: Math.max(1, Number(p.porBulto) || 1) };
    try { const id = await put('productos', body); toast(editing ? 'Producto actualizado' : 'Producto agregado'); onSaved ? onSaved(id, body) : onClose(); }
    catch (e) { setBusy(false); }
  };
  const gan = round2(p.precio - p.costo);
  const eliminar = async () => {
    const ok = await confirmar({ title: 'Eliminar ' + p.nombre, message: 'Sale del catálogo. Los pedidos donde ya se vendió lo conservan. Si solo no lo vendés más, desactivalo.', okLabel: 'Eliminar', danger: true });
    if (!ok) return;
    try { await del('productos', p.id); toast('Producto eliminado'); onClose(); } catch (e) { /* aviso mostrado */ }
  };
  return html`<${Modal} title=${editing ? 'Editar producto' : 'Nuevo producto'} onClose=${onClose} onSubmit=${ok} footer=${html`${editing && html`<button className="btn ghost danger" onClick=${eliminar}><${Icon} n="trash" s=${15} />Eliminar</button>`}<button className="btn ghost" onClick=${onClose}>Cancelar</button><button className="btn primary" disabled=${busy} onClick=${ok}>${editing ? 'Guardar' : 'Agregar producto'}</button>`}>
    <div className="grid3">
      <${Field} label="Código" id="pr-cod" hint=${dupCod ? html`<span className="bad-t">Ya existe</span>` : 'SKU o código de barras'}><input id="pr-cod" className="input mono" value=${p.codigo} onChange=${set('codigo')} placeholder="7790895000997" /><//>
      <${Field} label="Nombre *" id="pr-nom" cls="span2"><input id="pr-nom" className="input" value=${p.nombre} onChange=${set('nombre')} placeholder="Ej.: Coca-Cola 2,25 L" autoFocus=${!editing} /><//>
    </div>
    <div className="grid2">
      <${Field} label="Categoría" id="pr-cat"><input id="pr-cat" className="input" list="dl-cat" value=${p.categoria} onChange=${set('categoria')} placeholder="Ej.: Bebidas" /><datalist id="dl-cat">${s.cats.map((x) => html`<option key=${x} value=${x} />`)}</datalist><//>
      <${Field} label="Marca / proveedor" id="pr-mar"><input id="pr-mar" className="input" list="dl-mar" value=${p.marca} onChange=${set('marca')} /><datalist id="dl-mar">${s.marcas.map((x) => html`<option key=${x} value=${x} />`)}</datalist><//>
    </div>
    <div className="grid2">
      <${Field} label="Se vende por" id="pr-uni"><select id="pr-uni" className="select" value=${p.unidad} onChange=${set('unidad')}>${UNIDADES.map((u) => html`<option key=${u} value=${u}>${u}</option>`)}</select><//>
      <${Field} label="Unidades por bulto" id="pr-bul" hint="Para sumar de a un bulto al armar."><${NumInput} id="pr-bul" value=${p.porBulto} decimals=${0} onChange=${(v) => setP((x) => ({ ...x, porBulto: v }))} /><//>
    </div>
    <hr className="hr" />
    <div className="grid3">
      <${Field} label="Costo" id="pr-costo"><${NumInput} id="pr-costo" value=${p.costo} prefix="$" onChange=${setCosto} /><//>
      <${Field} label="Recargo" id="pr-rec"><${NumInput} id="pr-rec" value=${rec} suffix="%" onChange=${setRecargo} /><//>
      <${Field} label="Precio de venta" id="pr-precio"><${NumInput} id="pr-precio" value=${p.precio} prefix="$" onChange=${setPrecio} /><//>
    </div>
    <div className=${'banner ' + (gan >= 0 ? 'info' : 'warn')}><${Icon} n="percent" s=${15} /><span className="grow">Ganás <b>${money(gan)}</b> por ${(p.unidad || 'unidad').toLowerCase()} · margen sobre la venta ${pct(margenDe(p.costo, p.precio))}</span></div>
    <div className="grid3">
      <${Field} label="Precio sugerido al público" id="pr-pvp" hint="Opcional. Para el comercio."><${NumInput} id="pr-pvp" value=${p.pvp} prefix="$" placeholder="0" onChange=${(v) => setP((x) => ({ ...x, pvp: v }))} /><//>
      <${Field} label="Stock actual" id="pr-stock"><${NumInput} id="pr-stock" value=${p.stock} decimals=${3} onChange=${(v) => setP((x) => ({ ...x, stock: v }))} /><//>
      <${Field} label="Stock mínimo" id="pr-min" hint="Avisa cuando baja de acá."><${NumInput} id="pr-min" value=${p.stockMin} placeholder="0" decimals=${3} onChange=${(v) => setP((x) => ({ ...x, stockMin: v }))} /><//>
    </div>
    ${editing && html`<${Toggle} id="pr-activo" checked=${p.activo !== false} onChange=${(v) => setP((x) => ({ ...x, activo: v }))} label="Disponible para la venta" />`}
  <//>`;
}

function StockModal({ p, onClose }) {
  const [modo, setModo] = useState('sumar');
  const [n, setN] = useState(0);
  const [busy, setBusy] = useState(false);
  const actual = Number(p.stock) || 0;
  const nuevo = modo === 'sumar' ? actual + n : modo === 'restar' ? actual - n : n;
  const ok = async () => { setBusy(true); try { await put('productos', { ...p, stock: round2(nuevo) }); toast(`Stock de ${p.nombre}: ${qty(nuevo)}`); onClose(); } catch (e) { setBusy(false); } };
  return html`<${Modal} title="Ajustar stock" onClose=${onClose} onSubmit=${ok} footer=${html`<button className="btn ghost" onClick=${onClose}>Cancelar</button><button className="btn primary" disabled=${busy} onClick=${ok}>Guardar</button>`}>
    <div className="row-flex"><${Ico} n="box" tone=${colorFor(p.categoria || 'x')} lg /><div><div className="strong">${p.nombre}</div><div className="small muted">Stock actual: ${qty(actual)}</div></div></div>
    <${Seg} value=${modo} onChange=${setModo} options=${[{ v: 'sumar', l: 'Entró mercadería' }, { v: 'restar', l: 'Salió / rotura' }, { v: 'fijar', l: 'Conteo real' }]} />
    <${Field} label=${modo === 'fijar' ? 'Cantidad contada' : 'Cantidad'} id="st-n"><${NumInput} id="st-n" value=${n} decimals=${3} autoFocus onChange=${setN} /><//>
    <div className="banner info"><${Icon} n="box" s=${15} /><span className="grow">Queda en <b>${qty(nuevo)}</b></span></div>
  <//>`;
}

function PreciosModal({ s, onClose }) {
  const [alcance, setAlcance] = useState('todos');
  const [valor, setValor] = useState('');
  const [campo, setCampo] = useState('costo-precio');
  const [porc, setPorc] = useState(10);
  const [redondeo, setRedondeo] = useState(10);
  const [busy, setBusy] = useState(null);
  const opciones = alcance === 'categoria' ? s.cats : alcance === 'marca' ? s.marcas : [];
  const afectados = s.productos.filter((p) => alcance === 'todos' || (alcance === 'categoria' && p.categoria === valor) || (alcance === 'marca' && p.marca === valor));
  const red = (v) => redondeo > 0 ? Math.round(v / redondeo) * redondeo : round2(v);
  const aplicar = (p) => {
    const f = 1 + porc / 100; const o = { ...p };
    if (campo === 'costo-precio') { o.costo = round2((Number(p.costo) || 0) * f); const r = recargoDe(Number(p.costo) || 0, Number(p.precio) || 0); o.precio = red(o.costo * (1 + r / 100)); }
    else if (campo === 'precio') o.precio = red((Number(p.precio) || 0) * f);
    else if (campo === 'costo') o.costo = round2((Number(p.costo) || 0) * f);
    else if (campo === 'pvp') o.pvp = red((Number(p.pvp) || 0) * f);
    return o;
  };
  const ej = afectados[0] ? aplicar(afectados[0]) : null;
  const ok = async () => {
    if (!afectados.length) return;
    const go = await confirmar({ title: `Actualizar ${afectados.length} productos`, message: `${porc >= 0 ? 'Subir' : 'Bajar'} ${pct(Math.abs(porc))}. No se puede deshacer automáticamente.`, okLabel: 'Actualizar' });
    if (!go) return;
    setBusy('0/' + afectados.length);
    const errs = await runPool(afectados.map((p) => () => put('productos', aplicar(p))), 4, (d, t) => setBusy(d + '/' + t));
    toast(errs.length ? `Listo, con ${errs.length} errores. Revisá y repetí si hace falta.` : `${afectados.length} productos actualizados`, { tone: errs.length ? 'bad' : '' });
    onClose();
  };
  return html`<${Modal} title="Actualizar precios por porcentaje" onClose=${onClose} onSubmit=${() => { if (!busy && afectados.length && porc) ok(); }} footer=${html`<button className="btn ghost" onClick=${onClose}>Cancelar</button><button className="btn primary" disabled=${!!busy || !afectados.length || !porc} onClick=${ok}><${Icon} n="percent" s=${15} />${busy ? 'Actualizando ' + busy : `Actualizar ${afectados.length}`}</button>`}>
    <${Field} label="¿A qué productos?"><${Seg} value=${alcance} onChange=${(v) => { setAlcance(v); setValor(''); }} options=${[{ v: 'todos', l: 'Todos' }, { v: 'categoria', l: 'Una categoría' }, { v: 'marca', l: 'Una marca' }]} /><//>
    ${alcance !== 'todos' && html`<select className="select" value=${valor} onChange=${(e) => setValor(e.target.value)} aria-label="Elegir"><option value="">Elegí ${alcance === 'categoria' ? 'la categoría' : 'la marca'}</option>${opciones.map((o) => html`<option key=${o} value=${o}>${o}</option>`)}</select>`}
    <${Field} label="¿Qué cambia?" id="pm-campo"><select id="pm-campo" className="select" value=${campo} onChange=${(e) => setCampo(e.target.value)}>
      <option value="costo-precio">Aumento del proveedor: costo y precio (mantiene el recargo)</option>
      <option value="precio">Solo el precio de venta</option><option value="costo">Solo el costo</option><option value="pvp">Solo el precio sugerido al público</option></select><//>
    <div className="grid2">
      <${Field} label="Porcentaje" id="pm-porc" hint="Negativo para bajar."><${NumInput} id="pm-porc" value=${porc} suffix="%" onChange=${setPorc} /><//>
      <${Field} label="Redondear precios" id="pm-red"><select id="pm-red" className="select" value=${redondeo} onChange=${(e) => setRedondeo(Number(e.target.value))}>
        <option value="0">Sin redondeo</option><option value="10">A $10</option><option value="50">A $50</option><option value="100">A $100</option></select><//>
    </div>
    ${ej && html`<div className="banner info small"><${Icon} n="sparkle" s=${15} /><span className="grow">Ejemplo · ${afectados[0].nombre}: costo ${money(afectados[0].costo)} → <b>${money(ej.costo)}</b>, precio ${money(afectados[0].precio)} → <b>${money(ej.precio)}</b></span></div>`}
  <//>`;
}

const IMPORT_COLS = { codigo: ['codigo', 'cod', 'sku', 'ean', 'barras', 'codigo de barras'], nombre: ['nombre', 'producto', 'descripcion', 'articulo', 'detalle'], categoria: ['categoria', 'rubro', 'familia'], marca: ['marca', 'proveedor'], unidad: ['unidad', 'presentacion'], porBulto: ['bulto', 'por bulto', 'unidades por bulto', 'x bulto'], costo: ['costo', 'precio costo', 'compra', 'precio de compra'], precio: ['precio', 'venta', 'precio venta', 'precio de venta', 'mayorista'], pvp: ['pvp', 'sugerido', 'publico', 'precio publico'], stock: ['stock', 'cantidad', 'existencia'], stockMin: ['minimo', 'stock minimo'] };
function detectarColumnas(head) {
  const map = {};
  head.forEach((h, i) => {
    const n = norm(h);
    for (const [k, alias] of Object.entries(IMPORT_COLS)) { if (map[k] == null && alias.some((a) => n === a)) { map[k] = i; return; } }
    for (const [k, alias] of Object.entries(IMPORT_COLS)) { if (map[k] == null && alias.some((a) => n.includes(a))) { map[k] = i; return; } }
  });
  return map;
}
function ImportarModal({ s, onClose }) {
  const [txt, setTxt] = useState('');
  const [actualizar, setActualizar] = useState(true);
  const [busy, setBusy] = useState(null);
  const rows = useMemo(() => parseCSV(txt), [txt]);
  const map = rows.length ? detectarColumnas(rows[0]) : {};
  const conHeader = map.nombre != null;
  const cols = conHeader ? map : { codigo: 0, nombre: 1, categoria: 2, costo: 3, precio: 4, stock: 5 };
  const datos = (conHeader ? rows.slice(1) : rows).map((r) => {
    const g = (k) => cols[k] != null ? r[cols[k]] : undefined;
    const o = { nombre: (g('nombre') || '').trim() };
    if (g('codigo') != null) o.codigo = String(g('codigo')).trim();
    for (const k of ['categoria', 'marca', 'unidad']) if (g(k)) o[k] = g(k).trim();
    for (const k of ['costo', 'precio', 'pvp', 'stock', 'stockMin', 'porBulto']) if (g(k) != null && g(k) !== '') o[k] = parseNum(g(k));
    return o;
  }).filter((o) => o.nombre);
  const porCod = new Map(s.productos.filter((p) => p.codigo).map((p) => [norm(p.codigo), p]));
  const nuevos = datos.filter((d) => !(d.codigo && porCod.has(norm(d.codigo))));
  const existentes = datos.length - nuevos.length;
  const leer = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => setTxt(String(r.result || '')); r.readAsText(f, 'utf-8'); };
  const ok = async () => {
    const tareas = [];
    for (const d of datos) {
      const ex = d.codigo ? porCod.get(norm(d.codigo)) : null;
      if (ex) { if (actualizar) tareas.push(() => put('productos', { ...ex, ...d })); }
      else tareas.push(() => put('productos', { codigo: '', categoria: '', marca: '', unidad: 'Unidad', porBulto: 1, costo: 0, precio: 0, pvp: 0, stock: 0, stockMin: 0, activo: true, ...d }));
    }
    if (!tareas.length) { toast('No hay nada para importar.', { tone: 'bad' }); return; }
    setBusy('0/' + tareas.length);
    const errs = await runPool(tareas, 4, (a, t) => setBusy(a + '/' + t));
    toast(errs.length ? `Importación con ${errs.length} errores.` : `${tareas.length} productos importados`, { tone: errs.length ? 'bad' : '' });
    onClose();
  };
  const campos = Object.keys(IMPORT_COLS).filter((k) => cols[k] != null);
  const ETQ = { codigo: 'Código', nombre: 'Nombre', categoria: 'Categoría', marca: 'Marca', unidad: 'Unidad', porBulto: 'Bulto', costo: 'Costo', precio: 'Precio', pvp: 'PVP', stock: 'Stock', stockMin: 'Mínimo' };
  return html`<${Modal} wide title="Importar productos desde Excel" onClose=${onClose} onSubmit=${() => { if (!busy && datos.length) ok(); }} footer=${html`<button className="btn ghost" onClick=${onClose}>Cancelar</button><button className="btn primary" disabled=${!!busy || !datos.length} onClick=${ok}><${Icon} n="upload" s=${15} />${busy ? 'Importando ' + busy : `Importar ${datos.length ? (actualizar ? datos.length : nuevos.length) : ''}`}</button>`}>
    <p className="soft small">Copiá las filas desde Excel o Google Sheets (con la fila de títulos) y pegalas acá, o elegí un archivo CSV. Se reconocen columnas como <b>Código, Nombre, Categoría, Marca, Costo, Precio, PVP, Stock</b>.</p>
    <textarea className="textarea mono" style=${{ minHeight: '150px', fontSize: '12.5px' }} placeholder=${'Código\tNombre\tCategoría\tCosto\tPrecio\tStock\n7790895000997\tCoca-Cola 2,25 L\tBebidas\t1850\t2450\t48'} value=${txt} onChange=${(e) => setTxt(e.target.value)}></textarea>
    <div className="row-flex wrap"><label className="btn sm" htmlFor="imp-file"><${Icon} n="file" s=${14} />Elegir archivo CSV</label><input id="imp-file" type="file" accept=".csv,.txt,.tsv,text/csv,text/plain" className="sr" onChange=${leer} />
      ${datos.length > 0 && html`<span className="small soft">${datos.length} filas · ${nuevos.length} nuevos · ${existentes} ya existen (por código)</span>`}</div>
    ${existentes > 0 && html`<${Toggle} id="imp-upd" checked=${actualizar} onChange=${setActualizar} label="Actualizar los productos que ya existen con el mismo código" />`}
    ${datos.length > 0 && html`<div className="panel tbl-wrap"><table className="tbl"><thead><tr>${campos.map((k) => html`<th key=${k} className=${['costo', 'precio', 'pvp', 'stock', 'stockMin', 'porBulto'].includes(k) ? 'r' : ''}>${ETQ[k]}</th>`)}</tr></thead>
      <tbody>${datos.slice(0, 6).map((d, i) => html`<tr key=${i}>${campos.map((k) => html`<td key=${k} className=${['costo', 'precio', 'pvp'].includes(k) ? 'r' : ['stock', 'stockMin', 'porBulto'].includes(k) ? 'r' : ''}>${['costo', 'precio', 'pvp'].includes(k) ? money(d[k]) : ['stock', 'stockMin', 'porBulto'].includes(k) ? qty(d[k]) : (d[k] || '')}</td>`)}</tr>`)}</tbody></table>
      ${datos.length > 6 && html`<div className="li muted small">y ${datos.length - 6} filas más…</div>`}</div>`}
    ${rows.length > 0 && !conHeader && html`<div className="banner warn small"><${Icon} n="alert" s=${15} /><span className="grow">No encontré la fila de títulos. Uso el orden: Código, Nombre, Categoría, Costo, Precio, Stock.</span></div>`}
  <//>`;
}

function Productos({ s, go, params }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [f, setF] = useState(params.filtro || 'todos');
  const [modal, setModal] = useState(() => { const pr = params.open ? s.prodMap.get(params.open) : null; return pr ? { t: 'form', p: pr } : null; });
  const [limit, setLimit] = useState(150);
  const test = { todos: (p) => p.activo !== false, bajo: stockBajo, sin: (p) => p.activo !== false && (Number(p.stock) || 0) <= 0, margen: (p) => p.activo !== false && margenDe(Number(p.costo) || 0, Number(p.precio) || 0) < 10, inactivos: (p) => p.activo === false };
  const base = s.productos.filter((p) => (!cat || p.categoria === cat) && matches(q, p.nombre, p.codigo, p.marca, p.categoria));
  const lista = base.filter(test[f] || test.todos);
  const inv = useMemo(() => { let c = 0, v = 0; for (const p of s.productos) { if (p.activo === false) continue; const st = Math.max(0, Number(p.stock) || 0); c += st * (Number(p.costo) || 0); v += st * (Number(p.precio) || 0); } return { c, v }; }, [s.version]);
  const exportar = () => guardarArchivo('productos-jf.csv', toCSV([['Código', 'Nombre', 'Categoría', 'Marca', 'Unidad', 'Por bulto', 'Costo', 'Precio', 'PVP', 'Margen %', 'Stock', 'Stock mínimo', 'Activo'],
    ...lista.map((p) => [p.codigo, p.nombre, p.categoria, p.marca, p.unidad, p.porBulto || 1, csvNum(p.costo), csvNum(p.precio), csvNum(p.pvp || 0), csvNum(margenDe(Number(p.costo) || 0, Number(p.precio) || 0)), csvNum(p.stock || 0), csvNum(p.stockMin || 0), p.activo === false ? 'No' : 'Sí'])]));
  const stockCls = (p) => { const st = Number(p.stock) || 0; return st <= 0 ? 't-bad' : stockBajo(p) ? 't-warn' : ''; };
  useCtx('Productos', [
    { id: 'ad', title: 'Agregar producto', icon: 'box', tone: 'c-orange', key: 'a', primary: true, run: () => setModal({ t: 'form', p: {} }) },
    { id: 'im', title: 'Importar productos desde Excel', icon: 'upload', tone: 'c-orange', key: 'i', run: () => setModal({ t: 'importar' }) },
    s.productos.length ? { id: 'pr', title: 'Actualizar precios por porcentaje', icon: 'percent', tone: 'c-orange', key: 'p', run: () => setModal({ t: 'precios' }) } : null,
    { id: 'fb', title: 'Ver productos con stock bajo', icon: 'alert', tone: 'c-yellow', run: () => setF('bajo') },
    lista.length ? { id: 'ex', title: 'Exportar catálogo a CSV', icon: 'download', run: exportar } : null,
  ]);
  const meta = (p) => [p.categoria, p.marca, p.unidad && p.unidad !== 'Unidad' ? p.unidad + (p.porBulto > 1 ? ' x' + p.porBulto : '') : (p.porBulto > 1 ? 'bulto x' + p.porBulto : '')].filter(Boolean).join(' · ');
  return html`<${Fragment}>
    <${PageHead} title="Productos" sub=${`${s.productos.filter((p) => p.activo !== false).length} activos · inventario ${moneyK(inv.c)} al costo · ${moneyK(inv.v)} a precio de venta`}
      actions=${html`<${KBtn} cls="desk-only" icon="upload" k="i" onClick=${() => setModal({ t: 'importar' })}>Importar<//>
        <${KBtn} cls="desk-only" icon="percent" k="p" onClick=${() => setModal({ t: 'precios' })} disabled=${!s.productos.length}>Precios<//>
        <button className="btn icon desk-only" title="Exportar a CSV" aria-label="Exportar a CSV" onClick=${exportar} disabled=${!lista.length}><${Icon} n="download" s=${15} /></button>
        <${KBtn} cls="primary" icon="plus" k="a" onClick=${() => setModal({ t: 'form', p: {} })}>Producto<//>`} />
    <div className="row-flex wrap">
      <${Search} page value=${q} onChange=${setQ} placeholder="Buscar por nombre, código o marca" />
      ${s.cats.length > 0 && html`<select className="select" style=${{ width: 'auto', flex: '0 1 210px' }} value=${cat} onChange=${(e) => setCat(e.target.value)} aria-label="Filtrar por categoría"><option value="">Todas las categorías</option>${s.cats.map((c) => html`<option key=${c} value=${c}>${c}</option>`)}</select>`}
    </div>
    <${Chips} value=${f} onChange=${setF} options=${[['todos', 'Activos'], ['bajo', 'Stock bajo'], ['sin', 'Sin stock'], ['margen', 'Margen menor a 10%'], ['inactivos', 'Inactivos']].map(([v, l]) => ({ v, l, ct: base.filter(test[v]).length }))} />
    ${lista.length === 0 ? html`<div className="panel"><${Empty} icon="box" title=${s.productos.length ? 'Ningún producto con estos filtros' : 'Tu catálogo está vacío'} sub=${s.productos.length ? 'Probá con otra búsqueda.' : 'Cargalos de a uno o pegá tu lista de precios desde Excel.'}>
        ${!s.productos.length && html`<${KBtn} cls="primary" icon="plus" k="a" onClick=${() => setModal({ t: 'form', p: {} })}>Agregar producto<//><${KBtn} icon="upload" k="i" onClick=${() => setModal({ t: 'importar' })}>Importar desde Excel<//>`}<//></div>`
    : html`
      <div className="panel tbl-desk"><div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Producto</th><th>Código</th><th className="r">Costo</th><th className="r">Precio</th><th className="r">Margen</th><th className="r">PVP</th><th className="r">Stock</th><th></th></tr></thead>
        <tbody>${lista.slice(0, limit).map((p) => { const m = margenDe(Number(p.costo) || 0, Number(p.precio) || 0); return html`<tr key=${p.id} data-row="" tabIndex="0" onClick=${() => setModal({ t: 'form', p })}>
          <td><div className="row-flex"><${Ico} n="box" tone=${colorFor(p.categoria || 'x')} /><div style=${{ minWidth: 0 }}><div className="cell-t ellipsis">${p.nombre}</div><div className="tiny muted ellipsis">${meta(p) || '—'}</div></div></div></td>
          <td className="mono muted">${p.codigo || '—'}</td>
          <td className="r soft">${money(p.costo)}</td><td className="r cell-t">${money(p.precio)}</td>
          <td className=${'r ' + (m < 10 ? 'bad-t' : m < 20 ? 'warn-t' : 'ok-t')}>${pct(m)}</td>
          <td className="r soft">${Number(p.pvp) > 0 ? money(p.pvp) : '—'}</td>
          <td className="r"><${Pill} plain tone=${stockCls(p)}>${qty(p.stock)}<//></td>
          <td className="r"><button className="btn sm ghost" onClick=${(e) => { e.stopPropagation(); setModal({ t: 'stock', p }); }}>Stock</button></td></tr>`; })}</tbody>
      </table></div></div>
      <div className="panel list-mob" style=${{ padding: '6px 0' }}><div className="list">${lista.slice(0, limit).map((p) => html`<button key=${p.id} className="li" data-row="" onClick=${() => setModal({ t: 'form', p })}>
        <${Ico} n="box" tone=${colorFor(p.categoria || 'x')} />
        <div className="li-main"><span className="li-t">${p.nombre}</span><span className="li-s"><span className="mono">${p.codigo || 's/c'}</span> · costo ${money(p.costo)} · ${pct(margenDe(Number(p.costo) || 0, Number(p.precio) || 0))}</span></div>
        <div className="li-r"><span className="amt">${money(p.precio)}</span><span className=${'pill plain ' + stockCls(p)} onClick=${(e) => { e.stopPropagation(); setModal({ t: 'stock', p }); }}>Stock ${qty(p.stock)}</span></div>
      </button>`)}</div></div>
      ${lista.length > limit && html`<button className="btn block" onClick=${() => setLimit(limit + 250)}>Mostrar más (${lista.length - limit} restantes)</button>`}`}
    ${modal && modal.t === 'form' && html`<${ProductoForm} s=${s} init=${modal.p} onClose=${() => setModal(null)} />`}
    ${modal && modal.t === 'stock' && html`<${StockModal} p=${modal.p} onClose=${() => setModal(null)} />`}
    ${modal && modal.t === 'precios' && html`<${PreciosModal} s=${s} onClose=${() => setModal(null)} />`}
    ${modal && modal.t === 'importar' && html`<${ImportarModal} s=${s} onClose=${() => setModal(null)} />`}
  <//>`;
}

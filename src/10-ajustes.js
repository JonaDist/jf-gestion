/* =========================================================
   Ajustes, respaldo y datos de ejemplo
   ========================================================= */
async function cargarDemo() {
  try { assertWritable(); } catch (e) { return; }
  const hoy = todayISO(); let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const P = [
    ['7790895000997', 'Coca-Cola 2,25 L', 'Bebidas', 'Coca-Cola', 'Pack', 6, 2950, 3650, 4300, 60, 18],
    ['7790895001000', 'Sprite 2,25 L', 'Bebidas', 'Coca-Cola', 'Pack', 6, 2700, 3350, 3950, 30, 12],
    ['7798062541019', 'Agua mineral 2 L', 'Bebidas', 'Villavicencio', 'Pack', 6, 1150, 1500, 1850, 72, 24],
    ['7790315001126', 'Cerveza lata 473 ml', 'Bebidas', 'Quilmes', 'Pack', 24, 1350, 1700, 2100, 96, 48],
    ['7790580106301', 'Jugo en polvo naranja', 'Bebidas', 'Tang', 'Display', 20, 260, 340, 450, 140, 40],
    ['7790040613601', 'Alfajor triple chocolate', 'Golosinas', 'Guaymallén', 'Caja', 40, 380, 520, 700, 200, 80],
    ['7790580327209', 'Chicles menta x 10', 'Golosinas', 'Beldent', 'Display', 18, 560, 760, 990, 54, 18],
    ['7790040379804', 'Caramelos masticables 800 g', 'Golosinas', 'Arcor', 'Unidad', 1, 3900, 5100, 6400, 12, 6],
    ['7790060023688', 'Chocolate con leche 100 g', 'Golosinas', 'Milka', 'Caja', 12, 1900, 2450, 3100, 36, 12],
    ['7790580660001', 'Galletitas de agua 3 x 100 g', 'Almacén', 'Criollitas', 'Caja', 24, 1100, 1450, 1800, 48, 24],
    ['7790387011200', 'Yerba mate 1 kg', 'Almacén', 'Playadito', 'Bulto', 10, 3900, 4700, 5600, 40, 20],
    ['7790070411208', 'Azúcar 1 kg', 'Almacén', 'Ledesma', 'Bulto', 10, 980, 1250, 1500, 50, 20],
    ['7790060013108', 'Fideos tirabuzón 500 g', 'Almacén', 'Matarazzo', 'Bulto', 20, 1050, 1380, 1700, 80, 40],
    ['7790580119806', 'Aceite girasol 1,5 L', 'Almacén', 'Natura', 'Caja', 12, 2600, 3250, 3900, 24, 12],
    ['7790272001005', 'Leche entera larga vida 1 L', 'Almacén', 'La Serenísima', 'Caja', 12, 1250, 1580, 1900, 6, 24],
    ['7791290013109', 'Lavandina 1 L', 'Limpieza', 'Ayudín', 'Caja', 12, 780, 1050, 1350, 36, 12],
    ['7791290786201', 'Detergente 500 ml', 'Limpieza', 'Magistral', 'Caja', 12, 1650, 2150, 2700, 24, 12],
    ['7790520985306', 'Papel higiénico x 4', 'Limpieza', 'Higienol', 'Bulto', 12, 1500, 1950, 2400, 0, 12],
    ['7790250000106', 'Papas fritas 145 g', 'Snacks', "Lay's", 'Caja', 20, 1700, 2200, 2800, 40, 20],
    ['7790250000304', 'Maní salado 120 g', 'Snacks', 'Pehuamar', 'Caja', 20, 820, 1100, 1400, 60, 20],
    ['7790742332508', 'Cigarrillos box 20', 'Kiosco', 'Marlboro', 'Unidad', 10, 3100, 3350, 3600, 100, 50],
    ['7790742500001', 'Encendedor', 'Kiosco', 'Bic', 'Display', 50, 520, 750, 1000, 150, 50],
    ['7790742600004', 'Pilas AA x 2', 'Kiosco', 'Duracell', 'Display', 12, 2400, 3100, 3900, 18, 12],
    ['7790742700007', 'Preservativos x 3', 'Kiosco', 'Prime', 'Display', 12, 1800, 2400, 3000, 24, 12],
  ].map(([codigo, nombre, categoria, marca, unidad, porBulto, costo, precio, pvp, stock, stockMin]) => ({ id: 'demo-p-' + slug(nombre), codigo, nombre, categoria, marca, unidad, porBulto, costo, precio, pvp, stock, stockMin, activo: true, demo: true }));
  const C = [
    ['Kiosco La Esquina', 'Marta', 'San Martín 450', 'Centro', 1, 0], ['Almacén Don Pepe', 'José', 'Rivadavia 1210', 'Centro', 1, 0],
    ['Maxikiosco 24 hs', 'Lucas', 'Av. Belgrano 88', 'Centro', 3, 5], ['Despensa El Sol', 'Rosa', 'Pellegrini 640', 'Barrio Norte', 2, 0],
    ['Autoservicio Los Hermanos', 'Diego', 'Ruta 12 km 3', 'Ruta 12', 4, 8], ['Kiosco del Club', 'Andrea', '25 de Mayo 300', 'Barrio Norte', 2, 0],
    ['Drugstore La Terminal', 'Gustavo', 'Terminal de ómnibus, local 4', 'Centro', 5, 3], ['Almacén La Abuela', 'Nélida', 'Moreno 1550', 'Barrio Sur', 4, 0],
  ].map(([nombre, contacto, direccion, zona, diaVisita, descuento]) => ({ id: 'demo-c-' + slug(nombre), nombre, contacto, telefono: '', direccion, localidad: 'Gualeguay', zona, cuit: '', condIva: descuento ? 'Responsable inscripto' : 'Monotributo', diaVisita, descuento, notas: '', activo: true, demo: true }));
  const peds = []; const estados = ['entregado', 'entregado', 'entregado', 'entregado', 'listo', 'preparando', 'confirmado', 'presupuesto', 'cancelado'];
  const base = (s) => s.maxNum || 0;
  const nro0 = base(storeSnapshot());
  for (let i = 0; i < 22; i++) {
    const dAgo = Math.floor(rnd() * 34); const fecha = addISO(hoy, -dAgo);
    const cli = C[Math.floor(rnd() * C.length)];
    const nIt = 3 + Math.floor(rnd() * 6); const usados = new Set(); const items = [];
    for (let k = 0; k < nIt; k++) { const pr = P[Math.floor(rnd() * P.length)]; if (usados.has(pr.id)) continue; usados.add(pr.id); items.push({ pid: pr.id, codigo: pr.codigo, nombre: pr.nombre, unidad: pr.unidad, cant: (1 + Math.floor(rnd() * 4)) * (pr.porBulto > 6 ? 1 : pr.porBulto), precio: pr.precio, costo: pr.costo, desc: 0 }); }
    let estado = dAgo > 3 ? (rnd() < 0.1 ? 'cancelado' : 'entregado') : estados[Math.floor(rnd() * estados.length)];
    const p = { id: 'demo-o-' + i, numero: nro0 + i + 1, clienteId: cli.id, clienteSnap: snapCli(cli), fecha, entrega: estado === 'presupuesto' ? '' : dAgo >= 1 ? addISO(fecha, 1) : fecha, items, descGeneral: cli.descuento, envio: 0, notas: '', estado, pagos: [], historial: [{ ts: Date.now(), estado }], stockAplicado: false, demo: true };
    const c = calcPedido(p);
    if (estado === 'entregado') { const r = rnd(); if (r < 0.65) p.pagos = [{ id: 'pg' + i, fecha: p.entrega, monto: c.total, medio: rnd() < 0.5 ? 'Efectivo' : 'Transferencia', nota: '' }]; else if (r < 0.85) p.pagos = [{ id: 'pg' + i, fecha: p.entrega, monto: round2(c.total / 2), medio: 'Efectivo', nota: '' }]; }
    peds.push(p);
  }
  peds.sort((x, y) => x.fecha.localeCompare(y.fecha)).forEach((p, i) => { p.numero = nro0 + i + 1; });
  const V = []; const ini = startOfWeek(new Date());
  for (const c of C) { const f = isoDate(addDays(ini, (c.diaVisita + 6) % 7)); V.push({ id: 'demo-v-' + c.id.slice(7) + '-' + f, clienteId: c.id, fecha: f, hora: '', nota: '', estado: f < hoy ? 'visitado' : 'pendiente', demo: true }); }
  const tareas = [...P.map((x) => () => put('productos', x)), ...C.map((x) => () => put('clientes', x)), ...peds.map((x) => () => put('pedidos', x)), ...V.map((x) => () => put('visitas', x))];
  const errs = await runPool(tareas, 4);
  toast(errs.length ? `Ejemplos cargados con ${errs.length} errores` : 'Datos de ejemplo cargados. Se borran desde Ajustes.');
}
async function borrarDemo() {
  const s = storeSnapshot(); const t = [];
  for (const [col, arr] of [['productos', s.productos], ['clientes', s.clientes], ['pedidos', s.pedidos], ['visitas', s.visitas]]) for (const x of arr) if (x.demo) t.push(() => del(col, x.id));
  const errs = await runPool(t, 4);
  toast(errs.length ? `Quedaron ${errs.length} ejemplos sin borrar, probá de nuevo.` : 'Datos de ejemplo borrados');
}

function descargarRespaldo(s) {
  const j = { app: 'JF Gestión', version: 1, exportado: new Date().toISOString(), config: s.config, productos: s.productos, clientes: s.clientes, pedidos: s.pedidos, visitas: s.visitas };
  return guardarArchivo(`respaldo-jf-${todayISO()}.json`, JSON.stringify(j, null, 1));
}

function Ajustes({ s, go }) {
  const [cfg, setCfg] = useState(() => ({ ...s.config }));
  const [busy, setBusy] = useState('');
  const touched = useRef(false);
  useEffect(() => { if (!touched.current) setCfg({ ...s.config }); }, [s.config]);
  const dirty = touched.current && JSON.stringify(cfg) !== JSON.stringify(s.config);
  const set = (k) => (e) => { touched.current = true; setCfg((x) => ({ ...x, [k]: e && e.target ? e.target.value : e })); };
  const guardar = async () => { setBusy('cfg'); try { await putConfig(cfg); touched.current = false; toast('Ajustes guardados'); } catch (e) { /* aviso mostrado */ } setBusy(''); };
  const respaldo = () => descargarRespaldo(s);
  const restaurar = (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    const r = new FileReader();
    r.onload = async () => {
      let j; try { j = JSON.parse(String(r.result)); } catch (err) { toast('El archivo no es un respaldo válido.', { tone: 'bad' }); return; }
      if (!j || !Array.isArray(j.productos)) { toast('El archivo no es un respaldo de JF Gestión.', { tone: 'bad' }); return; }
      const n = COLS.reduce((a, c) => a + ((j[c] || []).length), 0);
      const ok = await confirmar({ title: 'Restaurar respaldo', message: `Se cargan ${n} registros del ${j.exportado ? fmtCorta(j.exportado.slice(0, 10)) : 'respaldo'}. Los que tengan el mismo identificador se reemplazan; el resto de tus datos no se toca.`, okLabel: 'Restaurar' });
      if (!ok) return;
      setBusy('rest');
      const t = []; for (const c of COLS) for (const x of j[c] || []) if (x && x.id) t.push(() => put(c, x));
      const errs = await runPool(t, 4, (d, tt) => setBusy(`rest ${d}/${tt}`));
      if (j.config) await safe(putConfig(j.config));
      setBusy(''); toast(errs.length ? `Restaurado con ${errs.length} errores` : `${t.length} registros restaurados`);
    };
    r.readAsText(f);
  };
  const csvPedidos = () => guardarArchivo(`pedidos-jf-${todayISO()}.csv`, toCSV([['Número', 'Fecha', 'Entrega', 'Cliente', 'Zona', 'Estado', 'Productos', 'Unidades', 'Subtotal', 'Descuento', 'Envío', 'Total', 'Costo', 'Ganancia', 'Pagado', 'Saldo', 'Notas'],
    ...s.pedidos.map((p) => { const c = s.calc.get(p.id); const sn = p.clienteSnap || {}; return [numCorto(p), fmtCorta(p.fecha), p.entrega ? fmtCorta(p.entrega) : '', sn.nombre, sn.zona || sn.localidad, ESTADOS[p.estado].label, c.lineas, csvNum(c.unidades), csvNum(c.subtotal), csvNum(c.descMonto), csvNum(c.envio), csvNum(c.total), csvNum(c.costo), csvNum(c.ganancia), csvNum(c.pagado), csvNum(c.saldo), p.notas]; })]));
  const csvDetalle = () => guardarArchivo(`ventas-detalle-jf-${todayISO()}.csv`, toCSV([['Número', 'Fecha', 'Cliente', 'Estado', 'Código', 'Producto', 'Cantidad', 'Precio', 'Dto %', 'Importe', 'Costo unitario'],
    ...s.pedidos.flatMap((p) => (p.items || []).map((it) => [numCorto(p), fmtCorta(p.fecha), (p.clienteSnap || {}).nombre, ESTADOS[p.estado].label, it.codigo, it.nombre, csvNum(it.cant), csvNum(it.precio), csvNum(it.desc || 0), csvNum(lineaSub(it)), csvNum(it.costo)]))]));
  const borrarTodo = async () => {
    const ok = await confirmar({ title: 'Borrar todos los datos', message: 'Se eliminan productos, clientes, pedidos y visitas para siempre. Descargá un respaldo antes.', okLabel: 'Borrar todo', danger: true, typeToConfirm: 'BORRAR' });
    if (!ok) return;
    setBusy('all');
    const t = []; for (const [col, arr] of [['productos', s.productos], ['clientes', s.clientes], ['pedidos', s.pedidos], ['visitas', s.visitas]]) for (const x of arr) t.push(() => del(col, x.id));
    const errs = await runPool(t, 4, (d, tt) => setBusy(`all ${d}/${tt}`));
    setBusy(''); toast(errs.length ? `Quedaron ${errs.length} registros sin borrar` : 'Datos borrados');
  };
  const total = s.productos.length + s.clientes.length + s.pedidos.length + s.visitas.length;
  useCtx('Ajustes', [
    { id: 'gu', title: 'Guardar cambios', icon: 'check', tone: 'c-green', key: 'mod+s', primary: true, disabled: !dirty, run: guardar },
    total ? { id: 'bk', title: 'Descargar respaldo', icon: 'download', run: respaldo } : null,
    s.pedidos.length ? { id: 'cp', title: 'Exportar pedidos a CSV', icon: 'file', run: csvPedidos } : null,
    s.pedidos.length ? { id: 'cd', title: 'Exportar ventas por producto a CSV', icon: 'file', run: csvDetalle } : null,
  ]);
  return html`<${Fragment}>
    <${PageHead} title="Ajustes" sub="Datos del negocio, depósito, documentos y respaldo"
      actions=${html`<${KBtn} cls="primary" k="mod+s" disabled=${!dirty || busy === 'cfg'} onClick=${guardar}>${busy === 'cfg' ? 'Guardando…' : 'Guardar cambios'}<//>`} />
    ${s.mode === 'local' && html`<div className="banner warn"><${Icon} n="alert" s=${16} /><span className="grow">Los datos se están guardando solo en este navegador. ${EN_CLAUDE ? 'Abrí el sistema desde su enlace en Claude, con tu cuenta, para guardarlos en la nube.' : 'Falta configurar la base de datos: completá config.js con la URL y la clave de Supabase.'}</span></div>`}
    ${s.mode === 'supa' && html`<div className="banner info"><${Icon} n="user" s=${16} /><span className="grow">Entraste como <b>${s.usuario}</b>.</span><button className="btn sm" onClick=${async () => { const ok = await confirmar({ title: 'Cerrar sesión', message: 'Para volver a entrar vas a necesitar tu email y contraseña.', okLabel: 'Cerrar sesión' }); if (ok) supaLogout(); }}>Cerrar sesión</button></div>`}
    ${s.readOnly && html`<div className="banner warn"><${Icon} n="eye" s=${16} /><span className="grow">Estás viendo en modo lectura. Para cargar y modificar datos, el dueño tiene que compartirte el sistema como editor.</span></div>`}
    <div className="cols c-1-1">
      <${Panel} title="Tu negocio">
        <div className="stack">
          <div className="grid2">
            <${Field} label="Nombre comercial" id="aj-nom"><input id="aj-nom" className="input" value=${cfg.nombre} onChange=${set('nombre')} /><//>
            <${Field} label="Administrador" id="aj-adm" hint="Para el saludo del inicio."><input id="aj-adm" className="input" value=${cfg.admin} onChange=${set('admin')} /><//>
          </div>
          <${Field} label="Razón social" id="aj-rs"><input id="aj-rs" className="input" value=${cfg.razonSocial} onChange=${set('razonSocial')} /><//>
          <div className="grid2">
            <${Field} label="CUIT" id="aj-cuit"><input id="aj-cuit" className="input" value=${cfg.cuit} onChange=${set('cuit')} placeholder="30-12345678-9" /><//>
            <${Field} label="Condición IVA" id="aj-iva"><select id="aj-iva" className="select" value=${cfg.condIva} onChange=${set('condIva')}>${COND_IVA.map((x) => html`<option key=${x} value=${x}>${x}</option>`)}</select><//>
          </div>
          <div className="grid2">
            <${Field} label="Dirección" id="aj-dir"><input id="aj-dir" className="input" value=${cfg.direccion} onChange=${set('direccion')} /><//>
            <${Field} label="Localidad" id="aj-loc"><input id="aj-loc" className="input" value=${cfg.localidad} onChange=${set('localidad')} /><//>
          </div>
          <div className="grid2">
            <${Field} label="Teléfono" id="aj-tel"><input id="aj-tel" className="input" inputMode="tel" value=${cfg.telefono} onChange=${set('telefono')} /><//>
            <${Field} label="Email" id="aj-mail"><input id="aj-mail" className="input" type="email" value=${cfg.email} onChange=${set('email')} /><//>
          </div>
        </div>
      <//>
      <div className="stack">
        <${Panel} title="Depósito">
          <div className="stack">
            <div className="grid2">
              <${Field} label="Cómo lo llamás" id="aj-dep"><input id="aj-dep" className="input" value=${cfg.nombreDeposito} onChange=${set('nombreDeposito')} placeholder="Depósito" /><//>
              <${Field} label="WhatsApp de quien arma" id="aj-wa" hint=${cfg.waDeposito ? (telWa(cfg.waDeposito) ? 'Se envía a +' + telWa(cfg.waDeposito) : 'Revisá el número') : 'Con código de área, sin 0 ni 15.'}><input id="aj-wa" className="input" inputMode="tel" value=${cfg.waDeposito} onChange=${set('waDeposito')} placeholder="3444 512345" /><//>
            </div>
            <p className="small muted">Con este número, el botón “Al depósito” de cada pedido abre WhatsApp con la orden de armado ya escrita.</p>
          </div>
        <//>
        <${Panel} title="Documentos y alertas">
          <div className="stack">
            <div className="grid3">
              <${Field} label="Punto de venta" id="aj-pv"><input id="aj-pv" className="input mono" inputMode="numeric" value=${cfg.puntoVenta} onChange=${set('puntoVenta')} /><//>
              <${Field} label="Validez presupuesto" id="aj-val"><${NumInput} id="aj-val" value=${cfg.validez} decimals=${0} suffix="días" onChange=${set('validez')} /><//>
              <${Field} label="Cliente inactivo tras" id="aj-in"><${NumInput} id="aj-in" value=${cfg.diasInactivo} decimals=${0} suffix="días" onChange=${set('diasInactivo')} /><//>
            </div>
            <${Field} label="Leyenda al pie de la boleta" id="aj-ley"><input id="aj-ley" className="input" value=${cfg.leyenda} onChange=${set('leyenda')} /><//>
          </div>
        <//>
      </div>
    </div>
    <${Panel} title="Datos y respaldo">
      <div className="stack">
        <div className="row-flex wrap small">
          <span className=${'sync' + (s.mode === 'local' ? ' local' : '')}><span className="dot"></span>${s.mode === 'nube' || s.mode === 'supa' ? 'Guardado en la nube, sincronizado entre dispositivos' : 'Guardado en este navegador'}</span>
          <span className="muted">· ${s.productos.length} productos · ${s.clientes.length} clientes · ${s.pedidos.length} pedidos · ${s.visitas.length} visitas</span>
        </div>
        <div className="row-flex wrap">
          <button className="btn" onClick=${respaldo} disabled=${!total}><${Icon} n="download" s=${15} />Descargar respaldo</button>
          <label className="btn" htmlFor="aj-rest"><${Icon} n="upload" s=${15} />${busy.startsWith('rest') ? 'Restaurando ' + busy.slice(5) : 'Restaurar respaldo'}</label>
          <input id="aj-rest" type="file" accept=".json,application/json" className="sr" onChange=${restaurar} />
          <button className="btn" onClick=${csvPedidos} disabled=${!s.pedidos.length}><${Icon} n="file" s=${15} />Pedidos en CSV</button>
          <button className="btn" onClick=${csvDetalle} disabled=${!s.pedidos.length}><${Icon} n="file" s=${15} />Ventas por producto en CSV</button>
        </div>
        <p className="small muted">El respaldo es un archivo con todo el sistema. Guardalo una vez por semana; también sirve para pasar los datos a la futura app de Android.</p>
        <hr className="hr" />
        <div className="row-flex wrap">
          ${s.hayDemo ? html`<button className="btn" disabled=${!!busy} onClick=${async () => { setBusy('demo'); await borrarDemo(); setBusy(''); }}><${Icon} n="trash" s=${15} />${busy === 'demo' ? 'Borrando…' : 'Borrar datos de ejemplo'}</button>`
          : html`<button className="btn" disabled=${!!busy} onClick=${async () => { setBusy('demo'); await cargarDemo(); setBusy(''); }}><${Icon} n="sparkle" s=${15} />${busy === 'demo' ? 'Cargando…' : 'Cargar datos de ejemplo'}</button>`}
          <span className="grow"></span>
          <button className="btn danger" disabled=${!total || !!busy} onClick=${borrarTodo}><${Icon} n="trash" s=${15} />${busy.startsWith('all') ? 'Borrando ' + busy.slice(4) : 'Borrar todo'}</button>
        </div>
      </div>
    <//>
  <//>`;
}

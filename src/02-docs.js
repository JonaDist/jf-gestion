/* =========================================================
   Documentos: textos de WhatsApp, boleta PDF, etiqueta, CSV
   ========================================================= */
const LIB_JSPDF = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
const LIB_AUTOTABLE = 'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js';
const loadScript = (src) => new Promise((res, rej) => {
  const s = document.createElement('script'); s.src = src; s.async = true;
  s.onload = res; s.onerror = () => rej(new Error('No se pudo cargar el generador de PDF. Revisá la conexión.'));
  document.head.appendChild(s);
});
let pdfLibP = null;
function getPDF() {
  if (!pdfLibP) {
    pdfLibP = (async () => { await loadScript(LIB_JSPDF); await loadScript(LIB_AUTOTABLE); return window.jspdf.jsPDF; })();
    pdfLibP.catch(() => { pdfLibP = null; });
  }
  return pdfLibP;
}

/* ---------- guardar y compartir archivos ---------- */
const EN_CLAUDE = !!(window.claude && typeof window.claude.use === 'function');
const MIME = { pdf: 'application/pdf', png: 'image/png', csv: 'text/csv', json: 'application/json' };
function descargaDirecta(filename, data) {
  const ext = filename.split('.').pop();
  const blob = data instanceof Blob ? data : new Blob([data], { type: (MIME[ext] || 'text/plain') + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
async function puedeGuardar() { return !EN_CLAUDE || !!(await getCap('downloads')); }
async function guardarArchivo(filename, data) {
  if (!EN_CLAUDE) { try { descargaDirecta(filename, data); toast('Archivo descargado: ' + filename); return true; } catch (e) { toast('No se pudo descargar el archivo.', { tone: 'bad' }); return false; } }
  const dl = await getCap('downloads');
  if (!dl) { toast('Descargar archivos no está disponible en esta vista.', { tone: 'bad' }); return false; }
  try { await dl.save({ filename, data }); toast('Archivo guardado: ' + filename); return true; }
  catch (e) {
    const c = e && e.code;
    if (c === 'declined') return false;
    if (c === 'rate_limited') toast('Hay otra descarga esperando confirmación. Probá en unos segundos.', { tone: 'bad' });
    else toast('No se pudo guardar el archivo' + (c ? ` (${c})` : ''), { tone: 'bad' });
    return false;
  }
}
/* Compartir directo a WhatsApp u otra app (celulares, fuera de Claude) */
function puedeCompartir(filename) {
  if (EN_CLAUDE || !navigator.canShare || !window.File) return false;
  try { return navigator.canShare({ files: [new File(['x'], filename, { type: MIME[filename.split('.').pop()] || 'application/octet-stream' })] }); } catch (e) { return false; }
}
async function compartirArchivo(filename, blob, texto) {
  try {
    const file = new File([blob], filename, { type: blob.type || MIME[filename.split('.').pop()] || 'application/octet-stream' });
    await navigator.share({ files: [file], text: texto || undefined });
    return true;
  } catch (e) {
    if (e && e.name === 'AbortError') return false;
    toast('No se pudo compartir. Descargalo y mandalo a mano.', { tone: 'bad' });
    return false;
  }
}
const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'archivo';

/* ---------- textos para WhatsApp ---------- */
function dirCliente(snap) { return [snap && snap.direccion, snap && snap.localidad].filter(Boolean).join(', '); }
function textoDeposito(p, cfg) {
  const c = calcPedido(p); const s = p.clienteSnap || {};
  const L = [`*ARMAR PEDIDO ${numCorto(p)}*`, `Cliente: *${s.nombre || 'Sin cliente'}*`];
  const dir = dirCliente(s); if (dir) L.push(`Dirección: ${dir}`);
  if (s.zona) L.push(`Zona: ${s.zona}`);
  if (p.entrega) L.push(`Entrega: ${cap(fmtLarga(p.entrega))}`);
  L.push('--------------------------------');
  for (const it of p.items || []) L.push(`☐ *${qty(it.cant)}* × ${it.nombre}${it.unidad && it.unidad !== 'Unidad' ? ` (${it.unidad})` : ''}${it.codigo ? ` · ${it.codigo}` : ''}`);
  L.push('--------------------------------');
  L.push(`${c.lineas} productos · ${qty(c.unidades)} unidades en total`);
  if (p.notas) L.push(`Notas: ${p.notas}`);
  L.push(`_${cfg.nombre}_`);
  return L.join('\n');
}
function textoCliente(p, cfg) {
  const c = calcPedido(p); const s = p.clienteSnap || {};
  const tipo = p.estado === 'presupuesto' ? 'Presupuesto' : 'Pedido';
  const L = [`*${cfg.nombre}*`, `${tipo} ${numCorto(p)} · ${fmtCorta(p.fecha)}`];
  if (s.nombre) L.push(`Cliente: ${s.nombre}`);
  L.push('');
  for (const it of p.items || []) {
    const sub = (Number(it.cant) || 0) * (Number(it.precio) || 0) * (1 - (Number(it.desc) || 0) / 100);
    L.push(`• ${qty(it.cant)} × ${it.nombre} — ${money(it.precio)}${it.desc ? ` (-${nf1.format(it.desc)}%)` : ''} = ${money(sub)}`);
  }
  L.push('');
  if (c.descMonto) { L.push(`Subtotal: ${money(c.subtotal)}`); L.push(`Descuento ${nf1.format(p.descGeneral)}%: −${money(c.descMonto)}`); }
  if (c.envio) L.push(`Envío: ${money(c.envio)}`);
  L.push(`*TOTAL: ${money(c.total)}*`);
  if (c.cuenta && c.pagado > 0) L.push(`Pagado: ${money(c.pagado)} · Saldo: ${money(c.saldo)}`);
  if (p.entrega) L.push(`Entrega: ${cap(fmtLarga(p.entrega))}`);
  if (p.estado === 'presupuesto' && cfg.validez) L.push(`_Presupuesto válido por ${cfg.validez} días._`);
  if (cfg.leyenda) L.push(cfg.leyenda);
  return L.join('\n');
}
function textoCobro(cli, saldo, pedidos, cfg) {
  const L = [`Hola${cli.contacto ? ' ' + cli.contacto.split(' ')[0] : ''}, te escribimos de *${cfg.nombre}*.`, `Te pasamos el resumen de tu cuenta: saldo pendiente *${money(saldo)}*.`, ''];
  for (const p of pedidos) L.push(`• Pedido ${numCorto(p.p)} del ${fmtCorta(p.p.fecha)}: ${money(p.c.saldo)}`);
  L.push('', '¡Gracias!');
  return L.join('\n');
}
async function copiar(text) {
  try { await navigator.clipboard.writeText(text); toast('Texto copiado'); return true; }
  catch (e) { return false; }
}

/* ---------- boleta PDF ---------- */
const TIPOS_DOC = { presupuesto: 'PRESUPUESTO', pedido: 'NOTA DE PEDIDO', remito: 'REMITO' };
async function pdfBoleta(p, cfg, opts) {
  const jsPDF = await getPDF();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const copias = opts.duplicado ? ['ORIGINAL', 'DUPLICADO'] : [''];
  copias.forEach((copia, i) => { if (i > 0) doc.addPage(); dibujarBoleta(doc, p, cfg, opts, copia); });
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(120);
    doc.text(`${cfg.nombre} · ${TIPOS_DOC[opts.tipo]} N° ${numLargo(p, cfg)} · Página ${i} de ${n}`, 105, 290, { align: 'center' });
  }
  return doc.output('blob');
}
function dibujarBoleta(doc, p, cfg, opts, copia) {
  const c = calcPedido(p); const s = p.clienteSnap || {};
  const M = 14, W = 210, R = W - M;
  doc.setTextColor(20, 23, 30); doc.setDrawColor(20, 23, 30);
  // Emisor
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text(cfg.nombre || 'JF', M, 20);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  const emi = [cfg.razonSocial, [cfg.direccion, cfg.localidad].filter(Boolean).join(' · '), cfg.telefono && 'Tel: ' + cfg.telefono, cfg.email, cfg.cuit && 'CUIT: ' + cfg.cuit, cfg.condIva && 'IVA: ' + cfg.condIva].filter(Boolean);
  emi.forEach((t, i) => doc.text(String(t), M, 25.5 + i * 4));
  // Caja X
  doc.setLineWidth(0.5); doc.rect(97, 11, 16, 15);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(24); doc.text('X', 105, 22.5, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.text('DOCUMENTO NO VÁLIDO', 105, 29.5, { align: 'center' }); doc.text('COMO FACTURA', 105, 32, { align: 'center' });
  // Documento
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.text(TIPOS_DOC[opts.tipo], R, 18, { align: 'right' });
  doc.setFontSize(10); doc.text('N° ' + numLargo(p, cfg), R, 24, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text('Fecha: ' + fmtCorta(p.fecha), R, 29.5, { align: 'right' });
  let yy = 34;
  if (p.entrega) { doc.text('Entrega: ' + fmtCorta(p.entrega), R, yy, { align: 'right' }); yy += 4.5; }
  if (copia) { doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text(copia, R, yy + 1, { align: 'right' }); }
  const top = Math.max(26 + emi.length * 4, 42);
  doc.setLineWidth(0.6); doc.line(M, top, R, top);
  // Cliente
  doc.setFontSize(9);
  const cli = [
    ['Cliente', s.nombre || 'Consumidor final'], ['CUIT', s.cuit || '—'],
    ['Dirección', dirCliente(s) || '—'], ['Cond. IVA', s.condIva || 'Consumidor final'],
    ['Contacto', [s.contacto, s.telefono].filter(Boolean).join(' · ') || '—'], ['Zona', s.zona || '—'],
  ];
  cli.forEach(([k, v], i) => {
    const x = i % 2 === 0 ? M : 125; const y = top + 6 + Math.floor(i / 2) * 5;
    doc.setFont('helvetica', 'bold'); doc.text(k + ':', x, y);
    doc.setFont('helvetica', 'normal'); doc.text(doc.splitTextToSize(String(v), i % 2 === 0 ? 86 : 52)[0], x + (i % 2 === 0 ? 19 : 17), y);
  });
  const tableY = top + 22;
  doc.setLineWidth(0.2); doc.setDrawColor(200); doc.line(M, tableY - 3, R, tableY - 3);
  const precios = opts.precios;
  const head = precios ? [['Código', 'Descripción', 'Cant.', 'P. unit.', 'Dto.', 'Importe']] : [['Código', 'Descripción', 'Unidad', 'Cant.', 'Control']];
  const body = (p.items || []).map((it) => {
    const sub = (Number(it.cant) || 0) * (Number(it.precio) || 0) * (1 - (Number(it.desc) || 0) / 100);
    return precios
      ? [it.codigo || '', it.nombre, qty(it.cant), money(it.precio), it.desc ? nf1.format(it.desc) + '%' : '', money(sub)]
      : [it.codigo || '', it.nombre, it.unidad || 'Unidad', qty(it.cant), ''];
  });
  doc.autoTable({
    startY: tableY, head, body, margin: { left: M, right: M, top: 16, bottom: 18 }, theme: 'plain',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: { top: 2, bottom: 2, left: 2, right: 2 }, textColor: [20, 23, 30], lineColor: [215, 218, 222], lineWidth: { bottom: 0.2 } },
    headStyles: { fontStyle: 'bold', fontSize: 8, fillColor: [236, 238, 242], textColor: [20, 23, 30], lineWidth: { bottom: 0.5 }, lineColor: [20, 23, 30] },
    columnStyles: precios
      ? { 0: { cellWidth: 22 }, 2: { halign: 'right', cellWidth: 16 }, 3: { halign: 'right', cellWidth: 26 }, 4: { halign: 'right', cellWidth: 14 }, 5: { halign: 'right', cellWidth: 28, fontStyle: 'bold' } }
      : { 0: { cellWidth: 24 }, 2: { cellWidth: 24 }, 3: { halign: 'right', cellWidth: 18, fontStyle: 'bold' }, 4: { cellWidth: 20 } },
    didParseCell: (d) => { if (d.section === 'head' && precios && d.column.index >= 2) d.cell.styles.halign = 'right'; if (d.section === 'head' && !precios && d.column.index === 3) d.cell.styles.halign = 'right'; },
    didDrawCell: (d) => {
      if (!precios && d.section === 'body' && d.column.index === 4) { doc.setDrawColor(20, 23, 30); doc.setLineWidth(0.3); doc.rect(d.cell.x + 7, d.cell.y + d.cell.height / 2 - 2, 4, 4); }
    },
  });
  let y = doc.lastAutoTable.finalY + 6;
  const need = (precios ? 34 : 10) + (p.notas ? 14 : 0) + (opts.tipo === 'remito' ? 22 : 0) + 12;
  if (y + need > 278) { doc.addPage(); y = 20; }
  const blockY = y;
  // Totales
  doc.setTextColor(20, 23, 30); doc.setDrawColor(20, 23, 30);
  if (precios) {
    const rows = [['Subtotal', money(c.subtotal)]];
    if (c.descMonto) rows.push([`Descuento ${nf1.format(p.descGeneral)}%`, '-' + money(c.descMonto)]);
    if (c.envio) rows.push(['Envío', money(c.envio)]);
    doc.setFontSize(9.5); doc.setFont('helvetica', 'normal');
    rows.forEach(([k, v]) => { doc.text(k, 140, y); doc.text(v, R, y, { align: 'right' }); y += 5; });
    doc.setLineWidth(0.5); doc.line(136, y - 2, R, y - 2);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text('TOTAL', 140, y + 4); doc.text(money(c.total), R, y + 4, { align: 'right' });
    y += 10;
    if (c.cuenta && c.pagado > 0) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
      doc.text('Pagado', 140, y); doc.text(money(c.pagado), R, y, { align: 'right' }); y += 5;
      doc.setFont('helvetica', 'bold'); doc.text('Saldo', 140, y); doc.text(money(c.saldo), R, y, { align: 'right' }); y += 5;
    }
  } else {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text(`${c.lineas} productos · ${qty(c.unidades)} unidades`, R, y, { align: 'right' }); y += 8;
  }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(60);
  const notas = [];
  if (p.notas) notas.push('Observaciones: ' + p.notas);
  if (opts.tipo === 'presupuesto' && cfg.validez) notas.push(`Presupuesto válido por ${cfg.validez} días desde la fecha de emisión.`);
  if (cfg.leyenda) notas.push(cfg.leyenda);
  let ny = blockY;
  notas.forEach((t) => { const lines = doc.splitTextToSize(t, 110); doc.text(lines, M, ny); ny += lines.length * 4 + 1.5; });
  if (opts.tipo === 'remito') {
    const fy = Math.max(y, ny) + 14;
    doc.setDrawColor(20, 23, 30); doc.setLineWidth(0.3); doc.setTextColor(20, 23, 30);
    doc.line(M, fy, M + 70, fy); doc.line(R - 70, fy, R, fy);
    doc.setFontSize(8); doc.text('Recibí conforme (firma)', M, fy + 4); doc.text('Aclaración y DNI', R - 70, fy + 4);
  }
}

/* ---------- etiqueta del depósito ---------- */
async function pdfEtiqueta(p, cfg) {
  const jsPDF = await getPDF();
  const doc = new jsPDF({ unit: 'mm', format: [100, 150] });
  const s = p.clienteSnap || {}; const c = calcPedido(p);
  const head = () => {
    doc.setFillColor(20, 23, 30); doc.rect(0, 0, 100, 13, 'F');
    doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text((cfg.nombre || 'JF').toUpperCase(), 5, 8.6);
    doc.setFontSize(8); doc.text('ORDEN DE ARMADO', 95, 8.4, { align: 'right' });
  };
  head();
  doc.setTextColor(20, 23, 30);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(28); doc.text(numCorto(p), 5, 26);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  doc.text(p.entrega ? 'Entrega: ' + cap(fmtLarga(p.entrega)) : 'Fecha: ' + fmtCorta(p.fecha), 95, 20, { align: 'right' });
  doc.text(`${c.lineas} prod. · ${qty(c.unidades)} u.`, 95, 25, { align: 'right' });
  doc.setLineWidth(0.4); doc.setDrawColor(20, 23, 30); doc.line(5, 30, 95, 30);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  const nm = doc.splitTextToSize(s.nombre || 'Sin cliente', 90).slice(0, 2); doc.text(nm, 5, 37);
  let y = 37 + nm.length * 5.4;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  const extra = [dirCliente(s), s.zona && 'Zona: ' + s.zona, s.telefono && 'Tel: ' + s.telefono].filter(Boolean);
  extra.forEach((t) => { doc.text(doc.splitTextToSize(t, 90)[0], 5, y); y += 4.4; });
  doc.autoTable({
    startY: y + 2, margin: { left: 5, right: 5, top: 17, bottom: 22 }, theme: 'plain',
    head: [['', 'Cant.', 'Producto']],
    body: (p.items || []).map((it) => ['', qty(it.cant), it.nombre + (it.codigo ? `  ·  ${it.codigo}` : '')]),
    styles: { fontSize: 9.5, cellPadding: { top: 1.6, bottom: 1.6, left: 1.5, right: 1.5 }, textColor: [20, 23, 30], lineColor: [210, 210, 210], lineWidth: { bottom: 0.2 } },
    headStyles: { fontSize: 7.5, fontStyle: 'bold', lineWidth: { bottom: 0.4 }, lineColor: [20, 23, 30] },
    columnStyles: { 0: { cellWidth: 7 }, 1: { cellWidth: 14, halign: 'right', fontStyle: 'bold', fontSize: 11 } },
    didDrawCell: (d) => { if (d.section === 'body' && d.column.index === 0) { doc.setDrawColor(20, 23, 30); doc.setLineWidth(0.3); doc.rect(d.cell.x + 1.2, d.cell.y + d.cell.height / 2 - 2, 4, 4); } },
    didDrawPage: (d) => { if (d.pageNumber > 1) head(); },
  });
  let fy = doc.lastAutoTable.finalY + 8;
  if (fy > 140) { doc.addPage(); head(); fy = 24; }
  if (p.notas) { doc.setFontSize(8.5); doc.setFont('helvetica', 'italic'); const l = doc.splitTextToSize('Notas: ' + p.notas, 90).slice(0, 3); doc.text(l, 5, fy - 2); fy += l.length * 4; }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(20, 23, 30);
  doc.text('Bultos: ______', 5, fy + 4); doc.text('Armó: __________', 36, fy + 4); doc.text('Controló: ________', 95, fy + 4, { align: 'right' });
  return doc.output('blob');
}
async function pngEtiqueta(p, cfg) {
  try { await Promise.all([document.fonts.load('700 40px "Inter"'), document.fonts.load('500 30px "Inter"'), document.fonts.load('400 30px "Inter"')]); } catch (e) { /* fuentes del sistema */ }
  const W = 1000, H = 1500, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'); const s = p.clienteSnap || {}; const c = calcPedido(p);
  const D = '"Inter", Arial, sans-serif', B = '"Inter", Arial, sans-serif';
  g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#161A21'; g.fillRect(0, 0, W, 130);
  g.fillStyle = '#FFFFFF'; g.font = `700 64px ${D}`; g.textBaseline = 'middle'; g.fillText((cfg.nombre || 'JF').toUpperCase(), 50, 68);
  g.font = `600 28px ${D}`; g.textAlign = 'right'; g.fillText('ORDEN DE ARMADO', W - 50, 68); g.textAlign = 'left';
  g.fillStyle = '#161A21'; g.textBaseline = 'alphabetic';
  g.font = `700 132px ${D}`; g.fillText(numCorto(p), 44, 292);
  g.font = `500 32px ${B}`; g.textAlign = 'right';
  g.fillText(p.entrega ? 'Entrega ' + fmtDia(p.entrega) : fmtCorta(p.fecha), W - 50, 220);
  g.fillText(`${c.lineas} prod. · ${qty(c.unidades)} u.`, W - 50, 272); g.textAlign = 'left';
  g.fillRect(50, 330, W - 100, 5);
  const fit = (txt, max) => { let t = String(txt || ''); if (g.measureText(t).width <= max) return t; while (t.length > 1 && g.measureText(t + '…').width > max) t = t.slice(0, -1); return t + '…'; };
  g.font = `700 56px ${D}`; g.fillText(fit(s.nombre || 'Sin cliente', W - 100), 50, 410);
  g.font = `400 34px ${B}`; g.fillStyle = '#3B414B';
  let y = 462;
  for (const t of [dirCliente(s), s.zona && 'Zona: ' + s.zona, s.telefono && 'Tel: ' + s.telefono].filter(Boolean)) { g.fillText(fit(t, W - 100), 50, y); y += 46; }
  y += 18; g.fillStyle = '#161A21'; g.fillRect(50, y, W - 100, 2); y += 14;
  const items = p.items || [];
  const area = H - 150 - y;
  let fs = 36, lh = 56;
  if (items.length * lh > area) { fs = 30; lh = 46; }
  if (items.length * lh > area) { fs = 25; lh = 38; }
  const maxRows = Math.floor(area / lh);
  const shown = items.length > maxRows ? items.slice(0, maxRows - 1) : items;
  for (const it of shown) {
    const cy = y + lh / 2;
    g.strokeStyle = '#161A21'; g.lineWidth = 3; g.strokeRect(52, cy - fs * 0.42, fs * 0.84, fs * 0.84);
    g.font = `700 ${fs + 4}px ${D}`; g.textAlign = 'right'; g.fillText(qty(it.cant), 52 + fs + 110, cy + fs * 0.36); g.textAlign = 'left';
    g.font = `500 ${fs}px ${B}`; g.fillText(fit(it.nombre + (it.codigo ? '  ·  ' + it.codigo : ''), W - 100 - (fs + 130)), 52 + fs + 130, cy + fs * 0.34);
    g.strokeStyle = '#D5D8DD'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(50, y + lh); g.lineTo(W - 50, y + lh); g.stroke();
    y += lh;
  }
  if (shown.length < items.length) { g.font = `600 ${fs}px ${B}`; g.fillStyle = '#9C620C'; g.fillText(`+ ${items.length - shown.length} productos más — ver boleta o PDF`, 52, y + lh * 0.62); g.fillStyle = '#161A21'; }
  g.fillRect(50, H - 120, W - 100, 3);
  g.font = `500 32px ${B}`; g.fillText('Bultos: ______', 50, H - 62); g.fillText('Armó: __________', 380, H - 62);
  g.textAlign = 'right'; g.fillText('Controló: ______', W - 50, H - 62);
  return await new Promise((res) => cv.toBlob(res, 'image/png'));
}

/* ---------- CSV / respaldo ---------- */
const csvNum = (v) => String(round2(v)).replace('.', ',');
function toCSV(rows) {
  const esc = (v) => { const s = v == null ? '' : String(v); return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return '﻿' + rows.map((r) => r.map(esc).join(';')).join('\r\n');
}
function parseCSV(text) {
  const t = String(text || '').replace(/^﻿/, '').trim();
  if (!t) return [];
  const first = t.split(/\r?\n/)[0];
  const sep = ['\t', ';', ','].map((s) => [s, first.split(s).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === sep) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  row.push(cell); rows.push(row);
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some(Boolean));
}

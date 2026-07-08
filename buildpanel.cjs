/**
 * buildpanel.cjs — Generador del panel de gestión GURAH.
 *
 * Patrón heredado de Kirana: se EDITA este generador (y sus snippets), NUNCA los
 * archivos generados en src/generated/. Produce:
 *   - src/generated/panel.css        (estilos)
 *   - src/generated/panel-markup.html (markup de pestañas)
 *   - src/generated/panel-app.js     (lógica cliente; expone window.PANEL)
 *
 * El panel consume las APIs protegidas /api/panel/*. Pestañas:
 *   Apartamentos · Reservas · Facturas · Ingresos/Gastos · Contabilidad · Clientes · Canales · Reseñas
 */

const fs = require('node:fs');
const path = require('node:path');

const OUT = path.join(__dirname, 'src', 'generated');
fs.mkdirSync(OUT, { recursive: true });

const TABS = [
  { id: 'apartamentos', label: 'Apartamentos' },
  { id: 'reservas', label: 'Reservas' },
  { id: 'facturas', label: 'Facturas' },
  { id: 'gastos', label: 'Ingresos / Gastos' },
  { id: 'contabilidad', label: 'Contabilidad' },
  { id: 'impuestos', label: 'Impuestos' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'marketing', label: 'Email marketing' },
  { id: 'canales', label: 'Canales (iCal)' },
  { id: 'resenas', label: 'Reseñas (IA)' },
];

// --- CSS ---------------------------------------------------------------------
const css = `
:root{--verde:#46554a;--verde2:#37433b;--salvia:#8a9a8c;--arena:#efe8db;--crema:#f6f1e8;--tinta:#23221e;--gris:#8a8478;--linea:#e4dccd;--dorado:#b7a488;--rojo:#b4462f}
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:var(--tinta);background:var(--crema);overflow-x:hidden}
.card{overflow-x:auto}
.panel-top{display:flex;align-items:center;justify-content:space-between;padding:14px 22px;background:var(--verde);color:#fff}
.panel-top strong{font-size:18px;letter-spacing:.04em}
.panel-top .demo{background:#ffd257;color:#5b4a00;font-size:12px;font-weight:600;padding:3px 9px;border-radius:20px;margin-left:10px}
.panel-top a{color:#fff;text-decoration:none;font-size:14px;opacity:.9}
.tabs{display:flex;flex-wrap:wrap;gap:4px;padding:0 16px;background:#fff;border-bottom:1px solid var(--linea);position:sticky;top:0;z-index:5}
.tabs button{border:0;background:none;padding:14px 16px;font-size:14px;color:var(--gris);cursor:pointer;border-bottom:3px solid transparent}
.tabs button.active{color:var(--verde);border-bottom-color:var(--verde);font-weight:600}
.tab-badge{display:inline-block;min-width:18px;height:18px;line-height:18px;padding:0 5px;margin-left:6px;background:var(--rojo);color:#fff;border-radius:10px;font-size:11px;font-weight:700;text-align:center;vertical-align:middle}
.rev.nueva{background:#fbf5e3;border-radius:10px;padding:16px;margin:8px 0}
.rev-nueva-tag{display:inline-block;background:#ffd257;color:#5b4a00;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;margin-left:8px}
.aviso{display:flex;align-items:center;gap:10px;background:#fff6d9;border:1px solid #e8d48a;color:#6b5600;border-radius:12px;padding:12px 14px;margin-bottom:16px;font-size:14px}
.mkt-grid{display:grid;grid-template-columns:1.6fr 1fr;gap:16px}
@media(max-width:820px){.mkt-grid{grid-template-columns:1fr}}
.mkt-lb{display:block;font-size:12px;color:var(--gris);margin:10px 0 4px;font-weight:600}
.mkt-in{width:100%;padding:9px 11px;border:1px solid var(--linea);border-radius:8px;font:inherit;font-size:14px}
textarea.mkt-in{resize:vertical;line-height:1.5}
.mkt-row{display:flex;gap:10px;flex-wrap:wrap}
.mkt-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:14px}
.mkt-sel{padding:8px 10px;border:1px solid var(--linea);border-radius:8px;font:inherit}
.mkt-aside{background:var(--arena)}
.mkt-total{font-size:22px;color:var(--verde)}
.mkt-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.mkt-chip{background:#fff;border:1px solid var(--linea);border-radius:20px;padding:4px 11px;font-size:13px}
.mkt-chip b{color:var(--verde);margin-left:3px}
.mkt-mail{border:1px solid var(--linea);border-radius:12px;overflow:hidden;margin-top:6px;max-width:520px}
.mkt-mail-h{background:var(--verde);color:#fff;text-align:center;letter-spacing:.22em;padding:14px;font-size:18px}
.mkt-mail-sub{padding:14px 16px 0;font-weight:700;font-size:16px}
.mkt-mail-body{padding:10px 16px 18px;color:#3a382f;font-size:14px;line-height:1.6}
.gasto-form{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end}
.gasto-form label{display:flex;flex-direction:column;font-size:12px;color:var(--gris);gap:3px;flex:1;min-width:120px}
.gasto-form input,.gasto-form select{padding:8px 10px;border:1px solid var(--linea);border-radius:8px;font:inherit;font-size:14px}
.gasto-form .btn{min-width:120px}
.mod-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:760px){.mod-grid{grid-template-columns:1fr}}
.mod{border:1px solid var(--linea);border-radius:12px;padding:16px 18px;background:#fff}
.mod h4{margin:0 0 4px;font-size:15px}
.mod .cas{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--linea);font-size:14px}
.mod .cas:last-child{border-bottom:0}
.mod .cas b{font-variant-numeric:tabular-nums}
.mod .res{display:flex;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:2px solid var(--verde);font-size:16px;font-weight:700}
.mod .cnum{color:var(--gris);font-size:11px}
.aviso-fiscal{background:#fff6d9;border:1px solid #e8d48a;color:#6b5600;border-radius:12px;padding:12px 14px;margin-top:16px;font-size:13px}
.tabpage{display:none;padding:22px;max-width:1100px;margin:0 auto}
.tabpage.active{display:block}
.card{background:#fff;border:1px solid var(--linea);border-radius:14px;padding:18px;margin-bottom:16px}
.apt-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.apt-head h3{margin:0 0 4px}
.badge{font-size:12px;padding:2px 8px;border-radius:20px;background:var(--arena);color:var(--gris)}
.badge.on{background:#d8f0e6;color:var(--verde)}
.badge.off{background:#f3d9d2;color:var(--rojo)}
.badge.pend{background:#fff2cc;color:#8a6d00}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:12px 0}
.field label{display:block;font-size:12px;color:var(--gris);margin-bottom:3px}
.field input,.field select{width:100%;padding:8px;border:1px solid var(--linea);border-radius:8px;font-size:14px}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{text-align:left;padding:8px;border-bottom:1px solid var(--linea)}
th{color:var(--gris);font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.03em}
.btn{border:0;border-radius:8px;padding:9px 14px;font-size:14px;font-weight:600;cursor:pointer;background:var(--verde);color:#fff}
.btn.sec{background:var(--arena);color:var(--tinta)}
.btn.warn{background:var(--rojo);color:#fff}
.btn:disabled{opacity:.5;cursor:default}
.seasons td input{width:100%}
.muted{color:var(--gris);font-size:13px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px}
.kpi{background:#fff;border:1px solid var(--linea);border-radius:14px;padding:16px}
.kpi label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--gris);margin-bottom:6px}
.kpi b{display:block;font-size:28px;font-weight:600;color:var(--tinta);line-height:1.1}
.kpi span{font-size:12px;color:var(--gris)}
.kpi span.up{color:#2e7d54}.kpi span.down{color:var(--rojo)}
.subttl{margin:0 0 2px}.lead{color:var(--gris);font-size:13px;margin:0 0 16px}
.rev{border-top:1px solid var(--linea);padding:16px 0}.rev:first-child{border-top:0}
.rev-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.rev-orig{margin:8px 0 0}
.rev-trad{margin:8px 0 0;background:var(--arena);border-radius:8px;padding:9px 11px;font-size:14px}
.demoline{display:inline-block;border:1px solid #d8c48a;color:#8a6d00;background:#fbf5e3;border-radius:20px;padding:6px 12px;font-size:11px;letter-spacing:.05em;text-transform:uppercase;margin-bottom:16px}
/* Píldoras de canal y estado */
.pill{display:inline-block;font-size:12px;padding:3px 10px;border-radius:20px;background:var(--arena);color:var(--gris);white-space:nowrap}
.pill.directa{background:#d8f0e6;color:var(--verde)}
.pill.booking{background:#dbe7f6;color:#26568f}
.pill.ota{background:#efe2f4;color:#7a4b8f}
.pill.tel{background:#e7efd8;color:#5b7a2e}
.pill.encasa{background:#d8f0e6;color:var(--verde)}
.pill.confirmada{background:#fff2cc;color:#8a6d00}
.pill.pasada{background:#eee9df;color:var(--gris)}
.pill.pendiente{background:#fff2cc;color:#8a6d00}
.pill.cobrada{background:#d8f0e6;color:var(--verde)}
/* Calendario de ocupación (tipo Gantt) */
.cal-wrap{overflow-x:auto}
.cal{border-collapse:collapse;font-size:11px;min-width:640px;width:100%;table-layout:fixed}
.cal th,.cal td{border:1px solid var(--linea);padding:0;text-align:center;height:26px}
.cal th.room,.cal td.room{width:120px;text-align:left;padding:0 8px;font-size:12px;white-space:nowrap;position:sticky;left:0;background:#fff;z-index:1}
.cal th{color:var(--gris);font-weight:600;height:22px}
.cal th.wknd,.cal td.wknd{background:var(--crema)}
.cal td.today{box-shadow:inset 0 0 0 2px var(--verde)}
.cal .bar{background:var(--verde);color:#fff;border-radius:6px;font-size:10px;line-height:20px;height:20px;margin:3px 1px;overflow:hidden;white-space:nowrap;padding:0 6px}
.cal .bar.c2{background:var(--salvia)}.cal .bar.c3{background:var(--dorado)}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:middle}
.legend{display:flex;flex-wrap:wrap;gap:14px;margin-top:12px;font-size:12px;color:var(--gris)}
/* Gráfico de barras (ingresos por mes) */
.bars{display:flex;align-items:flex-end;gap:8px;height:180px;padding-top:24px}
.bars .b{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end}
.bars .b i{display:block;width:100%;max-width:34px;background:var(--verde);border-radius:6px 6px 0 0;position:relative}
.bars .b i.alt{background:var(--dorado)}
.bars .b em{font-size:10px;color:var(--gris);font-style:normal}
.bars .b small{font-size:9px;color:var(--tinta);font-weight:600}
.pos{color:#2e7d54;font-weight:600}.neg{color:var(--rojo);font-weight:600}
.infocard{display:flex;gap:14px;align-items:flex-start}
.infocard .tag{background:var(--verde);color:#fff;border-radius:10px;padding:12px 14px;font-size:12px;text-align:center;line-height:1.3;min-width:96px}
.rowbtn{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.btn.sec{padding:6px 12px;font-size:13px}
.fac-ver{background:var(--arena);color:var(--tinta);white-space:nowrap}
.qrdot{color:var(--verde)}
.tbaiid{margin-top:2px}
/* Barra de periodo (Contabilidad) */
.toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px}
.toolbar select{padding:8px 10px;border:1px solid var(--linea);border-radius:8px;font-size:14px;background:#fff;color:var(--tinta)}
/* Modal de factura */
.facmodal{position:fixed;inset:0;background:rgba(20,19,16,.55);z-index:60;display:flex;align-items:center;justify-content:center;padding:16px}
.facbox{background:#fff;max-width:640px;width:100%;border-radius:16px;padding:22px;max-height:92vh;overflow:auto}
.facbar{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px}
.facgrid{display:grid;grid-template-columns:1.4fr 1fr;gap:22px}
.facgrid table td{padding:6px 0;border-bottom:1px solid var(--linea)}
.tbaibox{text-align:center;background:var(--arena);border-radius:12px;padding:16px}
.tbaihdr{margin-bottom:10px}
.tag2{background:var(--verde);color:#fff;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px}
@media(max-width:560px){.facgrid{grid-template-columns:1fr}}
.toast{position:fixed;bottom:20px;right:20px;background:var(--tinta);color:#fff;padding:12px 18px;border-radius:10px;opacity:0;transition:.3s;pointer-events:none}
.toast.show{opacity:1}
@media(max-width:600px){.tabpage{padding:14px}.kpi b{font-size:23px}}
`.trim();

// --- Markup ------------------------------------------------------------------
const tabButtons = TABS.map(
  (t, i) => `<button data-tab="${t.id}" class="${i === 0 ? 'active' : ''}">${t.label}${t.id === 'resenas' ? '<span class="tab-badge" data-badge-resenas hidden></span>' : ''}</button>`,
).join('');
const tabPages = TABS.map(
  (t, i) => `<section class="tabpage ${i === 0 ? 'active' : ''}" id="tab-${t.id}"><div class="muted">Cargando…</div></section>`,
).join('\n');

const markup = `
<div class="panel-top">
  <div><strong>GURAH</strong> · Panel de gestión <span class="demo" id="demoBadge" hidden>MODO DEMO</span></div>
  <a href="/panel/logout">Cerrar sesión →</a>
</div>
<nav class="tabs">${tabButtons}</nav>
${tabPages}
<div class="facmodal" id="facModal" style="display:none"><div class="facbox" id="facBody"></div></div>
<div class="toast" id="toast"></div>
`.trim();

// --- App JS ------------------------------------------------------------------
const appjs = `
// window.PANEL — lógica del panel GURAH (generado por buildpanel.cjs).
(function(){
  const SERVICIOS = ${JSON.stringify(require('./src/lib/servicios.cjs'))};
  let state = { apartments: [], blocks: {}, bookings: [], invoices: [], expenses: [], customers: [], reviews: [], feeds: {} };
  var contab = { y: String(new Date().getFullYear()), p: 'all' }; // filtro de Contabilidad
  var imp = { y: String(new Date().getFullYear()), p: 'T' + (Math.floor(new Date().getMonth() / 3) + 1) }; // filtro de Impuestos

  function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); }
  function eur(n){ return (Number(n)||0).toLocaleString('es-ES',{maximumFractionDigits:0})+' €'; }
  function eur2(n){ return (Number(n)||0).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})+' €'; }
  var MESES=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  function todayISO(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function aptNombre(id){ return (state.apartments.find(function(a){return a.id===id;})||{}).nombre||id; }
  function canalClass(c){ c=(c||'').toLowerCase(); if(c.indexOf('directa')>=0)return'directa'; if(c.indexOf('booking')>=0)return'booking'; if(c.indexOf('expedia')>=0||c.indexOf('vrbo')>=0||c.indexOf('airbnb')>=0)return'ota'; if(c.indexOf('tel')>=0||c.indexOf('whats')>=0)return'tel'; return''; }
  function estadoReserva(b){ var t=todayISO(); if(b.salida<=t)return{k:'pasada',t:'Pasada'}; if(b.entrada<=t)return{k:'encasa',t:'En casa'}; return{k:'confirmada',t:'Confirmada'}; }
  function diasDelMes(y,m){ return new Date(y,m+1,0).getDate(); }
  function isDemo(){ return state.bookings.some(function(b){return b.demo;})||state.invoices.some(function(f){return f.demo;}); }
  function facturaDe(bookingId){ return state.invoices.find(function(f){return f.bookingId===bookingId;}); }
  // QR visual TicketBAI (representativo): patrón determinista a partir del id.
  function hashStr(s){ var h=2166136261; for(var i=0;i<(s||'').length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619);} return h>>>0; }
  function qrSVG(text,size){
    size=size||124; var n=25, cell=size/n, sc='#23221e', seed=hashStr(text)||1;
    function rnd(){ seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;seed>>>=0; return seed/4294967296; }
    var r='';
    for(var y=0;y<n;y++){for(var x=0;x<n;x++){ if((x<8&&y<8)||(x>n-9&&y<8)||(x<8&&y>n-9))continue; if(rnd()>0.52)r+='<rect x="'+(x*cell)+'" y="'+(y*cell)+'" width="'+cell+'" height="'+cell+'" fill="'+sc+'"/>'; }}
    function fnd(x,y){ r+='<rect x="'+(x*cell)+'" y="'+(y*cell)+'" width="'+(7*cell)+'" height="'+(7*cell)+'" fill="'+sc+'"/><rect x="'+((x+1)*cell)+'" y="'+((y+1)*cell)+'" width="'+(5*cell)+'" height="'+(5*cell)+'" fill="#fff"/><rect x="'+((x+2)*cell)+'" y="'+((y+2)*cell)+'" width="'+(3*cell)+'" height="'+(3*cell)+'" fill="'+sc+'"/>'; }
    fnd(0,0); fnd(n-7,0); fnd(0,n-7);
    return '<svg viewBox="0 0 '+size+' '+size+'" width="'+size+'" height="'+size+'" style="background:#fff;border-radius:8px;padding:6px">'+r+'</svg>';
  }
  function verFactura(id){
    var f=state.invoices.find(function(x){return x.id===id;}); if(!f)return;
    var bk=state.bookings.find(function(b){return b.id===f.bookingId;});
    var est=f.estado==='cobrada'?'<span class="pill cobrada">Cobrada</span>':'<span class="pill pendiente">Pendiente</span>';
    var tb=f.tbai||{};
    var body=document.getElementById('facBody');
    body.innerHTML=
      '<div class="facbar"><div><strong style="font-size:18px">Factura '+f.id+'</strong> '+est+'<div class="muted">'+fmt(f.fecha)+' · '+(bk?aptNombre(bk.apartmentId):'')+'</div></div>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sec" id="facPrint">🖨 Imprimir / PDF</button><button class="btn" id="facSend">✉ Enviar al cliente</button><button class="btn sec" id="facClose">Cerrar</button></div></div>'+
      '<div class="muted" id="facSendStatus" style="text-align:right;margin:-8px 0 8px;min-height:16px"></div>'+
      '<div class="facgrid"><div>'+
        '<div class="muted">Cliente</div><div><strong>'+f.cliente.nombre+'</strong><br><span class="muted">'+(f.cliente.email||'')+'</span></div>'+
        '<div class="muted" style="margin-top:12px">Concepto</div><div>'+f.concepto+(bk?' ('+fmt(bk.entrada)+' → '+fmt(bk.salida)+')':'')+'</div>'+
        '<table style="margin-top:14px"><tr><td class="muted">Base imponible</td><td style="text-align:right">'+eur2(f.base)+'</td></tr>'+
        '<tr><td class="muted">IVA ('+f.ivaPct+'% alojamiento)</td><td style="text-align:right">'+eur2(f.iva)+'</td></tr>'+
        '<tr><td><strong>Total</strong></td><td style="text-align:right"><strong>'+eur2(f.total)+'</strong></td></tr></table>'+
      '</div><div class="tbaibox">'+
        '<div class="tbaihdr"><span class="tag2">TicketBAI · Batuz</span></div>'+
        qrSVG(tb.tbaiId||f.id,140)+
        '<div class="muted" style="font-size:10px;word-break:break-all;margin-top:8px">'+(tb.tbaiId||'—')+'</div>'+
        '<div class="muted" style="font-size:11px;margin-top:6px">'+(tb.firmadoReal?'Firmada y enviada a Hacienda Foral de Bizkaia.':'Demostración · al activarla, cada factura se firma y se declara a Hacienda automáticamente.')+'</div>'+
      '</div></div>';
    var m=document.getElementById('facModal'); m.style.display='flex';
    document.getElementById('facClose').onclick=closeFac;
    document.getElementById('facPrint').onclick=function(){ window.open('/api/panel/invoice-send?id='+encodeURIComponent(f.id),'_blank'); };
    document.getElementById('facSend').onclick=async function(){
      var st=document.getElementById('facSendStatus');
      if(!f.cliente || !f.cliente.email){ st.textContent='La factura no tiene email del cliente.'; return; }
      if(!confirm('¿Enviar la factura '+f.id+' por email a '+f.cliente.email+'?')) return;
      st.textContent='Enviando…';
      var r=await api('/api/panel/invoice-send',{invoiceId:f.id});
      if(r.ok){ st.textContent=r.demo?('Demostración · se enviaría automáticamente a '+r.to):('Enviada a '+r.to); toast(r.demo?'Envío de ejemplo':'Factura enviada'); }
      else { st.textContent=r.error||'error'; }
    };
    m.onclick=function(e){ if(e.target===m)closeFac(); };
  }
  function closeFac(){ document.getElementById('facModal').style.display='none'; }
  async function api(url, body){
    const opt = body ? {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)} : {};
    const r = await fetch(url, opt); return r.json();
  }

  async function load(){
    const [a,d] = await Promise.all([api('/api/panel/apartments'), api('/api/panel/data')]);
    if(a.ok){ state.apartments=a.apartments; state.blocks=a.blocks||{}; }
    if(d.ok){ state.bookings=d.bookings; state.invoices=d.invoices; state.expenses=d.expenses; state.customers=d.customers; state.reviews=d.reviews||[]; state.feeds=d.feeds||{}; }
    renderAll();
  }

  // --- Apartamentos ---------------------------------------------------------
  function renderApartamentos(){
    const el = document.getElementById('tab-apartamentos');
    el.innerHTML = state.apartments.map(function(a){
      const seasons = (a.tarifas_temporada||[]).map(function(t,i){
        return '<tr><td><input value="'+t.nombre+'" data-f="nombre" data-i="'+i+'"></td>'+
          '<td><input value="'+t.desde+'" data-f="desde" data-i="'+i+'" size="5"></td>'+
          '<td><input value="'+t.hasta+'" data-f="hasta" data-i="'+i+'" size="5"></td>'+
          '<td><input type="number" value="'+t.precio+'" data-f="precio" data-i="'+i+'"></td>'+
          '<td><input type="number" value="'+(t.estancia_minima||'')+'" data-f="estancia_minima" data-i="'+i+'"></td></tr>';
      }).join('');
      const pend = (a.pendiente_cliente&&a.pendiente_cliente.length) ? '<span class="badge pend">PENDIENTE: '+a.pendiente_cliente.join(', ')+'</span>' : '';
      return '<div class="card" data-apt="'+a.id+'">'+
        '<div class="apt-head"><div><h3>'+a.nombre+'</h3><div class="muted">'+a.concepto+' · '+a.ubicacion.texto+'</div><div style="margin-top:6px">'+
          '<span class="badge '+(a.estado==='activa'?'on':'off')+'">'+a.estado+'</span> '+pend+'</div></div>'+
          '<button class="btn '+(a.estado==='activa'?'warn':'')+'" data-act="toggle">'+(a.estado==='activa'?'Desactivar':'Activar')+'</button></div>'+
        '<div class="grid">'+
          '<div class="field"><label>m²</label><input type="number" data-e="m2" value="'+a.m2+'"></div>'+
          '<div class="field"><label>Dormitorios</label><input type="number" data-e="dormitorios" value="'+a.dormitorios+'"></div>'+
          '<div class="field"><label>Baños</label><input type="number" data-e="banos" value="'+a.banos+'"></div>'+
          '<div class="field"><label>Capacidad</label><input type="number" data-e="capacidad" value="'+a.capacidad+'"></div>'+
          '<div class="field"><label>Precio base €/noche</label><input type="number" data-e="precio_base" value="'+a.precio_base+'"></div>'+
          '<div class="field"><label>Estancia mínima</label><input type="number" data-e="estancia_minima" value="'+a.estancia_minima+'"></div>'+
          '<div class="field"><label>Ubicación</label><select data-e="ubicacion_tipo"><option value="campo"'+(a.ubicacion.tipo==='campo'?' selected':'')+'>Campo</option><option value="playa"'+(a.ubicacion.tipo==='playa'?' selected':'')+'>Playa</option></select></div>'+
        '</div>'+
        '<h4>Tarifas por temporada</h4>'+
        '<table class="seasons"><thead><tr><th>Temporada</th><th>Desde MM-DD</th><th>Hasta MM-DD</th><th>€/noche</th><th>Est. mín.</th></tr></thead><tbody>'+seasons+'</tbody></table>'+
        '<h4>Bloqueo de disponibilidad</h4>'+
        '<div class="field"><label>Fechas bloqueadas (YYYY-MM-DD separadas por coma)</label><input data-e="blocks" value="'+((state.blocks[a.id]||[]).join(', '))+'"></div>'+
        '<div style="margin-top:12px;display:flex;gap:8px"><button class="btn" data-act="save">Guardar cambios</button></div>'+
      '</div>';
    }).join('') || '<div class="muted">Sin apartamentos.</div>';

    el.querySelectorAll('.card').forEach(function(card){
      const id = card.getAttribute('data-apt');
      card.querySelector('[data-act="toggle"]').onclick = async function(){
        const a = state.apartments.find(x=>x.id===id);
        const r = await api('/api/panel/apartments',{action:'toggle',id:id,active:a.estado!=='activa'});
        if(r.ok){ state.apartments=r.apartments; renderApartamentos(); toast('Estado actualizado'); }
      };
      card.querySelector('[data-act="save"]').onclick = async function(){
        const g = function(k){ const e=card.querySelector('[data-e="'+k+'"]'); return e?e.value:null; };
        const patch = { m2:+g('m2'), dormitorios:+g('dormitorios'), banos:+g('banos'), capacidad:+g('capacidad'), precio_base:+g('precio_base'), estancia_minima:+g('estancia_minima') };
        const tipo = g('ubicacion_tipo');
        const a0 = state.apartments.find(x=>x.id===id);
        patch.ubicacion = Object.assign({}, a0.ubicacion, {tipo:tipo});
        const seasons = [].map.call(card.querySelectorAll('.seasons tbody tr'), function(tr){
          const gg=function(f){ const e=tr.querySelector('[data-f="'+f+'"]'); return e?e.value:''; };
          const em = gg('estancia_minima');
          return { nombre:gg('nombre'), desde:gg('desde'), hasta:gg('hasta'), precio:+gg('precio'), estancia_minima: em?+em:undefined };
        });
        await api('/api/panel/apartments',{action:'update',id:id,patch:patch});
        await api('/api/panel/apartments',{action:'seasons',id:id,tarifas_temporada:seasons});
        const dias = (g('blocks')||'').split(',').map(s=>s.trim()).filter(Boolean);
        const rb = await api('/api/panel/apartments',{action:'blocks',id:id,dias:dias});
        if(rb.ok) state.blocks=rb.blocks;
        toast('Cambios guardados'); load();
      };
    });
  }

  // Estado de pago efectivo. Reservas antiguas de ejemplo sin campo: pasadas =
  // cobradas, futuras = con garantía.
  function pagoEfectivo(b){ if(b.pagoEstado)return b.pagoEstado; return b.salida<=todayISO()?'cobrada':'garantizada'; }
  function pagoDe(b){
    var p=pagoEfectivo(b);
    if(p==='cobrada')return '<span class="pill cobrada">Cobrada</span>';
    if(p==='no_show')return '<span class="pill" style="background:#f3d9d2;color:#b4462f">No-show · 1 noche</span>';
    var lim=b.cancelableHasta?('<div class="muted" style="font-size:11px">cancela sin cargo hasta '+fmt(b.cancelableHasta)+'</div>'):'';
    return '<span class="pill" style="background:#f6eeda;color:#8a6d00">Garantía</span>'+lim;
  }
  function accionesPago(b,t){
    if(pagoEfectivo(b)!=='garantizada')return '<span class="muted">—</span>';
    var llegada = b.entrada<=t; // el cobro se hace el día de llegada en adelante
    var cobrar='<button class="btn" data-cobrar="'+b.id+'" data-tipo="cobro" style="padding:5px 10px;font-size:12px"'+(llegada?'':' title="Disponible el día de llegada"')+'>Cobrar</button>';
    var noshow='<button class="btn sec" data-cobrar="'+b.id+'" data-tipo="noshow" style="padding:5px 10px;font-size:12px">No-show</button>';
    return '<div style="display:flex;gap:6px;flex-wrap:wrap">'+cobrar+noshow+'</div>';
  }
  async function cobrarReserva(id,tipo){
    var esNo=tipo==='noshow';
    var b=(state.bookings||[]).find(function(x){return x.id===id;});
    var msg=esNo?'Registrar NO-SHOW y cobrar la primera noche de '+(b?b.huesped.nombre:'la reserva')+'?':'Cobrar la estancia completa de '+(b?b.huesped.nombre:'la reserva')+' (día de llegada)?';
    if(!confirm(msg))return;
    var r=await api('/api/panel/charge',{bookingId:id,tipo:esNo?'noshow':'cobro'});
    if(r.ok){
      if(b){ b.pagoEstado=r.pagoEstado; b.cargo=r.cargo; }
      if(r.invoice){ state.invoices=state.invoices||[]; state.invoices.push(r.invoice); }
      toast(r.demo?(esNo?'No-show registrado (demo)':'Cobro simulado'):(esNo?'No-show cobrado':'Cobrado')+' · '+eur(r.importe));
      renderReservas(); renderFacturas(); renderContabilidad();
    } else { toast(r.error||'Error en el cobro'); }
  }

  // --- Reservas -------------------------------------------------------------
  function renderReservas(){
    const el=document.getElementById('tab-reservas');
    var t=todayISO(), now=new Date(), y=now.getFullYear(), m=now.getMonth();
    var bks=state.bookings.filter(function(b){return b.estado!=='cancelada';});
    // KPIs
    var ndias=diasDelMes(y,m), napt=Math.max(1,state.apartments.length);
    var mesPref=y+'-'+String(m+1).padStart(2,'0');
    var nochesMes=0;
    bks.forEach(function(b){ for(var d=new Date(b.entrada+'T00:00:00');d<new Date(b.salida+'T00:00:00');d.setDate(d.getDate()+1)){ var iso=d.toISOString().slice(0,10); if(iso.slice(0,7)===mesPref)nochesMes++; } });
    var ocup=Math.round(nochesMes/(napt*ndias)*100);
    var activas=bks.filter(function(b){return b.salida>t;}).length;
    var entradasHoy=bks.filter(function(b){return b.entrada===t;}).length;
    var salidasHoy=bks.filter(function(b){return b.salida===t;}).length;
    var kpis='<div class="kpis">'+
      kpi('Ocupación (mes)',ocup+'%',MESES[m]+' '+y)+
      kpi('Reservas activas',activas,'próximas + en curso')+
      kpi('Entradas hoy',entradasHoy,'check-in 16:00')+
      kpi('Salidas hoy',salidasHoy,'check-out 11:00')+'</div>';
    // Calendario de ocupación del mes
    var cal=calendarioOcupacion(bks,y,m,ndias,t);
    // Próximas reservas (ordenadas por entrada desc)
    var ord=bks.slice().sort(function(a,b){return a.entrada<b.entrada?1:-1;});
    var rows=ord.map(function(b){
      var es=estadoReserva(b);
      var canal=b.canal||'Directa';
      var fac=facturaDe(b.id);
      var facCell=fac?('<button class="btn sec fac-ver" data-fac="'+fac.id+'">🧾 '+fac.id+'</button>'):'<span class="muted">—</span>';
      var pg=pagoDe(b);
      var accion=accionesPago(b,t);
      return '<tr><td><strong>'+b.huesped.nombre+'</strong><div class="muted">'+b.id+'</div></td>'+
        '<td>'+aptNombre(b.apartmentId)+'</td>'+
        '<td>'+fmt(b.entrada)+' → '+fmt(b.salida)+'</td>'+
        '<td>'+b.noches+'</td>'+
        '<td><span class="pill '+canalClass(canal)+'">'+canal+'</span></td>'+
        '<td><span class="pill '+es.k+'">'+es.t+'</span></td>'+
        '<td>'+pg+'</td>'+
        '<td>'+accion+'</td>'+
        '<td>'+facCell+'</td>'+
        '<td style="text-align:right"><strong>'+eur(b.total)+'</strong></td></tr>';
    }).join('');
    el.innerHTML=
      '<h2 class="subttl">Reservas</h2><p class="lead">Reservas con tarjeta de garantía: se cobran el día de llegada. Cancelación gratis según temporada (48 h en baja, 7 días en alta).</p>'+
      (isDemo()?'<div class="demoline">Demo · reservas de ejemplo · el cobro genera la factura con TicketBAI</div>':'')+
      kpis+
      '<div class="card"><div class="rowbtn"><h3 style="margin:0">Calendario · '+MESES[m]+' '+y+'</h3></div><div class="cal-wrap">'+cal+'</div>'+leyendaApts()+'</div>'+
      '<div class="card"><h3>Próximas reservas</h3><table><thead><tr><th>Huésped</th><th>Apartamento</th><th>Fechas</th><th>Noches</th><th>Canal</th><th>Estado</th><th>Pago</th><th>Acciones</th><th>Factura</th><th style="text-align:right">Total</th></tr></thead><tbody>'+(rows||'<tr><td colspan=10 class=muted>Sin reservas todavía.</td></tr>')+'</tbody></table></div>';
    el.querySelectorAll('.fac-ver').forEach(function(btn){ btn.onclick=function(){ verFactura(btn.getAttribute('data-fac')); }; });
    el.querySelectorAll('[data-cobrar]').forEach(function(btn){ btn.onclick=function(){ cobrarReserva(btn.getAttribute('data-cobrar'), btn.getAttribute('data-tipo')); }; });
  }
  function kpi(label,val,sub,cls){ return '<div class="kpi"><label>'+label+'</label><b>'+val+'</b><span class="'+(cls||'')+'">'+(sub||'')+'</span></div>'; }
  function fmt(iso){ if(!iso)return''; var p=iso.split('-'); return p[2]+'/'+p[1]; }
  function leyendaApts(){ return '<div class="legend">'+state.apartments.map(function(a,i){ return '<span><span class="dot" style="background:'+['#46554a','#8a9a8c','#b7a488','#37433b'][i%4]+'"></span>'+a.nombre+'</span>'; }).join('')+'</div>'; }
  function calendarioOcupacion(bks,y,m,ndias,t){
    var head='<tr><th class="room">Apartamento</th>';
    for(var d=1;d<=ndias;d++){ var wd=new Date(y,m,d).getDay(); var wknd=(wd===0||wd===6)?' wknd':''; head+='<th class="'+wknd.trim()+'">'+d+'</th>'; }
    head+='</tr>';
    var body=state.apartments.map(function(a,ai){
      var cells='<td class="room">'+a.nombre+'</td>';
      var d=1;
      while(d<=ndias){
        var iso=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
        var bk=bks.find(function(b){return b.apartmentId===a.id && b.entrada<=iso && b.salida>iso;});
        var wd=new Date(y,m,d).getDay(); var wknd=(wd===0||wd===6)?' wknd':''; var isToday=(iso===t)?' today':'';
        if(bk){
          // cuántos días de esta reserva caen dentro del mes desde d
          var span=0; var dd=d;
          while(dd<=ndias){ var i2=y+'-'+String(m+1).padStart(2,'0')+'-'+String(dd).padStart(2,'0'); if(bk.entrada<=i2 && bk.salida>i2){span++;dd++;}else break; }
          var nm=(bk.huesped.nombre||'').split(' ')[0];
          cells+='<td class="'+wknd.trim()+isToday.trim()+'" colspan="'+span+'"><div class="bar c'+((ai%3)+1)+'">'+nm+'</div></td>';
          d+=span;
        } else { cells+='<td class="'+(wknd+isToday).trim()+'"></td>'; d++; }
      }
      return '<tr>'+cells+'</tr>';
    }).join('');
    return '<table class="cal"><thead>'+head+'</thead><tbody>'+body+'</tbody></table>';
  }

  // --- Facturas -------------------------------------------------------------
  function renderFacturas(){
    const el=document.getElementById('tab-facturas');
    var y=new Date().getFullYear();
    var añoInv=state.invoices.filter(function(f){return (f.fecha||'').slice(0,4)==String(y);});
    var facturado=añoInv.reduce(function(s,f){return s+f.total;},0);
    var ivaRep=añoInv.reduce(function(s,f){return s+(f.iva||0);},0);
    var pend=state.invoices.filter(function(f){return f.estado==='pendiente';}).reduce(function(s,f){return s+f.total;},0);
    var kpis='<div class="kpis">'+
      kpi('Facturado ('+y+')',eur(facturado),'base + IVA')+
      kpi('Emitidas',añoInv.length,String(y))+
      kpi('Pendientes de cobro',eur(pend),'por cobrar')+
      kpi('IVA repercutido',eur(ivaRep),'10% alojamiento')+'</div>';
    var info='<div class="card"><div class="infocard"><div class="tag">TicketBAI<br><strong>Batuz · Bizkaia</strong></div>'+
      '<div class="muted" style="font-size:13px;line-height:1.5"><strong style="color:var(--tinta)">Facturación conectada a la Hacienda Foral de Bizkaia.</strong> Obligatorio desde el 1 de enero de 2026: cada factura se firma digitalmente, se encadena con la anterior, lleva <strong style="color:var(--tinta)">código TBAI + QR</strong> y se anota en el LROE. '+
      (isDemo()?'<em>Demo:</em> la firma y el envío reales los realiza un software garante homologado + certificado digital; este panel organiza los datos.':'')+'</div></div></div>';
    const rows=state.invoices.slice().sort(function(a,b){return a.fecha<b.fecha?1:-1;}).map(function(f){
      var est=f.estado==='cobrada'?'<span class="pill cobrada">Cobrada</span>':'<span class="pill pendiente">Pendiente</span>';
      var tbai=f.tbai?('<div class="muted tbaiid" style="font-size:10px" title="'+f.tbai.qrUrl+'"><span class="qrdot">▦</span> '+f.tbai.tbaiId+(f.tbai.firmadoReal?'':' · demo')+'</div>'):'';
      return '<tr><td><strong>'+f.id+'</strong>'+tbai+'</td><td>'+fmt(f.fecha)+'</td><td>'+f.cliente.nombre+'</td><td>'+f.concepto+'</td><td style="text-align:right">'+eur2(f.total)+'</td><td>'+est+'</td><td style="text-align:right"><button class="btn sec fac-ver" data-fac="'+f.id+'">Ver</button></td></tr>';
    }).join('');
    el.innerHTML=
      '<h2 class="subttl">Facturas</h2><p class="lead">Emisión y seguimiento de facturas.</p>'+
      (isDemo()?'<div class="demoline">Demo · facturas de ejemplo</div>':'')+
      kpis+info+
      '<div class="card"><h3>Facturas emitidas</h3><table><thead><tr><th>Nº / TBAI</th><th>Fecha</th><th>Cliente</th><th>Concepto</th><th style="text-align:right">Total</th><th>Estado</th><th></th></tr></thead><tbody>'+(rows||'<tr><td colspan=7 class=muted>Sin facturas.</td></tr>')+'</tbody></table></div>';
    el.querySelectorAll('.fac-ver').forEach(function(btn){ btn.onclick=function(){ verFactura(btn.getAttribute('data-fac')); }; });
  }

  // --- Ingresos/Gastos ------------------------------------------------------
  function renderGastos(){
    const el=document.getElementById('tab-gastos');
    var now=new Date(), y=now.getFullYear(), m=now.getMonth();
    var añoInv=state.invoices.filter(function(f){return (f.fecha||'').slice(0,4)==String(y);});
    var mesPref=y+'-'+String(m+1).padStart(2,'0');
    var ingMes=añoInv.filter(function(f){return (f.fecha||'').slice(0,7)===mesPref;}).reduce(function(s,f){return s+f.total;},0);
    var ingAño=añoInv.reduce(function(s,f){return s+f.total;},0);
    var bks=state.bookings.filter(function(b){return b.estado!=='cancelada';});
    var totNoches=bks.reduce(function(s,b){return s+(b.noches||0);},0);
    var totBk=bks.reduce(function(s,b){return s+(b.total||0);},0);
    var adr=totNoches?Math.round(totBk/totNoches):0;
    var estMedia=bks.length?(totNoches/bks.length):0;
    var kpis='<div class="kpis">'+
      kpi('Ingresos (mes)',eur(ingMes),MESES[m]+' '+y)+
      kpi('Ingresos ('+y+')',eur(ingAño),'acumulado')+
      kpi('Tarifa media (ADR)',eur(adr),'por noche')+
      kpi('Estancia media',estMedia.toFixed(1),'noches/reserva')+'</div>';
    // Barras por mes
    var porMes=new Array(12).fill(0);
    añoInv.forEach(function(f){ var mm=parseInt((f.fecha||'').slice(5,7),10)-1; if(mm>=0&&mm<12)porMes[mm]+=f.total; });
    var max=Math.max.apply(null,porMes.concat([1]));
    var bars=porMes.map(function(v,i){ var h=Math.round(v/max*100); return '<div class="b"><small>'+(v?eur(v):'')+'</small><i class="'+(i===m?'alt':'')+'" style="height:'+h+'%"></i><em>'+MESES[i]+'</em></div>'; }).join('');
    // Gastos
    var exps=(state.expenses||[]).slice().sort(function(a,b){return a.fecha<b.fecha?1:-1;});
    var gTotal=exps.reduce(function(s,e){return s+(e.importe||0);},0);
    var gIva=exps.reduce(function(s,e){return s+(e.iva||0);},0);
    function baseDe(e){ return e.base!=null?e.base:round2((e.importe||0)-(e.iva||0)); }
    var grows=exps.map(function(e){
      var adj=e.adjunto?'<a class="btn sec" style="padding:3px 8px;font-size:12px" href="/api/panel/expenses?file='+e.id+'" target="_blank">📎 ver</a>':'<span class="muted">—</span>';
      var del=(''+e.id).charAt(0)==='g'?'<button class="btn sec" data-delgasto="'+e.id+'" style="padding:3px 9px;font-size:12px">✕</button>':'';
      return '<tr><td>'+fmt(e.fecha)+'</td><td>'+(e.proveedor?'<strong>'+e.proveedor+'</strong><br>':'')+'<span class="muted">'+e.concepto+'</span></td><td><span class="pill">'+(e.categoria||'—')+'</span></td>'+
        '<td style="text-align:right">'+eur2(baseDe(e))+'</td><td style="text-align:right" class="muted">'+eur2(e.iva||0)+(e.ivaPct!=null?' <span style="font-size:11px">('+e.ivaPct+'%)</span>':'')+'</td>'+
        '<td style="text-align:right" class="neg">−'+eur2(e.importe)+'</td><td style="text-align:center">'+adj+'</td><td style="text-align:center">'+del+'</td></tr>';
    }).join('');
    var cats=['Suministros','Limpieza','Mantenimiento','Comisiones','Marketing','Seguros','Amueblado','Amortización','Gestoría','Otros'];
    var form='<div class="card"><h3>Subir factura de gasto</h3><p class="muted" style="margin-top:0">Registra la factura y su IVA. Alimenta el cálculo del IVA a pagar (Impuestos).</p>'+
      '<div class="gasto-form">'+
      '<label>Fecha<input type="date" id="gf-fecha" value="'+todayISO()+'"></label>'+
      '<label>Proveedor<input id="gf-prov" placeholder="Ej. Iberdrola"></label>'+
      '<label style="flex:2">Concepto<input id="gf-con" placeholder="Ej. Luz junio"></label>'+
      '<label>Categoría<select id="gf-cat">'+cats.map(function(c){return '<option>'+c+'</option>';}).join('')+'</select></label>'+
      '<label>Base (€)<input type="number" step="0.01" id="gf-base" placeholder="0,00"></label>'+
      '<label>IVA<select id="gf-iva"><option value="21">21%</option><option value="10">10%</option><option value="4">4%</option><option value="0">0%</option></select></label>'+
      '<label>Factura (PDF/foto)<input type="file" id="gf-file" accept="image/*,application/pdf"></label>'+
      '<button class="btn" id="gf-add">Añadir gasto</button>'+
      '<span class="muted" id="gf-msg" style="align-self:center"></span>'+
      '</div></div>';
    el.innerHTML=
      '<h2 class="subttl">Ingresos / Gastos</h2><p class="lead">Evolución, y registro de facturas de gasto con su IVA.</p>'+
      (isDemo()?'<div class="demoline">Demo · datos de ejemplo</div>':'')+
      kpis+
      '<div class="card"><h3>Ingresos por mes · '+y+'</h3><div class="bars">'+bars+'</div></div>'+
      form+
      '<div class="card"><div class="rowbtn"><h3 style="margin:0">Gastos</h3><span class="muted">Total '+y+': <strong class="neg">'+eur(gTotal)+'</strong> · IVA soportado '+eur(gIva)+'</span></div><table><thead><tr><th>Fecha</th><th>Proveedor / concepto</th><th>Categoría</th><th style="text-align:right">Base</th><th style="text-align:right">IVA</th><th style="text-align:right">Total</th><th style="text-align:center">Factura</th><th></th></tr></thead><tbody>'+(grows||'<tr><td colspan=8 class=muted>Sin gastos todavía.</td></tr>')+'</tbody></table></div>';
    // Alta de gasto
    document.getElementById('gf-add').onclick=async function(){
      var msg=document.getElementById('gf-msg');
      var base=parseFloat(document.getElementById('gf-base').value);
      var con=document.getElementById('gf-con').value.trim();
      if(!con||!base){ msg.textContent='Pon concepto y base.'; return; }
      var gasto={ fecha:document.getElementById('gf-fecha').value, proveedor:document.getElementById('gf-prov').value.trim(), concepto:con, categoria:document.getElementById('gf-cat').value, base:base, ivaPct:parseFloat(document.getElementById('gf-iva').value) };
      var fi=document.getElementById('gf-file');
      msg.textContent='Guardando…';
      if(fi.files&&fi.files[0]){
        if(fi.files[0].size>4*1024*1024){ msg.textContent='El archivo supera 4 MB.'; return; }
        gasto.adjunto=await new Promise(function(res){ var r=new FileReader(); r.onload=function(){ res({nombre:fi.files[0].name,dataUrl:r.result}); }; r.readAsDataURL(fi.files[0]); });
      }
      var r=await api('/api/panel/expenses',{action:'add',gasto:gasto});
      if(r.ok){ toast('Gasto añadido'); load(); } else { msg.textContent=r.error||'Error'; }
    };
    el.querySelectorAll('[data-delgasto]').forEach(function(b){ b.onclick=async function(){ if(!confirm('¿Eliminar este gasto?'))return; var r=await api('/api/panel/expenses',{action:'delete',id:b.getAttribute('data-delgasto')}); if(r.ok){ toast('Gasto eliminado'); load(); } }; });
  }
  function round2(n){ return Math.round(n*100)/100; }
  // --- Contabilidad ---------------------------------------------------------
  function enPeriodo(fecha,p){
    if(p==='all')return true;
    var mm=parseInt((fecha||'').slice(5,7),10);
    if(p.charAt(0)==='T'){ var q=parseInt(p.slice(1),10); return mm>=(q-1)*3+1 && mm<=q*3; }
    return (fecha||'').slice(5,7)===p;
  }
  function periodoLabel(p){
    if(p==='all')return'Año completo';
    if(p.charAt(0)==='T')return'Trimestre '+p.slice(1);
    return MESES[parseInt(p,10)-1];
  }
  function renderContabilidad(){
    const el=document.getElementById('tab-contabilidad');
    // Años disponibles en los datos
    var years={};
    state.invoices.forEach(function(f){ var y=(f.fecha||'').slice(0,4); if(y)years[y]=1; });
    (state.expenses||[]).forEach(function(e){ var y=(e.fecha||'').slice(0,4); if(y)years[y]=1; });
    var yl=Object.keys(years).sort().reverse(); if(!yl.length)yl=[contab.y]; if(yl.indexOf(contab.y)<0)contab.y=yl[0];
    var Y=contab.y, P=contab.p;
    var inv=state.invoices.filter(function(f){return (f.fecha||'').slice(0,4)===Y && enPeriodo(f.fecha,P);});
    var gas=(state.expenses||[]).filter(function(e){return (e.fecha||'').slice(0,4)===Y && enPeriodo(e.fecha,P);});
    var ingresos=inv.reduce(function(s,f){return s+f.total;},0);
    var gastos=gas.reduce(function(s,e){return s+(e.importe||0);},0);
    var ivaRep=inv.reduce(function(s,f){return s+(f.iva||0);},0);
    var resultado=ingresos-gastos, margen=ingresos?Math.round(resultado/ingresos*100):0;
    // Selectores
    var yOpts=yl.map(function(y){return '<option value="'+y+'"'+(y===Y?' selected':'')+'>'+y+'</option>';}).join('');
    var pOpts=['all','T1','T2','T3','T4','01','02','03','04','05','06','07','08','09','10','11','12']
      .map(function(p){return '<option value="'+p+'"'+(p===P?' selected':'')+'>'+periodoLabel(p)+'</option>';}).join('');
    var toolbar='<div class="toolbar"><span class="muted">Periodo:</span>'+
      '<select id="ctY">'+yOpts+'</select>'+
      '<select id="ctP">'+pOpts+'</select>'+
      '<span class="muted">'+periodoLabel(P)+' '+Y+'</span>'+
      '<button class="btn sec" id="ctCSV" style="margin-left:auto">Exportar CSV</button></div>';
    var kpis='<div class="kpis">'+
      kpi('Ingresos',eur(ingresos),periodoLabel(P)+' '+Y)+
      kpi('Gastos',eur(gastos),'IVA rep. '+eur(ivaRep))+
      kpi('Resultado',eur(resultado),'ingresos − gastos')+
      kpi('Margen',margen+'%','sobre ingresos')+'</div>';
    var movs=[];
    inv.forEach(function(f){ movs.push({fecha:f.fecha,concepto:'Factura '+f.id+' · '+f.cliente.nombre,cat:'Ingreso alojamiento',iva:f.iva,imp:f.total,pos:true}); });
    gas.forEach(function(e){ movs.push({fecha:e.fecha,concepto:e.concepto,cat:e.categoria||'Gasto',iva:e.iva||0,imp:-e.importe,pos:false}); });
    movs.sort(function(a,b){return a.fecha<b.fecha?1:-1;});
    var rows=movs.map(function(mv){
      return '<tr><td>'+fmt(mv.fecha)+'</td><td>'+mv.concepto+'</td><td><span class="pill">'+mv.cat+'</span></td><td style="text-align:right">'+eur2(mv.iva)+'</td><td style="text-align:right" class="'+(mv.pos?'pos':'neg')+'">'+(mv.pos?'+':'−')+eur2(Math.abs(mv.imp))+'</td></tr>';
    }).join('');
    el.innerHTML=
      '<h2 class="subttl">Contabilidad</h2><p class="lead">Ingresos, gastos y resultado.</p>'+
      (isDemo()?'<div class="demoline">Demo · datos de ejemplo</div>':'')+
      '<div class="card">'+toolbar+kpis.replace('<div class="kpis">','<div class="kpis" style="margin-bottom:0">')+'</div>'+
      '<div class="card"><h3>Movimientos · '+periodoLabel(P)+' '+Y+' <span class="muted">('+movs.length+')</span></h3><table><thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th style="text-align:right">IVA</th><th style="text-align:right">Importe</th></tr></thead><tbody>'+(rows||'<tr><td colspan=5 class=muted>Sin movimientos en este periodo.</td></tr>')+'</tbody></table></div>';
    document.getElementById('ctY').onchange=function(){ contab.y=this.value; renderContabilidad(); };
    document.getElementById('ctP').onchange=function(){ contab.p=this.value; renderContabilidad(); };
    document.getElementById('ctCSV').onclick=function(){
      var csv='fecha,concepto,categoria,iva,importe\\n'+movs.map(function(mv){return [mv.fecha,'"'+mv.concepto+'"',mv.cat,mv.iva,mv.imp].join(',');}).join('\\n');
      var a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download='contabilidad-gurah-'+Y+'-'+P+'.csv'; a.click();
    };
  }

  // --- Impuestos (Modelo 303 IVA + Modelo 130 IRPF) -------------------------
  function baseGasto(e){ return e.base!=null?e.base:round2((e.importe||0)-(e.iva||0)); }
  function trimestreDe(fecha){ var mm=parseInt((fecha||'').slice(5,7),10); return Math.floor((mm-1)/3)+1; }
  function renderImpuestos(){
    var el=document.getElementById('tab-impuestos');
    var years={};
    state.invoices.forEach(function(f){ var y=(f.fecha||'').slice(0,4); if(y)years[y]=1; });
    (state.expenses||[]).forEach(function(e){ var y=(e.fecha||'').slice(0,4); if(y)years[y]=1; });
    var yl=Object.keys(years).sort().reverse(); if(!yl.length)yl=[imp.y]; if(yl.indexOf(imp.y)<0)imp.y=yl[0];
    var Y=imp.y, P=imp.p;
    var esTrim=P.charAt(0)==='T';
    // Periodo seleccionado
    var inv=state.invoices.filter(function(f){return (f.fecha||'').slice(0,4)===Y && enPeriodo(f.fecha,P);});
    var gas=(state.expenses||[]).filter(function(e){return (e.fecha||'').slice(0,4)===Y && enPeriodo(e.fecha,P);});
    var ivaRep=round2(inv.reduce(function(s,f){return s+(f.iva||0);},0));
    var ivaSop=round2(gas.reduce(function(s,e){return s+(e.iva||0);},0));
    var res303=round2(ivaRep-ivaSop);
    var baseIng=round2(inv.reduce(function(s,f){return s+(f.base||0);},0));
    var baseGas=round2(gas.reduce(function(s,e){return s+baseGasto(e);},0));
    // Modelo 130 (IRPF): acumulado del año hasta el trimestre
    function accBase(list,campo,q){ return list.filter(function(x){return (x.fecha||'').slice(0,4)===Y && trimestreDe(x.fecha)<=q;}).reduce(function(s,x){return s+(campo==='ing'?(x.base||0):baseGasto(x));},0); }
    var q=esTrim?parseInt(P.slice(1),10):4;
    var rendAcum=round2(accBase(state.invoices,'ing',q)-accBase(state.expenses||[],'gas',q));
    var rendPrev=round2(accBase(state.invoices,'ing',q-1)-accBase(state.expenses||[],'gas',q-1));
    var pago130=Math.max(0,round2(rendAcum*0.20));
    var pagoPrev=Math.max(0,round2(rendPrev*0.20));
    var pagar130=Math.max(0,round2(pago130-pagoPrev));
    // Selectores
    var yOpts=yl.map(function(y){return '<option value="'+y+'"'+(y===Y?' selected':'')+'>'+y+'</option>';}).join('');
    var pOpts=['T1','T2','T3','T4','all'].map(function(p){return '<option value="'+p+'"'+(p===P?' selected':'')+'>'+(p==='all'?'Año completo':'Trimestre '+p.slice(1))+'</option>';}).join('');
    var toolbar='<div class="toolbar"><span class="muted">Periodo:</span><select id="imY">'+yOpts+'</select><select id="imP">'+pOpts+'</select><span class="muted">'+(esTrim?('Trimestre '+P.slice(1)):'Año')+' '+Y+'</span><button class="btn sec" id="imPrint" style="margin-left:auto">🖨 Imprimir</button></div>';
    var kpis='<div class="kpis">'+
      kpi('IVA repercutido',eur(ivaRep),'cobrado a huéspedes')+
      kpi('IVA soportado',eur(ivaSop),'de tus gastos')+
      kpi('IVA a pagar (303)',eur(res303),res303>=0?'a ingresar':'a compensar')+
      kpi('IRPF estimado (130)',eur(pagar130),esTrim?'este trimestre':'selecc. trimestre')+'</div>';
    var m303='<div class="mod"><h4>Modelo 303 · IVA <span class="muted" style="font-weight:400;font-size:12px">('+(esTrim?'Trim. '+P.slice(1):'año')+' '+Y+')</span></h4>'+
      '<div class="cas"><span>IVA devengado (repercutido) <span class="cnum">casilla 27</span></span><b>'+eur2(ivaRep)+'</b></div>'+
      '<div class="cas"><span>IVA deducible (soportado) <span class="cnum">casilla 45</span></span><b>'+eur2(ivaSop)+'</b></div>'+
      '<div class="res"><span>Resultado '+(res303>=0?'a ingresar':'a compensar')+' <span class="cnum">casilla 71</span></span><b>'+eur2(Math.abs(res303))+'</b></div></div>';
    var m130=esTrim?('<div class="mod"><h4>Modelo 130 · IRPF <span class="muted" style="font-weight:400;font-size:12px">(acumulado a Trim. '+P.slice(1)+')</span></h4>'+
      '<div class="cas"><span>Ingresos − gastos (rendimiento) <span class="cnum">casilla 03</span></span><b>'+eur2(rendAcum)+'</b></div>'+
      '<div class="cas"><span>Pago a cuenta 20% <span class="cnum">casilla 04</span></span><b>'+eur2(pago130)+'</b></div>'+
      '<div class="cas"><span>Pagos de trimestres anteriores <span class="cnum">casilla 05</span></span><b>−'+eur2(pagoPrev)+'</b></div>'+
      '<div class="res"><span>A ingresar este trimestre <span class="cnum">casilla 19</span></span><b>'+eur2(pagar130)+'</b></div></div>'):
      '<div class="mod"><h4>Modelo 130 · IRPF</h4><p class="muted">Selecciona un trimestre para ver el pago fraccionado.</p></div>';
    el.innerHTML=
      '<h2 class="subttl">Impuestos</h2><p class="lead">Tu gestoría dentro del panel: el IVA a pagar y el IRPF, calculados y listos para presentar.</p>'+
      (isDemo()?'<div class="demoline">Demo · datos de ejemplo</div>':'')+
      '<div class="card">'+toolbar+kpis.replace('<div class="kpis">','<div class="kpis" style="margin-bottom:0">')+'</div>'+
      '<div class="card"><h3>Borradores para presentar</h3><div class="mod-grid">'+m303+m130+'</div>'+
      '<div class="aviso-fiscal">⚠️ <strong>Borrador orientativo.</strong> Te ahorra el trabajo de la gestoría, pero antes de presentar conviene una revisión: en <strong>Bizkaia (Batuz)</strong> los modelos forales pueden variar y hay gastos con IVA no deducible. Es una ayuda, no asesoramiento fiscal.</div>'+
      '</div>';
    document.getElementById('imY').onchange=function(){ imp.y=this.value; renderImpuestos(); };
    document.getElementById('imP').onchange=function(){ imp.p=this.value; renderImpuestos(); };
    document.getElementById('imPrint').onclick=function(){ window.print(); };
  }

  // --- Clientes -------------------------------------------------------------
  function renderClientes(){
    const el=document.getElementById('tab-clientes');
    var cs=state.customers||[];
    var repes=cs.filter(function(c){return (c.reservas||0)>1;}).length;
    const rows=cs.map(function(c){
      return '<tr><td>'+(c.nombre||'')+'</td><td>'+(c.email||'')+'</td><td>'+(c.telefono||'<span class="muted">—</span>')+'</td>'+
        '<td>'+(c.idioma?'<span class="pill">'+idiomaNom(c.idioma)+'</span>':'<span class="muted">—</span>')+'</td>'+
        '<td style="text-align:center">'+(c.reservas||'')+(c.reservas>1?' <span class="pill directa" style="font-size:10px">fiel</span>':'')+'</td>'+
        '<td class="muted">'+(c.ultima?fmt(c.ultima):'')+'</td></tr>';
    }).join('');
    el.innerHTML='<h2 class="subttl">Clientes (CRM)</h2><p class="lead">Base de clientes generada desde las reservas de la web. Alimenta el email marketing.</p>'+
      (isDemo()?'<div class="demoline">Demo · datos de ejemplo</div>':'')+
      '<div class="kpis"><div class="kpi"><label>Clientes</label><b>'+cs.length+'</b></div>'+
      '<div class="kpi"><label>Repiten</label><b>'+repes+'</b><span>más de 1 reserva</span></div></div>'+
      '<div class="card"><div class="apt-head"><h3>Clientes</h3><button class="btn sec" id="csvBtn">Exportar CSV</button></div>'+
      '<div class="card" style="border:0;padding:0;overflow-x:auto"><table><thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Idioma</th><th style="text-align:center">Reservas</th><th>Última</th></tr></thead><tbody>'+(rows||'<tr><td colspan=6 class=muted>Sin clientes.</td></tr>')+'</tbody></table></div></div>';
    const btn=document.getElementById('csvBtn'); if(btn) btn.onclick=function(){
      const csv='nombre,email,telefono,idioma,reservas,ultima\\n'+cs.map(function(c){return ['"'+(c.nombre||'')+'"',c.email||'',c.telefono||'',idiomaNom(c.idioma),c.reservas||0,c.ultima||''].join(',');}).join('\\n');
      const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download='clientes-gurah.csv'; a.click();
    };
  }

  function renderMarketing(){
    var el=document.getElementById('tab-marketing');
    var siteBtn='https://gurah.netlify.app/';
    el.innerHTML=
      '<h2 class="subttl">Email marketing</h2>'+
      '<p class="lead">Escribe la campaña en español. Se envía a cada huésped <strong>en el idioma de su reserva</strong> (traducción automática). Ideal para ofertas de temporada, huecos de última hora o reactivar clientes.</p>'+
      (isDemo()?'<div class="demoline">Demostración · así funciona: cada cliente recibe el email en el idioma de su reserva. Al activarlo, los envíos se hacen de verdad.</div>':'')+
      '<div class="mkt-grid">'+
        '<div class="card">'+
          '<label class="mkt-lb">Asunto</label>'+
          '<input id="mkAsunto" class="mkt-in" value="Vuelve a GURAH esta temporada — 10% de descuento reservando directo">'+
          '<label class="mkt-lb">Mensaje</label>'+
          '<textarea id="mkCuerpo" class="mkt-in" rows="7">Hola,\\n\\nGracias por haberte alojado con nosotros en Bakio. Nos encantaría volver a recibirte.\\n\\nReservando directamente en nuestra web tienes un 10% de descuento frente a las plataformas, mejores condiciones y trato directo con Maialen.\\n\\nTe esperamos junto al mar.</textarea>'+
          '<div class="mkt-row">'+
            '<div style="flex:1"><label class="mkt-lb">Texto del botón</label><input id="mkCta" class="mkt-in" value="Reservar con 10% directo"></div>'+
            '<div style="flex:2"><label class="mkt-lb">Enlace del botón</label><input id="mkUrl" class="mkt-in" value="'+siteBtn+'"></div>'+
          '</div>'+
          '<div class="mkt-actions">'+
            '<select id="mkPrevLang" class="mkt-sel"></select>'+
            '<button class="btn sec" id="mkPrevBtn">👁 Previsualizar</button>'+
            '<button class="btn" id="mkSendBtn">✉ Enviar campaña</button>'+
            '<span class="muted" id="mkStatus" style="align-self:center"></span>'+
          '</div>'+
        '</div>'+
        '<div class="card mkt-aside">'+
          '<h3 style="margin:0 0 4px">Destinatarios</h3>'+
          '<div id="mkAudience" class="muted">Cargando lista…</div>'+
        '</div>'+
      '</div>'+
      '<div id="mkPreview"></div>'+
      '<div id="mkResult"></div>';

    // Cargar audiencia agrupada por idioma + poblar selector de previsualización.
    (async function(){
      var r=await api('/api/panel/campaign',{asunto:'x',cuerpo:'x'});
      var aud=document.getElementById('mkAudience'); var sel=document.getElementById('mkPrevLang');
      if(r.ok){
        aud.innerHTML='<div class="mkt-total"><strong>'+r.total+'</strong> contactos</div>'+
          '<div class="mkt-chips">'+r.porIdioma.map(function(g){return '<span class="mkt-chip">'+idiomaNom(g.idioma)+' <b>'+g.total+'</b></span>';}).join('')+'</div>'+
          '<p class="muted" style="font-size:12px;margin-top:10px">Cada grupo recibe el email en su idioma. La lista se nutre sola de las reservas.</p>';
        sel.innerHTML=r.porIdioma.map(function(g){return '<option value="'+g.idioma+'">Ver en '+idiomaNom(g.idioma)+'</option>';}).join('');
      } else { aud.textContent='No se pudo cargar la lista.'; }
    })();

    document.getElementById('mkPrevBtn').onclick=async function(){
      var st=document.getElementById('mkStatus'); st.textContent='Preparando previsualización…';
      var lang=document.getElementById('mkPrevLang').value||'es';
      var r=await api('/api/panel/campaign',{asunto:mkVal('mkAsunto'),cuerpo:mkVal('mkCuerpo'),preview:lang});
      if(r.ok){
        document.getElementById('mkPreview').innerHTML=
          '<div class="card"><div class="apt-head"><h3>Previsualización · '+idiomaNom(r.idioma)+'</h3></div>'+
          (r.idioma==='es'?'':'<div class="demoline">'+(r.traducido?('Traducción automática al '+idiomaNom(r.idioma)):('Escribe la campaña de ejemplo para ver la traducción · al activarlo se traduce cualquier texto al '+idiomaNom(r.idioma)))+'</div>')+
          '<div class="mkt-mail"><div class="mkt-mail-h">GURAH</div><div class="mkt-mail-sub">'+escapeHtmlP(r.asunto)+'</div>'+
          '<div class="mkt-mail-body">'+escapeHtmlP(r.cuerpo).replace(/\\n/g,'<br>')+'</div></div></div>';
        st.textContent='';
      } else { st.textContent=r.error||'error'; }
    };

    document.getElementById('mkSendBtn').onclick=async function(){
      var st=document.getElementById('mkStatus');
      if(!confirm('¿Enviar la campaña a toda la lista, cada huésped en su idioma?')) return;
      st.textContent='Enviando por idiomas…';
      var r=await api('/api/panel/campaign',{asunto:mkVal('mkAsunto'),cuerpo:mkVal('mkCuerpo'),ctaTexto:mkVal('mkCta'),ctaUrl:mkVal('mkUrl'),enviar:true});
      if(r.ok){
        document.getElementById('mkResult').innerHTML=
          '<div class="card"><h3>'+(r.demo?'Simulación de envío':'Campaña enviada')+'</h3>'+
          '<p class="muted">'+r.totalContactos+' contactos · '+r.idiomas+' idiomas'+(r.demo?' · demostración (no se ha enviado ningún correo real)':'')+'</p>'+
          '<table><thead><tr><th>Idioma</th><th>Contactos</th><th>Enviados</th><th>Asunto</th></tr></thead><tbody>'+
          r.resumen.map(function(x){return '<tr><td>'+idiomaNom(x.idioma)+'</td><td>'+x.total+'</td><td>'+x.enviados+'</td><td class="muted">'+escapeHtmlP(x.muestraAsunto)+'</td></tr>';}).join('')+
          '</tbody></table></div>';
        st.textContent=''; toast(r.demo?'Envío simulado':'Campaña enviada');
      } else { st.textContent=r.error||'error'; }
    };
  }
  function mkVal(id){ var e=document.getElementById(id); return e?e.value:''; }
  function escapeHtmlP(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  function renderCanales(){
    var el=document.getElementById('tab-canales');
    el.innerHTML='<div class="card"><h3>Canales (iCal)</h3><p class="muted">Channel manager: pega las URLs iCal de Booking/Airbnb (una por línea) por apartamento e importa los bloqueos. Export por unidad: <code>/api/ical/&lt;id&gt;.ics</code>.</p>'+
      state.apartments.map(function(a){
        var urls=(state.feeds[a.id]||[]).join('\\n');
        return '<div style="border-top:1px solid var(--linea);padding:12px 0" data-ical="'+a.id+'"><strong>'+a.nombre+'</strong>'+
          '<textarea data-urls rows="2" style="width:100%;margin:6px 0;padding:8px;border:1px solid var(--linea);border-radius:8px" placeholder="https://...booking.../ical\\nhttps://...airbnb.../ical">'+urls+'</textarea>'+
          '<div style="display:flex;gap:8px"><button class="btn sec" data-act="savefeeds">Guardar URLs</button><button class="btn" data-act="sync">Sincronizar ahora</button><span class="muted" data-status style="align-self:center"></span></div></div>';
      }).join('')+'</div>';
    el.querySelectorAll('[data-ical]').forEach(function(row){
      var id=row.getAttribute('data-ical');
      var status=row.querySelector('[data-status]');
      row.querySelector('[data-act="savefeeds"]').onclick=async function(){
        var urls=row.querySelector('[data-urls]').value.split('\\n').map(function(s){return s.trim();}).filter(Boolean);
        var r=await api('/api/panel/ical',{action:'feeds',id:id,urls:urls}); if(r.ok){state.feeds=r.feeds; status.textContent='URLs guardadas'; toast('URLs guardadas');}
      };
      row.querySelector('[data-act="sync"]').onclick=async function(){
        status.textContent='Sincronizando…';
        var r=await api('/api/panel/ical',{action:'sync',id:id});
        if(r.ok){ var res=r.results[0]||{}; status.textContent=(res.fechas||0)+' fechas importadas'+(res.errores&&res.errores.length?(' · '+res.errores.length+' errores'):''); toast('Sincronizado'); load(); }
      };
    });
  }
  var IDIOMAS={es:'Español',en:'Inglés',fr:'Francés',de:'Alemán',nl:'Neerlandés',be:'Belga',it:'Italiano',eu:'Euskera',pt:'Portugués',no:'Noruego',da:'Danés'};
  function idiomaNom(c){ return IDIOMAS[(c||'es').slice(0,2)]||(c||'—'); }
  function renderResenas(){
    var el=document.getElementById('tab-resenas');
    var pend=pendientesResenas();
    var aviso = pend ? '<div class="aviso">🔔 <div><strong>'+pend+' reseña'+(pend>1?'s':'')+' nueva'+(pend>1?'s':'')+' sin responder.</strong> En producción, el panel detecta las reseñas de cualquier plataforma (Booking, Airbnb, Google…) y avisa aquí. Pulsa «Traducir y redactar respuesta» y revísala antes de publicar.</div></div>' : '';
    el.innerHTML=
      '<h2 class="subttl">Reseñas</h2><p class="lead">Respuestas asistidas por IA. Si la reseña está en otro idioma, se traduce al español y la respuesta se redacta en el idioma del huésped.</p>'+
      (isDemo()?'<div class="demoline">Demo · reseñas de ejemplo en varios idiomas</div>':'')+
      aviso+
      '<div class="card">'+
      (state.reviews.length?state.reviews.map(function(r){
        var apt=(state.apartments.find(function(a){return a.id===r.apartmentId;})||{}).nombre||'';
        var es=(r.idioma||'es').slice(0,2)==='es';
        var nueva=!r.respuesta;
        var trad = r.traduccion ? ('<div class="rev-trad" data-trad><span class="muted">Traducción (ES):</span> '+r.traduccion+'</div>') : (es?'<div data-trad></div>':'<div class="rev-trad" data-trad style="display:none"></div>');
        return '<div class="rev'+(nueva?' nueva':'')+'" data-rev="'+r.id+'">'+
          '<div class="rev-head"><div><strong>'+(r.autor||'Huésped')+'</strong> '+(r.puntuacion?('· '+r.puntuacion+'/10'):'')+' <span class="muted">'+apt+' · '+(r.fecha||'')+'</span>'+(nueva?'<span class="rev-nueva-tag">● Nueva · sin responder</span>':'')+'</div>'+
          '<span class="pill '+(es?'':'booking')+'">'+idiomaNom(r.idioma)+'</span></div>'+
          '<p class="rev-orig">'+r.texto+'</p>'+
          trad+
          '<label class="muted" style="font-size:12px;display:block;margin-top:8px">Respuesta pública <span data-replylang>'+(es?'':'· en '+idiomaNom(r.idioma))+'</span></label>'+
          '<textarea data-reply rows="3" style="width:100%;padding:8px;border:1px solid var(--linea);border-radius:8px" placeholder="Respuesta pública…">'+(r.respuesta||'')+'</textarea>'+
          '<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap"><button class="btn sec" data-act="ai">✨ Traducir y redactar respuesta</button><button class="btn" data-act="save">Guardar respuesta</button><span class="muted" data-status style="align-self:center"></span></div></div>';
      }).join(''):'<p class="muted">Sin reseñas.</p>')+'</div>';
    el.querySelectorAll('[data-rev]').forEach(function(row){
      var id=row.getAttribute('data-rev'); var ta=row.querySelector('[data-reply]'); var status=row.querySelector('[data-status]'); var tradBox=row.querySelector('[data-trad]'); var rl=row.querySelector('[data-replylang]');
      row.querySelector('[data-act="ai"]').onclick=async function(){
        status.textContent='Traduciendo y redactando…';
        var r=await api('/api/panel/review-reply',{reviewId:id});
        if(r.ok){
          if(r.traduccion && tradBox){ tradBox.innerHTML='<span class="muted">Traducción (ES):</span> '+r.traduccion; tradBox.className='rev-trad'; tradBox.style.display='block'; }
          if(rl && r.idioma!=='es') rl.textContent='· en '+idiomaNom(r.idioma);
          ta.value=r.draft; status.textContent=r.demo?'(demo)':'listo';
        } else { status.textContent=r.error||'error'; }
      };
      row.querySelector('[data-act="save"]').onclick=async function(){
        var r=await api('/api/panel/review-reply',{reviewId:id,respuesta:ta.value});
        if(r.ok){
          status.textContent='Guardada'; toast('Respuesta guardada');
          var rev=(state.reviews||[]).find(function(x){return x.id===id;}); if(rev) rev.respuesta=ta.value;
          row.classList.remove('nueva'); var tag=row.querySelector('.rev-nueva-tag'); if(tag) tag.remove();
          updateResenasBadge();
        }
      };
    });
  }

  function pendientesResenas(){ return (state.reviews||[]).filter(function(r){ return !r.respuesta; }).length; }
  function updateResenasBadge(){ var b=document.querySelector('[data-badge-resenas]'); if(!b)return; var n=pendientesResenas(); if(n){ b.textContent=n; b.hidden=false; } else { b.hidden=true; } }
  function renderAll(){ renderApartamentos(); renderReservas(); renderFacturas(); renderGastos(); renderContabilidad(); renderImpuestos(); renderClientes(); renderMarketing(); renderCanales(); renderResenas(); updateResenasBadge(); }

  // --- Pestañas -------------------------------------------------------------
  document.querySelectorAll('.tabs button').forEach(function(btn){
    btn.onclick=function(){
      document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.tabpage').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-'+btn.getAttribute('data-tab')).classList.add('active');
    };
  });

  window.PANEL = { load: load, state: state };
  document.addEventListener('DOMContentLoaded', load);
  if(document.readyState!=='loading') load();
})();
`.trim();

fs.writeFileSync(path.join(OUT, 'panel.css'), css);
fs.writeFileSync(path.join(OUT, 'panel-markup.html'), markup);
fs.writeFileSync(path.join(OUT, 'panel-app.js'), appjs);

console.log('[buildpanel] Panel GURAH generado en src/generated/ (' + TABS.length + ' pestañas).');

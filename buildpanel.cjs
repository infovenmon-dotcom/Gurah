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
  { id: 'clientes', label: 'Clientes' },
  { id: 'canales', label: 'Canales (iCal)' },
  { id: 'resenas', label: 'Reseñas (IA)' },
];

// --- CSS ---------------------------------------------------------------------
const css = `
:root{--verde:#46554a;--verde2:#37433b;--arena:#f4efe6;--tinta:#1a2420;--gris:#6b7a74;--linea:#e3ddd0;--rojo:#b4462f}
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:var(--tinta);background:var(--arena);overflow-x:hidden}
.card{overflow-x:auto}
.panel-top{display:flex;align-items:center;justify-content:space-between;padding:14px 22px;background:var(--verde);color:#fff}
.panel-top strong{font-size:18px;letter-spacing:.04em}
.panel-top .demo{background:#ffd257;color:#5b4a00;font-size:12px;font-weight:600;padding:3px 9px;border-radius:20px;margin-left:10px}
.panel-top a{color:#fff;text-decoration:none;font-size:14px;opacity:.9}
.tabs{display:flex;flex-wrap:wrap;gap:4px;padding:0 16px;background:#fff;border-bottom:1px solid var(--linea);position:sticky;top:0;z-index:5}
.tabs button{border:0;background:none;padding:14px 16px;font-size:14px;color:var(--gris);cursor:pointer;border-bottom:3px solid transparent}
.tabs button.active{color:var(--verde);border-bottom-color:var(--verde);font-weight:600}
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
.cal th.wknd,.cal td.wknd{background:#faf7f0}
.cal td.today{box-shadow:inset 0 0 0 2px var(--verde)}
.cal .bar{background:var(--verde);color:#fff;border-radius:6px;font-size:10px;line-height:20px;height:20px;margin:3px 1px;overflow:hidden;white-space:nowrap;padding:0 6px}
.cal .bar.c2{background:#7a8f84}.cal .bar.c3{background:#b98a4b}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:middle}
.legend{display:flex;flex-wrap:wrap;gap:14px;margin-top:12px;font-size:12px;color:var(--gris)}
/* Gráfico de barras (ingresos por mes) */
.bars{display:flex;align-items:flex-end;gap:8px;height:180px;padding-top:24px}
.bars .b{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end}
.bars .b i{display:block;width:100%;max-width:34px;background:var(--verde);border-radius:6px 6px 0 0;position:relative}
.bars .b i.alt{background:#b98a4b}
.bars .b em{font-size:10px;color:var(--gris);font-style:normal}
.bars .b small{font-size:9px;color:var(--tinta);font-weight:600}
.pos{color:#2e7d54;font-weight:600}.neg{color:var(--rojo);font-weight:600}
.infocard{display:flex;gap:14px;align-items:flex-start}
.infocard .tag{background:var(--verde);color:#fff;border-radius:10px;padding:12px 14px;font-size:12px;text-align:center;line-height:1.3;min-width:96px}
.rowbtn{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.toast{position:fixed;bottom:20px;right:20px;background:var(--tinta);color:#fff;padding:12px 18px;border-radius:10px;opacity:0;transition:.3s;pointer-events:none}
.toast.show{opacity:1}
@media(max-width:600px){.tabpage{padding:14px}.kpi b{font-size:23px}}
`.trim();

// --- Markup ------------------------------------------------------------------
const tabButtons = TABS.map(
  (t, i) => `<button data-tab="${t.id}" class="${i === 0 ? 'active' : ''}">${t.label}</button>`,
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
<div class="toast" id="toast"></div>
`.trim();

// --- App JS ------------------------------------------------------------------
const appjs = `
// window.PANEL — lógica del panel GURAH (generado por buildpanel.cjs).
(function(){
  const SERVICIOS = ${JSON.stringify(require('./src/lib/servicios.cjs'))};
  let state = { apartments: [], blocks: {}, bookings: [], invoices: [], expenses: [], customers: [], reviews: [], feeds: {} };

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
      return '<tr><td><strong>'+b.huesped.nombre+'</strong><div class="muted">'+b.id+'</div></td>'+
        '<td>'+aptNombre(b.apartmentId)+'</td>'+
        '<td>'+fmt(b.entrada)+' → '+fmt(b.salida)+'</td>'+
        '<td>'+b.noches+'</td>'+
        '<td><span class="pill '+canalClass(canal)+'">'+canal+'</span></td>'+
        '<td><span class="pill '+es.k+'">'+es.t+'</span></td>'+
        '<td style="text-align:right"><strong>'+eur(b.total)+'</strong></td></tr>';
    }).join('');
    el.innerHTML=
      '<h2 class="subttl">Reservas</h2><p class="lead">Calendario de ocupación por apartamento.</p>'+
      (isDemo()?'<div class="demoline">Demo · reservas de ejemplo</div>':'')+
      kpis+
      '<div class="card"><div class="rowbtn"><h3 style="margin:0">Calendario · '+MESES[m]+' '+y+'</h3></div><div class="cal-wrap">'+cal+'</div>'+leyendaApts()+'</div>'+
      '<div class="card"><h3>Próximas reservas</h3><table><thead><tr><th>Huésped</th><th>Apartamento</th><th>Fechas</th><th>Noches</th><th>Canal</th><th>Estado</th><th style="text-align:right">Total</th></tr></thead><tbody>'+(rows||'<tr><td colspan=7 class=muted>Sin reservas todavía.</td></tr>')+'</tbody></table></div>';
  }
  function kpi(label,val,sub,cls){ return '<div class="kpi"><label>'+label+'</label><b>'+val+'</b><span class="'+(cls||'')+'">'+(sub||'')+'</span></div>'; }
  function fmt(iso){ if(!iso)return''; var p=iso.split('-'); return p[2]+'/'+p[1]; }
  function leyendaApts(){ return '<div class="legend">'+state.apartments.map(function(a,i){ return '<span><span class="dot" style="background:'+['#46554a','#7a8f84','#b98a4b','#9a6b4b'][i%4]+'"></span>'+a.nombre+'</span>'; }).join('')+'</div>'; }
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
      var tbai=f.tbai?('<div class="muted" style="font-size:10px" title="'+f.tbai.qrUrl+'">'+f.tbai.tbaiId+(f.tbai.firmadoReal?'':' · sin firma (demo)')+'</div>'):'';
      return '<tr><td><strong>'+f.id+'</strong>'+tbai+'</td><td>'+fmt(f.fecha)+'</td><td>'+f.cliente.nombre+'</td><td>'+f.concepto+'</td><td style="text-align:right">'+eur2(f.total)+'</td><td>'+est+'</td></tr>';
    }).join('');
    el.innerHTML=
      '<h2 class="subttl">Facturas</h2><p class="lead">Emisión y seguimiento de facturas.</p>'+
      (isDemo()?'<div class="demoline">Demo · facturas de ejemplo</div>':'')+
      kpis+info+
      '<div class="card"><h3>Facturas emitidas</h3><table><thead><tr><th>Nº / TBAI</th><th>Fecha</th><th>Cliente</th><th>Concepto</th><th style="text-align:right">Total</th><th>Estado</th></tr></thead><tbody>'+(rows||'<tr><td colspan=6 class=muted>Sin facturas.</td></tr>')+'</tbody></table></div>';
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
    var gTotal=(state.expenses||[]).reduce(function(s,e){return s+(e.importe||0);},0);
    var grows=(state.expenses||[]).slice().sort(function(a,b){return a.fecha<b.fecha?1:-1;}).map(function(e){
      return '<tr><td>'+fmt(e.fecha)+'</td><td>'+e.concepto+'</td><td><span class="pill">'+(e.categoria||'—')+'</span></td><td style="text-align:right" class="neg">−'+eur2(e.importe)+'</td></tr>';
    }).join('');
    el.innerHTML=
      '<h2 class="subttl">Ingresos / Gastos</h2><p class="lead">Evolución y desglose.</p>'+
      (isDemo()?'<div class="demoline">Demo · datos de ejemplo</div>':'')+
      kpis+
      '<div class="card"><h3>Ingresos por mes · '+y+'</h3><div class="bars">'+bars+'</div></div>'+
      '<div class="card"><div class="rowbtn"><h3 style="margin:0">Gastos</h3><span class="muted">Total '+y+': <strong class="neg">'+eur(gTotal)+'</strong></span></div><table><thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th style="text-align:right">Importe</th></tr></thead><tbody>'+(grows||'<tr><td colspan=4 class=muted>Sin gastos. Alta manual + importación CSV.</td></tr>')+'</tbody></table></div>';
  }
  // --- Contabilidad ---------------------------------------------------------
  function renderContabilidad(){
    const el=document.getElementById('tab-contabilidad');
    var y=new Date().getFullYear();
    var añoInv=state.invoices.filter(function(f){return (f.fecha||'').slice(0,4)==String(y);});
    var ingresos=añoInv.reduce(function(s,f){return s+f.total;},0);
    var gastos=(state.expenses||[]).filter(function(e){return (e.fecha||'').slice(0,4)==String(y);}).reduce(function(s,e){return s+(e.importe||0);},0);
    var resultado=ingresos-gastos;
    var margen=ingresos?Math.round(resultado/ingresos*100):0;
    var kpis='<div class="kpis">'+
      kpi('Ingresos ('+y+')',eur(ingresos),'acumulado')+
      kpi('Gastos',eur(gastos),'acumulado')+
      kpi('Resultado',eur(resultado),'ingresos − gastos')+
      kpi('Margen',margen+'%','sobre ingresos')+'</div>';
    // Movimientos (ingresos + gastos) ordenados por fecha
    var movs=[];
    añoInv.forEach(function(f){ movs.push({fecha:f.fecha,concepto:'Factura '+f.id+' · '+f.cliente.nombre,cat:'Ingreso alojamiento',iva:f.iva,imp:f.total,pos:true}); });
    (state.expenses||[]).forEach(function(e){ if((e.fecha||'').slice(0,4)==String(y)) movs.push({fecha:e.fecha,concepto:e.concepto,cat:e.categoria||'Gasto',iva:e.iva||0,imp:-e.importe,pos:false}); });
    movs.sort(function(a,b){return a.fecha<b.fecha?1:-1;});
    var rows=movs.map(function(mv){
      return '<tr><td>'+fmt(mv.fecha)+'</td><td>'+mv.concepto+'</td><td><span class="pill">'+mv.cat+'</span></td><td style="text-align:right">'+eur2(mv.iva)+'</td><td style="text-align:right" class="'+(mv.pos?'pos':'neg')+'">'+(mv.pos?'+':'−')+eur2(Math.abs(mv.imp))+'</td></tr>';
    }).join('');
    el.innerHTML=
      '<h2 class="subttl">Contabilidad</h2><p class="lead">Ingresos, gastos y resultado.</p>'+
      (isDemo()?'<div class="demoline">Demo · datos de ejemplo</div>':'')+
      kpis+
      '<div class="card"><h3>Movimientos recientes</h3><table><thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th style="text-align:right">IVA</th><th style="text-align:right">Importe</th></tr></thead><tbody>'+(rows||'<tr><td colspan=5 class=muted>Sin movimientos.</td></tr>')+'</tbody></table></div>';
  }

  // --- Clientes -------------------------------------------------------------
  function renderClientes(){
    const el=document.getElementById('tab-clientes');
    const rows=(state.customers||[]).map(function(c){ return '<tr><td>'+(c.nombre||'')+'</td><td>'+(c.email||'')+'</td><td>'+(c.reservas||'')+'</td></tr>'; }).join('');
    el.innerHTML='<div class="card"><div class="apt-head"><h3>Clientes</h3><button class="btn sec" id="csvBtn">Exportar CSV</button></div><table><thead><tr><th>Nombre</th><th>Email</th><th>Reservas</th></tr></thead><tbody>'+(rows||'<tr><td colspan=3 class=muted>Sin clientes.</td></tr>')+'</tbody></table></div>';
    const btn=document.getElementById('csvBtn'); if(btn) btn.onclick=function(){
      const csv='nombre,email,reservas\\n'+(state.customers||[]).map(c=>[c.nombre,c.email,c.reservas].join(',')).join('\\n');
      const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download='clientes-gurah.csv'; a.click();
    };
  }

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
  function renderResenas(){
    var el=document.getElementById('tab-resenas');
    el.innerHTML='<div class="card"><h3>Reseñas <span class="muted">(respuestas con IA · Claude)</span></h3>'+
      (state.reviews.length?state.reviews.map(function(r){
        var apt=(state.apartments.find(function(a){return a.id===r.apartmentId;})||{}).nombre||'';
        return '<div style="border-top:1px solid var(--linea);padding:12px 0" data-rev="'+r.id+'">'+
          '<div><strong>'+(r.autor||'Huésped')+'</strong> '+(r.puntuacion?('· '+r.puntuacion+'/5'):'')+' <span class="muted">'+apt+' · '+(r.fecha||'')+'</span></div>'+
          '<p style="margin:6px 0">'+r.texto+'</p>'+
          '<textarea data-reply rows="2" style="width:100%;padding:8px;border:1px solid var(--linea);border-radius:8px" placeholder="Respuesta pública…">'+(r.respuesta||'')+'</textarea>'+
          '<div style="display:flex;gap:8px;margin-top:6px"><button class="btn sec" data-act="ai">✨ Generar con IA</button><button class="btn" data-act="save">Guardar respuesta</button><span class="muted" data-status style="align-self:center"></span></div></div>';
      }).join(''):'<p class="muted">Sin reseñas.</p>')+'</div>';
    el.querySelectorAll('[data-rev]').forEach(function(row){
      var id=row.getAttribute('data-rev'); var ta=row.querySelector('[data-reply]'); var status=row.querySelector('[data-status]');
      row.querySelector('[data-act="ai"]').onclick=async function(){
        status.textContent='Generando…';
        var r=await api('/api/panel/review-reply',{reviewId:id});
        if(r.ok){ ta.value=r.draft; status.textContent=r.demo?'(borrador demo)':'borrador IA listo'; } else { status.textContent=r.error||'error'; }
      };
      row.querySelector('[data-act="save"]').onclick=async function(){
        var r=await api('/api/panel/review-reply',{reviewId:id,respuesta:ta.value});
        if(r.ok){ status.textContent='Guardada'; toast('Respuesta guardada'); }
      };
    });
  }

  function renderAll(){ renderApartamentos(); renderReservas(); renderFacturas(); renderGastos(); renderContabilidad(); renderClientes(); renderCanales(); renderResenas(); }

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

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
:root{--verde:#0e5c4a;--verde2:#127a63;--arena:#f4efe6;--tinta:#1a2420;--gris:#6b7a74;--linea:#e3ddd0;--rojo:#b4462f}
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:var(--tinta);background:var(--arena)}
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
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px}
.kpi{background:#fff;border:1px solid var(--linea);border-radius:12px;padding:14px}
.kpi b{display:block;font-size:24px;color:var(--verde)}
.kpi span{font-size:12px;color:var(--gris)}
.toast{position:fixed;bottom:20px;right:20px;background:var(--tinta);color:#fff;padding:12px 18px;border-radius:10px;opacity:0;transition:.3s;pointer-events:none}
.toast.show{opacity:1}
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
  let state = { apartments: [], blocks: {}, bookings: [], invoices: [], expenses: [], customers: [] };

  function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); }
  function eur(n){ return (Number(n)||0).toFixed(2)+' €'; }
  async function api(url, body){
    const opt = body ? {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)} : {};
    const r = await fetch(url, opt); return r.json();
  }

  async function load(){
    const [a,d] = await Promise.all([api('/api/panel/apartments'), api('/api/panel/data')]);
    if(a.ok){ state.apartments=a.apartments; state.blocks=a.blocks||{}; }
    if(d.ok){ state.bookings=d.bookings; state.invoices=d.invoices; state.expenses=d.expenses; state.customers=d.customers; }
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
    const rows = state.bookings.slice().reverse().map(function(b){
      const apt=(state.apartments.find(a=>a.id===b.apartmentId)||{}).nombre||b.apartmentId;
      return '<tr><td>'+b.id+'</td><td>'+apt+'</td><td>'+b.huesped.nombre+'</td><td>'+b.entrada+'→'+b.salida+'</td><td>'+b.noches+'</td><td>'+eur(b.total)+'</td><td>'+b.estado+(b.demo?' (demo)':'')+'</td></tr>';
    }).join('');
    el.innerHTML='<div class="card"><h3>Reservas</h3><table><thead><tr><th>Localizador</th><th>Apartamento</th><th>Huésped</th><th>Fechas</th><th>Noches</th><th>Total</th><th>Estado</th></tr></thead><tbody>'+(rows||'<tr><td colspan=7 class=muted>Sin reservas todavía.</td></tr>')+'</tbody></table></div>';
  }

  // --- Facturas -------------------------------------------------------------
  function renderFacturas(){
    const el=document.getElementById('tab-facturas');
    const rows=state.invoices.slice().reverse().map(function(f){
      return '<tr><td>'+f.id+'</td><td>'+f.cliente.nombre+'</td><td>'+f.concepto+'</td><td>'+eur(f.base)+'</td><td>'+f.ivaPct+'%</td><td>'+eur(f.total)+'</td></tr>';
    }).join('');
    el.innerHTML='<div class="card"><h3>Facturas <span class="muted">(compatible TicketBAI / Batuz)</span></h3><table><thead><tr><th>Nº</th><th>Cliente</th><th>Concepto</th><th>Base</th><th>IVA</th><th>Total</th></tr></thead><tbody>'+(rows||'<tr><td colspan=6 class=muted>Sin facturas.</td></tr>')+'</tbody></table></div>';
  }

  // --- Ingresos/Gastos + Contabilidad --------------------------------------
  function renderGastos(){
    const el=document.getElementById('tab-gastos');
    const ingresos=state.invoices.reduce((s,f)=>s+f.total,0);
    const gastos=(state.expenses||[]).reduce((s,e)=>s+(e.importe||0),0);
    el.innerHTML='<div class="kpis"><div class="kpi"><b>'+eur(ingresos)+'</b><span>Ingresos</span></div><div class="kpi"><b>'+eur(gastos)+'</b><span>Gastos</span></div><div class="kpi"><b>'+eur(ingresos-gastos)+'</b><span>Resultado</span></div></div><div class="card muted">Registro de gastos: heredado de Kirana (alta manual + CSV). Placeholder en demo.</div>';
  }
  function renderContabilidad(){
    const el=document.getElementById('tab-contabilidad');
    const byYear={};
    state.invoices.forEach(function(f){ const y=(f.fecha||'').slice(0,4)||'—'; byYear[y]=(byYear[y]||0)+f.total; });
    const rows=Object.keys(byYear).sort().map(y=>'<tr><td>'+y+'</td><td>'+eur(byYear[y])+'</td></tr>').join('');
    el.innerHTML='<div class="card"><h3>Contabilidad (multi-año)</h3><table><thead><tr><th>Año</th><th>Facturado</th></tr></thead><tbody>'+(rows||'<tr><td colspan=2 class=muted>Sin datos.</td></tr>')+'</tbody></table></div>';
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

  function renderCanales(){ document.getElementById('tab-canales').innerHTML='<div class="card"><h3>Canales (iCal)</h3><p class="muted">Channel manager iCal heredado de Kirana: importa/exporta bloqueos de Booking, Airbnb, etc. por apartamento. URL export: <code>/api/ical/&lt;apartment&gt;.ics</code>.</p></div>'; }
  function renderResenas(){ document.getElementById('tab-resenas').innerHTML='<div class="card"><h3>Reseñas (IA)</h3><p class="muted">Respuestas a reseñas asistidas por IA (Claude), heredado de Kirana. Requiere ANTHROPIC_API_KEY.</p></div>'; }

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

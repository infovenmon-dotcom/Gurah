/* home.js — GURAH: reveal-on-scroll, motor de reserva (modal) y concierge IA. */
(function () {
  var A = window.GURAH_AVAIL || [];
  function money(n) { return (Math.round(n * 100) / 100).toFixed(0); }

  // --- Reveal on scroll -----------------------------------------------------
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  // --- Booking modal --------------------------------------------------------
  var modal = document.getElementById('modal');
  var cur = null;
  function $(id) { return document.getElementById(id); }
  function openModal(id) {
    cur = A.find(function (x) { return x.id === id; }); if (!cur) return;
    $('m-title').textContent = cur.nombre;
    $('m-sub').textContent = cur.concepto + ' · estancia mínima ' + cur.estancia_minima + ' noches';
    $('m-pax').max = cur.capacidad;
    $('m-quote').style.display = 'none'; $('m-msg').textContent = '';
    var today = new Date().toISOString().slice(0, 10);
    $('m-in').min = today; $('m-out').min = today;
    modal.style.display = 'flex';
  }
  document.querySelectorAll('.book').forEach(function (b) { b.onclick = function () { openModal(b.getAttribute('data-id')); }; });
  $('m-close').onclick = function () { modal.style.display = 'none'; };
  modal.onclick = function (e) { if (e.target === modal) modal.style.display = 'none'; };

  function quote() {
    var i = $('m-in').value, o = $('m-out').value, q = $('m-quote'), msg = $('m-msg');
    msg.textContent = ''; q.style.display = 'none';
    if (!i || !o || !cur) return;
    fetch('/api/availability?apartment=' + cur.id + '&entrada=' + i + '&salida=' + o)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.disponible) { msg.textContent = d.motivo || 'No disponible en esas fechas.'; return; }
        var p = d.precios; q.style.display = 'block';
        q.innerHTML = '<div style="display:flex;justify-content:space-between"><span>' + p.noches + ' noches</span><span><s style="color:#999">' + money(p.total) + ' €</s> <b style="color:var(--verde)">' + money(p.totalWeb) + ' €</b></span></div>' +
          '<div style="color:var(--gris);font-size:12px;margin-top:4px">Ahorras ' + money(p.ahorro) + ' € con la reserva directa.</div>';
      });
  }
  $('m-in').onchange = quote; $('m-out').onchange = quote;

  $('m-book').onclick = function () {
    var msg = $('m-msg');
    var body = { apartmentId: cur.id, entrada: $('m-in').value, salida: $('m-out').value, personas: +$('m-pax').value, nombre: $('m-nombre').value.trim(), email: $('m-email').value.trim(), telefono: $('m-tel').value.trim() };
    if (!body.entrada || !body.salida || !body.nombre || !body.email) { msg.textContent = 'Completa fechas, nombre y email.'; return; }
    var btn = this; btn.disabled = true; btn.textContent = 'Procesando…';
    fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ok) { msg.textContent = d.error || 'No se pudo completar.'; btn.disabled = false; btn.textContent = 'Reservar y pagar'; return; }
        if (d.mode === 'stripe' && d.url) { window.location.href = d.url; return; }
        window.location.href = d.redirect || ('/reserva-ok?id=' + (d.booking && d.booking.id));
      })
      .catch(function () { msg.textContent = 'Error de red.'; btn.disabled = false; btn.textContent = 'Reservar y pagar'; });
  };

  // --- Concierge IA ---------------------------------------------------------
  var panel = $('cc-panel'), launch = $('cc-launch'), log = $('cc-log'), input = $('cc-input');
  var history = [], started = false;
  function bubble(text, who) {
    var d = document.createElement('div'); d.className = 'cc-msg ' + who; d.textContent = text; log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  function openCC() {
    panel.style.display = 'flex'; launch.style.display = 'none';
    if (!started) { started = true; bubble(window.CC_GREETING || '¡Hola!', 'bot'); setTimeout(function () { input.focus(); }, 100); }
  }
  launch.onclick = openCC;
  $('cc-close').onclick = function () { panel.style.display = 'none'; launch.style.display = 'flex'; };
  $('cc-form').onsubmit = function (e) {
    e.preventDefault();
    var text = input.value.trim(); if (!text) return;
    bubble(text, 'me'); history.push({ role: 'user', content: text }); input.value = '';
    var typing = bubble('escribiendo…', 'bot typing');
    fetch('/api/concierge', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: history }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        typing.remove();
        var reply = d.ok ? d.reply : (d.error || 'Ahora mismo no puedo responder, inténtalo en un momento.');
        bubble(reply, 'bot'); history.push({ role: 'assistant', content: reply });
      })
      .catch(function () { typing.remove(); bubble('Error de conexión.', 'bot'); });
  };
})();

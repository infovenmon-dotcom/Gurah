/* home.js — GURAH: reveal-on-scroll, motor de reserva (modal) y concierge IA. */
(function () {
  var A = window.GURAH_AVAIL || [];
  var I = window.I18N || {};
  function T(k, d) { return I[k] != null ? I[k] : d; }
  function money(n) { return (Math.round(n * 100) / 100).toFixed(0); }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Parallax suave del hero ---------------------------------------------
  var slides = document.querySelector('.hero-slides') || document.querySelector('.hero-media');
  if (slides && !reduce) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY || 0;
        if (y < window.innerHeight) slides.style.transform = 'translateY(' + (y * 0.28) + 'px)';
        ticking = false;
      });
    }, { passive: true });
  }

  // --- Reveal on scroll -----------------------------------------------------
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  // --- Clips de apartamentos: carga diferida (solo el que está en pantalla) --
  // Evita descargar ~8 MB de vídeo de golpe: cada clip se carga y reproduce al
  // acercarse al viewport y se pausa al salir. Sin soporte → se queda el póster.
  var clips = document.querySelectorAll('.apt-video[data-clip]');
  if (clips.length && 'IntersectionObserver' in window && !reduce) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (!v.getAttribute('data-loaded')) {
            var s = document.createElement('source');
            s.src = v.getAttribute('data-clip'); s.type = 'video/webm';
            v.appendChild(s); v.setAttribute('data-loaded', '1'); v.load();
          }
          var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
        } else if (!v.paused) { v.pause(); }
      });
    }, { rootMargin: '250px 0px' });
    clips.forEach(function (v) { vio.observe(v); });
  }

  // --- Booking modal --------------------------------------------------------
  var modal = document.getElementById('modal');
  var cur = null;
  function $(id) { return document.getElementById(id); }
  function openModal(id) {
    cur = A.find(function (x) { return x.id === id; }); if (!cur) return;
    $('m-title').textContent = cur.nombre;
    $('m-sub').textContent = cur.concepto + ' · ' + T('minStay', 'estancia mínima') + ' ' + cur.estancia_minima + ' ' + T('nights', 'noches');
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
        if (!d.disponible) { msg.textContent = d.motivo || T('notAvailable', 'No disponible en esas fechas.'); return; }
        var p = d.precios; q.style.display = 'block';
        var pol = d.politica ? ('<div style="margin-top:8px;padding:8px 10px;background:var(--arena);border-radius:8px;font-size:12px;color:var(--gris)">✓ ' + T('noChargeNow', 'No se cobra ahora: tu tarjeta queda como garantía y el pago se hace el día de llegada.') + (d.politica.texto ? ' ' + d.politica.texto : '') + '</div>') : '';
        q.innerHTML = '<div style="display:flex;justify-content:space-between"><span>' + p.noches + ' ' + T('nights', 'noches') + '</span><span><s style="color:#999">' + money(p.total) + ' €</s> <b style="color:var(--verde)">' + money(p.totalWeb) + ' €</b></span></div>' +
          '<div style="color:var(--gris);font-size:12px;margin-top:4px">' + T('saveBefore', 'Ahorras') + ' ' + money(p.ahorro) + ' ' + T('saveAfter', '€ con la reserva directa.') + '</div>' + pol;
      });
  }
  $('m-in').onchange = quote; $('m-out').onchange = quote;

  $('m-book').onclick = function () {
    var msg = $('m-msg');
    var body = { apartmentId: cur.id, entrada: $('m-in').value, salida: $('m-out').value, personas: +$('m-pax').value, nombre: $('m-nombre').value.trim(), email: $('m-email').value.trim(), telefono: $('m-tel').value.trim() };
    if (!body.entrada || !body.salida || !body.nombre || !body.email) { msg.textContent = T('completeDates', 'Completa fechas, nombre y email.'); return; }
    var btn = this; btn.disabled = true; btn.textContent = T('processing', 'Procesando…');
    fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ok) { msg.textContent = d.error || T('couldNotComplete', 'No se pudo completar.'); btn.disabled = false; btn.textContent = T('bookPay', 'Reservar y pagar'); return; }
        if (d.mode === 'stripe' && d.url) { window.location.href = d.url; return; }
        window.location.href = d.redirect || ('/reserva-ok?id=' + (d.booking && d.booking.id));
      })
      .catch(function () { msg.textContent = T('netError', 'Error de red.'); btn.disabled = false; btn.textContent = T('bookPay', 'Reservar y pagar'); });
  };

  // --- Visor de fotos por apartamento (lightbox) ----------------------------
  var GAL = window.APT_GALLERY || {};
  var lb = $('lightbox'), lbImgs = [], lbIdx = 0;
  function lbShow() { if (!lbImgs.length) return; $('lb-img').src = lbImgs[lbIdx]; $('lb-count').textContent = (lbIdx + 1) + ' / ' + lbImgs.length; }
  function lbOpen(id) { lbImgs = GAL[id] || []; if (!lbImgs.length) return; lbIdx = 0; lbShow(); lb.style.display = 'flex'; }
  function lbClose() { lb.style.display = 'none'; }
  function lbGo(d) { if (!lbImgs.length) return; lbIdx = (lbIdx + d + lbImgs.length) % lbImgs.length; lbShow(); }
  if (lb) {
    $('lb-close').onclick = lbClose;
    $('lb-prev').onclick = function () { lbGo(-1); };
    $('lb-next').onclick = function () { lbGo(1); };
    lb.onclick = function (e) { if (e.target === lb || e.target.classList.contains('lb-stage')) lbClose(); };
    document.addEventListener('keydown', function (e) {
      if (lb.style.display !== 'flex') return;
      if (e.key === 'Escape') lbClose(); else if (e.key === 'ArrowLeft') lbGo(-1); else if (e.key === 'ArrowRight') lbGo(1);
    });
    document.querySelectorAll('.apt-gallery-btn').forEach(function (b) { b.onclick = function () { lbOpen(b.getAttribute('data-gal')); }; });
  }

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
    var typing = bubble(T('typing', 'escribiendo…'), 'bot typing');
    fetch('/api/concierge', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: history, lang: I.lang }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        typing.remove();
        var reply = d.ok ? d.reply : (d.error || T('ccError', 'Ahora mismo no puedo responder, inténtalo en un momento.'));
        bubble(reply, 'bot'); history.push({ role: 'assistant', content: reply });
      })
      .catch(function () { typing.remove(); bubble(T('connError', 'Error de conexión.'), 'bot'); });
  };

  // --- Formulario "deja tu experiencia" (reseña del huésped → panel) ---------
  (function () {
    var form = $('revform'); if (!form) return;
    var starsEl = $('rf-stars');
    function paint(v) { Array.prototype.forEach.call(starsEl.children, function (s) { s.classList.toggle('on', +s.getAttribute('data-s') <= v); }); }
    paint(+starsEl.getAttribute('data-val'));
    Array.prototype.forEach.call(starsEl.children, function (s) {
      s.onclick = function () { var v = +s.getAttribute('data-s'); starsEl.setAttribute('data-val', v); paint(v); };
    });
    form.onsubmit = function (e) {
      e.preventDefault();
      var msg = $('rf-msg');
      var nombre = $('rf-name').value.trim(), texto = $('rf-text').value.trim();
      if (!nombre || !texto) { msg.style.color = '#b4462f'; msg.textContent = T('completeReview', 'Pon tu nombre y tu experiencia.'); return; }
      var btn = $('rf-send'); btn.disabled = true;
      fetch('/api/review', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nombre: nombre, texto: texto, puntuacion: +starsEl.getAttribute('data-val') }) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          btn.disabled = false;
          if (d.ok) { form.reset(); starsEl.setAttribute('data-val', 5); paint(5); msg.style.color = 'var(--verde)'; msg.textContent = msg.getAttribute('data-thanks'); }
          else { msg.style.color = '#b4462f'; msg.textContent = d.error || 'Error'; }
        })
        .catch(function () { btn.disabled = false; msg.style.color = '#b4462f'; msg.textContent = T('netError', 'Error de red.'); });
    };
  })();
})();

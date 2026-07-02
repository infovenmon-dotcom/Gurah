# Mapa de adaptación Kirana → GURAH (archivo por archivo)

> Cómo construir GURAH reutilizando el **stack REAL de Kirana** (Astro SSR + Netlify Blobs + motor de
> reserva/pagos/facturación/seguridad), no la maqueta vanilla del traspaso. Kirana vive en el repo
> `alojamientohotel-rural`. La idea: **partir de una copia del código de Kirana** y adaptar solo la capa de
> datos (habitación → apartamento) + textos/branding.

## 0. Arranque recomendado
La forma más rápida y limpia: en la sesión de GURAH, **clonar el código de Kirana como base** y sobre él aplicar
este mapa. (Kirana es `infovenmon-dotcom/alojamientohotel-rural`, rama `claude/kirana-project-setup-6ck20h`.)
Alternativa: copiar carpeta a carpeta según las listas de abajo.

## 1. Copiar TAL CUAL (núcleo del stack — no cambia)
Estos archivos se reutilizan sin tocar (salvo el detalle indicado):
- `astro.config.mjs`, `package.json`, `package-lock.json`, `tsconfig.json` — **verbatim**.
- `src/middleware.ts` — **verbatim** (protección panel + cabeceras seguridad + PUBLIC_API).
- `src/lib/persist.ts` — cambiar solo `BLOB_STORE = 'kirana'` → `'gurah'`.
- `src/lib/auth.ts`, `src/lib/authStore.ts`, `src/lib/loginGuard.ts` — **verbatim** (login scrypt, cambio/recuperación, anti fuerza bruta).
- `src/lib/sanitize.ts` — **verbatim** (anti-XSS).
- `src/lib/email.ts` — **verbatim** (cambiar `EMAIL_FROM` por defecto y textos de marca).
- `src/lib/claude.ts` — **verbatim** (cliente IA reseñas).
- `src/lib/whatsapp.ts` + `src/pages/api/whatsapp.ts` — **verbatim** (asistente; adaptar el system-prompt a GURAH: apartamentos, mascotas, piscina).
- `src/lib/invoices.ts`, `src/lib/expenses.ts`, `src/lib/garante.ts` — **verbatim** (facturación TicketBAI + gastos).
- `src/lib/ical.ts` + `src/pages/api/sync.ts` + `netlify/functions/sync-ical.mjs` — **verbatim** (channel manager iCal).
- `src/pages/panel/login.astro`, `logout.astro`, `reset.astro`, `src/pages/privacidad.astro`, `src/pages/reserva-ok.astro` — **verbatim** (cambiar textos/logo).
- `src/pages/api/panel/{password,recover,expense,ical,import,review-reply}.ts` — **verbatim**.
- `src/pages/api/stripe-webhook.ts` — **verbatim** (adaptar metadata a apartmentId).
- Borrar el diagnóstico temporal `src/pages/api/wa-check.ts` (era solo para depurar Kirana).

## 2. ADAPTAR: habitación → apartamento (capa de datos)
- `src/lib/rooms.ts` + `src/lib/roomsStore.ts` → **`apartments.ts` + `apartmentsStore.ts`**.
  - Interfaz `Room` → **`Apartment`**: añadir `m2, dormitorios, banos, capacidad, camas, ubicacion{texto,lat,lng},
    estancia_minima, tarifas_temporada[]`; conservar `id, nombre, slug, concepto, storytelling, servicios[],
    precio_base (→ era 'precio'), activa/estado, fotos[]`.
  - `BLOB_KEY = 'rooms'` → `'apartments'`. Funciones equivalentes: `getAllApartments`, `getActiveApartments`,
    `setApartmentActive`, `setApartmentsActive` (guardado en bloque, a prueba de carreras — **mantener este patrón**,
    fue clave en Kirana), `setApartmentPrice`, `setApartmentSeasons`.
- `src/data/rooms.json` → **`apartments.json`**: seed con el catálogo del traspaso (GURAH casa campo, **BAKEA**,
  apto 3 dorm., apto grande 10 pax) con campos `[PENDIENTE CLIENTE]` como placeholders marcados.
- `src/lib/pricing.ts` → añadir **precio por temporada**:
  - `precioNoche(apartamento, fecha)` = tarifa de `tarifas_temporada` aplicable, si no `precio_base`.
  - Mantener `webPrice(tarifa)` = −10% (WEB_DISCOUNT_PCT).
  - `totalEstancia(apartamento, in, out)` = suma por noches **respetando cambios de temporada** dentro del rango.
  - Validar **`estancia_minima`** (nº noches).
- `src/lib/bookings.ts` → `booking.room`/`roomId` → **`apartmentId`**; añadir validación de `estancia_minima`
  (además del solape que ya trae). Mantener `addBooking` con `updateJson` (a prueba de carreras).
- `src/pages/api/checkout.ts` → por apartamento: aplicar `precioNoche`+temporadas, `estancia_minima`,
  metadata con `apartmentId`. Mantener modo demo (sin Stripe simula reserva+factura+email).
- `src/pages/api/availability.ts`, `src/pages/api/rooms/[id].ts`, `src/pages/api/ical/[room].ics.ts`,
  `src/pages/api/panel/rooms.ts`, `src/pages/api/panel/room-price.ts` → equivalentes **por apartamento**
  (renombrar rutas a `apartments`/`[apartment]`).

## 3. WEB pública (`src/home.html` + `src/pages/index.astro` + `[lang]/index.astro`)
- Copiar `home.html` como base y transformar la sección **"¿Dónde te quieres alojar?" → "Elige tu apartamento"**.
- Tarjeta de apartamento: fotos, `m²`, `dormitorios`, `baños`, `capacidad`, chips de **servicios** (piscina, mascotas,
  jardín, parking…), **ubicación** (campo/playa) con mini-mapa/enlace por unidad, storytelling, precio web **−10%**
  (tachado el de plataformas), y **estancia mínima** visible.
- Modal de reserva: selección de fechas con **estancia mínima** y cálculo de total con **temporadas**.
- Filtros útiles (diferenciadores GURAH): **admite mascotas**, **piscina**, **ubicación** (campo/playa).
- Inyección: `window.GURAH_AVAIL` (equivalente a `KIRANA_AVAIL`), con apartamentos activos + precios web + bloqueos.
- i18n: reutilizar el sistema de 10 idiomas con `applyLang` (re-render del grid). Adaptar cadenas de specs/servicios.

## 4. PANEL (`buildpanel.cjs` + mockup + `src/pages/panel/index.astro`)
- Reutilizar el generador `buildpanel.cjs` y el patrón `window.PANEL`. **Editar el generador/snippets, nunca los
  archivos generados** (`panel.css/markup/app.js`).
- Pestaña **Apartamentos** (equivalente a Habitaciones): activar/bloquear, **editar precio base + tarifas por
  temporada + estancia mínima**, calendario de **bloqueos de disponibilidad**, foto/portada.
- Resto de pestañas **igual que Kirana**: Reservas, Facturas, Ingresos/Gastos, Contabilidad (multi-año), Clientes
  (CSV + email marketing), Canales (iCal), Reseñas (IA).
- Necesitarás un **mockup de panel** para GURAH (o reutilizar el de Kirana adaptando etiquetas habitación→apartamento).

## 5. NUEVO en GURAH (no existe en Kirana)
- **Ubicación por unidad** (campo/playa) con coordenadas y mapa por apartamento (portfolio distribuido).
- **Tarifas por temporada** + **estancia mínima** en modelo, checkout, web y panel.
- Filtros mascotas/piscina/ubicación.

## 6. Branding
- Logo y colores de GURAH (sustituir `public/logo.png`/`logo-blanco.png` y tokens de color).
- Textos de marca: rural boutique, "5*", piscina, pet-friendly, Gaztelugatxe a 3 km.

## 7. Variables de entorno (idénticas a Kirana, cuenta propia de GURAH)
`STRIPE_SECRET_KEY`, `BREVO_API_KEY`, `ANTHROPIC_API_KEY`, `PANEL_PASSWORD`, `ADMIN_EMAIL`, (WhatsApp:
`WHATSAPP_TOKEN/PHONE_ID/VERIFY_TOKEN/APP_SECRET`), `PUBLIC_SITE_URL`, `WEB_DISCOUNT_PCT` (10).
Todo en **modo demo** sin claves. Secretos SIEMPRE en variables de entorno.

## 8. Orden sugerido (rápido)
1. Clonar base de Kirana → renombrar store a 'gurah' → arrancar (`npm i`, build Netlify).
2. `apartments.ts/Store` + `apartments.json` (seed traspaso con placeholders).
3. `pricing.ts` con temporadas + estancia mínima; `bookings.ts` con validación.
4. Web "Elige tu apartamento" + filtros + modal con temporadas.
5. Panel: pestaña Apartamentos (precio/temporadas/estancia/bloqueos).
6. Checkout demo→real; resto de pestañas heredadas.
7. i18n, branding, SEO/hreflang, deploy.

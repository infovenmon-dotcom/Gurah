# CLAUDE.md — GURAH Boutique Apartments

Guía para trabajar en este repositorio. Proyecto de **Venmon**: web de producción +
panel de gestión + **reserva directa real** para apartamentos boutique en **Bakio (Bizkaia)**.

## Stack
- **Astro SSR** (`output: 'server'`) + adaptador `@astrojs/netlify`.
- **Netlify Blobs** como base de datos (store `gurah`) — fuente única de datos panel ↔ web.
- Panel generado con **`buildpanel.cjs`** (patrón `window.PANEL`).
- Motor de reserva real: persistencia + bloqueo de fechas en vivo + Stripe Checkout (modo demo).
- Facturación compatible TicketBAI/Batuz, email Brevo, iCal (channel manager), reseñas IA (Claude),
  asistente WhatsApp, seguridad (scrypt, cookie firmada, honeypot, CSP).

> Adaptado del stack REAL de Kirana (`alojamientohotel-rural`). La **unidad es el APARTAMENTO
> COMPLETO** (self-catering), no la habitación: precio por apartamento/noche, `estancia_minima`,
> `tarifas_temporada`, `dormitorios/banos/capacidad` y `ubicacion` por unidad (campo/playa).

## Comandos
```bash
npm install
npm run panel     # regenera el panel (src/generated/*) desde buildpanel.cjs
npm run dev       # desarrollo en http://localhost:4321 (MODO DEMO)
npm run build     # buildpanel + astro build (salida en dist/)
```

## Modo demo
Sin variables de entorno, **todo funciona simulado** (para enseñar al cliente):
- Datos en memoria sembrados desde `src/data/*.json`.
- Checkout simula pago → crea reserva + factura + "envía" email.
- Panel: contraseña **`demo`**.
Con claves reales (Stripe, Brevo, PANEL_PASSWORD…) pasa a modo producción. Ver `.env.example`.
**Los secretos SIEMPRE en variables de entorno, nunca en el código.**

## Arquitectura (archivos clave)
| Archivo | Rol |
|---|---|
| `src/lib/persist.ts` | Netlify Blobs + fallback demo. `updateJson` = escritura **a prueba de carreras**. |
| `src/lib/apartments.ts` / `apartmentsStore.ts` | Modelo `Apartment` + acceso a datos (`BLOB_KEY='apartments'`). |
| `src/data/apartments.json` | Seed del catálogo (con `[PENDIENTE CLIENTE]`). |
| `src/lib/pricing.ts` | Tarifas por temporada, `−10%` web, `totalEstancia`, estancia mínima. |
| `src/lib/bookings.ts` | Reservas: solape + estancia mínima + capacidad, `addBooking` anti-carreras. |
| `src/pages/api/checkout.ts` | Reserva directa: Stripe real ↔ demo. |
| `src/pages/api/availability.ts` | Fechas bloqueadas / cotización por fechas. |
| `src/pages/api/panel/*` | APIs del panel (protegidas por `middleware.ts`). |
| `buildpanel.cjs` | **Generador** del panel. Editar aquí, NUNCA `src/generated/*`. |
| `src/pages/index.astro` | Web "Elige tu apartamento": grid, filtros, modal de reserva. |

## Reglas del proyecto
- **NO inventar datos de cliente** (nombres, m², precios, fotos): usar `[PENDIENTE CLIENTE]`.
  Ver campo `pendiente_cliente[]` en cada apartamento del seed.
- **Editar `buildpanel.cjs`**, no los archivos generados.
- Mantener el patrón `updateJson` (anti-carreras) en toda escritura concurrente.
- Rama de trabajo indicada por la sesión. Commits claros, push a esa rama.

## Documentos de referencia
- `docs/MAPA-ADAPTACION-KIRANA-GURAH.md` — mapa de adaptación archivo por archivo.
- `docs/MASTER-PROMPT.md` — briefing original del proyecto.

## Pendiente (para el build final)
Pedir al cliente: inventario real (nombres, m², camas, precios por temporada), **fotos propias
sin marca de agua**, coordenadas exactas por unidad, textos legales, y las claves de producción.

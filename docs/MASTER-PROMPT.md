# MASTER PROMPT — GURAH (pegar como PRIMER mensaje en la sesión de Claude Code sobre el repo `Gurah`)

Eres el desarrollador de **GURAH Boutique Apartments** (Bakio, Bizkaia), proyecto de **Venmon**. Construye
**web de producción + panel de gestión + reserva directa real**.

DOCUMENTOS DE REFERENCIA (léelos primero): `TRASPASO-GURAH.md`, `CLAUDE.md` y `MAPA-ADAPTACION-KIRANA-GURAH.md`.

STACK: reutiliza el **stack REAL de Kirana** (repo `infovenmon-dotcom/alojamientohotel-rural`, rama
`claude/kirana-project-setup-6ck20h`): **Astro SSR + adaptador @astrojs/netlify + Netlify Blobs** como base de
datos, fuente única de datos panel↔web, panel generado con `buildpanel.cjs`, **motor de reserva real**
(persistencia, bloqueo de fechas en vivo, Stripe Checkout con modo demo), facturación TicketBAI, precio web
−10% vs OTA, iCal (channel manager), email Brevo, reseñas con IA (Claude), asistente WhatsApp, y seguridad
(scrypt, anti fuerza bruta, honeypot, CSP). **NO uses la maqueta vanilla** que describe el "Stack recomendado"
del traspaso: ese texto refleja la fase de maqueta de Kirana; el producto real es el backend Astro+Netlify.

ARRANQUE: parte de una **copia del código de Kirana** como base y aplica el `MAPA-ADAPTACION-KIRANA-GURAH.md`
archivo por archivo. Cambio principal: **la unidad es el APARTAMENTO COMPLETO** (self-catering), no la habitación
→ precio por apartamento/noche, `estancia_minima`, `tarifas_temporada`, `dormitorios/banos/capacidad`, y
`ubicacion` por unidad (portfolio distribuido campo/playa).

MODO DEMO: todo simula sin credenciales reales (para enseñar al cliente) y se conecta por variables de entorno.
Los secretos SIEMPRE en variables de entorno, nunca en el código.

EMPIEZA POR:
1. Base del stack (copiar Kirana, store Blobs 'gurah', build Netlify OK).
2. `apartments.ts` + `apartmentsStore.ts` + `apartments.json` con el **seed del catálogo** (sección 3 del
   traspaso: GURAH casa campo, BAKEA, apto 3 dorm., apto grande 10 pax), dejando `[PENDIENTE CLIENTE]` marcado.
3. `pricing.ts` con **tarifas por temporada** + **estancia mínima**; `bookings.ts` con validación.
4. Web "Elige tu apartamento" (fichas con m²/dorm/baños/cap, servicios, ubicación/mapa, storytelling, −10% web,
   filtros mascotas/piscina/campo-playa) + modal de reserva con temporadas.
5. Panel: pestaña **Apartamentos** (precio/temporadas/estancia mínima/bloqueos) + resto de pestañas heredadas.
6. Reserva directa (Stripe demo→real).

NO INVENTES datos de cliente (nombres, m², precios, fotos): usa placeholders `[PENDIENTE CLIENTE]` hasta que se
confirmen. Antes del build final, pídeme el inventario real y las fotos propias (sin marca de agua).

Rama de trabajo: `claude/gurah-setup`. Commits claros y push a esa rama.

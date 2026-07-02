# GURAH Boutique Apartments

Web + panel de gestión + **reserva directa** para apartamentos boutique en **Bakio (Bizkaia)**.
Astro SSR sobre Netlify Blobs. Proyecto de **Venmon**.

## Inicio rápido

```bash
npm install
npm run dev     # http://localhost:4321  (MODO DEMO, sin credenciales)
```

Panel de gestión: `/panel` — contraseña **`demo`** en modo demo.

## Qué incluye (fase actual)

- **Catálogo por apartamento completo** (self-catering): m², dormitorios, baños, capacidad,
  camas, servicios, ubicación (campo/playa) y storytelling.
- **Tarifas por temporada** + **estancia mínima** (modelo, checkout, web y panel).
- **Precio web −10%** frente a plataformas (OTA), con cálculo noche a noche por temporada.
- **Reserva directa real** con bloqueo de fechas en vivo, a prueba de carreras.
  - Stripe Checkout en modo real; **modo demo** simula pago + reserva + factura + email.
- **Panel** (`buildpanel.cjs`): Apartamentos (precio/temporadas/estancia/bloqueos), Reservas,
  Facturas (TicketBAI/Batuz), Ingresos/Gastos, Contabilidad, Clientes (CSV), Canales (iCal), Reseñas (IA).
- **Web pública** "Elige tu apartamento" con filtros (🐾 mascotas, 🏊 piscina, 🌳 campo, 🏖️ playa)
  y modal de reserva con temporadas.
- Seguridad: panel protegido, cookie de sesión firmada, honeypot anti-bots, CSP y cabeceras.
- Facturación, email transaccional (Brevo) e iCal (channel manager) por apartamento.

## Modo demo vs producción

Sin variables de entorno → **modo demo** (datos en memoria, pagos/emails simulados). Configura
`.env` (ver `.env.example`) para activar Stripe, Brevo, panel con contraseña propia, etc.
**Secretos siempre en variables de entorno.**

## Estructura

Ver `CLAUDE.md` para la guía de arquitectura y las reglas del proyecto. Los datos de cliente
aún por confirmar están marcados como `[PENDIENTE CLIENTE]`.

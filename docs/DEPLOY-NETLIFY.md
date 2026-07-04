# Desplegar GURAH en Netlify

Guía para publicar la web + panel + motor de reservas. El proyecto ya está
**listo para desplegar**: adaptador `@astrojs/netlify`, `netlify.toml`, función SSR,
middleware (protección del panel + CSP) y Netlify Blobs como base de datos.

> **Sin variables de entorno el sitio arranca en MODO DEMO** (reservas y pagos
> simulados, panel con contraseña `demo`). Perfecto para enseñárselo al cliente.
> Al añadir las claves reales pasa a producción.

---

## Opción A — Desde la web de Netlify (recomendada)

1. Entra en <https://app.netlify.com> → **Add new site → Import an existing project**.
2. Conecta **GitHub** y elige el repositorio **`infovenmon-dotcom/gurah`**.
3. Rama a desplegar:
   - Para una vista previa rápida: la rama de trabajo `claude/new-session-0fhlj8`.
   - Para producción: primero fusiona el PR #1 a `main` y despliega `main`.
4. Netlify detecta la configuración de `netlify.toml` automáticamente:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node:** 20 (fijado en `netlify.toml` y `.nvmrc`)
5. Pulsa **Deploy**. En ~1-2 min tendrás una URL tipo `https://<algo>.netlify.app`.
6. (Opcional) Renombra el sitio a **`gurah`** en *Site configuration → Change site name*
   para obtener `https://gurah.netlify.app`.

### Base de datos (Netlify Blobs)
No requiere configuración: el store **`gurah`** se crea solo la primera vez.
El adaptador ya habilita las sesiones con Netlify Blobs.

---

## Opción B — Netlify CLI

```bash
npm i -g netlify-cli
netlify login
netlify init            # enlaza el repo/carpeta con un sitio nuevo
netlify deploy --build  # despliegue de previsualización
netlify deploy --build --prod   # a producción
```

---

## Variables de entorno

En *Site configuration → Environment variables*. **Todas son opcionales**: cada bloque
que rellenes activa esa parte en real; lo que dejes vacío sigue en demo.

| Variable | Para qué | Nota |
|---|---|---|
| `PUBLIC_SITE_URL` | URL pública (enlaces, emails, iCal) | Ponla tras el 1er deploy, p.ej. `https://gurah.netlify.app` |
| `WEB_DISCOUNT_PCT` | % descuento reserva directa | Por defecto `10` |
| `PANEL_PASSWORD` | Contraseña del panel `/panel` | Si falta → `demo` |
| `SESSION_SECRET` | Firma de la cookie de sesión | Cadena larga aleatoria |
| `ANTHROPIC_API_KEY` | Concierge IA + reseñas reales | Si falta → respuestas demo |
| `ANTHROPIC_MODEL` | Modelo de Claude | `claude-opus-4-8` |
| `STRIPE_SECRET_KEY` | Cobro real | Si falta → checkout simulado |
| `STRIPE_WEBHOOK_SECRET` | Confirmación de pago Stripe | |
| `BREVO_API_KEY` | Emails transaccionales reales | Si falta → email simulado |
| `EMAIL_FROM` / `ADMIN_EMAIL` | Remitente / aviso interno | |
| `TBAI_NIF` / `TBAI_ENV` | Facturación TicketBAI/Batuz | `TBAI_ENV=pruebas` para pruebas |
| `WHATSAPP_*` | Asistente WhatsApp (opcional) | |

Referencia completa en `.env.example`. **Nunca** subas `.env` al repositorio.

### Pasar a producción de pagos y facturas
1. Claves **live** de Stripe + webhook apuntando a `https://<tu-sitio>/api/checkout` (o
   el endpoint de webhook correspondiente).
2. `BREVO_API_KEY` + dominio verificado en Brevo para los correos.
3. **TicketBAI real:** falta la **firma XAdES con el certificado del emisor** (lo aporta
   el cliente). La lógica de encadenado, ID TBAI y QR ya está lista en `src/lib/garante.ts`.

---

## Después de desplegar — comprobación rápida
- `/` → web multi-idioma (selector arriba a la derecha, 10 idiomas).
- `/panel/login` → panel (contraseña `demo` o tu `PANEL_PASSWORD`):
  Apartamentos · Reservas · Facturas (TicketBAI+QR) · Ingresos/Gastos · Contabilidad ·
  Clientes (CSV) · Canales iCal · Reseñas IA.
- Haz una reserva de prueba desde la web → aparece en *Reservas* y genera factura.

## Sincronización iCal periódica (channel manager) — opcional
Hay una función programada preparada en `netlify/functions/sync-ical.mjs`.
Para activarla, descomenta en `netlify.toml`:

```toml
[functions."sync-ical"]
  schedule = "@hourly"
```

---

## Pendiente del cliente (para el sitio final)
Inventario real y **precios por temporada**, **fotos propias sin marca de agua** (en alta),
coordenadas exactas por unidad, textos legales, copy nativo de marketing en eu/nl/be/no/da,
y las **claves de producción** (Stripe, Brevo, certificado TicketBAI).

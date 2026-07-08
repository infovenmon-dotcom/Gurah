/**
 * POST /api/checkout — Reserva directa.
 *
 * Modo real (con STRIPE_SECRET_KEY): crea una Stripe Checkout Session con metadata
 * { apartmentId, entrada, salida, ... } y devuelve la URL de pago. La reserva se
 * confirma luego en el webhook.
 *
 * Modo demo (sin Stripe): simula el pago → crea la reserva (a prueba de carreras),
 * genera factura y "envía" el email de confirmación. Todo sin credenciales.
 */

import type { APIRoute } from 'astro';
import { getApartment } from '../../lib/apartmentsStore';
import { addBooking, comprobarDisponibilidad } from '../../lib/bookings';
import { totalEstancia, validarEstancia, politicaCancelacion } from '../../lib/pricing';
import { sendMail, bookingEmailHtml, ADMIN_EMAIL } from '../../lib/email';
import { getLang } from '../../lib/i18n';

export const prerender = false;

const STRIPE_SECRET_KEY =
  (typeof process !== 'undefined' && process.env?.STRIPE_SECRET_KEY) || '';
const SITE_URL =
  (typeof process !== 'undefined' && process.env?.PUBLIC_SITE_URL) || 'http://localhost:4321';

interface CheckoutBody {
  apartmentId: string;
  entrada: string;
  salida: string;
  personas: number;
  nombre: string;
  email: string;
  telefono?: string;
  idioma?: string;
}

export const POST: APIRoute = async ({ request, url, cookies }) => {
  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return json({ ok: false, error: 'JSON inválido' }, 400);
  }

  // Idioma del huésped: el que envía la web, o el que resuelve el sitio
  // (query ?lang → cookie → Accept-Language). Se guarda en la reserva para
  // poder enviarle emails y campañas en su idioma.
  const idioma =
    body.idioma || getLang(url, cookies, request.headers.get('accept-language'));

  const { apartmentId, entrada, salida, personas, nombre, email } = body;
  if (!apartmentId || !entrada || !salida || !personas || !nombre || !email) {
    return json({ ok: false, error: 'Faltan datos de la reserva.' }, 400);
  }

  const apto = await getApartment(apartmentId);
  if (!apto || apto.estado !== 'activa') {
    return json({ ok: false, error: 'Apartamento no disponible.' }, 404);
  }

  const val = validarEstancia(apto, entrada, salida);
  if (!val.ok) return json({ ok: false, error: val.motivo }, 400);

  const disp = await comprobarDisponibilidad(apartmentId, entrada, salida);
  if (!disp.disponible) return json({ ok: false, error: disp.motivo }, 409);

  const precios = totalEstancia(apto, entrada, salida);
  const politica = politicaCancelacion(apto, entrada);

  // --- Modo real: Stripe Checkout en modo SETUP (guarda tarjeta como garantía, ---
  // --- SIN cobrar). El cargo se hace el día de llegada desde el panel. ----------
  if (STRIPE_SECRET_KEY) {
    try {
      const params = new URLSearchParams();
      params.set('mode', 'setup'); // solo guarda el método de pago, no cobra
      params.set('payment_method_types[0]', 'card');
      params.set('success_url', `${SITE_URL}/reserva-ok?setup={CHECKOUT_SESSION_ID}`);
      params.set('cancel_url', `${SITE_URL}/?cancel=1`);
      params.set('customer_email', email);
      // La reserva y el importe viajan en metadata; el booking se finaliza en el
      // webhook de Stripe (checkout.session.completed) — pendiente de conectar,
      // como el certificado TicketBAI. En demo, el flujo funciona sin Stripe.
      params.set('metadata[apartmentId]', apartmentId);
      params.set('metadata[entrada]', entrada);
      params.set('metadata[salida]', salida);
      params.set('metadata[personas]', String(personas));
      params.set('metadata[nombre]', nombre);
      params.set('metadata[email]', email);
      params.set('metadata[idioma]', idioma);
      params.set('metadata[total]', String(precios.totalWeb));

      const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });
      const session = await res.json();
      if (!res.ok) return json({ ok: false, error: session?.error?.message || 'Error Stripe' }, 502);
      return json({ ok: true, mode: 'stripe', url: session.url, politica });
    } catch (err) {
      return json({ ok: false, error: `Error de pago: ${(err as Error).message}` }, 502);
    }
  }

  // --- Modo demo: guarda la reserva CON GARANTÍA (sin cobrar) ----------------
  // No se genera factura aquí: la factura se emite cuando se cobra el día de
  // llegada (o al registrar el no-show) desde el panel.
  const result = await addBooking({
    apartmentId,
    entrada,
    salida,
    personas,
    huesped: { nombre, email, telefono: body.telefono, idioma },
    origen: 'web',
    demo: true,
    estado: 'confirmada',
    pagoEstado: 'garantizada',
  });

  if (!result.ok || !result.booking) {
    return json({ ok: false, error: result.motivo || 'No se pudo crear la reserva.' }, 409);
  }

  const mail = await sendMail({
    to: email,
    subject: `Reserva confirmada · ${apto.nombre} · GURAH`,
    html: bookingEmailHtml({
      nombre,
      apartamento: apto.nombre,
      entrada,
      salida,
      noches: precios.noches,
      total: result.booking.total,
      bookingId: result.booking.id,
      politica: politica.texto,
    }),
  });
  // Aviso al administrador (demo: registrado, no enviado sin clave).
  await sendMail({
    to: ADMIN_EMAIL,
    subject: `Nueva reserva · ${apto.nombre} · ${result.booking.id}`,
    html: `<p>Reserva ${result.booking.id} de ${nombre} (${email}). Con garantía, se cobra el día de llegada.</p>`,
  });

  return json({
    ok: true,
    mode: 'demo',
    booking: result.booking,
    politica,
    email: mail,
    redirect: `/reserva-ok?id=${result.booking.id}`,
  });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

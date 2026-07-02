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
import { totalEstancia, validarEstancia } from '../../lib/pricing';
import { createInvoiceForBooking } from '../../lib/invoices';
import { sendMail, bookingEmailHtml, ADMIN_EMAIL } from '../../lib/email';

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
}

export const POST: APIRoute = async ({ request }) => {
  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return json({ ok: false, error: 'JSON inválido' }, 400);
  }

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

  // --- Modo real: Stripe Checkout -------------------------------------------
  if (STRIPE_SECRET_KEY) {
    try {
      const params = new URLSearchParams();
      params.set('mode', 'payment');
      params.set('success_url', `${SITE_URL}/reserva-ok?id={CHECKOUT_SESSION_ID}`);
      params.set('cancel_url', `${SITE_URL}/?cancel=1`);
      params.set('customer_email', email);
      params.set('line_items[0][price_data][currency]', 'eur');
      params.set('line_items[0][price_data][product_data][name]', `${apto.nombre} · ${precios.noches} noches`);
      params.set('line_items[0][price_data][unit_amount]', String(Math.round(precios.totalWeb * 100)));
      params.set('line_items[0][quantity]', '1');
      params.set('metadata[apartmentId]', apartmentId);
      params.set('metadata[entrada]', entrada);
      params.set('metadata[salida]', salida);
      params.set('metadata[personas]', String(personas));
      params.set('metadata[nombre]', nombre);
      params.set('metadata[email]', email);

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
      return json({ ok: true, mode: 'stripe', url: session.url });
    } catch (err) {
      return json({ ok: false, error: `Error de pago: ${(err as Error).message}` }, 502);
    }
  }

  // --- Modo demo: simula pago + reserva + factura + email -------------------
  const result = await addBooking({
    apartmentId,
    entrada,
    salida,
    personas,
    huesped: { nombre, email, telefono: body.telefono },
    origen: 'web',
    demo: true,
    estado: 'confirmada',
  });

  if (!result.ok || !result.booking) {
    return json({ ok: false, error: result.motivo || 'No se pudo crear la reserva.' }, 409);
  }

  const invoice = await createInvoiceForBooking(result.booking, apto.nombre);
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
    }),
  });
  // Aviso al administrador (demo: registrado, no enviado sin clave).
  await sendMail({
    to: ADMIN_EMAIL,
    subject: `Nueva reserva DEMO · ${apto.nombre} · ${result.booking.id}`,
    html: `<p>Reserva ${result.booking.id} de ${nombre} (${email}).</p>`,
  });

  return json({
    ok: true,
    mode: 'demo',
    booking: result.booking,
    invoice,
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

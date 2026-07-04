/**
 * POST /api/stripe-webhook — Confirma la reserva tras el pago (modo real).
 *
 * Al recibir checkout.session.completed, lee metadata.apartmentId y crea la reserva
 * + factura + email. Verifica la firma si STRIPE_WEBHOOK_SECRET está configurado.
 * (Adaptado de Kirana: metadata room → apartmentId.)
 */

import type { APIRoute } from 'astro';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getApartment } from '../../lib/apartmentsStore';
import { addBooking } from '../../lib/bookings';
import { createInvoiceForBooking } from '../../lib/invoices';
import { sendMail, bookingEmailHtml } from '../../lib/email';

export const prerender = false;

const WEBHOOK_SECRET =
  (typeof process !== 'undefined' && process.env?.STRIPE_WEBHOOK_SECRET) || '';

function verifyStripeSignature(payload: string, header: string | null): boolean {
  if (!WEBHOOK_SECRET) return true; // sin secreto configurado → no se verifica (demo)
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(',').map((kv) => kv.split('=') as [string, string]),
  );
  const t = parts['t'];
  const v1 = parts['v1'];
  if (!t || !v1) return false;
  const signed = `${t}.${payload}`;
  const expected = createHmac('sha256', WEBHOOK_SECRET).update(signed).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
  } catch {
    return false;
  }
}

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!verifyStripeSignature(payload, sig)) {
    return new Response('Firma inválida', { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(payload);
  } catch {
    return new Response('JSON inválido', { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  const md = event.data?.object?.metadata ?? {};
  const apto = await getApartment(md.apartmentId);
  if (!apto) return new Response('Apartamento no encontrado', { status: 404 });

  const result = await addBooking({
    apartmentId: md.apartmentId,
    entrada: md.entrada,
    salida: md.salida,
    personas: Number(md.personas) || 1,
    huesped: { nombre: md.nombre, email: md.email },
    origen: 'web',
    estado: 'confirmada',
  });

  if (result.ok && result.booking) {
    await createInvoiceForBooking(result.booking, apto.nombre);
    await sendMail({
      to: md.email,
      subject: `Reserva confirmada · ${apto.nombre} · GURAH`,
      html: bookingEmailHtml({
        nombre: md.nombre,
        apartamento: apto.nombre,
        entrada: md.entrada,
        salida: md.salida,
        noches: result.booking.noches,
        total: result.booking.total,
        bookingId: result.booking.id,
      }),
    });
  }

  return new Response(JSON.stringify({ received: true, booking: result.booking?.id }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

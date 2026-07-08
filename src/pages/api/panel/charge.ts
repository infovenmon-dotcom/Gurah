/**
 * Panel · Cobro con garantía (protegido). POST /api/panel/charge
 *   { bookingId, tipo: 'cobro' }   → cobra la estancia completa (día de llegada)
 *   { bookingId, tipo: 'noshow' }  → cobra la primera noche (no-show)
 *
 * Modelo GURAH: la reserva se guarda con tarjeta de garantía SIN cobrar. El cargo
 * se hace el día de llegada, o se registra el no-show cobrando la primera noche.
 * Al cobrar se emite la factura (TicketBAI). En producción, el cargo real se hace
 * off-session sobre la tarjeta guardada (Stripe); en demo se simula.
 */

import type { APIRoute } from 'astro';
import { getBookings, registrarCargo, type Booking } from '../../../lib/bookings';
import { getApartment } from '../../../lib/apartmentsStore';
import { createInvoiceForBooking } from '../../../lib/invoices';
import { primeraNocheWeb } from '../../../lib/pricing';
import { isDemoAuth } from '../../../lib/auth';
import { demoBookings } from '../../../data/panel-demo';

export const prerender = false;

const STRIPE_SECRET_KEY =
  (typeof process !== 'undefined' && process.env?.STRIPE_SECRET_KEY) || '';

export const POST: APIRoute = async ({ request }) => {
  let body: { bookingId?: string; tipo?: 'cobro' | 'noshow' };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'JSON inválido' }, 400);
  }
  const { bookingId } = body;
  const tipo = body.tipo === 'noshow' ? 'noshow' : 'cobro';
  if (!bookingId) return json({ ok: false, error: 'Falta bookingId' }, 400);

  // Localiza la reserva (store; en demo, también en los ejemplos).
  let bookings = await getBookings();
  let booking = bookings.find((b) => b.id === bookingId) as Booking | undefined;
  if (!booking && isDemoAuth()) {
    booking = (demoBookings as any[]).find((b) => b.id === bookingId) as Booking | undefined;
  }
  if (!booking) return json({ ok: false, error: 'Reserva no encontrada' }, 404);
  if (booking.pagoEstado === 'cobrada' || booking.pagoEstado === 'no_show') {
    return json({ ok: false, error: 'Esta reserva ya está cobrada o marcada como no-show.' }, 409);
  }

  const apto = await getApartment(booking.apartmentId).catch(() => null);
  const aptNombre = apto?.nombre || booking.apartmentId;
  const primeraNoche = apto ? primeraNocheWeb(apto, booking.entrada) : Math.round(booking.total / booking.noches);

  const importe = tipo === 'noshow' ? Math.round(primeraNoche * 100) / 100 : booking.total;
  const concepto =
    tipo === 'noshow'
      ? `No-show ${aptNombre} — primera noche (${booking.entrada})`
      : `Estancia en ${aptNombre} (${booking.noches} noches)`;

  // --- Cobro real (Stripe off-session sobre la tarjeta de garantía) ----------
  let demo = true;
  if (STRIPE_SECRET_KEY && booking.garantia?.setupIntentId) {
    demo = false;
    try {
      const params = new URLSearchParams();
      params.set('amount', String(Math.round(importe * 100)));
      params.set('currency', 'eur');
      params.set('confirm', 'true');
      params.set('off_session', 'true');
      params.set('metadata[bookingId]', booking.id);
      params.set('metadata[tipo]', tipo);
      // El payment_method se obtiene del SetupIntent guardado (se conecta en
      // producción junto al webhook). Aquí queda el punto de integración.
      const res = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });
      const pi = await res.json();
      if (!res.ok) return json({ ok: false, error: pi?.error?.message || 'Error de cobro Stripe' }, 502);
    } catch (err) {
      return json({ ok: false, error: `Error de cobro: ${(err as Error).message}` }, 502);
    }
  }

  // --- Factura (TicketBAI) por el importe cobrado ----------------------------
  const invoice = await createInvoiceForBooking(booking, aptNombre, {
    importe,
    concepto,
    estado: 'cobrada',
  });

  // --- Actualiza el estado de pago de la reserva -----------------------------
  const pagoEstado = tipo === 'noshow' ? 'no_show' : 'cobrada';
  const cargo = { fecha: new Date().toISOString(), importe, tipo: (tipo === 'noshow' ? 'no_show' : 'cobro') as 'cobro' | 'no_show', invoiceId: invoice.id };
  await registrarCargo(booking.id, pagoEstado, cargo);

  return json({ ok: true, tipo, importe, pagoEstado, invoice, cargo, demo });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

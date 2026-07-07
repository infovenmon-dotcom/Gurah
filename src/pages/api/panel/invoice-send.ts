/**
 * Panel · Factura imprimible / envío al cliente (protegido).
 *
 *   GET  /api/panel/invoice-send?id=GRH-2026-0001   → HTML de la factura (imprimir/PDF)
 *   POST { invoiceId }                              → envía la factura por email al cliente
 *
 * La misma plantilla (invoiceHtml) sirve para imprimir y para el email, así el
 * cliente recibe exactamente lo que ve el anfitrión. En demo (sin BREVO_API_KEY)
 * no se envía correo real: se devuelve el estado demo.
 */

import type { APIRoute } from 'astro';
import { getInvoices } from '../../../lib/invoices';
import { getBookings } from '../../../lib/bookings';
import { getApartment } from '../../../lib/apartmentsStore';
import { isDemoAuth } from '../../../lib/auth';
import { demoInvoices, demoBookings } from '../../../data/panel-demo';
import { invoiceHtml, sendMail } from '../../../lib/email';

export const prerender = false;

async function build(id: string) {
  let invoices = await getInvoices();
  let bookings = await getBookings();
  if (isDemoAuth()) {
    if (!invoices.length) invoices = demoInvoices as any;
    if (!bookings.length) bookings = demoBookings as any;
  }
  const inv = invoices.find((i: any) => i.id === id);
  if (!inv) return null;
  const bk = bookings.find((b: any) => b.id === (inv as any).bookingId);
  const apto = bk ? await getApartment(bk.apartmentId).catch(() => null) : null;
  const html = invoiceHtml({
    id: inv.id,
    fecha: inv.fecha,
    cliente: inv.cliente,
    concepto: inv.concepto,
    base: inv.base,
    iva: inv.iva,
    ivaPct: inv.ivaPct,
    total: inv.total,
    apartamento: apto?.nombre || (bk ? bk.apartmentId : undefined),
    entrada: bk?.entrada,
    salida: bk?.salida,
    tbaiId: (inv as any).tbai?.tbaiId,
    estado: (inv as any).estado,
  });
  return { inv, html };
}

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id') || '';
  const out = await build(id);
  if (!out) return new Response('Factura no encontrada', { status: 404 });
  return new Response(out.html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
};

export const POST: APIRoute = async ({ request }) => {
  let body: { invoiceId?: string };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'JSON inválido' }, 400);
  }
  if (!body.invoiceId) return json({ ok: false, error: 'Falta invoiceId' }, 400);
  const out = await build(body.invoiceId);
  if (!out) return json({ ok: false, error: 'Factura no encontrada' }, 404);
  const to = out.inv.cliente.email;
  if (!to) return json({ ok: false, error: 'La factura no tiene email de cliente.' }, 400);

  const res = await sendMail({
    to,
    subject: `Tu factura ${out.inv.id} · GURAH Boutique Apartments`,
    html: out.html,
  });
  return json({ ok: true, to, sent: res.sent, demo: res.demo, info: res.info });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

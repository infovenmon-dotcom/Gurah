/**
 * Panel · Datos agregados (protegido). GET /api/panel/data
 * Devuelve reservas, facturas, gastos y clientes para las pestañas del panel.
 */

import type { APIRoute } from 'astro';
import { getBookings } from '../../../lib/bookings';
import { getInvoices } from '../../../lib/invoices';
import { readJson } from '../../../lib/persist';
import { isDemoAuth } from '../../../lib/auth';
import { demoBookings, demoInvoices, demoExpenses } from '../../../data/panel-demo';

export const prerender = false;

export const GET: APIRoute = async () => {
  let [bookings, invoices, expenses, customers, reviews, feeds] = await Promise.all([
    getBookings(),
    getInvoices(),
    readJson<any[]>('expenses', []),
    readJson<any[]>('customers', []),
    readJson<any[]>('reviews', []),
    readJson('ical_feeds', {}),
  ]);

  // Modo demo (sin PANEL_PASSWORD real): si no hay datos reales, se muestran
  // ejemplos para enseñar el panel al cliente (como el panel de Kirana). En cuanto
  // entran reservas/facturas reales, los ejemplos desaparecen.
  if (isDemoAuth()) {
    if (!bookings.length) bookings = demoBookings as any;
    if (!invoices.length) invoices = demoInvoices as any;
    if (!expenses.length) expenses = demoExpenses as any;
  }

  // Clientes derivados de reservas si no hay lista explícita.
  const derived = new Map<string, { nombre: string; email: string; reservas: number }>();
  for (const b of bookings) {
    const key = b.huesped.email;
    const cur = derived.get(key) ?? { nombre: b.huesped.nombre, email: key, reservas: 0 };
    cur.reservas += 1;
    derived.set(key, cur);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      bookings,
      invoices,
      expenses,
      reviews,
      feeds,
      customers: (customers as any[]).length ? customers : [...derived.values()],
    }),
    { headers: { 'content-type': 'application/json' } },
  );
};

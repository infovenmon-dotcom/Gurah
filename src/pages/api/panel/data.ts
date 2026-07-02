/**
 * Panel · Datos agregados (protegido). GET /api/panel/data
 * Devuelve reservas, facturas, gastos y clientes para las pestañas del panel.
 */

import type { APIRoute } from 'astro';
import { getBookings } from '../../../lib/bookings';
import { getInvoices } from '../../../lib/invoices';
import { readJson } from '../../../lib/persist';

export const prerender = false;

export const GET: APIRoute = async () => {
  const [bookings, invoices, expenses, customers] = await Promise.all([
    getBookings(),
    getInvoices(),
    readJson('expenses', []),
    readJson('customers', []),
  ]);

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
      customers: (customers as any[]).length ? customers : [...derived.values()],
    }),
    { headers: { 'content-type': 'application/json' } },
  );
};

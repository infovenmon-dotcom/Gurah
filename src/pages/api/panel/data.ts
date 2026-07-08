/**
 * Panel · Datos agregados (protegido). GET /api/panel/data
 * Devuelve reservas, facturas, gastos y clientes para las pestañas del panel.
 */

import type { APIRoute } from 'astro';
import { getBookings } from '../../../lib/bookings';
import { getInvoices } from '../../../lib/invoices';
import { readJson } from '../../../lib/persist';
import { isDemoAuth } from '../../../lib/auth';
import { demoBookings, demoInvoices, demoExpenses, demoReviews } from '../../../data/panel-demo';

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
    // Reseñas: en demo se muestran las de ejemplo (varios idiomas) para enseñar el
    // flujo de traducción/respuesta. Se anteponen las reseñas reales dejadas desde
    // la web (origen:'web') para que el flujo huésped→panel funcione en la demo.
    const webReviews = (reviews as any[]).filter((r) => r?.origen === 'web');
    reviews = [...webReviews, ...(demoReviews as any)];
  }

  // Clientes derivados de reservas si no hay lista explícita. Incluye teléfono e
  // idioma (recogidos en la reserva desde la web) para el CRM y el email marketing.
  const derived = new Map<
    string,
    { nombre: string; email: string; telefono?: string; idioma?: string; reservas: number; ultima?: string }
  >();
  for (const b of bookings) {
    const key = b.huesped.email;
    const cur = derived.get(key) ?? { nombre: b.huesped.nombre, email: key, reservas: 0 };
    cur.reservas += 1;
    if (b.huesped.telefono) cur.telefono = b.huesped.telefono;
    if ((b.huesped as any).idioma) cur.idioma = (b.huesped as any).idioma;
    if (!cur.ultima || (b.entrada && b.entrada > cur.ultima)) cur.ultima = b.entrada;
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

/**
 * GET /api/availability?apartment=<id>
 *   → { apartmentId, blocked: string[] }  (fechas ocupadas: reservas + bloqueos)
 *
 * GET /api/availability?apartment=<id>&entrada=YYYY-MM-DD&salida=YYYY-MM-DD
 *   → { disponible, motivo?, precios? }
 */

import type { APIRoute } from 'astro';
import { getBlockedDates, comprobarDisponibilidad } from '../../lib/bookings';
import { getApartment } from '../../lib/apartmentsStore';
import { totalEstancia } from '../../lib/pricing';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const apartmentId = url.searchParams.get('apartment');
  if (!apartmentId) {
    return json({ error: 'Falta parámetro apartment' }, 400);
  }
  const entrada = url.searchParams.get('entrada');
  const salida = url.searchParams.get('salida');

  if (entrada && salida) {
    const disp = await comprobarDisponibilidad(apartmentId, entrada, salida);
    let precios = null;
    if (disp.disponible) {
      const apto = await getApartment(apartmentId);
      if (apto) precios = totalEstancia(apto, entrada, salida);
    }
    return json({ ...disp, precios });
  }

  const blocked = await getBlockedDates(apartmentId);
  return json({ apartmentId, blocked });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

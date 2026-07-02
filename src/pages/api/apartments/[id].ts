/** GET /api/apartments/<id> → detalle del apartamento (activo). */
import type { APIRoute } from 'astro';
import { getApartment } from '../../../lib/apartmentsStore';
import { getBlockedDates } from '../../../lib/bookings';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const id = params.id!;
  const apto = await getApartment(id);
  if (!apto || apto.estado !== 'activa') {
    return new Response(JSON.stringify({ error: 'No encontrado' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }
  const blocked = await getBlockedDates(id);
  return new Response(JSON.stringify({ apartment: apto, blocked }), {
    headers: { 'content-type': 'application/json' },
  });
};

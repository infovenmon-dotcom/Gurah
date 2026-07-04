/**
 * Panel · Apartamentos (protegido por middleware /api/panel/**).
 *
 * GET  /api/panel/apartments                → lista completa
 * POST /api/panel/apartments  { action, ... }
 *   action 'toggle'   { id, active }
 *   action 'price'    { id, precio_base }
 *   action 'seasons'  { id, tarifas_temporada }
 *   action 'minstay'  { id, estancia_minima }
 *   action 'update'   { id, patch }
 *   action 'blocks'   { id, dias }
 */

import type { APIRoute } from 'astro';
import { getAllApartments, setApartmentActive, setApartmentPrice, setApartmentSeasons, setApartmentMinStay, updateApartment } from '../../../lib/apartmentsStore';
import { setBlocks, getBlocks } from '../../../lib/bookings';

export const prerender = false;

export const GET: APIRoute = async () => {
  const apartments = await getAllApartments();
  const blocks = await getBlocks();
  return json({ ok: true, apartments, blocks });
};

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'JSON inválido' }, 400);
  }
  const { action, id } = body;
  if (!id) return json({ ok: false, error: 'Falta id' }, 400);

  try {
    switch (action) {
      case 'toggle':
        return json({ ok: true, apartments: await setApartmentActive(id, !!body.active) });
      case 'price':
        return json({ ok: true, apartments: await setApartmentPrice(id, Number(body.precio_base)) });
      case 'seasons':
        return json({ ok: true, apartments: await setApartmentSeasons(id, body.tarifas_temporada) });
      case 'minstay':
        return json({ ok: true, apartments: await setApartmentMinStay(id, Number(body.estancia_minima)) });
      case 'update':
        return json({ ok: true, apartments: await updateApartment(id, body.patch || {}) });
      case 'blocks':
        return json({ ok: true, blocks: await setBlocks(id, Array.isArray(body.dias) ? body.dias : []) });
      default:
        return json({ ok: false, error: 'Acción desconocida' }, 400);
    }
  } catch (err) {
    return json({ ok: false, error: (err as Error).message }, 500);
  }
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

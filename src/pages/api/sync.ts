/**
 * POST /api/sync — Dispara la sincronización iCal (channel manager).
 * Público para poder invocarse desde la función programada de Netlify.
 * Opcional: ?apartment=<id> para sincronizar solo uno.
 */

import type { APIRoute } from 'astro';
import { syncAll, syncApartment } from '../../lib/ical';

export const prerender = false;

export const POST: APIRoute = async ({ url }) => {
  const apartmentId = url.searchParams.get('apartment');
  const results = apartmentId ? [await syncApartment(apartmentId)] : await syncAll();
  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { 'content-type': 'application/json' },
  });
};

// GET de conveniencia para comprobar en el navegador (equivalente a POST).
export const GET: APIRoute = async ({ url }) => {
  const apartmentId = url.searchParams.get('apartment');
  const results = apartmentId ? [await syncApartment(apartmentId)] : await syncAll();
  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { 'content-type': 'application/json' },
  });
};

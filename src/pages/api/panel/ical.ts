/**
 * Panel · Canales iCal (protegido). POST /api/panel/ical
 *   { action:'feeds', id, urls }  → guarda los feeds iCal de un apartamento
 *   { action:'sync', id? }        → sincroniza (uno o todos)
 */

import type { APIRoute } from 'astro';
import { setFeeds, syncApartment, syncAll } from '../../../lib/ical';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'JSON inválido' }, 400);
  }
  if (body.action === 'feeds') {
    if (!body.id) return json({ ok: false, error: 'Falta id' }, 400);
    const urls = Array.isArray(body.urls) ? body.urls : String(body.urls || '').split('\n');
    const feeds = await setFeeds(body.id, urls.map((s: string) => s.trim()).filter(Boolean));
    return json({ ok: true, feeds });
  }
  if (body.action === 'sync') {
    const results = body.id ? [await syncApartment(body.id)] : await syncAll();
    return json({ ok: true, results });
  }
  return json({ ok: false, error: 'Acción desconocida' }, 400);
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

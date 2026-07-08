/**
 * POST /api/review — Reseña dejada por el huésped desde la web.
 *
 * Recoge la experiencia del cliente (nombre, puntuación, texto) y la guarda en el
 * almacén de reseñas con `origen:'web'`. Aparece en el panel (Reseñas) como reseña
 * nueva → salta el aviso y el anfitrión puede traducirla y responder. No se publica
 * automáticamente en la web pública (queda para moderación del anfitrión).
 */

import type { APIRoute } from 'astro';
import { updateJson } from '../../lib/persist';
import { getLang } from '../../lib/i18n';

export const prerender = false;

interface Review {
  id: string;
  autor?: string;
  apartmentId?: string;
  texto: string;
  puntuacion?: number;
  idioma?: string;
  fecha?: string;
  origen?: string;
  respuesta?: string;
}

export const POST: APIRoute = async ({ request, url, cookies }) => {
  let body: { nombre?: string; texto?: string; puntuacion?: number; apartmentId?: string };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'JSON inválido' }, 400);
  }
  const nombre = (body.nombre || '').trim();
  const texto = (body.texto || '').trim();
  const puntuacion = Math.max(1, Math.min(5, Number(body.puntuacion) || 5));
  if (!nombre || !texto) return json({ ok: false, error: 'Falta nombre o experiencia.' }, 400);
  if (texto.length > 1500) return json({ ok: false, error: 'Texto demasiado largo.' }, 400);

  const idioma = getLang(url, cookies, request.headers.get('accept-language'));
  const review: Review = {
    id: 'web-' + Date.now().toString(36),
    autor: nombre.slice(0, 80),
    apartmentId: body.apartmentId,
    texto,
    puntuacion,
    idioma,
    fecha: new Date().toISOString().slice(0, 10),
    origen: 'web',
  };

  await updateJson<Review[]>('reviews', (all) => [review, ...(all || [])], []);
  return json({ ok: true });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

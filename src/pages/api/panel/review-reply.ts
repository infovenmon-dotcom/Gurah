/**
 * Panel · Reseñas IA (protegido). POST /api/panel/review-reply
 *   { reviewId }            → genera un borrador de respuesta con IA (Claude)
 *   { reviewId, respuesta } → guarda la respuesta publicada
 *
 * Reconstrucción del módulo de Kirana (respuestas a reseñas asistidas por IA).
 */

import type { APIRoute } from 'astro';
import { readJson, updateJson } from '../../../lib/persist';
import { draftReviewReply } from '../../../lib/claude';
import { getApartment } from '../../../lib/apartmentsStore';

export const prerender = false;

interface Review {
  id: string;
  autor?: string;
  apartmentId?: string;
  texto: string;
  puntuacion?: number;
  idioma?: string;
  fecha?: string;
  respuesta?: string;
}

export const POST: APIRoute = async ({ request }) => {
  let body: { reviewId?: string; respuesta?: string };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'JSON inválido' }, 400);
  }
  if (!body.reviewId) return json({ ok: false, error: 'Falta reviewId' }, 400);

  const reviews = await readJson<Review[]>('reviews', []);
  const review = reviews.find((r) => r.id === body.reviewId);
  if (!review) return json({ ok: false, error: 'Reseña no encontrada' }, 404);

  // Guardar respuesta publicada.
  if (typeof body.respuesta === 'string') {
    await updateJson<Review[]>(
      'reviews',
      (all) => all.map((r) => (r.id === body.reviewId ? { ...r, respuesta: body.respuesta } : r)),
      [],
    );
    return json({ ok: true, saved: true });
  }

  // Generar borrador con IA.
  const apto = review.apartmentId ? await getApartment(review.apartmentId) : null;
  const result = await draftReviewReply({
    autor: review.autor,
    texto: apto ? `${review.texto}\n(Alojamiento: ${apto.nombre})` : review.texto,
    puntuacion: review.puntuacion,
    idioma: review.idioma,
  });
  if (result.error) return json({ ok: false, error: result.error }, 502);
  return json({ ok: true, draft: result.text, demo: result.demo });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

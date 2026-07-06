/**
 * Panel · Reseñas IA (protegido). POST /api/panel/review-reply
 *   { reviewId }            → genera un borrador de respuesta con IA (Claude)
 *   { reviewId, respuesta } → guarda la respuesta publicada
 *
 * Reconstrucción del módulo de Kirana (respuestas a reseñas asistidas por IA).
 */

import type { APIRoute } from 'astro';
import { readJson, updateJson } from '../../../lib/persist';
import { draftReviewReply, translateToSpanish } from '../../../lib/claude';
import { getApartment } from '../../../lib/apartmentsStore';

export const prerender = false;

interface Review {
  id: string;
  autor?: string;
  apartmentId?: string;
  texto: string;
  puntuacion?: number;
  idioma?: string;
  traduccion?: string;
  fecha?: string;
  respuesta?: string;
}

const LANG_NAME: Record<string, string> = {
  es: 'español', eu: 'euskera', en: 'inglés', fr: 'francés', de: 'alemán',
  nl: 'neerlandés', it: 'italiano', pt: 'portugués', no: 'noruego', da: 'danés',
};
// Respuestas demo (sin ANTHROPIC_API_KEY) en el idioma del huésped.
const DEMO_REPLY: Record<string, string> = {
  en: 'Thank you so much, James! We’re delighted you enjoyed the pool and the terrace. Maialen sends her best — we’d love to welcome you back to GURAH.',
  fr: 'Merci beaucoup, Sophie ! Ravis que la maison et son emplacement vous aient plu. Maialen vous remercie et serait heureuse de vous accueillir à nouveau à GURAH.',
  de: 'Vielen Dank, Thomas und Lena! Es freut uns sehr, dass euch Lage und Pool gefallen haben. Maialen grüßt herzlich — wir freuen uns auf euren nächsten Besuch bei GURAH.',
  nl: 'Hartelijk dank, Anke! Fijn dat je genoten hebt van BAKEA en het strand. We noteren je opmerking over de check-in. Graag tot ziens bij GURAH!',
  es: '¡Mil gracias, Marta! Nos alegra muchísimo que disfrutarais de la piscina y el jardín. Os esperamos de vuelta en GURAH cuando queráis.',
};

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

  // --- Asistencia IA: traducción al español + respuesta en el idioma del huésped ---
  const apto = review.apartmentId ? await getApartment(review.apartmentId) : null;
  const cod = (review.idioma || 'es').slice(0, 2);
  const esEspanol = cod === 'es';
  const idiomaNombre = LANG_NAME[cod] || 'el mismo idioma de la reseña';

  // 1) Traducción al español (si la reseña no está en español y no la trae ya).
  let traduccion = review.traduccion || '';
  if (!esEspanol && !traduccion) {
    const tr = await translateToSpanish(review.texto);
    if (!tr.error) traduccion = tr.text;
  }

  // 2) Borrador de respuesta en el idioma del huésped.
  const result = await draftReviewReply({
    autor: review.autor,
    texto: apto ? `${review.texto}\n(Alojamiento: ${apto.nombre})` : review.texto,
    puntuacion: review.puntuacion,
    idioma: idiomaNombre,
  });
  if (result.error) return json({ ok: false, error: result.error }, 502);

  // En demo, usa una respuesta de ejemplo en el idioma del huésped (más realista).
  const draft = result.demo && DEMO_REPLY[cod] ? DEMO_REPLY[cod] : result.text;
  return json({ ok: true, idioma: cod, idiomaNombre, traduccion, draft, demo: result.demo });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

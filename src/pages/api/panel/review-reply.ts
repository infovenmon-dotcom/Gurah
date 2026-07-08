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
import { isDemoAuth } from '../../../lib/auth';
import { demoReviews } from '../../../data/panel-demo';

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
// Respuestas de ejemplo (demostración) en el idioma del huésped. Genéricas, para
// que sirvan también con reseñas nuevas dejadas desde la web. Con la IA activada
// la respuesta se redacta a medida de cada reseña.
const DEMO_REPLY: Record<string, string> = {
  es: '¡Mil gracias por tus palabras! Nos alegra muchísimo que disfrutaras de tu estancia con nosotros. Te esperamos de vuelta en GURAH cuando quieras.',
  en: 'Thank you so much for your kind words! We’re delighted you enjoyed your stay. Maialen sends her best — we’d love to welcome you back to GURAH.',
  fr: 'Merci beaucoup pour votre message ! Ravis que votre séjour vous ait plu. Maialen vous remercie et serait heureuse de vous accueillir à nouveau à GURAH.',
  de: 'Vielen Dank für deine netten Worte! Es freut uns sehr, dass dir dein Aufenthalt gefallen hat. Maialen grüßt herzlich — wir freuen uns auf deinen nächsten Besuch bei GURAH.',
  nl: 'Hartelijk dank voor je bericht! Fijn dat je genoten hebt van je verblijf. We hopen je snel weer te verwelkomen bij GURAH!',
  be: 'Hartelijk dank voor je bericht! Fijn dat je genoten hebt van je verblijf. We hopen je snel weer te zien bij GURAH!',
  it: 'Grazie mille per il tuo messaggio! Siamo felici che il soggiorno ti sia piaciuto. Maialen ti saluta e sarebbe lieta di riaverti come ospite a GURAH.',
  eu: 'Mila esker zure hitzengatik! Pozten gaitu zure egonaldiaz gozatu izanak. GURAHera itzultzeko gogoz zaudenerako, hemen izango gaituzu.',
  no: 'Tusen takk for tilbakemeldingen! Vi er glade for at du likte oppholdet. Maialen hilser — vi håper å se deg igjen på GURAH.',
  da: 'Mange tak for din anmeldelse! Vi er glade for, at du nød opholdet. Maialen sender de bedste hilsener — vi håber at se dig igen på GURAH.',
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
  let review = reviews.find((r) => r.id === body.reviewId);
  // En demostración, las reseñas de ejemplo se muestran en el panel pero no están
  // en el almacén; se buscan también ahí para poder generar la respuesta.
  if (!review && isDemoAuth()) {
    review = (demoReviews as Review[]).find((r) => r.id === body.reviewId);
  }
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
    // En demostración (sin IA) no se usa el eco; se traduce de verdad al activar la IA.
    if (!tr.error && !tr.demo) traduccion = tr.text;
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

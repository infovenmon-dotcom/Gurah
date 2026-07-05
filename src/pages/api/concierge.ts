/**
 * POST /api/concierge — Concierge IA de la web (público).
 * Body: { messages: [{role:'user'|'assistant', content}] }
 * Responde como anfitrión-guía de Bakio y puede recomendar el apartamento perfecto
 * a partir del catálogo activo. Usa claude.ts (demo si no hay ANTHROPIC_API_KEY).
 */

import type { APIRoute } from 'astro';
import { askClaude, type ClaudeMessage } from '../../lib/claude';
import { getActiveApartments } from '../../lib/apartmentsStore';
import { webPrice } from '../../lib/pricing';
import { activeTheme } from '../../lib/theme';

export const prerender = false;

const LANG_NAME: Record<string, string> = {
  es: 'español', eu: 'euskera', fr: 'francés', en: 'inglés', it: 'italiano',
  be: 'neerlandés (flamenco)', nl: 'neerlandés', no: 'noruego', da: 'danés', de: 'alemán',
};

export const POST: APIRoute = async ({ request }) => {
  let body: { messages?: ClaudeMessage[]; lang?: string };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'JSON inválido' }, 400);
  }
  const langName = LANG_NAME[body.lang || 'es'] || 'español';
  const messages = (body.messages || [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-10);
  if (!messages.length) return json({ ok: false, error: 'Sin mensaje' }, 400);

  const apts = await getActiveApartments();
  const catalogo = apts
    .map(
      (a) =>
        `- ${a.nombre} (${a.ubicacion.tipo}, ${a.dormitorios} dorm., hasta ${a.capacidad} pers., ` +
        `desde ${webPrice(a.precio_base)}€/noche, estancia mínima ${a.estancia_minima}). ` +
        `Servicios: ${a.servicios.join(', ')}. Ancla: #apartamentos`,
    )
    .join('\n');

  const system =
    `Eres el concierge de ${activeTheme.brand.name}, apartamentos boutique en Bakio (Bizkaia), a 10 min ` +
    `de San Juan de Gaztelugatxe. Tono cercano, cálido, elegante y BREVE (2-4 frases, sin listas largas). ` +
    `La anfitriona se llama Maialen y es muy atenta; puedes mencionarla con cariño si viene a cuento. ` +
    `Conoces Bakio y su entorno: playa y surf (a 5 min), Gaztelugatxe a 10 min, bodegas de txakoli, ` +
    `restaurantes, rutas, y Bilbao a ~30 min. Ayudas a planear la escapada y, cuando encaje, recomiendas el apartamento perfecto ` +
    `según nº de personas, si viajan con mascota, si quieren piscina o playa. No inventes disponibilidad ni ` +
    `precios exactos por fecha: invita a ver fechas en la web. Si recomiendas un apartamento, di su nombre y ` +
    `sugiere "míralo más abajo, en Apartamentos". No compartas datos internos. ` +
    `IMPORTANTE: responde SIEMPRE en ${langName}, con naturalidad de hablante nativo.` +
    `\n\nCATÁLOGO ACTUAL:\n${catalogo}`;

  const result = await askClaude({ system, messages, maxTokens: 350 });
  if (result.error) return json({ ok: false, error: result.error }, 502);
  return json({ ok: true, reply: result.text, demo: result.demo });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

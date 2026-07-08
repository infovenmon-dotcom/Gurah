/**
 * claude.ts — Cliente de IA (Anthropic) para GURAH.
 *
 * Reconstrucción del módulo heredado de Kirana. Se usa para:
 *   - Redacción asistida de respuestas a reseñas (panel).
 *   - Asistente de WhatsApp (respuestas al huésped).
 *
 * Llamada por HTTP directo a la Messages API (mismo patrón raw-fetch que Stripe/Brevo
 * en este repo; sin SDK). Modelo por defecto: claude-opus-4-8.
 * En modo demo (sin ANTHROPIC_API_KEY) devuelve una respuesta simulada.
 */

const ANTHROPIC_API_KEY =
  (typeof process !== 'undefined' && process.env?.ANTHROPIC_API_KEY) || '';
const MODEL =
  (typeof process !== 'undefined' && process.env?.ANTHROPIC_MODEL) || 'claude-opus-4-8';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AskOptions {
  system?: string;
  messages: ClaudeMessage[];
  maxTokens?: number;
}

export interface ClaudeResult {
  text: string;
  demo: boolean;
  error?: string;
}

export function isClaudeConfigured(): boolean {
  return !!ANTHROPIC_API_KEY;
}

/** Realiza una consulta a Claude. Devuelve texto plano de la respuesta. */
export async function askClaude(opts: AskOptions): Promise<ClaudeResult> {
  if (!ANTHROPIC_API_KEY) {
    // Modo demo: eco simple para poder enseñar el flujo sin credenciales.
    const last = opts.messages[opts.messages.length - 1]?.content ?? '';
    return {
      demo: true,
      text: `[DEMO IA] Respuesta simulada. Configura ANTHROPIC_API_KEY para respuestas reales. (Entrada: "${last.slice(0, 80)}")`,
    };
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: opts.maxTokens ?? 1024,
        system: opts.system,
        messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { demo: false, text: '', error: `Anthropic ${res.status}: ${err.slice(0, 200)}` };
    }
    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = (data.content ?? [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('')
      .trim();
    return { demo: false, text };
  } catch (err) {
    return { demo: false, text: '', error: `Error de red: ${(err as Error).message}` };
  }
}

// --- Casos de uso GURAH ------------------------------------------------------

const BRAND_CONTEXT =
  'GURAH Boutique Apartments, apartamentos boutique en Bakio (Bizkaia), a 10 min de San Juan de ' +
  'Gaztelugatxe y 30 de Bilbao. Anfitriona: Maialen. Casa de campo con piscina, apartamentos pet-friendly ' +
  'y refugios junto a la playa. ' +
  'Trato cercano, cálido y profesional. Un proyecto de Venmon.';

/** Genera una respuesta profesional a una reseña de un huésped. */
/** Traduce un texto al español (para que el anfitrión entienda la reseña). */
export async function translateToSpanish(texto: string): Promise<ClaudeResult> {
  return askClaude({
    system: 'Traduce al español, de forma natural y fiel, el texto que te den. Devuelve SOLO la traducción, sin comillas ni comentarios.',
    messages: [{ role: 'user', content: texto }],
    maxTokens: 400,
  });
}

/**
 * Traduce un texto a un idioma destino (para campañas de email marketing).
 * `idiomaNombre` es el nombre del idioma en español (p.ej. "francés", "alemán").
 * Devuelve SOLO la traducción, conservando el tono y sin añadir comentarios.
 */
export async function translateTo(texto: string, idiomaNombre: string): Promise<ClaudeResult> {
  if (!texto.trim()) return { demo: !isClaudeConfigured(), text: '' };
  return askClaude({
    system:
      `Traduce al ${idiomaNombre} el texto de marketing que te den, de forma natural y ` +
      `comercialmente atractiva, conservando el tono cálido de la marca y el significado. ` +
      `Mantén los saltos de línea. Devuelve SOLO la traducción, sin comillas ni comentarios.`,
    messages: [{ role: 'user', content: texto }],
    maxTokens: 700,
  });
}

export async function draftReviewReply(review: {
  autor?: string;
  texto: string;
  puntuacion?: number;
  idioma?: string;
}): Promise<ClaudeResult> {
  const idioma = review.idioma || 'el mismo idioma de la reseña';
  return askClaude({
    system:
      `Eres el anfitrión de ${BRAND_CONTEXT} Redactas la respuesta pública a la reseña de un huésped. ` +
      `Clave: la respuesta debe basarse en LA EXPERIENCIA CONCRETA que cuenta el huésped. ` +
      `Identifica los aspectos positivos que menciona (p. ej. la piscina, las vistas al valle, el trato ` +
      `de Maialen, la tranquilidad, la ubicación cerca de Gaztelugatxe o la playa) y REFUÉRZALOS con ` +
      `naturalidad, para que quien lea la reseña perciba esos puntos fuertes. Agradece de forma cálida y ` +
      `personal, e invita a volver. Breve (2-4 frases), cercana, nada robótica ni genérica. ` +
      `Escribe en ${idioma}. Si la reseña es negativa o tiene alguna pega, agradece el comentario, ` +
      `discúlpate con tacto y ofrece mejorar, sin ponerte a la defensiva.`,
    messages: [
      {
        role: 'user',
        content:
          `Reseña de ${review.autor || 'un huésped'}` +
          (review.puntuacion ? ` (${review.puntuacion}/5)` : '') +
          `:\n"${review.texto}"\n\nEscribe la respuesta pública, reforzando los aspectos positivos que menciona.`,
      },
    ],
    maxTokens: 512,
  });
}

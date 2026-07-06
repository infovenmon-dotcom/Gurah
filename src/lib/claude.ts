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

export async function draftReviewReply(review: {
  autor?: string;
  texto: string;
  puntuacion?: number;
  idioma?: string;
}): Promise<ClaudeResult> {
  const idioma = review.idioma || 'el mismo idioma de la reseña';
  return askClaude({
    system:
      `Eres el anfitrión de ${BRAND_CONTEXT} Redacta respuestas a reseñas: agradecidas, ` +
      `personalizadas, breves (2-4 frases), sin sonar robóticas. Responde en ${idioma}. ` +
      `Si la reseña es negativa, discúlpate con tacto y ofrece mejorar.`,
    messages: [
      {
        role: 'user',
        content:
          `Reseña de ${review.autor || 'un huésped'}` +
          (review.puntuacion ? ` (${review.puntuacion}/5)` : '') +
          `:\n"${review.texto}"\n\nEscribe una respuesta pública como anfitrión.`,
      },
    ],
    maxTokens: 512,
  });
}

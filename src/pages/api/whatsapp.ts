/**
 * Webhook de WhatsApp (Meta Cloud API). Ruta pública (ver middleware PUBLIC_API).
 *
 * GET  → verificación del webhook (hub.challenge) con WHATSAPP_VERIFY_TOKEN.
 * POST → mensaje entrante: verifica firma (X-Hub-Signature-256 con APP_SECRET),
 *        genera respuesta con IA y la envía por WhatsApp.
 *
 * Reconstrucción del módulo de Kirana, adaptado a GURAH.
 */

import type { APIRoute } from 'astro';
import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  assistantReply,
  sendWhatsappText,
  WHATSAPP_VERIFY_TOKEN,
  WHATSAPP_APP_SECRET,
} from '../../lib/whatsapp';

export const prerender = false;

// Verificación del webhook (configuración en Meta).
export const GET: APIRoute = async ({ url }) => {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? '', { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
};

function verifySignature(payload: string, header: string | null): boolean {
  if (!WHATSAPP_APP_SECRET) return true; // demo: sin secreto no se verifica
  if (!header) return false;
  const expected = 'sha256=' + createHmac('sha256', WHATSAPP_APP_SECRET).update(payload).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  } catch {
    return false;
  }
}

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.text();
  const sig = request.headers.get('x-hub-signature-256');
  if (!verifySignature(payload, sig)) {
    return new Response('Firma inválida', { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(payload);
  } catch {
    return new Response('JSON inválido', { status: 400 });
  }

  // Extraer mensaje de texto entrante del formato de Meta.
  try {
    const value = body?.entry?.[0]?.changes?.[0]?.value;
    const msg = value?.messages?.[0];
    if (msg?.type === 'text' && msg.from) {
      const reply = await assistantReply(msg.text.body ?? '');
      await sendWhatsappText(msg.from, reply);
    }
  } catch {
    // No romper el webhook ante formatos inesperados: Meta reintenta si no devolvemos 200.
  }

  // Meta espera 200 para no reintentar.
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

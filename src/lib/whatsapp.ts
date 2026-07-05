/**
 * whatsapp.ts — Asistente de WhatsApp (Meta Cloud API). Reconstrucción del módulo
 * de Kirana, con system-prompt adaptado a GURAH (apartamentos, mascotas, piscina).
 *
 * Envía respuestas al huésped usando WHATSAPP_TOKEN + WHATSAPP_PHONE_ID.
 * La generación de la respuesta la hace Claude (claude.ts). En modo demo (sin token)
 * no envía nada; se limita a registrar.
 */

import { askClaude } from './claude';
import { getActiveApartments } from './apartmentsStore';
import { webPrice } from './pricing';

const WHATSAPP_TOKEN = (typeof process !== 'undefined' && process.env?.WHATSAPP_TOKEN) || '';
const WHATSAPP_PHONE_ID = (typeof process !== 'undefined' && process.env?.WHATSAPP_PHONE_ID) || '';
export const WHATSAPP_VERIFY_TOKEN =
  (typeof process !== 'undefined' && process.env?.WHATSAPP_VERIFY_TOKEN) || 'gurah-demo-verify';
export const WHATSAPP_APP_SECRET =
  (typeof process !== 'undefined' && process.env?.WHATSAPP_APP_SECRET) || '';

export function isWhatsappConfigured(): boolean {
  return !!(WHATSAPP_TOKEN && WHATSAPP_PHONE_ID);
}

/** System-prompt del asistente GURAH, con el catálogo vivo inyectado. */
async function buildSystemPrompt(): Promise<string> {
  const apts = await getActiveApartments();
  const catalogo = apts
    .map(
      (a) =>
        `- ${a.nombre} (${a.ubicacion.tipo}): ${a.dormitorios} dorm., hasta ${a.capacidad} pers., ` +
        `desde ${webPrice(a.precio_base)}€/noche. Servicios: ${a.servicios.join(', ')}. ` +
        `Estancia mínima ${a.estancia_minima} noches.`,
    )
    .join('\n');

  return (
    'Eres el asistente de reservas de GURAH Boutique Apartments (Bakio, Bizkaia), a 10 min de San ' +
    'Juan de Gaztelugatxe y 30 de Bilbao (anfitriona: Maialen). Atiendes a huéspedes por WhatsApp: cercano, breve y útil. Resuelves ' +
    'dudas sobre apartamentos, disponibilidad orientativa, mascotas (varios admiten), piscina ' +
    '(casa de campo y apartamento grande), ubicación (campo/playa) y cómo reservar (reserva ' +
    'directa en la web con −10% frente a plataformas). No inventes precios ni disponibilidad ' +
    'exacta: si no la sabes, invita a consultar la web o dejar fechas. No compartas datos internos.\n\n' +
    'CATÁLOGO ACTUAL:\n' +
    catalogo
  );
}

/** Genera una respuesta del asistente a un mensaje entrante del huésped. */
export async function assistantReply(userText: string): Promise<string> {
  const system = await buildSystemPrompt();
  const result = await askClaude({
    system,
    messages: [{ role: 'user', content: userText }],
    maxTokens: 400,
  });
  return result.text || 'Gracias por tu mensaje. Te responderemos enseguida.';
}

/** Envía un mensaje de texto por WhatsApp Cloud API. */
export async function sendWhatsappText(to: string, text: string): Promise<{ sent: boolean; info?: string }> {
  if (!isWhatsappConfigured()) {
    return { sent: false, info: 'Modo demo: WhatsApp no configurado.' };
  }
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text.slice(0, 4000) },
      }),
    });
    if (!res.ok) return { sent: false, info: `WhatsApp error ${res.status}` };
    return { sent: true };
  } catch (err) {
    return { sent: false, info: (err as Error).message };
  }
}

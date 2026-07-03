/**
 * netlify/functions/sync-ical.mjs — Sincronización iCal programada (channel manager).
 *
 * Heredado de Kirana. Netlify Scheduled Function que llama a /api/sync periódicamente
 * para importar los bloqueos de Booking/Airbnb, etc. Activa el schedule en netlify.toml.
 */

export default async () => {
  const base = process.env.PUBLIC_SITE_URL || process.env.URL || 'http://localhost:4321';
  try {
    const res = await fetch(`${base}/api/sync`, { method: 'POST' });
    const data = await res.json();
    console.log('[sync-ical] resultado:', JSON.stringify(data));
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('[sync-ical] error:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
};

// Programación horaria (Netlify Scheduled Functions).
export const config = { schedule: '@hourly' };

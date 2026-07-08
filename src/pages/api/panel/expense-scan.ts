/**
 * Panel · Lectura de factura de gasto (protegido). POST /api/panel/expense-scan
 *   { dataUrl, nombre } → { ok, datos:{ fecha, proveedor, concepto, base, ivaPct, iva, total }, demo }
 *
 * Sube el PDF/imagen de la factura y la IA (Claude visión) la lee y la desglosa
 * para rellenar el formulario de gasto. El usuario revisa antes de guardar.
 */

import type { APIRoute } from 'astro';
import { extractInvoice } from '../../../lib/claude';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: { dataUrl?: string; nombre?: string };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'JSON inválido' }, 400);
  }
  if (!body.dataUrl) return json({ ok: false, error: 'Falta el archivo.' }, 400);
  if (body.dataUrl.length > 8 * 1024 * 1024) return json({ ok: false, error: 'El archivo supera 6 MB.' }, 413);

  const r = await extractInvoice(body.dataUrl, body.nombre);
  if (r.error) return json({ ok: false, error: r.error }, 502);
  return json({
    ok: true,
    demo: r.demo,
    datos: {
      fecha: r.fecha ?? null,
      proveedor: r.proveedor ?? null,
      concepto: r.concepto ?? null,
      base: r.base ?? null,
      ivaPct: r.ivaPct ?? null,
      iva: r.iva ?? null,
      total: r.total ?? null,
    },
  });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

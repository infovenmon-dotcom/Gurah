/**
 * Panel · Gastos (protegido). Alta/baja de facturas de gasto + archivo adjunto.
 *
 *   POST { action:'add', gasto:{ fecha, proveedor, concepto, categoria, base, ivaPct, adjunto? } }
 *   POST { action:'delete', id }
 *   GET  ?file=<id>   → devuelve el archivo adjunto de la factura de gasto
 *
 * Los gastos alimentan el IVA soportado del Modelo 303 (ver pestaña Impuestos).
 * El adjunto (imagen/PDF de la factura) se guarda como data URL para poder verlo.
 */

import type { APIRoute } from 'astro';
import { readJson, updateJson } from '../../../lib/persist';

export const prerender = false;

interface Gasto {
  id: string;
  fecha: string;
  proveedor?: string;
  concepto: string;
  categoria: string;
  base: number;
  ivaPct: number;
  iva: number;
  importe: number;
  adjunto?: string; // nombre del archivo
}

const FILES_KEY = 'expense_files';
const MAX_FILE = 4 * 1024 * 1024; // 4 MB

const round2 = (n: number) => Math.round(n * 100) / 100;

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('file');
  if (!id) return new Response('Falta id', { status: 400 });
  const files = await readJson<Record<string, { nombre: string; dataUrl: string }>>(FILES_KEY, {});
  const f = files[id];
  if (!f) return new Response('Adjunto no encontrado', { status: 404 });
  const m = /^data:([^;]+);base64,(.*)$/s.exec(f.dataUrl);
  if (!m) return new Response('Adjunto no válido', { status: 500 });
  const bytes = Buffer.from(m[2], 'base64');
  return new Response(bytes, {
    headers: {
      'content-type': m[1],
      'content-disposition': `inline; filename="${(f.nombre || 'factura').replace(/"/g, '')}"`,
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'JSON inválido' }, 400);
  }

  if (body.action === 'delete') {
    if (!body.id) return json({ ok: false, error: 'Falta id' }, 400);
    await updateJson<Gasto[]>('expenses', (all) => (all || []).filter((g) => g.id !== body.id), []);
    await updateJson<Record<string, any>>(FILES_KEY, (m) => {
      const c = { ...(m || {}) };
      delete c[body.id];
      return c;
    }, {});
    return json({ ok: true, deleted: true });
  }

  // action: 'add'
  const g = body.gasto || {};
  const base = round2(Number(g.base) || 0);
  const ivaPct = Number(g.ivaPct);
  const concepto = String(g.concepto || '').trim();
  if (!concepto || !base) return json({ ok: false, error: 'Falta concepto o base imponible.' }, 400);
  const iva = round2(base * (isNaN(ivaPct) ? 21 : ivaPct) / 100);
  const id = 'g' + Date.now().toString(36);

  let adjuntoNombre: string | undefined;
  if (g.adjunto?.dataUrl && g.adjunto?.nombre) {
    if (String(g.adjunto.dataUrl).length > MAX_FILE * 1.4) {
      return json({ ok: false, error: 'El archivo supera 4 MB.' }, 413);
    }
    adjuntoNombre = String(g.adjunto.nombre).slice(0, 120);
    await updateJson<Record<string, any>>(FILES_KEY, (m) => ({
      ...(m || {}),
      [id]: { nombre: adjuntoNombre, dataUrl: g.adjunto.dataUrl },
    }), {});
  }

  const gasto: Gasto = {
    id,
    fecha: g.fecha || new Date().toISOString().slice(0, 10),
    proveedor: String(g.proveedor || '').slice(0, 120) || undefined,
    concepto: concepto.slice(0, 200),
    categoria: String(g.categoria || 'Otros').slice(0, 60),
    base,
    ivaPct: isNaN(ivaPct) ? 21 : ivaPct,
    iva,
    importe: round2(base + iva),
    adjunto: adjuntoNombre,
  };
  await updateJson<Gasto[]>('expenses', (all) => [gasto, ...(all || [])], []);
  return json({ ok: true, gasto });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

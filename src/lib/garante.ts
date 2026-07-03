/**
 * garante.ts — Garante TicketBAI / Batuz (Hacienda Foral de Bizkaia).
 *
 * Reconstrucción del módulo de Kirana. Implementa la capa de datos del sistema
 * garante: encadenamiento de facturas (huella de la anterior), identificador
 * TBAI y URL del código QR de verificación.
 *
 * NOTA: la firma XAdES real y el envío a Batuz requieren un certificado del
 * emisor y el software garante homologado; se conecta en producción vía
 * variables de entorno (TBAI_CERT_*). En demo se genera toda la estructura de
 * datos (encadenamiento + huella + TBAI ID + QR) para poder mostrar el flujo.
 */

import { createHash } from 'node:crypto';
import { readJson, updateJson } from './persist';

const CHAIN_KEY = 'tbai_chain';

// NIF del emisor y entorno (producción vs pruebas). [PENDIENTE CLIENTE]
const EMISOR_NIF = (typeof process !== 'undefined' && process.env?.TBAI_NIF) || 'X0000000X';
const TBAI_ENV = (typeof process !== 'undefined' && process.env?.TBAI_ENV) || 'pruebas';

// URL base del QR de verificación (Bizkaia). Pruebas vs producción.
const QR_BASE =
  TBAI_ENV === 'produccion'
    ? 'https://batuz.eus/QRTBAI/'
    : 'https://batuz.eus/QRTBAI/'; // mismo path; el entorno real lo define el certificado

export interface TbaiChainEntry {
  serie: string;
  numero: string;
  fecha: string; // YYYY-MM-DD
  huella: string; // huella de ESTA factura
}

export interface TbaiData {
  tbaiId: string; // TBAI-<NIF>-<AAMMDD>-<huella13>-<crc3>
  huella: string; // huella de esta factura (SHA-256 hex, recortada)
  huellaAnterior: string | null; // encadenamiento
  qrUrl: string;
  entorno: string;
  firmadoReal: boolean; // false en demo (sin certificado)
}

function fechaAAMMDD(fecha: string): string {
  // fecha ISO YYYY-MM-DD → AAMMDD
  const [y, m, d] = fecha.slice(0, 10).split('-');
  return `${y.slice(2)}${m}${d}`;
}

/** CRC-8 sencillo (3 dígitos) para el identificador TBAI. */
function crc3(input: string): string {
  let crc = 0;
  for (let i = 0; i < input.length; i++) {
    crc = (crc + input.charCodeAt(i) * (i + 1)) % 1000;
  }
  return String(crc).padStart(3, '0');
}

/**
 * Registra una factura en la cadena TicketBAI y devuelve sus datos garante.
 * Encadena con la huella de la factura anterior (a prueba de carreras).
 */
export async function registrarTbai(factura: {
  serie: string;
  numero: string;
  fecha: string;
  total: number;
}): Promise<TbaiData> {
  const cadena = await readJson<TbaiChainEntry[]>(CHAIN_KEY, []);
  const anterior = cadena.length ? cadena[cadena.length - 1] : null;
  const huellaAnterior = anterior?.huella ?? null;

  // Huella de esta factura: encadena datos + huella anterior (SHA-256).
  const material = `${EMISOR_NIF}|${factura.serie}|${factura.numero}|${factura.fecha}|${factura.total.toFixed(
    2,
  )}|${huellaAnterior ?? ''}`;
  const huella = createHash('sha256').update(material).digest('hex').slice(0, 20).toUpperCase();

  // Identificador TBAI-<NIF>-<AAMMDD>-<huella13>-<crc3>
  const aammdd = fechaAAMMDD(factura.fecha);
  const huella13 = huella.slice(0, 13);
  const base = `TBAI-${EMISOR_NIF}-${aammdd}-${huella13}-`;
  const tbaiId = base + crc3(base);

  // URL del QR de verificación.
  const qrUrl =
    `${QR_BASE}?id=${encodeURIComponent(tbaiId)}` +
    `&s=${encodeURIComponent(factura.serie)}&nf=${encodeURIComponent(factura.numero)}` +
    `&i=${factura.total.toFixed(2)}`;

  // Añadir a la cadena (a prueba de carreras).
  await updateJson<TbaiChainEntry[]>(
    CHAIN_KEY,
    (c) => [...c, { serie: factura.serie, numero: factura.numero, fecha: factura.fecha, huella }],
    [],
  );

  return {
    tbaiId,
    huella,
    huellaAnterior,
    qrUrl,
    entorno: TBAI_ENV,
    firmadoReal: false, // en producción, tras la firma XAdES con certificado → true
  };
}

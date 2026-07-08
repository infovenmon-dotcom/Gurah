/**
 * pricing.ts — Motor de precios GURAH: tarifas por temporada + estancia mínima.
 *
 * Reglas:
 *  - precioNoche(apto, fecha) = tarifa de temporada aplicable a esa fecha; si no, precio_base.
 *  - webPrice(precio) = precio con el descuento web (−10% por defecto vs OTA).
 *  - totalEstancia(apto, in, out) = suma noche a noche, respetando cambios de temporada
 *    dentro del rango de la reserva.
 *  - estancia mínima: por temporada (si la define) o del apartamento.
 */

import type { Apartment, TarifaTemporada } from './apartments';

export const WEB_DISCOUNT_PCT = Number(
  (typeof process !== 'undefined' && process.env?.WEB_DISCOUNT_PCT) || 10,
);

/** Precio con descuento web aplicado, redondeado a 2 decimales. */
export function webPrice(precio: number): number {
  const pct = Number.isFinite(WEB_DISCOUNT_PCT) ? WEB_DISCOUNT_PCT : 10;
  return Math.round(precio * (1 - pct / 100) * 100) / 100;
}

// --- Utilidades de fecha (UTC, granularidad de día) --------------------------

function toDate(d: string | Date): Date {
  if (d instanceof Date) return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  // 'YYYY-MM-DD'
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, day ?? 1));
}

function mmdd(date: Date): string {
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${m}-${d}`;
}

/** ¿mmdd de `date` cae dentro del rango [desde, hasta] (MM-DD, puede envolver año)? */
function enRango(date: Date, desde: string, hasta: string): boolean {
  const x = mmdd(date);
  if (desde <= hasta) return x >= desde && x <= hasta;
  // Rango que cruza el fin de año (p.ej. 12-21 → 01-07)
  return x >= desde || x <= hasta;
}

/** Número de noches entre dos fechas ISO (out exclusivo). */
export function noches(entrada: string | Date, salida: string | Date): number {
  const a = toDate(entrada).getTime();
  const b = toDate(salida).getTime();
  return Math.round((b - a) / 86_400_000);
}

// --- Temporadas --------------------------------------------------------------

/** Tarifa de temporada aplicable a una fecha, o null. */
export function tarifaParaFecha(apto: Apartment, fecha: string | Date): TarifaTemporada | null {
  const d = toDate(fecha);
  for (const t of apto.tarifas_temporada ?? []) {
    if (enRango(d, t.desde, t.hasta)) return t;
  }
  return null;
}

/** Precio por noche para una fecha concreta. */
export function precioNoche(apto: Apartment, fecha: string | Date): number {
  const t = tarifaParaFecha(apto, fecha);
  return t?.precio ?? apto.precio_base;
}

/** Estancia mínima aplicable en la fecha de entrada (temporada > apartamento). */
export function estanciaMinima(apto: Apartment, entrada: string | Date): number {
  const t = tarifaParaFecha(apto, entrada);
  return t?.estancia_minima ?? apto.estancia_minima ?? 1;
}

/** ¿La fecha de entrada cae en temporada alta? (por el nombre de la temporada). */
export function esTemporadaAlta(apto: Apartment, entrada: string | Date): boolean {
  const t = tarifaParaFecha(apto, entrada);
  return /\balta\b/i.test(t?.nombre ?? '');
}

export interface PoliticaCancelacion {
  temporadaAlta: boolean;
  diasAntelacion: number; // 7 en alta, 2 (48 h) en el resto
  limite: string; // YYYY-MM-DD: último día para cancelar sin cargo
  texto: string; // texto legible para la web/email
}

/**
 * Política de cancelación GURAH según temporada de la fecha de entrada:
 *  - Temporada alta: cancelación gratuita hasta 7 días antes.
 *  - Resto (baja/media): hasta 48 h antes.
 * Fuera de plazo o no-show: se cobra la primera noche (garantía).
 */
export function politicaCancelacion(apto: Apartment, entrada: string | Date): PoliticaCancelacion {
  const alta = esTemporadaAlta(apto, entrada);
  const dias = alta ? 7 : 2;
  const d = toDate(entrada);
  d.setUTCDate(d.getUTCDate() - dias);
  const limite = d.toISOString().slice(0, 10);
  const cuando = alta ? '7 días antes' : '48 horas antes';
  return {
    temporadaAlta: alta,
    diasAntelacion: dias,
    limite,
    texto:
      `Cancelación gratuita hasta ${cuando} de la llegada (hasta el ${limite}). ` +
      `Después, o si no te presentas, se cobra la primera noche.`,
  };
}

/** Precio (web, −10%) de la primera noche — penalización por no-show / cancelación tardía. */
export function primeraNocheWeb(apto: Apartment, entrada: string | Date): number {
  return webPrice(precioNoche(apto, entrada));
}

// --- Total de estancia -------------------------------------------------------

export interface NocheDesglose {
  fecha: string; // YYYY-MM-DD
  temporada: string;
  precio: number;
  precioWeb: number;
}

export interface TotalEstancia {
  noches: number;
  total: number; // precio OTA (sin descuento)
  totalWeb: number; // precio web (−10%)
  ahorro: number;
  desglose: NocheDesglose[];
}

/**
 * Suma el precio noche a noche entre entrada y salida (salida exclusiva),
 * respetando los cambios de temporada dentro del rango.
 */
export function totalEstancia(
  apto: Apartment,
  entrada: string | Date,
  salida: string | Date,
): TotalEstancia {
  const n = noches(entrada, salida);
  const desglose: NocheDesglose[] = [];
  let total = 0;
  let totalWeb = 0;

  const cursor = toDate(entrada);
  for (let i = 0; i < n; i++) {
    const t = tarifaParaFecha(apto, cursor);
    const precio = t?.precio ?? apto.precio_base;
    const pw = webPrice(precio);
    total += precio;
    totalWeb += pw;
    desglose.push({
      fecha: cursor.toISOString().slice(0, 10),
      temporada: t?.nombre ?? 'Base',
      precio,
      precioWeb: pw,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  total = Math.round(total * 100) / 100;
  totalWeb = Math.round(totalWeb * 100) / 100;
  return { noches: n, total, totalWeb, ahorro: Math.round((total - totalWeb) * 100) / 100, desglose };
}

// --- Validación --------------------------------------------------------------

export interface ValidacionEstancia {
  ok: boolean;
  motivo?: string;
  minimo?: number;
}

/** Valida fechas y estancia mínima. No comprueba disponibilidad (eso es bookings.ts). */
export function validarEstancia(
  apto: Apartment,
  entrada: string | Date,
  salida: string | Date,
): ValidacionEstancia {
  const n = noches(entrada, salida);
  if (n <= 0) return { ok: false, motivo: 'Las fechas no son válidas (salida debe ser posterior a la entrada).' };
  const min = estanciaMinima(apto, entrada);
  if (n < min) {
    return { ok: false, motivo: `La estancia mínima para estas fechas es de ${min} noches.`, minimo: min };
  }
  return { ok: true };
}

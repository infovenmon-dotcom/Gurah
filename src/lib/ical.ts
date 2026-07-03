/**
 * ical.ts — Importación iCal (channel manager). Reconstrucción del módulo de Kirana.
 *
 * Lee los feeds iCal externos (Booking, Airbnb, etc.) configurados por apartamento,
 * extrae las fechas ocupadas de cada VEVENT y las fusiona con los bloqueos manuales,
 * evitando dobles reservas entre canales. La exportación (.ics por apartamento) ya la
 * sirve /api/ical/[apartment].ics.
 */

import { readJson, updateJson } from './persist';
import { getAllApartments } from './apartmentsStore';

const FEEDS_KEY = 'ical_feeds'; // { [apartmentId]: string[] URLs }
const BLOCKS_KEY = 'blocks'; // { [apartmentId]: string[] fechas ISO }
const IMPORTED_KEY = 'ical_imported'; // { [apartmentId]: string[] } — fechas de origen iCal

export type Feeds = Record<string, string[]>;

export async function getFeeds(): Promise<Feeds> {
  return readJson<Feeds>(FEEDS_KEY, {});
}

export async function setFeeds(apartmentId: string, urls: string[]): Promise<Feeds> {
  return updateJson<Feeds>(
    FEEDS_KEY,
    (cur) => ({ ...cur, [apartmentId]: urls.filter(Boolean) }),
    {},
  );
}

// --- Parseo iCal ------------------------------------------------------------

function parseDate(v: string): Date | null {
  // Formatos: 20260805 | 20260805T140000Z | 2026-08-05
  const clean = v.trim().replace(/[-:]/g, '');
  const m = clean.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

function daysBetween(start: Date, endExclusive: Date): string[] {
  const out: string[] = [];
  const cur = new Date(start);
  while (cur.getTime() < endExclusive.getTime()) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/** Extrae las fechas ocupadas (ISO) de un texto iCal. */
export function parseICalBlockedDates(ical: string): string[] {
  const dias = new Set<string>();
  const lines = ical.split(/\r?\n/);
  let dtstart: Date | null = null;
  let dtend: Date | null = null;
  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      dtstart = dtend = null;
    } else if (line.startsWith('DTSTART')) {
      dtstart = parseDate(line.split(':').pop() || '');
    } else if (line.startsWith('DTEND')) {
      dtend = parseDate(line.split(':').pop() || '');
    } else if (line.startsWith('END:VEVENT')) {
      if (dtstart && dtend) {
        for (const d of daysBetween(dtstart, dtend)) dias.add(d);
      } else if (dtstart) {
        dias.add(dtstart.toISOString().slice(0, 10));
      }
    }
  }
  return [...dias].sort();
}

// --- Sincronización ---------------------------------------------------------

export interface SyncResult {
  apartmentId: string;
  feeds: number;
  fechas: number;
  errores: string[];
}

/** Sincroniza un apartamento: descarga sus feeds y fusiona en los bloqueos. */
export async function syncApartment(apartmentId: string): Promise<SyncResult> {
  const feeds = (await getFeeds())[apartmentId] ?? [];
  const errores: string[] = [];
  const importadas = new Set<string>();

  for (const url of feeds) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'GURAH-iCal/1.0' } });
      if (!res.ok) {
        errores.push(`${url}: HTTP ${res.status}`);
        continue;
      }
      const text = await res.text();
      for (const d of parseICalBlockedDates(text)) importadas.add(d);
    } catch (err) {
      errores.push(`${url}: ${(err as Error).message}`);
    }
  }

  // Reemplaza las fechas importadas previas por las nuevas, conservando los bloqueos manuales.
  const prevImported = (await readJson<Record<string, string[]>>(IMPORTED_KEY, {}))[apartmentId] ?? [];
  await updateJson<Record<string, string[]>>(
    IMPORTED_KEY,
    (cur) => ({ ...cur, [apartmentId]: [...importadas].sort() }),
    {},
  );

  await updateJson<Record<string, string[]>>(
    BLOCKS_KEY,
    (cur) => {
      const manuales = (cur[apartmentId] ?? []).filter((d) => !prevImported.includes(d));
      const merged = [...new Set([...manuales, ...importadas])].sort();
      return { ...cur, [apartmentId]: merged };
    },
    {},
  );

  return { apartmentId, feeds: feeds.length, fechas: importadas.size, errores };
}

/** Sincroniza todos los apartamentos con feeds configurados. */
export async function syncAll(): Promise<SyncResult[]> {
  const apts = await getAllApartments();
  const results: SyncResult[] = [];
  for (const a of apts) {
    results.push(await syncApartment(a.id));
  }
  return results;
}

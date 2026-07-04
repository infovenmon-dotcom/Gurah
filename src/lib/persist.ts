/**
 * persist.ts — Capa de datos GURAH sobre Netlify Blobs.
 *
 * Fuente única de datos panel ↔ web (mismo patrón que Kirana).
 * En producción usa el store 'gurah' de Netlify Blobs. En local / build / modo demo
 * (sin contexto Netlify) cae a un almacén en memoria sembrado desde src/data/*.json,
 * de forma que TODO funciona sin credenciales.
 *
 * `updateJson` implementa lectura-modificación-escritura a prueba de carreras: fue clave
 * en Kirana para reservas simultáneas y bloqueos de precio, y se conserva aquí.
 */

export const BLOB_STORE = 'gurah';

type Json = unknown;

// --- Almacén en memoria (fallback demo) --------------------------------------
const memory = new Map<string, Json>();

// Seeds embebidos: se importan de forma estática para que estén disponibles en el
// bundle de la función Netlify (no hay acceso a fs fiable en runtime serverless).
import apartmentsSeed from '../data/apartments.json';

const SEEDS: Record<string, Json> = {
  apartments: apartmentsSeed,
  bookings: [],
  invoices: [],
  expenses: [],
  customers: [],
  blocks: {}, // { [apartmentId]: string[] fechas ISO bloqueadas }
  reviews: [
    {
      id: 'rev-demo-1',
      autor: 'Marta G.',
      apartmentId: 'gurah-casa-campo',
      texto: 'Un fin de semana perfecto. La piscina y el jardín son un lujo, y Gaztelugatxe a un paso. Repetiremos.',
      puntuacion: 5,
      idioma: 'es',
      fecha: '2026-06-15',
      respuesta: '',
    },
    {
      id: 'rev-demo-2',
      autor: 'Jon A.',
      apartmentId: 'bakea',
      texto: 'Apartamento coqueto y muy cerca de la playa. El check-in podría haber sido algo más rápido.',
      puntuacion: 4,
      idioma: 'es',
      fecha: '2026-06-22',
      respuesta: '',
    },
  ],
};

function seedFor(key: string): Json {
  const seed = SEEDS[key];
  // Clonar para no mutar el seed original.
  return seed === undefined ? null : structuredClone(seed);
}

// --- Detección de entorno Netlify -------------------------------------------
let blobsModule: typeof import('@netlify/blobs') | null | undefined;

async function getStore() {
  if (blobsModule === undefined) {
    try {
      blobsModule = await import('@netlify/blobs');
    } catch {
      blobsModule = null;
    }
  }
  if (!blobsModule) return null;
  try {
    // getStore lanza si no hay contexto Netlify (siteID/token). En ese caso → demo.
    return blobsModule.getStore({ name: BLOB_STORE, consistency: 'strong' });
  } catch {
    return null;
  }
}

/** ¿Estamos en modo demo (sin Netlify Blobs)? Útil para la UI. */
export async function isDemoMode(): Promise<boolean> {
  return (await getStore()) === null;
}

// --- API pública -------------------------------------------------------------

export async function readJson<T = Json>(key: string, fallback: T | null = null): Promise<T> {
  const store = await getStore();
  if (store) {
    const val = await store.get(key, { type: 'json' });
    if (val !== null && val !== undefined) return val as T;
    // Sin valor persistido: sembrar si procede.
    const seed = seedFor(key);
    if (seed !== null) {
      await store.setJSON(key, seed);
      return seed as T;
    }
    return (fallback ?? seed) as T;
  }
  // Modo demo (memoria)
  if (!memory.has(key)) {
    const seed = seedFor(key);
    memory.set(key, seed !== null ? seed : fallback);
  }
  return (memory.get(key) as T) ?? (fallback as T);
}

export async function writeJson<T = Json>(key: string, value: T): Promise<void> {
  const store = await getStore();
  if (store) {
    await store.setJSON(key, value);
    return;
  }
  memory.set(key, value);
}

/**
 * Actualización a prueba de carreras: lee, aplica `mutator`, escribe.
 * Netlify Blobs con consistencia fuerte + reintento optimista.
 */
export async function updateJson<T = Json>(
  key: string,
  mutator: (current: T) => T,
  fallback: T,
): Promise<T> {
  const store = await getStore();
  if (!store) {
    // Demo: JS es monohilo, no hay carrera real.
    const current = await readJson<T>(key, fallback);
    const next = mutator(structuredClone(current));
    memory.set(key, next);
    return next;
  }

  // Producción: reintento con backoff corto ante escrituras concurrentes.
  const MAX = 5;
  for (let attempt = 0; attempt < MAX; attempt++) {
    const entry = await store.getWithMetadata(key, { type: 'json' });
    const current = (entry?.data ?? seedFor(key) ?? fallback) as T;
    const etag = entry?.etag;
    const next = mutator(structuredClone(current));
    try {
      await store.setJSON(key, next, etag ? { onlyIfMatch: etag } : { onlyIfNew: false });
      return next;
    } catch (err) {
      // Conflicto de etag → releer y reintentar.
      if (attempt === MAX - 1) throw err;
      await new Promise((r) => setTimeout(r, 25 * (attempt + 1)));
    }
  }
  throw new Error(`updateJson: no se pudo escribir ${key} tras ${MAX} intentos`);
}

/**
 * apartmentsStore.ts — Acceso a datos de apartamentos sobre Netlify Blobs.
 *
 * Mantiene el patrón de Kirana: guardado en bloque a prueba de carreras
 * (setApartmentsActive / setApartmentPrice / setApartmentSeasons usan updateJson).
 * BLOB_KEY: 'apartments'.
 */

import { readJson, updateJson } from './persist';
import type { Apartment, TarifaTemporada } from './apartments';

const BLOB_KEY = 'apartments';

export async function getAllApartments(): Promise<Apartment[]> {
  return readJson<Apartment[]>(BLOB_KEY, []);
}

export async function getActiveApartments(): Promise<Apartment[]> {
  const all = await getAllApartments();
  return all.filter((a) => a.estado === 'activa');
}

export async function getApartment(id: string): Promise<Apartment | null> {
  const all = await getAllApartments();
  return all.find((a) => a.id === id) ?? null;
}

export async function getApartmentBySlug(slug: string): Promise<Apartment | null> {
  const all = await getAllApartments();
  return all.find((a) => a.slug === slug) ?? null;
}

/** Activa/desactiva un apartamento (guardado en bloque, a prueba de carreras). */
export async function setApartmentActive(id: string, active: boolean): Promise<Apartment[]> {
  return updateJson<Apartment[]>(
    BLOB_KEY,
    (all) =>
      all.map((a) => (a.id === id ? { ...a, estado: active ? 'activa' : 'inactiva' } : a)),
    [],
  );
}

/** Activa/desactiva varios apartamentos en una sola escritura. */
export async function setApartmentsActive(
  ids: string[],
  active: boolean,
): Promise<Apartment[]> {
  const set = new Set(ids);
  return updateJson<Apartment[]>(
    BLOB_KEY,
    (all) =>
      all.map((a) => (set.has(a.id) ? { ...a, estado: active ? 'activa' : 'inactiva' } : a)),
    [],
  );
}

export async function setApartmentPrice(id: string, precio_base: number): Promise<Apartment[]> {
  return updateJson<Apartment[]>(
    BLOB_KEY,
    (all) => all.map((a) => (a.id === id ? { ...a, precio_base } : a)),
    [],
  );
}

export async function setApartmentSeasons(
  id: string,
  tarifas_temporada: TarifaTemporada[],
): Promise<Apartment[]> {
  return updateJson<Apartment[]>(
    BLOB_KEY,
    (all) => all.map((a) => (a.id === id ? { ...a, tarifas_temporada } : a)),
    [],
  );
}

export async function setApartmentMinStay(
  id: string,
  estancia_minima: number,
): Promise<Apartment[]> {
  return updateJson<Apartment[]>(
    BLOB_KEY,
    (all) => all.map((a) => (a.id === id ? { ...a, estancia_minima } : a)),
    [],
  );
}

/** Actualiza campos arbitrarios de un apartamento (edición desde panel). */
export async function updateApartment(
  id: string,
  patch: Partial<Apartment>,
): Promise<Apartment[]> {
  return updateJson<Apartment[]>(
    BLOB_KEY,
    (all) => all.map((a) => (a.id === id ? { ...a, ...patch, id: a.id } : a)),
    [],
  );
}

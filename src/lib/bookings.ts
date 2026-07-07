/**
 * bookings.ts — Motor de reservas GURAH.
 *
 * Adaptación de Kirana: booking.room/roomId → apartmentId. Añade validación de
 * estancia mínima además del solape. addBooking usa updateJson (a prueba de carreras)
 * para que dos reservas simultáneas no puedan ocupar el mismo apartamento/fechas.
 */

import { readJson, updateJson } from './persist';
import { getApartment } from './apartmentsStore';
import { totalEstancia, validarEstancia, noches, politicaCancelacion } from './pricing';

const BOOKINGS_KEY = 'bookings';
const BLOCKS_KEY = 'blocks';

export type BookingStatus = 'pendiente' | 'confirmada' | 'cancelada';

export interface Booking {
  id: string;
  apartmentId: string;
  entrada: string; // YYYY-MM-DD
  salida: string; // YYYY-MM-DD (exclusiva)
  huesped: { nombre: string; email: string; telefono?: string; idioma?: string };
  personas: number;
  noches: number;
  total: number; // precio web de la estancia
  estado: BookingStatus;
  creada: string; // ISO
  origen: 'web' | 'ical' | 'panel';
  // --- Cobro (modelo garantía: reserva sin cobrar, cargo el día de llegada) ---
  pagoEstado?: PagoEstado; // 'garantizada' | 'cobrada' | 'no_show'
  cancelableHasta?: string; // YYYY-MM-DD: último día para cancelar sin cargo
  garantia?: { setupIntentId?: string; last4?: string }; // tarjeta guardada (Stripe)
  cargo?: { fecha: string; importe: number; tipo: 'cobro' | 'no_show'; invoiceId?: string };
  demo?: boolean;
}

/** Estado del cobro. 'garantizada' = confirmada con tarjeta, aún sin cobrar. */
export type PagoEstado = 'garantizada' | 'cobrada' | 'no_show';

/** Bloqueos manuales de disponibilidad por apartamento: { [apartmentId]: ISO[] }. */
type Blocks = Record<string, string[]>;

// --- Utilidades --------------------------------------------------------------

function rangoDias(entrada: string, salida: string): string[] {
  const out: string[] = [];
  const [y, m, d] = entrada.split('-').map(Number);
  const cur = new Date(Date.UTC(y, m - 1, d));
  const end = new Date(`${salida}T00:00:00Z`).getTime();
  while (cur.getTime() < end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

function solapan(aIn: string, aOut: string, bIn: string, bOut: string): boolean {
  // [aIn, aOut) ∩ [bIn, bOut) ≠ ∅
  return aIn < bOut && bIn < aOut;
}

// --- Lectura -----------------------------------------------------------------

export async function getBookings(): Promise<Booking[]> {
  return readJson<Booking[]>(BOOKINGS_KEY, []);
}

export async function getBookingsForApartment(apartmentId: string): Promise<Booking[]> {
  const all = await getBookings();
  return all.filter((b) => b.apartmentId === apartmentId && b.estado !== 'cancelada');
}

export async function getBlocks(): Promise<Blocks> {
  return readJson<Blocks>(BLOCKS_KEY, {});
}

/** Conjunto de días ocupados (reservas activas + bloqueos manuales) por apartamento. */
export async function getBlockedDates(apartmentId: string): Promise<string[]> {
  const [bookings, blocks] = await Promise.all([
    getBookingsForApartment(apartmentId),
    getBlocks(),
  ]);
  const dias = new Set<string>(blocks[apartmentId] ?? []);
  for (const b of bookings) {
    for (const d of rangoDias(b.entrada, b.salida)) dias.add(d);
  }
  return [...dias].sort();
}

// --- Disponibilidad ----------------------------------------------------------

export interface DisponibilidadResult {
  disponible: boolean;
  motivo?: string;
}

/** Comprueba disponibilidad SIN escribir (para availability API / UI). */
export async function comprobarDisponibilidad(
  apartmentId: string,
  entrada: string,
  salida: string,
): Promise<DisponibilidadResult> {
  const apto = await getApartment(apartmentId);
  if (!apto) return { disponible: false, motivo: 'Apartamento no encontrado.' };
  if (apto.estado !== 'activa') return { disponible: false, motivo: 'Apartamento no disponible.' };

  const val = validarEstancia(apto, entrada, salida);
  if (!val.ok) return { disponible: false, motivo: val.motivo };

  const blocks = await getBlocks();
  const dias = new Set(blocks[apartmentId] ?? []);
  for (const d of rangoDias(entrada, salida)) {
    if (dias.has(d)) return { disponible: false, motivo: 'Fechas bloqueadas.' };
  }

  const existentes = await getBookingsForApartment(apartmentId);
  for (const b of existentes) {
    if (solapan(entrada, salida, b.entrada, b.salida)) {
      return { disponible: false, motivo: 'Fechas ya reservadas.' };
    }
  }
  return { disponible: true };
}

// --- Escritura (a prueba de carreras) ----------------------------------------

export interface NuevaReserva {
  apartmentId: string;
  entrada: string;
  salida: string;
  huesped: { nombre: string; email: string; telefono?: string; idioma?: string };
  personas: number;
  origen?: Booking['origen'];
  demo?: boolean;
  estado?: BookingStatus;
  pagoEstado?: PagoEstado;
  garantia?: Booking['garantia'];
}

export interface AddBookingResult {
  ok: boolean;
  motivo?: string;
  booking?: Booking;
}

let counter = 0;
function nuevoId(): string {
  counter = (counter + 1) % 100000;
  const rand = counter.toString(36).padStart(3, '0');
  const ts = Date.now().toString(36);
  return `GRH-${ts}-${rand}`.toUpperCase();
}

/**
 * Crea una reserva validando estancia mínima, capacidad y solape en una única
 * lectura-modificación-escritura (updateJson). Devuelve el motivo si no es posible.
 */
export async function addBooking(nueva: NuevaReserva): Promise<AddBookingResult> {
  const apto = await getApartment(nueva.apartmentId);
  if (!apto) return { ok: false, motivo: 'Apartamento no encontrado.' };
  if (apto.estado !== 'activa') return { ok: false, motivo: 'Apartamento no disponible.' };
  if (nueva.personas > apto.capacidad) {
    return { ok: false, motivo: `Capacidad máxima ${apto.capacidad} personas.` };
  }

  const val = validarEstancia(apto, nueva.entrada, nueva.salida);
  if (!val.ok) return { ok: false, motivo: val.motivo };

  const blocks = await getBlocks();
  const bloqueados = new Set(blocks[nueva.apartmentId] ?? []);
  for (const d of rangoDias(nueva.entrada, nueva.salida)) {
    if (bloqueados.has(d)) return { ok: false, motivo: 'Fechas bloqueadas.' };
  }

  const precios = totalEstancia(apto, nueva.entrada, nueva.salida);
  const politica = politicaCancelacion(apto, nueva.entrada);
  const booking: Booking = {
    id: nuevoId(),
    apartmentId: nueva.apartmentId,
    entrada: nueva.entrada,
    salida: nueva.salida,
    huesped: nueva.huesped,
    personas: nueva.personas,
    noches: noches(nueva.entrada, nueva.salida),
    total: precios.totalWeb,
    estado: nueva.estado ?? 'confirmada',
    creada: new Date().toISOString(),
    origen: nueva.origen ?? 'web',
    // Modelo garantía: la reserva se guarda confirmada pero SIN cobrar; el cargo
    // se hace el día de llegada. cancelableHasta depende de la temporada.
    pagoEstado: nueva.pagoEstado ?? 'garantizada',
    cancelableHasta: politica.limite,
    garantia: nueva.garantia,
    demo: nueva.demo,
  };

  let rechazo: string | null = null;
  await updateJson<Booking[]>(
    BOOKINGS_KEY,
    (all) => {
      // Re-comprobar solape DENTRO de la transacción (clave anti-carreras).
      const activas = all.filter(
        (b) => b.apartmentId === nueva.apartmentId && b.estado !== 'cancelada',
      );
      for (const b of activas) {
        if (solapan(nueva.entrada, nueva.salida, b.entrada, b.salida)) {
          rechazo = 'Fechas ya reservadas.';
          return all;
        }
      }
      return [...all, booking];
    },
    [],
  );

  if (rechazo) return { ok: false, motivo: rechazo };
  return { ok: true, booking };
}

export async function cancelBooking(id: string): Promise<boolean> {
  let found = false;
  await updateJson<Booking[]>(
    BOOKINGS_KEY,
    (all) =>
      all.map((b) => {
        if (b.id === id) {
          found = true;
          return { ...b, estado: 'cancelada' as BookingStatus };
        }
        return b;
      }),
    [],
  );
  return found;
}

/** Registra el cobro (o no-show) de una reserva: actualiza estado de pago y cargo. */
export async function registrarCargo(
  id: string,
  pagoEstado: PagoEstado,
  cargo: Booking['cargo'],
): Promise<boolean> {
  let found = false;
  await updateJson<Booking[]>(
    BOOKINGS_KEY,
    (all) =>
      all.map((b) => {
        if (b.id === id) {
          found = true;
          return { ...b, pagoEstado, cargo };
        }
        return b;
      }),
    [],
  );
  return found;
}

/** Añade/quita días de bloqueo manual (panel). */
export async function setBlocks(apartmentId: string, dias: string[]): Promise<Blocks> {
  return updateJson<Blocks>(
    BLOCKS_KEY,
    (cur) => ({ ...cur, [apartmentId]: [...new Set(dias)].sort() }),
    {},
  );
}

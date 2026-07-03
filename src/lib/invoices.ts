/**
 * invoices.ts — Facturación (compatible TicketBAI / Batuz de la Hacienda Foral de
 * Bizkaia). Versión demo: genera la factura con numeración correlativa y los importes
 * (base + IVA), persistida en Blobs. La firma/envío real a TicketBAI se conecta por
 * variables de entorno en producción (heredado de Kirana).
 */

import { readJson, updateJson } from './persist';
import { registrarTbai, type TbaiData } from './garante';
import type { Booking } from './bookings';

const INVOICES_KEY = 'invoices';

// IVA turístico aplicable (alojamiento) — ajustable por el cliente.
export const IVA_PCT = 10;

export interface Invoice {
  id: string; // numeración correlativa, p.ej. GRH-2026-0001
  bookingId: string;
  fecha: string; // ISO
  cliente: { nombre: string; email: string };
  concepto: string;
  base: number;
  iva: number;
  ivaPct: number;
  total: number;
  serie: string;
  tbai?: TbaiData; // datos garante TicketBAI/Batuz
  demo?: boolean;
}

function desglosaIva(total: number, ivaPct: number): { base: number; iva: number } {
  const base = Math.round((total / (1 + ivaPct / 100)) * 100) / 100;
  const iva = Math.round((total - base) * 100) / 100;
  return { base, iva };
}

export async function getInvoices(): Promise<Invoice[]> {
  return readJson<Invoice[]>(INVOICES_KEY, []);
}

/** Crea la factura para una reserva (numeración correlativa por año). */
export async function createInvoiceForBooking(
  booking: Booking,
  apartamentoNombre: string,
): Promise<Invoice> {
  const year = new Date(booking.creada).getUTCFullYear();
  const serie = `GRH-${year}`;
  const { base, iva } = desglosaIva(booking.total, IVA_PCT);

  let created!: Invoice;
  let numero = '';
  await updateJson<Invoice[]>(
    INVOICES_KEY,
    (all) => {
      const nEnAnio = all.filter((i) => i.serie === serie).length + 1;
      numero = String(nEnAnio).padStart(4, '0');
      created = {
        id: `${serie}-${numero}`,
        bookingId: booking.id,
        fecha: booking.creada,
        cliente: { nombre: booking.huesped.nombre, email: booking.huesped.email },
        concepto: `Estancia en ${apartamentoNombre} (${booking.noches} noches)`,
        base,
        iva,
        ivaPct: IVA_PCT,
        total: booking.total,
        serie,
        demo: booking.demo,
      };
      return [...all, created];
    },
    [],
  );

  // Registrar en el sistema garante TicketBAI/Batuz (encadenamiento + TBAI ID + QR).
  const tbai = await registrarTbai({
    serie,
    numero,
    fecha: booking.creada.slice(0, 10),
    total: booking.total,
  });
  await updateJson<Invoice[]>(
    INVOICES_KEY,
    (all) => all.map((i) => (i.id === created.id ? { ...i, tbai } : i)),
    [],
  );
  created.tbai = tbai;
  return created;
}

/**
 * panel-demo.ts — Datos de EJEMPLO para el panel en MODO DEMO.
 *
 * Solo se usan cuando `isDemoMode()` es true y no hay datos reales en Blobs.
 * Referencia fecha "hoy": ver `HOY`. Reservas repartidas por todo 2026 para que
 * las gráficas y KPIs (ocupación, ADR, ingresos por mes) tengan vida, como Kirana.
 * Nada de esto se persiste; es puramente para enseñar el panel al cliente.
 */

export interface DemoBooking {
  id: string;
  apartmentId: string;
  huesped: { nombre: string; email: string; telefono?: string };
  entrada: string; // YYYY-MM-DD
  salida: string; // YYYY-MM-DD (exclusiva)
  noches: number;
  total: number;
  canal: string;
  estado: 'confirmada';
  creada: string;
  demo: true;
}

export interface DemoInvoice {
  id: string;
  bookingId: string;
  fecha: string;
  cliente: { nombre: string; email: string };
  concepto: string;
  base: number;
  iva: number;
  ivaPct: number;
  total: number;
  estado: 'cobrada' | 'pendiente';
  tbai: { tbaiId: string; qrUrl: string; firmadoReal: false };
  demo: true;
}

export interface DemoExpense {
  id: string;
  fecha: string;
  concepto: string;
  categoria: string;
  iva: number;
  importe: number;
  demo: true;
}

const APT = { lurra: 'GURAH · Lurra', zerua: 'GURAH · Zerua', bakea: 'BAKEA' };

// Reservas de ejemplo (2026). "canal" imita el channel manager de Kirana.
export const demoBookings: DemoBooking[] = [
  b('0001', 'lurra', 'Marie & Paul L.', 'marie.paul@example.fr', '2026-01-12', '2026-01-15', 3, 630, 'Directa'),
  b('0002', 'bakea', 'Anke V.', 'anke.v@example.nl', '2026-02-07', '2026-02-11', 4, 720, 'Booking'),
  b('0003', 'zerua', 'Familia Etxeberria', 'etxeberria@example.eus', '2026-02-20', '2026-02-24', 4, 740, 'Directa'),
  b('0004', 'lurra', 'Jensen (4 pax)', 'jensen@example.dk', '2026-03-14', '2026-03-18', 4, 900, 'Expedia/Vrbo'),
  b('0005', 'bakea', 'Cristina R.', 'cristina.r@example.es', '2026-04-02', '2026-04-06', 4, 760, 'Directa'),
  b('0006', 'zerua', 'De Vries', 'devries@example.nl', '2026-04-25', '2026-04-29', 4, 800, 'Booking'),
  b('0007', 'lurra', 'Sophie & Marc', 'sophie.marc@example.be', '2026-05-10', '2026-05-15', 5, 1150, 'Directa'),
  b('0008', 'bakea', 'Hans & Greta', 'hg@example.de', '2026-05-22', '2026-05-26', 4, 800, 'Teléfono/WhatsApp'),
  b('0009', 'zerua', 'Laura & Tom', 'lauratom@example.co.uk', '2026-06-06', '2026-06-11', 5, 1050, 'Directa'),
  b('0010', 'lurra', 'Familia Agirre', 'agirre@example.eus', '2026-06-20', '2026-06-25', 5, 1300, 'Booking'),
  b('0011', 'bakea', 'Nora S.', 'nora.s@example.no', '2026-06-27', '2026-06-30', 3, 630, 'Directa'),
  b('0012', 'lurra', 'Marta & Ander', 'marta.ander@example.eus', '2026-07-01', '2026-07-06', 5, 1450, 'Directa'),
  b('0013', 'zerua', 'Claire D.', 'claire.d@example.fr', '2026-07-04', '2026-07-08', 4, 900, 'Directa'),
  b('0014', 'bakea', 'Familia Ruiz (4 pax)', 'ruiz@example.es', '2026-07-18', '2026-07-22', 4, 780, 'Booking'),
  b('0015', 'lurra', 'The Millers', 'millers@example.com', '2026-08-08', '2026-08-13', 5, 1550, 'Expedia/Vrbo'),
  b('0016', 'zerua', 'Ibai & June', 'ibaijune@example.eus', '2026-08-22', '2026-08-27', 5, 1100, 'Directa'),
];

function b(
  n: string, apartmentId: string, nombre: string, email: string,
  entrada: string, salida: string, noches: number, total: number, canal: string,
): DemoBooking {
  return {
    id: 'GRH-2026-' + n,
    apartmentId,
    huesped: { nombre, email },
    entrada, salida, noches, total, canal,
    estado: 'confirmada',
    creada: entrada,
    demo: true,
  };
}

// Facturas emitidas (de las reservas ya pasadas/en curso). IVA 10% alojamiento.
const IVA = 10;
export const demoInvoices: DemoInvoice[] = demoBookings
  .filter((bk) => bk.entrada <= '2026-07-06') // emitidas hasta la fecha
  .map((bk, i) => {
    const base = Math.round((bk.total / (1 + IVA / 100)) * 100) / 100;
    const iva = Math.round((bk.total - base) * 100) / 100;
    const num = String(60 + i).padStart(3, '0');
    return {
      id: '2026/' + num,
      bookingId: bk.id,
      fecha: bk.entrada,
      cliente: { nombre: bk.huesped.nombre, email: bk.huesped.email },
      concepto: `Estancia ${bk.noches} noches · ${APT[bk.apartmentId as keyof typeof APT]}`,
      base, iva, ivaPct: IVA, total: bk.total,
      estado: bk.entrada >= '2026-06-01' ? 'pendiente' : 'cobrada',
      tbai: {
        tbaiId: 'TBAI-' + 'A1B2C3'.slice(0, 6) + '-' + bk.entrada.replace(/-/g, '') + '-' + num,
        qrUrl: 'https://batuz.eus/QRTBAI/?id=' + num,
        firmadoReal: false,
      },
      demo: true,
    };
  });

// Gastos de ejemplo (para Contabilidad · Ingresos/Gastos).
export const demoExpenses: DemoExpense[] = [
  e('g1', '2026-01-31', 'Limpieza y lavandería · enero', 'Limpieza', 42, 462),
  e('g2', '2026-02-15', 'Suministros (luz, agua, gas)', 'Suministros', 63, 363),
  e('g3', '2026-03-10', 'Comisión OTA · Booking/Expedia', 'Comisiones', 0, 288),
  e('g4', '2026-03-28', 'Mantenimiento piscina y jardín', 'Mantenimiento', 52, 312),
  e('g5', '2026-04-30', 'Limpieza y lavandería · abril', 'Limpieza', 48, 528),
  e('g6', '2026-05-20', 'Amenities y reposición', 'Suministros', 31, 186),
  e('g7', '2026-06-12', 'Seguro y tasas municipales', 'Seguros/Tasas', 0, 540),
  e('g8', '2026-06-30', 'Limpieza y lavandería · junio', 'Limpieza', 55, 605),
];

function e(id: string, fecha: string, concepto: string, categoria: string, iva: number, importe: number): DemoExpense {
  return { id, fecha, concepto, categoria, iva, importe, demo: true };
}

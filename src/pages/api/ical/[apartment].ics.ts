/**
 * GET /api/ical/<apartment>.ics — Export iCal de fechas ocupadas (channel manager).
 * Heredado de Kirana, por apartamento. Compatible con Booking/Airbnb.
 */

import type { APIRoute } from 'astro';
import { getApartment } from '../../../lib/apartmentsStore';
import { getBookingsForApartment } from '../../../lib/bookings';

export const prerender = false;

function fmt(d: string): string {
  return d.replace(/-/g, '');
}

export const GET: APIRoute = async ({ params }) => {
  const id = params.apartment!;
  const apto = await getApartment(id);
  if (!apto) return new Response('No encontrado', { status: 404 });

  const bookings = await getBookingsForApartment(id);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GURAH//Reservas//ES',
    `X-WR-CALNAME:GURAH ${apto.nombre}`,
  ];
  for (const b of bookings) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${b.id}@gurah`,
      `DTSTART;VALUE=DATE:${fmt(b.entrada)}`,
      `DTEND;VALUE=DATE:${fmt(b.salida)}`,
      `SUMMARY:Reservado (${apto.nombre})`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');

  return new Response(lines.join('\r\n'), {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `inline; filename="${id}.ics"`,
    },
  });
};

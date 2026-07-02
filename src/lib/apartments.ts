/**
 * apartments.ts — Modelo de dominio del APARTAMENTO COMPLETO (self-catering).
 *
 * Adaptación de rooms.ts de Kirana: la unidad ya no es una habitación sino el
 * apartamento entero. Se añaden m2, dormitorios, baños, capacidad, camas,
 * ubicación por unidad (portfolio distribuido campo/playa), estancia mínima y
 * tarifas por temporada.
 */

export type UbicacionTipo = 'campo' | 'playa';

export interface Ubicacion {
  texto: string;
  tipo: UbicacionTipo;
  lat: number;
  lng: number;
}

export interface TarifaTemporada {
  nombre: string;
  /** Fecha de inicio MM-DD (recurrente cada año). */
  desde: string;
  /** Fecha de fin MM-DD (recurrente cada año). Puede envolver fin de año. */
  hasta: string;
  precio: number;
  /** Estancia mínima específica de la temporada; si falta, usa la del apartamento. */
  estancia_minima?: number;
}

export interface Apartment {
  id: string;
  nombre: string;
  slug: string;
  concepto: string;
  storytelling: string;
  ubicacion: Ubicacion;
  m2: number;
  dormitorios: number;
  banos: number;
  capacidad: number;
  camas: string;
  servicios: string[];
  /** Precio base por noche (antes 'precio' en Kirana). */
  precio_base: number;
  estancia_minima: number;
  tarifas_temporada: TarifaTemporada[];
  fotos: string[];
  estado: 'activa' | 'inactiva';
  /** Lista de campos aún pendientes de confirmación por el cliente. */
  pendiente_cliente?: string[];
}

/** Etiquetas legibles de servicios para chips en la web/panel. */
export const SERVICIOS_LABEL: Record<string, string> = {
  piscina: 'Piscina',
  jardin: 'Jardín',
  mascotas: 'Admite mascotas',
  parking: 'Parking',
  wifi: 'WiFi',
  cocina_equipada: 'Cocina equipada',
  chimenea: 'Chimenea',
  barbacoa: 'Barbacoa',
  terraza: 'Terraza',
  vistas_mar: 'Vistas al mar',
};

export function servicioLabel(key: string): string {
  return SERVICIOS_LABEL[key] ?? key;
}

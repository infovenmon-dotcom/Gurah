/**
 * theme.ts — Capa de TEMA del framework de hoteles boutique (Venmon).
 *
 * Un archivo de tema por hotel define identidad + narrativa + media. Los componentes
 * (hero cinematográfico, apartamentos a pantalla completa, "una experiencia", "el lugar",
 * galería editorial, opiniones, reserva, concierge IA y panel) son COMPARTIDOS y se
 * re-tematizan cambiando solo este objeto. GURAH es el primer tema.
 *
 * Para un hotel nuevo: duplicar `gurah`, cambiar textos/colores/tipos/fotos y exportarlo
 * como `activeTheme`. Nada más de la web necesita reescribirse.
 */

export interface HotelTheme {
  id: string;
  brand: {
    name: string; // wordmark
    subtitle: string; // bajo el logo
    tagline: string; // firma de marca
  };
  palette: {
    verde: string; // acento primario (botones)
    verde2: string; // hover
    salvia: string;
    arena: string;
    crema: string;
    tinta: string; // texto principal
    gris: string;
    linea: string;
    dorado: string; // acento cálido
  };
  fonts: {
    serif: string; // titulares
    sans: string; // texto
    googleHref: string | null; // link de Google Fonts (null = solo del sistema)
  };
  hero: {
    videoUrl: string | null; // metraje real en bucle; null → cinematic sobre fotos
    images: string[]; // fotos para el paneo/fundido cinematográfico (fallback y póster)
    eyebrow: string;
    titleLines: string[]; // se renderiza en 2 líneas; la 2ª en itálica
    emphasisWord: string; // (informativo)
    ctaLabel: string;
  };
  storytelling: {
    title: string; // frase grande ("No vienes a dormir…")
    paragraphs: string[]; // 2 párrafos cortos
    image: string;
  };
  /** "Una experiencia": emociones, no amenities. */
  experience: {
    kicker: string;
    title: string;
    items: { texto: string; foto: string }[];
  };
  /** "El lugar": entorno. */
  place: {
    kicker: string;
    title: string;
    items: { titulo: string; texto: string; foto: string }[];
  };
  concierge: {
    launcher: string; // texto del botón flotante
    greeting: string; // primer mensaje del asistente
  };
}

// ---------------------------------------------------------------------------
// TEMA GURAH
// ---------------------------------------------------------------------------
export const gurah: HotelTheme = {
  id: 'gurah',
  brand: {
    name: 'GURAH',
    subtitle: 'Boutique Apartments',
    tagline: 'Mar · Diseño · Calma',
  },
  palette: {
    verde: '#46554a',
    verde2: '#37433b',
    salvia: '#8a9a8c',
    arena: '#efe8db',
    crema: '#f6f1e8',
    tinta: '#23221e',
    gris: '#8a8478',
    linea: '#e4dccd',
    dorado: '#b7a488',
  },
  fonts: {
    serif: "'DM Serif Display', 'Georgia', 'Times New Roman', serif",
    sans: "'Poppins', system-ui, -apple-system, 'Segoe UI', sans-serif",
    googleHref:
      'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Poppins:wght@300;400;500;600&display=swap',
  },
  hero: {
    // [PENDIENTE CLIENTE] metraje cinematográfico real (dron, viñas, piscina, interiores).
    videoUrl: null,
    images: ['/img/gurah/hero.jpg', '/img/gurah/env-gaztelugatxe.jpg', '/img/gurah/apt-casa-campo.jpg'],
    eyebrow: 'Bakio · Bizkaia · Costa Vasca',
    titleLines: ['Donde el campo', 'encuentra el mar'],
    emphasisWord: 'encuentra el mar',
    ctaLabel: 'Descubrir GURAH',
  },
  storytelling: {
    title: 'No vienes a dormir.\nVienes a desconectar.',
    paragraphs: [
      'Una casa de campo boutique entre viñas y el silencio del valle vizcaíno, a tres kilómetros de San Juan de Gaztelugatxe. Piedra, madera y luz suave.',
      'Aquí el día empieza con niebla sobre Bakio y termina con el sonido del Cantábrico. Sin prisa. Sin ruido. Solo mar, diseño y calma.',
    ],
    image: '/img/gurah/env-piscina.jpg',
  },
  experience: {
    kicker: 'Una experiencia',
    title: 'Vivir, no solo alojarse',
    items: [
      { texto: 'Despertar con luz natural', foto: '/img/gurah/apt-3dorm.jpg' },
      { texto: 'Desayunar en la terraza', foto: '/img/gurah/apt-bakea.jpg' },
      { texto: 'Volver de la playa', foto: '/img/gurah/env-playa.jpg' },
      { texto: 'Leer junto a la piscina', foto: '/img/gurah/env-piscina.jpg' },
    ],
  },
  place: {
    kicker: 'El lugar',
    title: 'Bakio y su costa',
    items: [
      { titulo: 'Playa de Bakio', texto: 'Uno de los mejores arenales de Bizkaia para surf y paseo.', foto: '/img/gurah/env-playa.jpg' },
      { titulo: 'San Juan de Gaztelugatxe', texto: 'El icónico islote y su ermita, a solo 3 km.', foto: '/img/gurah/env-gaztelugatxe.jpg' },
      { titulo: 'Viñedos y valle', texto: 'Txakoli, verde y silencio a la puerta de casa.', foto: '/img/gurah/env-jardin.jpg' },
    ],
  },
  concierge: {
    launcher: 'Concierge',
    greeting:
      '¡Hola! Soy el concierge de GURAH. ¿Es tu primera vez en Bakio? Puedo recomendarte playas, surf, Gaztelugatxe, bodegas de txakoli o restaurantes — y, si quieres, el apartamento perfecto para tu viaje.',
  },
};

export const activeTheme: HotelTheme = gurah;

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
  /** Galería editorial (mosaico tipo revista). */
  gallery: { kicker: string; title: string; images: string[] };
  /** Puntuaciones agregadas por plataforma (referencia social). [PENDIENTE CLIENTE] */
  ratings: { plataforma: string; score: string; escala: string; etiqueta?: string }[];
  /** Testimonios destacados (todos 5★). */
  reviews: { texto: string; autor: string; origen?: string }[];
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
    // Clip cinematográfico generado desde las fotos reales (sustituible por metraje de dron).
    videoUrl: '/img/gurah/clips/hero.webm',
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
  gallery: {
    kicker: 'Galería',
    title: 'Un vistazo a GURAH',
    images: [
      '/img/gurah/gal-1.jpg', '/img/gurah/gal-2.jpg', '/img/gurah/gal-3.jpg', '/img/gurah/gal-4.jpg',
      '/img/gurah/gal-5.jpg', '/img/gurah/gal-6.jpg', '/img/gurah/gal-7.jpg', '/img/gurah/gal-8.jpg',
    ],
  },
  // Puntuaciones agregadas — VALORES DE EJEMPLO [PENDIENTE CLIENTE]: sustituir por
  // las notas reales de cada plataforma cuando el cliente las facilite.
  ratings: [
    { plataforma: 'Booking.com', score: '9,4', escala: '/10', etiqueta: 'Fantástico' },
    { plataforma: 'Airbnb', score: '4,9', escala: '/5', etiqueta: 'Favorito de huéspedes' },
    { plataforma: 'Google', score: '4,8', escala: '/5', etiqueta: 'Reseñas verificadas' },
  ],
  reviews: [
    { texto: 'Un fin de semana perfecto. La piscina y el jardín son un lujo, y Gaztelugatxe a un paso. Repetiremos sin duda.', autor: 'Marta G.', origen: 'Bilbao' },
    { texto: 'Casa preciosa, impecable y con muchísimo encanto. El silencio del valle y las vistas nos enamoraron.', autor: 'Thomas & Lena', origen: 'München' },
    { texto: 'Diseño cuidado hasta el último detalle. Nos sentimos como en casa, pero mejor. Volveremos con la familia.', autor: 'Amaia E.', origen: 'Donostia' },
    { texto: 'Spotless, stylish and so peaceful. The pool and the terrace made our stay. Highly recommended.', autor: 'James P.', origen: 'London' },
    { texto: 'Ubicación ideal para descubrir la costa vasca. Los anfitriones, atentísimos. Bakio es una joya.', autor: 'Sophie L.', origen: 'Bordeaux' },
    { texto: 'Espacioso, luminoso y muy bien equipado. Perfecto para venir con niños y con el perro. Diez sobre diez.', autor: 'Familia Etxeberria', origen: 'Gasteiz' },
  ],
  concierge: {
    launcher: 'Concierge',
    greeting:
      '¡Hola! Soy el concierge de GURAH. ¿Es tu primera vez en Bakio? Puedo recomendarte playas, surf, Gaztelugatxe, bodegas de txakoli o restaurantes — y, si quieres, el apartamento perfecto para tu viaje.',
  },
};

// ---------------------------------------------------------------------------
// SEGUNDO TEMA (demo del framework) — misma estructura, otra identidad.
// Prueba de que re-tematizar = cambiar este objeto, sin tocar la web.
// ---------------------------------------------------------------------------
export const costa: HotelTheme = {
  ...gurah,
  id: 'costa',
  brand: { name: 'COSTA', subtitle: 'Seaside Suites', tagline: 'Sal · Luz · Horizonte' },
  palette: {
    verde: '#2f5d6b', // azul marino apagado
    verde2: '#24485360',
    salvia: '#8fb0b6',
    arena: '#eef1ef',
    crema: '#f8f9f7',
    tinta: '#1c2b30',
    gris: '#7c8a8e',
    linea: '#dde4e3',
    dorado: '#c08a5e', // terracota suave
  },
  fonts: {
    serif: "'Cormorant Garamond', 'Georgia', serif",
    sans: "'Jost', system-ui, -apple-system, 'Segoe UI', sans-serif",
    googleHref:
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Jost:wght@300;400;500&display=swap',
  },
  hero: {
    ...gurah.hero,
    eyebrow: 'Costa Vasca · Cantábrico',
    titleLines: ['El mar', 'como forma de vida'],
    ctaLabel: 'Descubrir COSTA',
  },
  storytelling: {
    ...gurah.storytelling,
    title: 'El horizonte\nno tiene prisa.',
  },
  concierge: {
    launcher: 'Concierge',
    greeting: '¡Hola! Soy el concierge de COSTA. ¿Buscas playa, surf o una escapada tranquila? Te ayudo a planear — y a elegir la suite perfecta.',
  },
};

const THEMES: Record<string, HotelTheme> = { gurah, costa };

export const activeTheme: HotelTheme = gurah;

/** Resuelve el tema del framework. `?theme=<id>` permite previsualizar otros hoteles. */
export function getTheme(url?: URL): HotelTheme {
  const id = url?.searchParams?.get('theme') || '';
  return THEMES[id] || activeTheme;
}

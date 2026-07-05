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
  /** Puntuación real de Booking.com (nota global + categorías + otros listados). */
  booking: {
    score: string;
    etiqueta: string;
    opiniones: number;
    categorias: { nombre: string; valor: number }[];
    otros: { nombre: string; score: string; opiniones: number }[];
  };
  /** Testimonios reales de huéspedes. */
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
    // Fotos REALES de la casa en fundido cinematográfico (sustituible por metraje de dron).
    videoUrl: null,
    images: ['/img/gurah/piscina-valle.jpg', '/img/gurah/casa-exterior.jpg', '/img/gurah/lurra-salon.jpg', '/img/gurah/casa-piscina.jpg'],
    eyebrow: 'Bakio · Bizkaia · Costa Vasca',
    titleLines: ['Donde el campo', 'encuentra el mar'],
    emphasisWord: 'encuentra el mar',
    ctaLabel: 'Descubrir GURAH',
  },
  storytelling: {
    title: 'No vienes a dormir.\nVienes a desconectar.',
    paragraphs: [
      'Una casa de campo boutique entre viñas y el silencio del valle vizcaíno, a diez minutos de San Juan de Gaztelugatxe y media hora de Bilbao. Piedra, madera y luz suave.',
      'Aquí el día empieza con niebla sobre Bakio y termina con el sonido del Cantábrico. Sin prisa. Sin ruido. Solo mar, diseño y calma.',
    ],
    image: '/img/gurah/casa-piscina.jpg',
  },
  experience: {
    kicker: 'Una experiencia',
    title: 'Vivir, no solo alojarse',
    items: [
      { texto: 'Despertar con luz natural', foto: '/img/gurah/lurra-dormitorio.jpg' },
      { texto: 'Desayunar en la terraza', foto: '/img/gurah/casa-terraza.jpg' },
      { texto: 'Volver de la playa', foto: '/img/gurah/entorno-playa-atardecer.jpg' },
      { texto: 'Leer junto a la piscina', foto: '/img/gurah/casa-solarium.jpg' },
    ],
  },
  place: {
    kicker: 'El lugar',
    title: 'Bakio y su costa',
    items: [
      { titulo: 'Playa de Bakio', texto: 'Uno de los mejores arenales de Bizkaia para surf y paseo.', foto: '/img/gurah/entorno-playa.jpg' },
      { titulo: 'San Juan de Gaztelugatxe', texto: 'El icónico islote y su ermita, a solo 10 minutos.', foto: '/img/gurah/entorno-gaztelugatxe.jpg' },
      { titulo: 'Viñedos y valle', texto: 'Txakoli, verde y silencio a la puerta de casa.', foto: '/img/gurah/piscina-valle.jpg' },
    ],
  },
  gallery: {
    kicker: 'Galería',
    title: 'Un vistazo a GURAH',
    images: [
      '/img/gurah/piscina-valle.jpg', '/img/gurah/lurra-salon.jpg', '/img/gurah/zerua-salon.jpg', '/img/gurah/casa-exterior.jpg',
      '/img/gurah/casa-piscina.jpg', '/img/gurah/casa-solarium.jpg', '/img/gurah/zerua-cocina.jpg', '/img/gurah/lurra-comedor.jpg',
    ],
  },
  // Puntuación REAL de Booking.com (capturas del cliente).
  booking: {
    score: '9,7',
    etiqueta: 'Excepcional',
    opiniones: 124,
    categorias: [
      { nombre: 'Limpieza', valor: 9.7 },
      { nombre: 'Confort', valor: 9.9 },
      { nombre: 'Instalaciones y servicios', valor: 9.8 },
      { nombre: 'Ubicación', valor: 9.2 },
      { nombre: 'Personal', valor: 9.6 },
      { nombre: 'Relación calidad-precio', valor: 9.4 },
    ],
    otros: [{ nombre: 'BAKEA (apartamento playa)', score: '9,5', opiniones: 76 }],
  },
  // Testimonios REALES de huéspedes (Booking.com).
  reviews: [
    { texto: 'Me encantó todo. El apartamento, la zona de piscina, la ubicación. Un sitio ideal para desconectar y relajarse. La anfitriona un diez.', autor: 'Kepa', origen: 'España' },
    { texto: 'El lugar súper tranquilo, limpio y con unas vistas espectaculares. Los detalles fueron increíbles, desde las galletitas y el café hasta el cepillo de dientes. Piscina increíble y hasta su rincón para hacer deporte. Lo recomiendo al 100%.', autor: 'Raquel', origen: 'España' },
    { texto: 'Gran ubicación, en pleno campo pero a 5 minutos en coche del centro y la playa de Bakio. Nos quedamos 6 personas y la estancia fue muy cómoda. Lo recomiendo.', autor: 'Lucia', origen: 'España' },
    { texto: 'Un paraje increíble. El apartamento precioso; hemos pasado unos días de desconexión y descanso de lujo. Maialen, muy atenta en todo momento. Repetiremos seguro.', autor: 'Leire', origen: 'España' },
    { texto: 'La ubicación por la tranquilidad, la limpieza, la atención de los propietarios… todo de 10.', autor: 'Fernando', origen: 'España' },
    { texto: 'Está cerquita de todo y a la vez se respira la tranquilidad de la montaña. Apartamento cómodo, amplio, con buenas calidades y muy bien decorado. La información para visitar la zona, idónea.', autor: 'Francisco', origen: 'España' },
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

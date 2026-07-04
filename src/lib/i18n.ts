/**
 * i18n.ts — Capa de internacionalización del framework (Venmon).
 *
 * 10 idiomas (los mismos que Kirana), en el orden pedido por el cliente:
 *   Español · Euskera · Francés · Inglés · Italiano · Belga (flamenco) ·
 *   Holandés · Noruego · Danés · Alemán.
 *
 * Diseño:
 *  - `LOCALES`  → lista para el selector (endónimo + bandera + lang HTML/hreflang).
 *  - `DICT`     → diccionario de cadenas de interfaz (UI chrome) para los 10 idiomas.
 *  - Cadenas largas de marketing (storytelling del tema y de cada apartamento):
 *    traducidas a es/en/fr/de/it; el resto recae con elegancia (be→nl, eu→es, · →en→es).
 *  - `getLang`  → resuelve el idioma desde `?lang=`, cookie o Accept-Language y lo persiste.
 *  - `t()`      → cadena de interfaz con interpolación `{var}` y cadena de reserva.
 *  - `tx()`     → texto del tema con reserva al valor español de `theme.ts`.
 *
 * El copy nativo profesional para eu/nl/be/no/da de los párrafos largos queda como
 * [PENDIENTE CLIENTE]; mientras tanto se muestra el inglés (o español) como reserva.
 */

export type Lang = 'es' | 'eu' | 'fr' | 'en' | 'it' | 'be' | 'nl' | 'no' | 'da' | 'de';

export const DEFAULT_LANG: Lang = 'es';

export interface Locale {
  code: Lang;
  /** Nombre del idioma en su propia lengua. */
  endonym: string;
  /** Emoji de bandera (Euskera usa la ikurriña por secuencia de etiqueta). */
  flag: string;
  /** Valor para <html lang> y hreflang. */
  htmlLang: string;
}

/** Orden EXACTO pedido por el cliente. */
export const LOCALES: Locale[] = [
  { code: 'es', endonym: 'Español', flag: '🇪🇸', htmlLang: 'es' },
  { code: 'eu', endonym: 'Euskara', flag: '🏴󠁥󠁳󠁰󠁶󠁿', htmlLang: 'eu' },
  { code: 'fr', endonym: 'Français', flag: '🇫🇷', htmlLang: 'fr' },
  { code: 'en', endonym: 'English', flag: '🇬🇧', htmlLang: 'en' },
  { code: 'it', endonym: 'Italiano', flag: '🇮🇹', htmlLang: 'it' },
  { code: 'be', endonym: 'Vlaams', flag: '🇧🇪', htmlLang: 'nl-BE' },
  { code: 'nl', endonym: 'Nederlands', flag: '🇳🇱', htmlLang: 'nl' },
  { code: 'no', endonym: 'Norsk', flag: '🇳🇴', htmlLang: 'no' },
  { code: 'da', endonym: 'Dansk', flag: '🇩🇰', htmlLang: 'da' },
  { code: 'de', endonym: 'Deutsch', flag: '🇩🇪', htmlLang: 'de' },
];

const CODES = new Set<Lang>(LOCALES.map((l) => l.code));
export function isLang(x: string | null | undefined): x is Lang {
  return !!x && CODES.has(x as Lang);
}
export function localeOf(lang: Lang): Locale {
  return LOCALES.find((l) => l.code === lang) || LOCALES[0];
}

type Entry = Partial<Record<Lang, string>>;

/** Reserva: idioma pedido → (be→nl, eu→es) → en → es. */
function resolve(map: Entry, lang: Lang): string | undefined {
  if (map[lang] != null) return map[lang];
  if (lang === 'be' && map.nl != null) return map.nl; // flamenco ≈ neerlandés
  if (lang === 'eu' && map.es != null) return map.es; // euskera → castellano
  if (map.en != null) return map.en;
  return map.es;
}

// ---------------------------------------------------------------------------
// DICCIONARIO DE INTERFAZ (UI chrome) — 10 idiomas.
// ---------------------------------------------------------------------------
const DICT: Record<string, Entry> = {
  // Barra demo
  'demo.bar': {
    es: 'MODO DEMO — reservas y pagos simulados.',
    eu: 'DEMO MODUA — erreserbak eta ordainketak simulatuak.',
    fr: 'MODE DÉMO — réservations et paiements simulés.',
    en: 'DEMO MODE — simulated bookings and payments.',
    it: 'MODALITÀ DEMO — prenotazioni e pagamenti simulati.',
    nl: 'DEMO-MODUS — gesimuleerde boekingen en betalingen.',
    no: 'DEMOMODUS — simulerte bestillinger og betalinger.',
    da: 'DEMOTILSTAND — simulerede bookinger og betalinger.',
    de: 'DEMO-MODUS — simulierte Buchungen und Zahlungen.',
  },

  // Cabecera / navegación
  'nav.apartments': {
    es: 'Apartamentos', eu: 'Apartamentuak', fr: 'Appartements', en: 'Apartments',
    it: 'Appartamenti', nl: 'Appartementen', no: 'Leiligheter', da: 'Lejligheder', de: 'Apartments',
  },
  'nav.environment': {
    es: 'Entorno', eu: 'Ingurunea', fr: 'Les environs', en: 'The area',
    it: 'Dintorni', nl: 'Omgeving', no: 'Området', da: 'Området', de: 'Umgebung',
  },
  'nav.book': {
    es: 'Reservar', eu: 'Erreserbatu', fr: 'Réserver', en: 'Book',
    it: 'Prenota', nl: 'Boeken', no: 'Bestill', da: 'Book', de: 'Buchen',
  },
  'lang.label': {
    es: 'Idioma', eu: 'Hizkuntza', fr: 'Langue', en: 'Language',
    it: 'Lingua', nl: 'Taal', no: 'Språk', da: 'Sprog', de: 'Sprache',
  },

  // Storytelling — enlace
  'story.discover': {
    es: 'Descubre los apartamentos →', eu: 'Ezagutu apartamentuak →',
    fr: 'Découvrez les appartements →', en: 'Discover the apartments →',
    it: 'Scopri gli appartamenti →', nl: 'Ontdek de appartementen →',
    no: 'Oppdag leilighetene →', da: 'Oplev lejlighederne →', de: 'Entdecke die Apartments →',
  },

  // Sección apartamentos
  'apts.kicker': {
    es: 'Alojamientos', eu: 'Ostatuak', fr: 'Hébergements', en: 'Stays',
    it: 'Alloggi', nl: 'Verblijven', no: 'Overnatting', da: 'Ophold', de: 'Unterkünfte',
  },
  'apts.title': {
    es: 'Elige tu apartamento', eu: 'Aukeratu zure apartamentua', fr: 'Choisissez votre appartement',
    en: 'Choose your apartment', it: 'Scegli il tuo appartamento', nl: 'Kies je appartement',
    no: 'Velg leiligheten din', da: 'Vælg din lejlighed', de: 'Wähle dein Apartment',
  },
  'apts.lead': {
    es: '{n} espacios · reserva directa con el mejor precio.',
    eu: '{n} espazio · erreserba zuzena prezio onenarekin.',
    fr: '{n} espaces · réservation directe au meilleur prix.',
    en: '{n} spaces · direct booking at the best price.',
    it: '{n} spazi · prenotazione diretta al miglior prezzo.',
    nl: '{n} ruimtes · direct boeken voor de beste prijs.',
    no: '{n} rom · direkte booking til beste pris.',
    da: '{n} rum · direkte booking til bedste pris.',
    de: '{n} Räume · Direktbuchung zum besten Preis.',
  },

  // Ubicación (chip)
  'loc.beach': { es: 'Playa', eu: 'Hondartza', fr: 'Plage', en: 'Beach', it: 'Spiaggia', nl: 'Strand', no: 'Strand', da: 'Strand', de: 'Strand' },
  'loc.field': { es: 'Campo', eu: 'Landa', fr: 'Campagne', en: 'Countryside', it: 'Campagna', nl: 'Platteland', no: 'Landlig', da: 'Landet', de: 'Land' },

  // Fichas — especificaciones
  'unit.bedrooms': { es: 'dorm.', eu: 'log.', fr: 'ch.', en: 'bed.', it: 'cam.', nl: 'slk.', no: 'sov.', da: 'sov.', de: 'Schlafz.' },
  'unit.bath': { es: 'baño', eu: 'komun', fr: 'sdb', en: 'bath', it: 'bagno', nl: 'badk.', no: 'bad', da: 'bad', de: 'Bad' },
  'unit.baths': { es: 'baños', eu: 'komun', fr: 'sdb', en: 'baths', it: 'bagni', nl: 'badk.', no: 'bad', da: 'bad', de: 'Bäder' },
  'unit.upto': { es: 'hasta', eu: 'arte', fr: "jusqu'à", en: 'up to', it: 'fino a', nl: 'tot', no: 'opptil', da: 'op til', de: 'bis zu' },
  'price.perNight': {
    es: '/noche · −10%', eu: '/gau · −10%', fr: '/nuit · −10%', en: '/night · −10%',
    it: '/notte · −10%', nl: '/nacht · −10%', no: '/natt · −10%', da: '/nat · −10%', de: '/Nacht · −10%',
  },
  'book.cta': {
    es: 'Ver fechas y reservar', eu: 'Ikusi datak eta erreserbatu', fr: 'Voir les dates et réserver',
    en: 'See dates & book', it: 'Vedi date e prenota', nl: 'Data bekijken & boeken',
    no: 'Se datoer og bestill', da: 'Se datoer og book', de: 'Termine ansehen & buchen',
  },

  // Opiniones
  'reviews.kicker': { es: 'Opiniones', eu: 'Iritziak', fr: 'Avis', en: 'Reviews', it: 'Recensioni', nl: 'Beoordelingen', no: 'Omtaler', da: 'Anmeldelser', de: 'Bewertungen' },
  'reviews.title': {
    es: 'Lo que cuentan', eu: 'Zer dioten', fr: 'Ce qu’ils racontent', en: 'What guests say',
    it: 'Cosa raccontano', nl: 'Wat gasten zeggen', no: 'Hva gjestene sier', da: 'Hvad gæsterne siger', de: 'Was Gäste sagen',
  },

  // CTA final
  'cta.title': {
    es: 'Tu escapada empieza aquí', eu: 'Zure ihesaldia hemen hasten da', fr: 'Votre escapade commence ici',
    en: 'Your getaway starts here', it: 'La tua fuga inizia qui', nl: 'Jouw uitje begint hier',
    no: 'Din ferie starter her', da: 'Din ferie starter her', de: 'Deine Auszeit beginnt hier',
  },
  'cta.desc': {
    es: 'Reserva directa, sin comisiones, con el mejor precio garantizado.',
    eu: 'Erreserba zuzena, komisiorik gabe, prezio onena bermatuta.',
    fr: 'Réservation directe, sans commission, au meilleur prix garanti.',
    en: 'Direct booking, no fees, best price guaranteed.',
    it: 'Prenotazione diretta, senza commissioni, miglior prezzo garantito.',
    nl: 'Direct boeken, geen kosten, beste prijs gegarandeerd.',
    no: 'Direkte booking, ingen gebyrer, beste pris garantert.',
    da: 'Direkte booking, ingen gebyrer, bedste pris garanteret.',
    de: 'Direktbuchung, keine Gebühren, bester Preis garantiert.',
  },
  'cta.btn': {
    es: 'Elige tu apartamento', eu: 'Aukeratu zure apartamentua', fr: 'Choisissez votre appartement',
    en: 'Choose your apartment', it: 'Scegli il tuo appartamento', nl: 'Kies je appartement',
    no: 'Velg leiligheten din', da: 'Vælg din lejlighed', de: 'Wähle dein Apartment',
  },

  // Modal de reserva
  'modal.checkin': { es: 'Entrada', eu: 'Sarrera', fr: 'Arrivée', en: 'Check-in', it: 'Arrivo', nl: 'Aankomst', no: 'Innsjekk', da: 'Ankomst', de: 'Anreise' },
  'modal.checkout': { es: 'Salida', eu: 'Irteera', fr: 'Départ', en: 'Check-out', it: 'Partenza', nl: 'Vertrek', no: 'Utsjekk', da: 'Afrejse', de: 'Abreise' },
  'modal.guests': { es: 'Personas', eu: 'Pertsonak', fr: 'Personnes', en: 'Guests', it: 'Persone', nl: 'Personen', no: 'Personer', da: 'Personer', de: 'Personen' },
  'modal.name': { es: 'Nombre', eu: 'Izena', fr: 'Nom', en: 'Name', it: 'Nome', nl: 'Naam', no: 'Navn', da: 'Navn', de: 'Name' },
  'modal.email': { es: 'Email', eu: 'Emaila', fr: 'E-mail', en: 'Email', it: 'Email', nl: 'E-mail', no: 'E-post', da: 'E-mail', de: 'E-Mail' },
  'modal.phone': {
    es: 'Teléfono (opcional)', eu: 'Telefonoa (aukerakoa)', fr: 'Téléphone (facultatif)', en: 'Phone (optional)',
    it: 'Telefono (facoltativo)', nl: 'Telefoon (optioneel)', no: 'Telefon (valgfritt)', da: 'Telefon (valgfrit)', de: 'Telefon (optional)',
  },
  'modal.book': {
    es: 'Reservar y pagar', eu: 'Erreserbatu eta ordaindu', fr: 'Réserver et payer', en: 'Book and pay',
    it: 'Prenota e paga', nl: 'Boeken en betalen', no: 'Bestill og betal', da: 'Book og betal', de: 'Buchen und bezahlen',
  },
  'modal.fineprint': {
    es: 'Pago seguro · precio directo −10%.', eu: 'Ordainketa segurua · zuzeneko prezioa −10%.',
    fr: 'Paiement sécurisé · prix direct −10%.', en: 'Secure payment · direct price −10%.',
    it: 'Pagamento sicuro · prezzo diretto −10%.', nl: 'Veilige betaling · directe prijs −10%.',
    no: 'Sikker betaling · direkte pris −10%.', da: 'Sikker betaling · direkte pris −10%.', de: 'Sichere Zahlung · Direktpreis −10%.',
  },
  'modal.close': { es: 'Cerrar', eu: 'Itxi', fr: 'Fermer', en: 'Close', it: 'Chiudi', nl: 'Sluiten', no: 'Lukk', da: 'Luk', de: 'Schließen' },

  // Concierge
  'cc.title': {
    es: 'Concierge {brand}', eu: '{brand} kontzertua', fr: 'Concierge {brand}', en: '{brand} Concierge',
    it: 'Concierge {brand}', nl: '{brand} Concierge', no: '{brand} Concierge', da: '{brand} Concierge', de: '{brand} Concierge',
  },
  'cc.placeholder': {
    es: 'Escríbeme…', eu: 'Idatzi niri…', fr: 'Écrivez-moi…', en: 'Write to me…',
    it: 'Scrivimi…', nl: 'Schrijf me…', no: 'Skriv til meg…', da: 'Skriv til mig…', de: 'Schreib mir…',
  },

  // Cabecera de sección concierge / botón
  'concierge.launcher': {
    es: 'Concierge', eu: 'Concierge', fr: 'Concierge', en: 'Concierge',
    it: 'Concierge', nl: 'Concierge', no: 'Concierge', da: 'Concierge', de: 'Concierge',
  },

  // Cadenas dinámicas del motor cliente (home.js)
  'js.minStay': {
    es: 'estancia mínima', eu: 'gutxieneko egonaldia', fr: 'séjour minimum', en: 'minimum stay',
    it: 'soggiorno minimo', nl: 'minimaal verblijf', no: 'minimumsopphold', da: 'minimumsophold', de: 'Mindestaufenthalt',
  },
  'js.nights': { es: 'noches', eu: 'gau', fr: 'nuits', en: 'nights', it: 'notti', nl: 'nachten', no: 'netter', da: 'nætter', de: 'Nächte' },
  'js.notAvailable': {
    es: 'No disponible en esas fechas.', eu: 'Ez dago erabilgarri data horietan.',
    fr: 'Non disponible à ces dates.', en: 'Not available on those dates.',
    it: 'Non disponibile in quelle date.', nl: 'Niet beschikbaar op die data.',
    no: 'Ikke tilgjengelig på disse datoene.', da: 'Ikke ledig på de datoer.', de: 'An diesen Daten nicht verfügbar.',
  },
  'js.saveBefore': { es: 'Ahorras', eu: 'Aurrezten duzu', fr: 'Vous économisez', en: 'You save', it: 'Risparmi', nl: 'Je bespaart', no: 'Du sparer', da: 'Du sparer', de: 'Du sparst' },
  'js.saveAfter': {
    es: '€ con la reserva directa.', eu: '€ erreserba zuzenarekin.', fr: '€ avec la réservation directe.',
    en: '€ with direct booking.', it: '€ con la prenotazione diretta.', nl: '€ met direct boeken.',
    no: '€ med direkte booking.', da: '€ med direkte booking.', de: '€ mit der Direktbuchung.',
  },
  'js.completeDates': {
    es: 'Completa fechas, nombre y email.', eu: 'Bete datak, izena eta emaila.',
    fr: 'Renseignez dates, nom et e-mail.', en: 'Please fill in dates, name and email.',
    it: 'Inserisci date, nome ed email.', nl: 'Vul data, naam en e-mail in.',
    no: 'Fyll inn datoer, navn og e-post.', da: 'Udfyld datoer, navn og e-mail.', de: 'Bitte Daten, Name und E-Mail angeben.',
  },
  'js.processing': { es: 'Procesando…', eu: 'Prozesatzen…', fr: 'Traitement…', en: 'Processing…', it: 'Elaborazione…', nl: 'Verwerken…', no: 'Behandler…', da: 'Behandler…', de: 'Wird verarbeitet…' },
  'js.couldNotComplete': {
    es: 'No se pudo completar.', eu: 'Ezin izan da osatu.', fr: 'Impossible de finaliser.', en: 'Could not complete.',
    it: 'Impossibile completare.', nl: 'Kon niet voltooien.', no: 'Kunne ikke fullføre.', da: 'Kunne ikke gennemføre.', de: 'Konnte nicht abgeschlossen werden.',
  },
  'js.netError': { es: 'Error de red.', eu: 'Sare-errorea.', fr: 'Erreur réseau.', en: 'Network error.', it: 'Errore di rete.', nl: 'Netwerkfout.', no: 'Nettverksfeil.', da: 'Netværksfejl.', de: 'Netzwerkfehler.' },
  'js.typing': { es: 'escribiendo…', eu: 'idazten…', fr: 'écrit…', en: 'typing…', it: 'sta scrivendo…', nl: 'aan het typen…', no: 'skriver…', da: 'skriver…', de: 'schreibt…' },
  'js.ccError': {
    es: 'Ahora mismo no puedo responder, inténtalo en un momento.',
    eu: 'Orain ezin dut erantzun, saiatu une batean.',
    fr: 'Je ne peux pas répondre pour le moment, réessayez dans un instant.',
    en: 'I can’t reply right now, please try again in a moment.',
    it: 'Ora non posso rispondere, riprova tra un momento.',
    nl: 'Ik kan nu niet antwoorden, probeer het zo weer.',
    no: 'Jeg kan ikke svare akkurat nå, prøv igjen om et øyeblikk.',
    da: 'Jeg kan ikke svare lige nu, prøv igen om lidt.',
    de: 'Ich kann gerade nicht antworten, bitte versuche es gleich noch einmal.',
  },
  'js.connError': { es: 'Error de conexión.', eu: 'Konexio-errorea.', fr: 'Erreur de connexion.', en: 'Connection error.', it: 'Errore di connessione.', nl: 'Verbindingsfout.', no: 'Tilkoblingsfeil.', da: 'Forbindelsesfejl.', de: 'Verbindungsfehler.' },

  // Pie de página
  'footer.boutique': {
    es: 'Apartamentos boutique · Bakio, Bizkaia', eu: 'Apartamentu boutique · Bakio, Bizkaia',
    fr: 'Appartements boutique · Bakio, Biscaye', en: 'Boutique apartments · Bakio, Biscay',
    it: 'Appartamenti boutique · Bakio, Biscaglia', nl: 'Boutique-appartementen · Bakio, Biskaje',
    no: 'Boutique-leiligheter · Bakio, Biscaya', da: 'Boutique-lejligheder · Bakio, Biscaya', de: 'Boutique-Apartments · Bakio, Biskaya',
  },
  'footer.near': {
    es: 'A 3 km de San Juan de Gaztelugatxe.', eu: 'San Juan de Gaztelugatxetik 3 km-ra.',
    fr: 'À 3 km de San Juan de Gaztelugatxe.', en: '3 km from San Juan de Gaztelugatxe.',
    it: 'A 3 km da San Juan de Gaztelugatxe.', nl: 'Op 3 km van San Juan de Gaztelugatxe.',
    no: '3 km fra San Juan de Gaztelugatxe.', da: '3 km fra San Juan de Gaztelugatxe.', de: '3 km von San Juan de Gaztelugatxe entfernt.',
  },
  'footer.directTitle': {
    es: 'Reserva directa', eu: 'Erreserba zuzena', fr: 'Réservation directe', en: 'Direct booking',
    it: 'Prenotazione diretta', nl: 'Direct boeken', no: 'Direkte booking', da: 'Direkte booking', de: 'Direktbuchung',
  },
  'footer.directDesc': {
    es: 'El mejor precio, sin comisiones de plataformas.',
    eu: 'Prezio onena, plataformen komisiorik gabe.',
    fr: 'Le meilleur prix, sans commissions de plateformes.',
    en: 'The best price, no platform fees.',
    it: 'Il miglior prezzo, senza commissioni delle piattaforme.',
    nl: 'De beste prijs, zonder platformkosten.',
    no: 'Beste pris, uten plattformgebyrer.',
    da: 'Den bedste pris, uden platformsgebyrer.',
    de: 'Der beste Preis, ohne Plattformgebühren.',
  },
  'footer.venmon': {
    es: 'Un proyecto de Venmon.', eu: 'Venmon-en proiektua.', fr: 'Un projet de Venmon.', en: 'A Venmon project.',
    it: 'Un progetto di Venmon.', nl: 'Een project van Venmon.', no: 'Et Venmon-prosjekt.', da: 'Et Venmon-projekt.', de: 'Ein Venmon-Projekt.',
  },
  'footer.privacy': { es: 'Privacidad', eu: 'Pribatutasuna', fr: 'Confidentialité', en: 'Privacy', it: 'Privacy', nl: 'Privacy', no: 'Personvern', da: 'Privatliv', de: 'Datenschutz' },
  'footer.panel': { es: 'Panel', eu: 'Panela', fr: 'Panneau', en: 'Panel', it: 'Pannello', nl: 'Paneel', no: 'Panel', da: 'Panel', de: 'Panel' },

  // ------------------------------------------------------------------------
  // TEXTO DEL TEMA (marketing). es = reserva desde theme.ts (no se duplica aquí).
  // Frases cortas: 10 idiomas. Párrafos largos: es/en/fr/de/it.
  // ------------------------------------------------------------------------
  'hero.eyebrow': {
    en: 'Bakio · Biscay · Basque Coast', fr: 'Bakio · Biscaye · Côte Basque',
    de: 'Bakio · Biskaya · Baskische Küste', it: 'Bakio · Biscaglia · Costa Basca',
    eu: 'Bakio · Bizkaia · Euskal Kostaldea', nl: 'Bakio · Biskaje · Baskische Kust',
    no: 'Bakio · Biscaya · Baskerkysten', da: 'Bakio · Biscaya · Baskiske Kyst',
  },
  'hero.title0': {
    en: 'Where the land', fr: 'Là où la terre', de: 'Wo das Land', it: 'Dove la terra',
    eu: 'Non lurra', nl: 'Waar het land', no: 'Der landet', da: 'Hvor landet',
  },
  'hero.title1': {
    en: 'meets the sea', fr: 'rencontre la mer', de: 'auf das Meer trifft', it: 'incontra il mare',
    eu: 'itsasoa aurkitzen duen', nl: 'de zee ontmoet', no: 'møter havet', da: 'møder havet',
  },
  'hero.cta': {
    en: 'Discover GURAH', fr: 'Découvrir GURAH', de: 'GURAH entdecken', it: 'Scopri GURAH',
    eu: 'GURAH ezagutu', nl: 'Ontdek GURAH', no: 'Oppdag GURAH', da: 'Oplev GURAH',
  },
  'story.title': {
    en: 'You don’t come to sleep.\nYou come to unplug.',
    fr: 'On ne vient pas dormir.\nOn vient déconnecter.',
    de: 'Du kommst nicht zum Schlafen.\nDu kommst zum Abschalten.',
    it: 'Non vieni a dormire.\nVieni a staccare la spina.',
  },
  'story.p0': {
    en: 'A boutique country house among vines and the silence of the Biscayan valley, three kilometres from San Juan de Gaztelugatxe. Stone, wood and soft light.',
    fr: 'Une maison de campagne boutique parmi les vignes et le silence de la vallée biscayenne, à trois kilomètres de San Juan de Gaztelugatxe. Pierre, bois et lumière douce.',
    de: 'Ein Boutique-Landhaus zwischen Reben und der Stille des biskayischen Tals, drei Kilometer von San Juan de Gaztelugatxe entfernt. Stein, Holz und sanftes Licht.',
    it: 'Una casa di campagna boutique tra le vigne e il silenzio della valle biscaglina, a tre chilometri da San Juan de Gaztelugatxe. Pietra, legno e luce morbida.',
  },
  'story.p1': {
    en: 'Here the day begins with mist over Bakio and ends with the sound of the Cantabrian Sea. No rush. No noise. Just sea, design and calm.',
    fr: 'Ici, le jour commence par la brume sur Bakio et se termine par le bruit de la mer Cantabrique. Sans hâte. Sans bruit. Juste la mer, le design et le calme.',
    de: 'Hier beginnt der Tag mit Nebel über Bakio und endet mit dem Rauschen des Kantabrischen Meeres. Ohne Eile. Ohne Lärm. Nur Meer, Design und Ruhe.',
    it: 'Qui il giorno inizia con la nebbia su Bakio e finisce con il suono del Mar Cantabrico. Senza fretta. Senza rumore. Solo mare, design e calma.',
  },
  'exp.kicker': { en: 'An experience', fr: 'Une expérience', de: 'Ein Erlebnis', it: 'Un’esperienza', eu: 'Esperientzia bat', nl: 'Een ervaring', no: 'En opplevelse', da: 'En oplevelse' },
  'exp.title': {
    en: 'To live, not just to stay', fr: 'Vivre, pas seulement séjourner', de: 'Leben, nicht nur übernachten',
    it: 'Vivere, non solo alloggiare', eu: 'Bizi, ez soilik ostatu hartu', nl: 'Leven, niet alleen verblijven',
    no: 'Å leve, ikke bare bo', da: 'At leve, ikke bare at bo',
  },
  'exp.i0': { en: 'Wake up in natural light', fr: 'Se réveiller à la lumière naturelle', de: 'Im Tageslicht aufwachen', it: 'Svegliarsi con la luce naturale', eu: 'Argi naturalarekin esnatu', nl: 'Wakker worden in natuurlijk licht', no: 'Våkne i naturlig lys', da: 'Vågn op i naturligt lys' },
  'exp.i1': { en: 'Breakfast on the terrace', fr: 'Petit-déjeuner sur la terrasse', de: 'Frühstück auf der Terrasse', it: 'Colazione in terrazza', eu: 'Terrazan gosaldu', nl: 'Ontbijten op het terras', no: 'Frokost på terrassen', da: 'Morgenmad på terrassen' },
  'exp.i2': { en: 'Come back from the beach', fr: 'Revenir de la plage', de: 'Vom Strand zurückkommen', it: 'Tornare dalla spiaggia', eu: 'Hondartzatik itzuli', nl: 'Terugkomen van het strand', no: 'Komme tilbake fra stranden', da: 'Komme hjem fra stranden' },
  'exp.i3': { en: 'Read by the pool', fr: 'Lire au bord de la piscine', de: 'Am Pool lesen', it: 'Leggere a bordo piscina', eu: 'Igerilekuaren ondoan irakurri', nl: 'Lezen bij het zwembad', no: 'Lese ved bassenget', da: 'Læse ved poolen' },
  'place.kicker': { en: 'The place', fr: 'Le lieu', de: 'Der Ort', it: 'Il luogo', eu: 'Lekua', nl: 'De plek', no: 'Stedet', da: 'Stedet' },
  'place.title': {
    en: 'Bakio and its coast', fr: 'Bakio et sa côte', de: 'Bakio und seine Küste', it: 'Bakio e la sua costa',
    eu: 'Bakio eta bere kostaldea', nl: 'Bakio en zijn kust', no: 'Bakio og kysten', da: 'Bakio og kysten',
  },
  'place.i0.t': { en: 'Bakio Beach', fr: 'Plage de Bakio', de: 'Strand von Bakio', it: 'Spiaggia di Bakio', eu: 'Bakioko hondartza', nl: 'Strand van Bakio', no: 'Bakio-stranden', da: 'Bakio-stranden' },
  'place.i0.d': {
    en: 'One of the best sandy beaches in Biscay for surfing and strolling.',
    fr: 'L’une des plus belles plages de sable de Biscaye pour le surf et la promenade.',
    de: 'Einer der schönsten Sandstrände Biskayas zum Surfen und Spazieren.',
    it: 'Una delle migliori spiagge di sabbia della Biscaglia per surf e passeggiate.',
  },
  'place.i1.t': { en: 'San Juan de Gaztelugatxe', fr: 'San Juan de Gaztelugatxe', de: 'San Juan de Gaztelugatxe', it: 'San Juan de Gaztelugatxe', eu: 'San Joan Gaztelugatxekoa', nl: 'San Juan de Gaztelugatxe', no: 'San Juan de Gaztelugatxe', da: 'San Juan de Gaztelugatxe' },
  'place.i1.d': {
    en: 'The iconic islet and its hermitage, just 3 km away.',
    fr: 'L’îlot emblématique et son ermitage, à seulement 3 km.',
    de: 'Die ikonische Insel und ihre Einsiedelei, nur 3 km entfernt.',
    it: 'L’iconico isolotto e il suo eremo, a soli 3 km.',
  },
  'place.i2.t': { en: 'Vineyards and valley', fr: 'Vignobles et vallée', de: 'Weinberge und Tal', it: 'Vigneti e valle', eu: 'Mahastiak eta harana', nl: 'Wijngaarden en vallei', no: 'Vinmarker og dal', da: 'Vinmarker og dal' },
  'place.i2.d': {
    en: 'Txakoli, greenery and silence right at your door.',
    fr: 'Txakoli, verdure et silence à votre porte.',
    de: 'Txakoli, Grün und Stille direkt vor der Tür.',
    it: 'Txakoli, verde e silenzio proprio davanti alla porta.',
  },
  'gallery.kicker': { en: 'Gallery', fr: 'Galerie', de: 'Galerie', it: 'Galleria', eu: 'Galeria', nl: 'Galerij', no: 'Galleri', da: 'Galleri' },
  'gallery.title': {
    en: 'A glimpse of GURAH', fr: 'Un aperçu de GURAH', de: 'Ein Blick auf GURAH', it: 'Uno sguardo a GURAH',
    eu: 'GURAH-i begiratu bat', nl: 'Een blik op GURAH', no: 'Et glimt av GURAH', da: 'Et glimt af GURAH',
  },
  'concierge.greeting': {
    en: 'Hello! I’m the GURAH concierge. First time in Bakio? I can suggest beaches, surf, Gaztelugatxe, txakoli wineries or restaurants — and, if you like, the perfect apartment for your trip.',
    fr: 'Bonjour ! Je suis le concierge de GURAH. Première fois à Bakio ? Je peux vous conseiller plages, surf, Gaztelugatxe, caves de txakoli ou restaurants — et, si vous voulez, l’appartement parfait pour votre séjour.',
    de: 'Hallo! Ich bin der GURAH-Concierge. Zum ersten Mal in Bakio? Ich empfehle Strände, Surfen, Gaztelugatxe, Txakoli-Weingüter oder Restaurants — und, wenn du magst, das perfekte Apartment für deine Reise.',
    it: 'Ciao! Sono il concierge di GURAH. Prima volta a Bakio? Posso consigliarti spiagge, surf, Gaztelugatxe, cantine di txakoli o ristoranti — e, se vuoi, l’appartamento perfetto per il tuo viaggio.',
  },

  // ------------------------------------------------------------------------
  // ETIQUETAS DE SERVICIOS (chips) — 10 idiomas.
  // ------------------------------------------------------------------------
  'serv.piscina_privada': { es: 'Piscina privada', eu: 'Igerileku pribatua', fr: 'Piscine privée', en: 'Private pool', it: 'Piscina privata', nl: 'Privézwembad', no: 'Privat basseng', da: 'Privat pool', de: 'Privatpool' },
  'serv.piscina_comunitaria': { es: 'Piscina comunitaria', eu: 'Igerileku komunitarioa', fr: 'Piscine commune', en: 'Shared pool', it: 'Piscina condivisa', nl: 'Gedeeld zwembad', no: 'Felles basseng', da: 'Fælles pool', de: 'Gemeinschaftspool' },
  'serv.piscina': { es: 'Piscina', eu: 'Igerilekua', fr: 'Piscine', en: 'Pool', it: 'Piscina', nl: 'Zwembad', no: 'Basseng', da: 'Pool', de: 'Pool' },
  'serv.gimnasio': { es: 'Gimnasio', eu: 'Gimnasioa', fr: 'Salle de sport', en: 'Gym', it: 'Palestra', nl: 'Fitnessruimte', no: 'Treningsrom', da: 'Fitnessrum', de: 'Fitnessraum' },
  'serv.solarium': { es: 'Solárium', eu: 'Solariuma', fr: 'Solarium', en: 'Solarium', it: 'Solarium', nl: 'Solarium', no: 'Solterrasse', da: 'Solarium', de: 'Sonnenterrasse' },
  'serv.terraza': { es: 'Terraza', eu: 'Terraza', fr: 'Terrasse', en: 'Terrace', it: 'Terrazza', nl: 'Terras', no: 'Terrasse', da: 'Terrasse', de: 'Terrasse' },
  'serv.jardin': { es: 'Jardín', eu: 'Lorategia', fr: 'Jardin', en: 'Garden', it: 'Giardino', nl: 'Tuin', no: 'Hage', da: 'Have', de: 'Garten' },
  'serv.vistas_montana': { es: 'Vistas a la montaña', eu: 'Mendirako bistak', fr: 'Vue sur la montagne', en: 'Mountain views', it: 'Vista sulle montagne', nl: 'Bergzicht', no: 'Fjellutsikt', da: 'Bjergudsigt', de: 'Bergblick' },
  'serv.vistas_mar': { es: 'Vistas al mar', eu: 'Itsasorako bistak', fr: 'Vue sur la mer', en: 'Sea views', it: 'Vista sul mare', nl: 'Zeezicht', no: 'Havutsikt', da: 'Havudsigt', de: 'Meerblick' },
  'serv.entrada_privada': { es: 'Entrada privada', eu: 'Sarrera pribatua', fr: 'Entrée privée', en: 'Private entrance', it: 'Ingresso privato', nl: 'Privé-ingang', no: 'Privat inngang', da: 'Privat indgang', de: 'Privater Eingang' },
  'serv.parking': { es: 'Parking', eu: 'Aparkalekua', fr: 'Parking', en: 'Parking', it: 'Parcheggio', nl: 'Parkeren', no: 'Parkering', da: 'Parkering', de: 'Parkplatz' },
  'serv.wifi': { es: 'WiFi', eu: 'WiFi', fr: 'WiFi', en: 'WiFi', it: 'WiFi', nl: 'WiFi', no: 'WiFi', da: 'WiFi', de: 'WLAN' },
  'serv.cocina_equipada': { es: 'Cocina equipada', eu: 'Sukalde ekipatua', fr: 'Cuisine équipée', en: 'Equipped kitchen', it: 'Cucina attrezzata', nl: 'Uitgeruste keuken', no: 'Utstyrt kjøkken', da: 'Udstyret køkken', de: 'Ausgestattete Küche' },
  'serv.lavavajillas': { es: 'Lavavajillas', eu: 'Ontzi-garbigailua', fr: 'Lave-vaisselle', en: 'Dishwasher', it: 'Lavastoviglie', nl: 'Vaatwasser', no: 'Oppvaskmaskin', da: 'Opvaskemaskine', de: 'Geschirrspüler' },
  'serv.tv': { es: 'TV pantalla plana', eu: 'Pantaila laueko TB', fr: 'TV écran plat', en: 'Flat-screen TV', it: 'TV a schermo piatto', nl: 'Flatscreen-tv', no: 'Flatskjerm-TV', da: 'Fladskærms-tv', de: 'Flachbild-TV' },
  'serv.lavadora': { es: 'Lavadora', eu: 'Garbigailua', fr: 'Lave-linge', en: 'Washing machine', it: 'Lavatrice', nl: 'Wasmachine', no: 'Vaskemaskin', da: 'Vaskemaskine', de: 'Waschmaschine' },
  'serv.mascotas': { es: 'Admite mascotas', eu: 'Maskotak onartzen ditu', fr: 'Animaux acceptés', en: 'Pet-friendly', it: 'Animali ammessi', nl: 'Huisdieren welkom', no: 'Kjæledyr tillatt', da: 'Kæledyr tilladt', de: 'Haustiere erlaubt' },
  'serv.barbacoa': { es: 'Barbacoa', eu: 'Barbakoa', fr: 'Barbecue', en: 'Barbecue', it: 'Barbecue', nl: 'Barbecue', no: 'Grill', da: 'Grill', de: 'Grill' },
  'serv.chimenea': { es: 'Chimenea', eu: 'Tximinia', fr: 'Cheminée', en: 'Fireplace', it: 'Camino', nl: 'Open haard', no: 'Peis', da: 'Pejs', de: 'Kamin' },
  'serv.padel': { es: 'Tenis-pádel', eu: 'Tenis-padela', fr: 'Tennis-padel', en: 'Tennis & padel', it: 'Tennis-padel', nl: 'Tennis & padel', no: 'Tennis og padel', da: 'Tennis og padel', de: 'Tennis & Padel' },
};

/** Cadena de interfaz con interpolación `{var}`. */
export function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const map = DICT[key];
  let s = map ? resolve(map, lang) : undefined;
  if (s == null) s = key;
  if (vars) for (const k of Object.keys(vars)) s = s!.replace('{' + k + '}', String(vars[k]));
  return s!;
}

/** Texto del tema: usa la traducción si existe; si no, el valor español de theme.ts. */
export function tx(lang: Lang, key: string, fallbackEs: string): string {
  if (lang === 'es') return fallbackEs;
  const map = DICT[key];
  if (!map) return fallbackEs;
  const s = resolve(map, lang);
  return s != null ? s : fallbackEs;
}

/** Etiqueta de servicio traducida (reserva a la clave cruda). */
export function servicioLabelI18n(key: string, lang: Lang): string {
  const map = DICT['serv.' + key];
  const s = map ? resolve(map, lang) : undefined;
  return s ?? key;
}

// ---------------------------------------------------------------------------
// TRADUCCIÓN DEL CATÁLOGO (concepto + storytelling por unidad).
// nombre se mantiene (marca). es = fuente en apartments.json.
// ---------------------------------------------------------------------------
interface ApartCopy { concepto?: Entry; storytelling?: Entry; }
const APART_I18N: Record<string, ApartCopy> = {
  lurra: {
    concepto: {
      en: 'Ground floor of the country house · 3 bedrooms',
      fr: 'Rez-de-chaussée de la maison de campagne · 3 chambres',
      de: 'Erdgeschoss des Landhauses · 3 Schlafzimmer',
      it: 'Piano terra della casa di campagna · 3 camere',
    },
    storytelling: {
      en: 'The ground floor of the house, with a private entrance and everything on one level. Three bedrooms of stone and wood for up to six guests, with views of the garden and the mountains, and the pool, gym and solarium just steps away. The perfect base to switch off without leaving home.',
      fr: 'Le rez-de-chaussée de la maison, avec entrée privée et tout de plain-pied. Trois chambres de pierre et de bois pour six personnes, avec vue sur le jardin et la montagne, et la piscine, la salle de sport et le solarium à deux pas. Le point de départ idéal pour déconnecter sans quitter la maison.',
      de: 'Das Erdgeschoss des Hauses, mit privatem Eingang und allem auf einer Ebene. Drei Schlafzimmer aus Stein und Holz für bis zu sechs Personen, mit Blick auf Garten und Berge, und Pool, Fitnessraum und Sonnenterrasse nur wenige Schritte entfernt. Der perfekte Ausgangspunkt zum Abschalten, ohne das Haus zu verlassen.',
      it: 'Il piano terra della casa, con ingresso privato e tutto sullo stesso livello. Tre camere in pietra e legno per un massimo di sei persone, con vista sul giardino e sulle montagne, e piscina, palestra e solarium a pochi passi. Il punto di partenza perfetto per staccare senza uscire di casa.',
    },
  },
  zerua: {
    concepto: {
      en: 'Upper floor of the country house · 2 bedrooms',
      fr: 'Étage de la maison de campagne · 2 chambres',
      de: 'Obergeschoss des Landhauses · 2 Schlafzimmer',
      it: 'Piano superiore della casa di campagna · 2 camere',
    },
    storytelling: {
      en: 'Upstairs, where the light rules. Two double bedrooms under the Basque roof, characterful ceilings and open views of the valley and the mountains. Private entrance and stair access; it shares the pool, gym and solarium with the house, and keeps the silence and the sky for itself.',
      fr: 'À l’étage, là où la lumière règne. Deux chambres doubles sous le toit basque, des plafonds pleins de caractère et une vue ouverte sur la vallée et la montagne. Entrée privée et accès par escalier ; elle partage la piscine, la salle de sport et le solarium avec la maison, et garde pour elle le silence et le ciel.',
      de: 'Oben, wo das Licht regiert. Zwei Doppelzimmer unter dem baskischen Dach, charaktervolle Decken und offener Blick auf Tal und Berge. Privater Eingang und Zugang über die Treppe; teilt sich Pool, Fitnessraum und Sonnenterrasse mit dem Haus und behält Stille und Himmel für sich.',
      it: 'Al piano di sopra, dove comanda la luce. Due camere matrimoniali sotto il tetto basco, soffitti pieni di carattere e vista aperta sulla valle e sulle montagne. Ingresso privato e accesso tramite scala; condivide piscina, palestra e solarium con la casa e si tiene il silenzio e il cielo.',
    },
  },
  bakea: {
    concepto: {
      en: 'Apartment with terrace, by the beach',
      fr: 'Appartement avec terrasse, près de la plage',
      de: 'Apartment mit Terrasse, am Strand',
      it: 'Appartamento con terrazza, vicino alla spiaggia',
    },
    storytelling: {
      en: 'A short walk from Bakio’s sandy beach. Fifty-seven square metres of warm design with a terrace and garden, pool and tennis-padel courts for sunny days. The bright retreat to come back from the sea without rushing. Pet-friendly.',
      fr: 'À quelques pas de la plage de Bakio. Cinquante-sept mètres carrés au design chaleureux avec terrasse et jardin, piscine et courts de tennis-padel pour les jours ensoleillés. Le refuge lumineux pour revenir de la mer sans se presser. Animaux acceptés.',
      de: 'Nur einen Spaziergang vom Sandstrand von Bakio entfernt. Siebenundfünfzig Quadratmeter warmes Design mit Terrasse und Garten, Pool und Tennis-Padel-Plätzen für sonnige Tage. Der helle Rückzugsort, um ohne Eile vom Meer zurückzukehren. Haustierfreundlich.',
      it: 'A pochi passi dalla spiaggia di Bakio. Cinquantasette metri quadrati di design caldo con terrazza e giardino, piscina e campi da tennis-padel per le giornate di sole. Il rifugio luminoso per tornare dal mare senza fretta. Animali ammessi.',
    },
  },
};

export interface LocalizableApartment {
  id: string;
  nombre: string;
  concepto: string;
  storytelling: string;
  [k: string]: unknown;
}

/** Devuelve una copia del apartamento con concepto/storytelling en el idioma. */
export function localizeApartment<T extends LocalizableApartment>(a: T, lang: Lang): T {
  if (lang === 'es') return a;
  const copy = APART_I18N[a.id];
  if (!copy) return a;
  const out: T = { ...a };
  if (copy.concepto) { const c = resolve(copy.concepto, lang); if (c != null) out.concepto = c; }
  if (copy.storytelling) { const s = resolve(copy.storytelling, lang); if (s != null) out.storytelling = s; }
  return out;
}

// ---------------------------------------------------------------------------
// RESOLUCIÓN DEL IDIOMA (servidor).
// ---------------------------------------------------------------------------
export interface CookieJar {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, opts?: Record<string, unknown>): void;
}

/**
 * Resuelve el idioma activo y lo persiste en cookie:
 *  1) `?lang=` (y lo fija en cookie), 2) cookie `lang`, 3) Accept-Language, 4) es.
 */
export function getLang(url: URL, cookies?: CookieJar, acceptLanguage?: string | null): Lang {
  const q = url.searchParams.get('lang');
  if (isLang(q)) {
    cookies?.set('lang', q, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
    return q;
  }
  const c = cookies?.get('lang')?.value;
  if (isLang(c)) return c;
  const fromHeader = pickFromAcceptLanguage(acceptLanguage);
  if (fromHeader) return fromHeader;
  return DEFAULT_LANG;
}

function pickFromAcceptLanguage(header?: string | null): Lang | null {
  if (!header) return null;
  const parts = header.split(',').map((p) => p.trim().split(';')[0].toLowerCase());
  for (const p of parts) {
    const base = p.split('-')[0];
    if (p.startsWith('nl-be')) return 'be';
    if (isLang(base)) return base as Lang;
  }
  return null;
}

/** Enlace que conserva la ruta actual y cambia solo el idioma. */
export function langHref(url: URL, code: Lang): string {
  const u = new URL(url.toString());
  u.searchParams.set('lang', code);
  return u.pathname + '?' + u.searchParams.toString();
}

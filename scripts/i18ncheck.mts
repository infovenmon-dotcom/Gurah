import { LOCALES, tx, localizeApartment } from '../src/lib/i18n.ts';

// Claves de texto largo del tema que se muestran en la web (deben existir por idioma).
const proseKeys = ['hero.eyebrow', 'hero.title0', 'hero.title1', 'hero.cta', 'story.title', 'story.p0', 'story.p1', 'exp.kicker', 'exp.title', 'exp.i0', 'exp.i1', 'exp.i2', 'exp.i3', 'place.kicker', 'place.title', 'place.i0.t', 'place.i0.d', 'place.i1.t', 'place.i1.d', 'place.i2.t', 'place.i2.d', 'gallery.kicker', 'gallery.title', 'concierge.greeting'];
const apts = [
  { id: 'lurra', nombre: 'GURAH · Lurra', concepto: 'Planta baja de la casa de campo · 3 dormitorios', storytelling: 'La planta baja de la casa...' },
  { id: 'zerua', nombre: 'GURAH · Zerua', concepto: 'Planta alta de la casa de campo · 2 dormitorios', storytelling: 'Arriba, donde manda la luz...' },
  { id: 'bakea', nombre: 'BAKEA', concepto: 'Apartamento con terraza, junto a la playa', storytelling: 'A un paseo del arenal...' },
];

let problems = 0;
for (const loc of LOCALES) {
  const L = loc.code as any;
  for (const k of proseKeys) {
    const v = tx(L, k, '«ES-FALLBACK»');
    if (v === '«ES-FALLBACK»' && L !== 'es') { console.log(`[${L}] tx('${k}') -> cae a ES`); problems++; }
  }
  if (L !== 'es') {
    for (const a of apts) {
      const la: any = localizeApartment({ ...a } as any, L);
      if (la.concepto === a.concepto) { console.log(`[${L}] ${a.id}.concepto sin traducir`); problems++; }
      if (la.storytelling === a.storytelling) { console.log(`[${L}] ${a.id}.storytelling sin traducir`); problems++; }
    }
  }
}
console.log(problems === 0 ? 'OK: sin fugas de idioma en textos largos.' : `PROBLEMAS: ${problems}`);

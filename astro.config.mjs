// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

// GURAH — Astro SSR sobre Netlify (adaptador oficial + Netlify Blobs como base de datos).
// Mismo stack real que Kirana: server output, i18n integrado, sin frameworks de UI pesados.
export default defineConfig({
  output: 'server',
  adapter: netlify(),
  site: process.env.PUBLIC_SITE_URL || 'https://gurah.netlify.app',
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'eu', 'en', 'fr', 'de', 'it', 'pt', 'nl', 'ca', 'gl'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    ssr: {
      // @netlify/blobs se resuelve en runtime dentro de funciones Netlify.
      external: ['@netlify/blobs'],
    },
  },
});

/**
 * middleware.ts — Protección del panel + cabeceras de seguridad.
 *
 * - Protege /panel/** (salvo login/logout/reset) exigiendo cookie de sesión válida.
 * - PUBLIC_API: rutas de API accesibles sin sesión (checkout, availability, webhooks…).
 * - Cabeceras de seguridad (CSP, X-Frame-Options, etc.) en todas las respuestas.
 * Heredado de Kirana.
 */

import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, verifySessionToken } from './lib/auth';

// Rutas de panel que NO requieren sesión.
const PANEL_PUBLIC = new Set(['/panel/login', '/panel/logout', '/panel/reset']);

// APIs públicas (sin sesión).
const PUBLIC_API = [
  '/api/availability',
  '/api/checkout',
  '/api/apartments',
  '/api/stripe-webhook',
  '/api/whatsapp',
  '/api/sync',
  '/api/ical',
];

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

const CSP = [
  "default-src 'self'",
  "img-src 'self' data: https:",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://www.openstreetmap.org",
  "connect-src 'self' https://api.stripe.com",
  "font-src 'self' data:",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Protección del panel (páginas, no las APIs públicas).
  if (pathname.startsWith('/panel') && !PANEL_PUBLIC.has(pathname)) {
    const token = context.cookies.get(SESSION_COOKIE)?.value;
    if (!verifySessionToken(token)) {
      return context.redirect('/panel/login');
    }
  }

  // Protección de APIs de panel (todo /api/panel/**).
  if (pathname.startsWith('/api/panel')) {
    const token = context.cookies.get(SESSION_COOKIE)?.value;
    if (!verifySessionToken(token)) {
      return new Response(JSON.stringify({ ok: false, error: 'No autorizado' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
  }

  const response = await next();

  // Cabeceras de seguridad en todas las respuestas HTML/API.
  response.headers.set('Content-Security-Policy', CSP);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  // marcador para depurar rutas públicas
  if (isPublicApi(pathname)) response.headers.set('X-Public-Api', '1');

  return response;
});

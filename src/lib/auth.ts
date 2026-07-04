/**
 * auth.ts — Autenticación del panel (scrypt + cookie firmada).
 *
 * Adaptado de Kirana. En modo demo (sin PANEL_PASSWORD) acepta la contraseña
 * 'demo' para que el cliente pueda entrar al panel sin configurar nada.
 * Los secretos SIEMPRE por variable de entorno, nunca en el código.
 */

import { scryptSync, timingSafeEqual, randomBytes, createHmac } from 'node:crypto';

const PANEL_PASSWORD = (typeof process !== 'undefined' && process.env?.PANEL_PASSWORD) || '';
const SESSION_SECRET =
  (typeof process !== 'undefined' && process.env?.SESSION_SECRET) || 'gurah-demo-secret';
export const SESSION_COOKIE = 'gurah_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 horas

export function isDemoAuth(): boolean {
  return !PANEL_PASSWORD;
}

/** Hash scrypt con sal, formato "salt:hash" en hex. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

/** Comprueba la contraseña del panel (demo: 'demo'). */
export function checkPanelPassword(password: string): boolean {
  if (isDemoAuth()) return password === 'demo';
  // PANEL_PASSWORD puede ser texto plano (compat) o hash "salt:hash".
  if (PANEL_PASSWORD.includes(':')) return verifyPassword(password, PANEL_PASSWORD);
  const a = Buffer.from(password);
  const b = Buffer.from(PANEL_PASSWORD);
  return a.length === b.length && timingSafeEqual(a, b);
}

// --- Cookie de sesión firmada (HMAC) ----------------------------------------

function sign(payload: string): string {
  return createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}

export function createSessionToken(): string {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `admin.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [sub, expStr, sig] = parts;
  const payload = `${sub}.${expStr}`;
  const expected = sign(payload);
  if (sig.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  const exp = Number(expStr);
  return Number.isFinite(exp) && exp > Date.now();
}

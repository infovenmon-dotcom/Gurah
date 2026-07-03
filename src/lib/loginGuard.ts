/**
 * loginGuard.ts — Protección anti fuerza bruta del panel (heredado de Kirana).
 *
 * Registra intentos fallidos por IP en Blobs y bloquea temporalmente tras N fallos.
 * Funciona igual en demo (memoria) que en producción (Blobs), vía persist.
 */

import { readJson, writeJson } from './persist';

const KEY = 'login_attempts';
const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 min
const LOCK_MS = 15 * 60 * 1000; // 15 min de bloqueo

interface Attempt {
  fails: number;
  first: number; // ts del primer fallo de la ventana
  lockedUntil?: number;
}

type Store = Record<string, Attempt>;

function ipKey(ip: string): string {
  return ip || 'unknown';
}

export interface GuardState {
  blocked: boolean;
  retryAfterMs?: number;
  remaining?: number;
}

/** Comprueba si una IP puede intentar login ahora. */
export async function checkLogin(ip: string): Promise<GuardState> {
  const store = await readJson<Store>(KEY, {});
  const a = store[ipKey(ip)];
  const now = Date.now();
  if (!a) return { blocked: false, remaining: MAX_FAILS };
  if (a.lockedUntil && a.lockedUntil > now) {
    return { blocked: true, retryAfterMs: a.lockedUntil - now };
  }
  // ventana expirada → reset implícito
  if (now - a.first > WINDOW_MS) return { blocked: false, remaining: MAX_FAILS };
  return { blocked: false, remaining: Math.max(0, MAX_FAILS - a.fails) };
}

/** Registra un fallo de login; bloquea si se supera el umbral. */
export async function registerFail(ip: string): Promise<GuardState> {
  const store = await readJson<Store>(KEY, {});
  const now = Date.now();
  const k = ipKey(ip);
  let a = store[k];
  if (!a || now - a.first > WINDOW_MS) {
    a = { fails: 0, first: now };
  }
  a.fails += 1;
  if (a.fails >= MAX_FAILS) {
    a.lockedUntil = now + LOCK_MS;
  }
  store[k] = a;
  await writeJson(KEY, store);
  return a.lockedUntil
    ? { blocked: true, retryAfterMs: a.lockedUntil - now }
    : { blocked: false, remaining: MAX_FAILS - a.fails };
}

/** Limpia los intentos de una IP tras un login correcto. */
export async function clearAttempts(ip: string): Promise<void> {
  const store = await readJson<Store>(KEY, {});
  if (store[ipKey(ip)]) {
    delete store[ipKey(ip)];
    await writeJson(KEY, store);
  }
}

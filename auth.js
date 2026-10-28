// Shared auth helpers — used by middleware.js (Edge) and api/auth/* (Node).
// Uses only Web standard APIs (Web Crypto, TextEncoder) so it runs in both.
//
// No database: the pending PIN and the session are HMAC-signed cookies.
// The PIN itself is never stored, only an HMAC of it, so the cookie can't be
// brute-forced offline without AUTH_SECRET.

export const SESSION_COOKIE = 'odp_session';
export const PENDING_COOKIE = 'odp_pin';

export const PIN_TTL_SEC = 10 * 60;      // PIN valid for 10 minutes
export const RESEND_AFTER_SEC = 60;      // wait before sending another PIN
export const MAX_ATTEMPTS = 5;           // wrong PINs before it is discarded

const enc = new TextEncoder();
const dec = new TextDecoder();

export function env(name, fallback = '') {
  const v = typeof process !== 'undefined' && process.env ? process.env[name] : undefined;
  return v == null || v === '' ? fallback : v;
}

export function sessionDays() {
  const n = parseInt(env('SESSION_DAYS', '7'), 10);
  return Number.isFinite(n) && n > 0 && n <= 90 ? n : 7;
}

/* ---------- base64url ---------- */
function b64urlFromBytes(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function bytesFromB64url(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* ---------- HMAC ---------- */
let keyCache = null;
async function key() {
  const secret = env('AUTH_SECRET');
  if (!secret || secret.length < 32) throw new ConfigError('AUTH_SECRET ต้องตั้งค่าและยาวอย่างน้อย 32 ตัวอักษร');
  if (keyCache && keyCache.secret === secret) return keyCache.key;
  const k = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  keyCache = { secret, key: k };
  return k;
}
export async function hmac(data) {
  const sig = await crypto.subtle.sign('HMAC', await key(), enc.encode(data));
  return b64urlFromBytes(new Uint8Array(sig));
}
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/* ---------- signed tokens ---------- */
export async function sign(payload) {
  const body = b64urlFromBytes(enc.encode(JSON.stringify(payload)));
  return body + '.' + (await hmac('tok:' + body));
}
export async function verify(token) {
  if (typeof token !== 'string' || token.length > 2048) return null;
  const i = token.lastIndexOf('.');
  if (i < 1) return null;
  const body = token.slice(0, i), sig = token.slice(i + 1);
  if (!safeEqual(sig, await hmac('tok:' + body))) return null;
  try {
    const p = JSON.parse(dec.decode(bytesFromB64url(body)));
    if (!p || typeof p.x !== 'number' || p.x * 1000 < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}

export async function pinHash(email, pin, exp) {
  return hmac('pin:' + email + ':' + pin + ':' + exp);
}
export { safeEqual };

/* ---------- PIN ---------- */
export function newPin() {
  // uniform 000000–999999 via rejection sampling
  const buf = new Uint32Array(1);
  let n;
  do { crypto.getRandomValues(buf); n = buf[0]; } while (n >= 4294000000);
  return String(n % 1000000).padStart(6, '0');
}

export function newId() {
  return b64urlFromBytes(crypto.getRandomValues(new Uint8Array(12)));
}

/* ---------- email allowlist ---------- */
export function normalizeEmail(v) {
  return String(v || '').trim().toLowerCase();
}
export function validEmail(e) {
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
/* ---------- cookies ---------- */
export function readCookie(request, name) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}
export function setCookie(name, value, { maxAge, path = '/' } = {}) {
  let c = `${name}=${encodeURIComponent(value)}; Path=${path}; HttpOnly; Secure; SameSite=Lax`;
  if (maxAge != null) c += `; Max-Age=${maxAge}`;
  return c;
}
export function clearCookie(name, path = '/') {
  return `${name}=; Path=${path}; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function sessionFrom(request) {
  const p = await verify(readCookie(request, SESSION_COOKIE));
  return p && p.t === 's' && p.e ? p : null;
}

/* ---------- responses ---------- */
export class ConfigError extends Error {}

export function json(data, status = 200, cookies = []) {
  const headers = new Headers({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  for (const c of cookies) headers.append('set-cookie', c);
  return new Response(JSON.stringify(data), { status, headers });
}

export async function readJson(request) {
  try { return await request.json(); } catch { return {}; }
}

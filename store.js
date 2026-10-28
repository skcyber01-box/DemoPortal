// Upstash Redis over its REST API (no SDK). Holds: viewer list + permissions,
// project on/off switches, last-login times, and the anti-abuse counters.
//
// Env (set automatically when you add "Upstash for Redis" from the Vercel Marketplace):
//   KV_REST_API_URL / KV_REST_API_TOKEN   or   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
import { env, ConfigError } from './auth.js';

function conf() {
  const url = env('KV_REST_API_URL') || env('UPSTASH_REDIS_REST_URL');
  const token = env('KV_REST_API_TOKEN') || env('UPSTASH_REDIS_REST_TOKEN');
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

export function hasStore() { return !!conf(); }

export async function pipeline(cmds) {
  const c = conf();
  if (!c) throw new ConfigError('ยังไม่ได้เชื่อม Upstash Redis (ดู README ขั้นที่ 3)');
  const res = await fetch(c.url + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + c.token, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds.map(a => a.map(String)))
  });
  if (!res.ok) throw new Error('Redis ' + res.status);
  const out = await res.json();
  return out.map(r => { if (r.error) throw new Error('Redis ' + r.error); return r.result; });
}
export async function cmd(...args) { return (await pipeline([args]))[0]; }

/** Increment a counter that expires after `ttl` seconds; returns the new value. */
export async function bump(key, ttl) {
  const [n] = await pipeline([['INCR', key], ['EXPIRE', key, ttl, 'NX']]);
  return Number(n);
}
export async function setCount(key, value, ttl) {
  await pipeline([['SET', key, value, 'EX', ttl]]);
}

let warned = false;
export function warnNoStore() {
  if (!warned && !hasStore()) {
    warned = true;
    console.warn('[auth] Upstash Redis not configured: only Super Admins can sign in. See README, step 3.');
  }
}

// Who may see what.
//
//  Super Admins  — env SUPER_ADMINS (comma-separated). See every project, open the settings page,
//                  and can't be removed or switched off from the web UI.
//  Viewers       — stored in Redis hash `odp:users`. Key is an email, or "@domain" to admit a whole
//                  domain. Value: { name, enabled, all, projects[], addedBy, addedAt, updatedAt }.
//                  An exact email record wins over a domain record.
//  Project off   — Redis set `odp:proj_off`: hidden from every viewer (Super Admins still see it).
import { env, normalizeEmail } from './auth.js';
import { hasStore, pipeline, cmd } from './store.js';
import { GROUPS, PROJECTS } from './projects.js';

export const USERS_KEY = 'odp:users';
export const OFF_KEY = 'odp:proj_off';
export const LOGIN_KEY = 'odp:lastlogin';

export const PUBLIC_DOMAINS = ['gmail.com', 'googlemail.com', 'hotmail.com', 'outlook.com', 'live.com',
  'yahoo.com', 'icloud.com', 'me.com', 'msn.com', 'proton.me', 'protonmail.com', 'aol.com'];

export function superAdmins() {
  return env('SUPER_ADMINS').split(/[\s,;]+/).map(normalizeEmail).filter(Boolean);
}
export function isSuperAdmin(email) {
  return !!email && superAdmins().includes(normalizeEmail(email));
}

function parse(v) { try { return v ? JSON.parse(v) : null; } catch { return null; } }

/** The record that governs this email (exact match first, then its domain), or null. */
export async function recordFor(email) {
  if (!hasStore()) return null;
  const domain = '@' + (email.split('@')[1] || '');
  const [exact, dom] = await pipeline([['HGET', USERS_KEY, email], ['HGET', USERS_KEY, domain]]);
  const e = parse(exact);
  if (e) return { key: email, ...e };
  const d = parse(dom);
  return d ? { key: domain, ...d } : null;
}

/** null = no access at all; otherwise { super, all, projects:Set } */
export async function accessFor(email) {
  email = normalizeEmail(email);
  if (isSuperAdmin(email)) return { super: true, all: true, projects: new Set() };
  const r = await recordFor(email);
  if (!r || r.enabled === false) return null;
  return { super: false, all: !!r.all, projects: new Set(Array.isArray(r.projects) ? r.projects : []), via: r.key };
}

export async function offProjects() {
  if (!hasStore()) return new Set();
  return new Set((await cmd('SMEMBERS', OFF_KEY)) || []);
}

/** Projects this viewer may see, already filtered. */
export async function visibleProjects(access) {
  const off = await offProjects();
  return PROJECTS
    .filter(p => access.super || (!off.has(p.id) && (access.all || access.projects.has(p.id))))
    .map(p => (access.super ? { ...p, off: off.has(p.id) } : p));
}

export async function listUsers() {
  if (!hasStore()) return [];
  const [flat, logins] = await pipeline([['HGETALL', USERS_KEY], ['HGETALL', LOGIN_KEY]]);
  const last = {};
  for (let i = 0; i + 1 < (logins || []).length; i += 2) last[logins[i]] = Number(logins[i + 1]);
  const out = [];
  for (let i = 0; i + 1 < (flat || []).length; i += 2) {
    const rec = parse(flat[i + 1]);
    if (rec) out.push({ key: flat[i], ...rec, lastLogin: last[flat[i]] || null });
  }
  return out.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
}

export async function recordLogin(email) {
  if (hasStore()) await cmd('HSET', LOGIN_KEY, email, Math.floor(Date.now() / 1000));
}

export async function lastLogins(emails) {
  if (!hasStore() || !emails.length) return {};
  const vals = await cmd('HMGET', LOGIN_KEY, ...emails);
  const out = {};
  emails.forEach((e, i) => { if (vals && vals[i]) out[e] = Number(vals[i]); });
  return out;
}

export { GROUPS, PROJECTS };

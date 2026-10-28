// POST   /api/admin/users  { key, name?, enabled?, all?, projects?, create? }  → add or update a viewer
// DELETE /api/admin/users  { key }                                           → remove a viewer
// key = an email, or "@domain" for everyone at that domain. Super Admin only.
import { json, readJson, normalizeEmail, validEmail, ConfigError } from '../_lib/auth.js';
import { requireSuperAdmin } from '../_lib/guard.js';
import { pipeline, cmd } from '../_lib/store.js';
import { USERS_KEY, LOGIN_KEY, PUBLIC_DOMAINS, isSuperAdmin, PROJECTS } from '../_lib/access.js';

const IDS = new Set(PROJECTS.map(p => p.id));

function checkKey(raw) {
  const key = normalizeEmail(raw);
  if (key.startsWith('@')) {
    const d = key.slice(1);
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d)) return { error: 'รูปแบบโดเมนไม่ถูกต้อง ตัวอย่าง: @onespace.co.th' };
    if (PUBLIC_DOMAINS.includes(d)) return { error: `ไม่สามารถเปิดสิทธิ์ทั้งโดเมน ${key} ได้ เพราะเป็นอีเมลสาธารณะ ให้เพิ่มเป็นรายคนแทน` };
    return { key };
  }
  if (!validEmail(key)) return { error: 'รูปแบบอีเมลไม่ถูกต้อง' };
  if (isSuperAdmin(key)) return { error: 'อีเมลนี้เป็น Super Admin อยู่แล้ว เห็นทุกโครงการ' };
  return { key };
}

export async function POST(request) {
  try {
    const g = await requireSuperAdmin(request);
    if (g instanceof Response) return g;
    const body = await readJson(request);
    const k = checkKey(body.key);
    if (k.error) return json({ error: 'invalid', message: k.error }, 400);

    const existing = await cmd('HGET', USERS_KEY, k.key);
    if (body.create && existing) return json({ error: 'exists', message: `${k.key} มีอยู่ในรายชื่อแล้ว` }, 409);
    if (!body.create && !existing) return json({ error: 'missing', message: `ไม่พบ ${k.key} ในรายชื่อ` }, 404);

    const now = Math.floor(Date.now() / 1000);
    const rec = existing ? JSON.parse(existing) : { enabled: true, all: false, projects: [], addedBy: g.email, addedAt: now };
    if (body.name !== undefined) rec.name = String(body.name || '').trim().slice(0, 120);
    if (body.enabled !== undefined) rec.enabled = !!body.enabled;
    if (body.all !== undefined) rec.all = !!body.all;
    if (body.projects !== undefined) {
      if (!Array.isArray(body.projects)) return json({ error: 'invalid', message: 'projects ต้องเป็นรายการ' }, 400);
      rec.projects = [...new Set(body.projects.map(String))].filter(id => IDS.has(id));
    }
    rec.updatedAt = now;
    rec.updatedBy = g.email;

    await cmd('HSET', USERS_KEY, k.key, JSON.stringify(rec));
    console.log(`[admin] ${g.email} ${existing ? 'updated' : 'added'} ${k.key} enabled=${rec.enabled} all=${rec.all} projects=${rec.projects.join('|')}`);
    return json({ ok: true, user: { key: k.key, ...rec } });
  } catch (err) {
    console.error('[admin] users POST failed:', err && err.message);
    return json({ error: 'server', message: err instanceof ConfigError ? err.message : 'บันทึกไม่สำเร็จ กรุณาลองใหม่' }, 500);
  }
}

export async function DELETE(request) {
  try {
    const g = await requireSuperAdmin(request);
    if (g instanceof Response) return g;
    const key = normalizeEmail((await readJson(request)).key);
    if (!key) return json({ error: 'invalid', message: 'ไม่ได้ระบุอีเมล' }, 400);
    await pipeline([['HDEL', USERS_KEY, key], ['HDEL', LOGIN_KEY, key]]);
    console.log(`[admin] ${g.email} removed ${key}`);
    return json({ ok: true });
  } catch (err) {
    console.error('[admin] users DELETE failed:', err && err.message);
    return json({ error: 'server', message: 'ลบไม่สำเร็จ กรุณาลองใหม่' }, 500);
  }
}

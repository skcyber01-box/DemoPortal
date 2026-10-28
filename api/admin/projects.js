// POST /api/admin/projects  { id, off }  → hide/show a project for every viewer (Super Admin only)
import { json, readJson } from '../_lib/auth.js';
import { requireSuperAdmin } from '../_lib/guard.js';
import { cmd } from '../_lib/store.js';
import { OFF_KEY, PROJECTS } from '../_lib/access.js';

export async function POST(request) {
  try {
    const g = await requireSuperAdmin(request);
    if (g instanceof Response) return g;
    const { id, off } = await readJson(request);
    if (!PROJECTS.some(p => p.id === id)) return json({ error: 'invalid', message: 'ไม่พบโครงการนี้' }, 400);
    await cmd(off ? 'SADD' : 'SREM', OFF_KEY, id);
    console.log(`[admin] ${g.email} turned ${off ? 'off' : 'on'} project ${id}`);
    return json({ ok: true, id, off: !!off });
  } catch (err) {
    console.error('[admin] projects failed:', err && err.message);
    return json({ error: 'server', message: 'บันทึกไม่สำเร็จ กรุณาลองใหม่' }, 500);
  }
}

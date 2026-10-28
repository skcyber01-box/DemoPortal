// GET /api/admin/state → everything the settings page needs (Super Admin only)
import { json, ConfigError } from '../_lib/auth.js';
import { requireSuperAdmin } from '../_lib/guard.js';
import { hasStore } from '../_lib/store.js';
import { listUsers, offProjects, superAdmins, lastLogins, GROUPS, PROJECTS } from '../_lib/access.js';

export async function GET(request) {
  try {
    const g = await requireSuperAdmin(request);
    if (g instanceof Response) return g;
    if (!hasStore()) {
      return json({ error: 'config', message: 'ยังไม่ได้เชื่อม Upstash Redis จึงยังบันทึกสิทธิ์ไม่ได้ (ดู README ขั้นที่ 3)' }, 500);
    }
    const [users, off] = await Promise.all([listUsers(), offProjects()]);
    const admins = superAdmins();
    const adminLogins = await lastLogins(admins);
    return json({
      me: g.email,
      superAdmins: admins.map(e => ({ key: e, lastLogin: adminLogins[e] || null })),
      users,
      groups: GROUPS,
      projects: PROJECTS.map(p => ({ id: p.id, name: p.name, group: p.group, status: p.status, off: off.has(p.id) }))
    });
  } catch (err) {
    console.error('[admin] state failed:', err && err.message);
    return json({ error: 'server', message: err instanceof ConfigError ? err.message : 'โหลดข้อมูลไม่สำเร็จ' }, 500);
  }
}

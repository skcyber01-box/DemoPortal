// GET /api/projects → only the projects this viewer is allowed to see
import { json, loginRequired } from './_lib/auth.js';
import { requireViewer } from './_lib/guard.js';
import { visibleProjects, GROUPS } from './_lib/access.js';

export async function GET(request) {
  try {
    // login switched off: everyone sees every project that is switched on
    if (!loginRequired()) {
      const projects = await visibleProjects({ super: false, all: true, projects: new Set() });
      const used = new Set(projects.map(p => p.group));
      return json({ email: null, superAdmin: false, loginRequired: false, groups: GROUPS.filter(x => used.has(x.id)), projects });
    }
    const g = await requireViewer(request);
    if (g instanceof Response) return g;
    const projects = await visibleProjects(g.access);
    const used = new Set(projects.map(p => p.group));
    return json({
      email: g.email,
      superAdmin: g.access.super,
      groups: GROUPS.filter(x => used.has(x.id)),
      projects
    });
  } catch (err) {
    console.error('[projects] failed:', err && err.message);
    return json({ error: 'server', message: 'โหลดรายการโครงการไม่สำเร็จ' }, 500);
  }
}

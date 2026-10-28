// GET /api/projects → only the projects this viewer is allowed to see
import { json } from './_lib/auth.js';
import { requireViewer } from './_lib/guard.js';
import { visibleProjects, GROUPS } from './_lib/access.js';

export async function GET(request) {
  try {
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

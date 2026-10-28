// GET /api/auth/me → { email, superAdmin } of the signed-in viewer
import { json, ConfigError, loginRequired } from '../_lib/auth.js';
import { requireViewer } from '../_lib/guard.js';

export async function GET(request) {
  try {
    if (!loginRequired()) return json({ email: null, superAdmin: false, loginRequired: false });
    const g = await requireViewer(request);
    if (g instanceof Response) return g;
    return json({ email: g.email, superAdmin: g.access.super });
  } catch (err) {
    console.error('[auth] me failed:', err && err.message);
    return json({ error: err instanceof ConfigError ? 'config' : 'server' }, 500);
  }
}

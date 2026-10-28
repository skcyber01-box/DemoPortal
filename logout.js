// POST /api/auth/logout → clears the session cookie
import { SESSION_COOKIE, clearCookie, json } from '../_lib/auth.js';

export async function POST() {
  return json({ ok: true }, 200, [clearCookie(SESSION_COOKIE)]);
}

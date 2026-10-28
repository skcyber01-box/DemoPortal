// Request guards for the JSON APIs.
import { sessionFrom, json } from './auth.js';
import { accessFor, isSuperAdmin } from './access.js';

/** Returns { email, access } or a Response to send back. */
export async function requireViewer(request) {
  const s = await sessionFrom(request);
  if (!s) return json({ error: 'signed_out', message: 'กรุณาเข้าสู่ระบบ' }, 401);
  const access = await accessFor(s.e);
  if (!access) return json({ error: 'revoked', message: 'อีเมลนี้ไม่มีสิทธิ์เข้าดู Demo แล้ว' }, 403);
  return { email: s.e, access };
}

/** Super Admin only. Changes must also come from this site (CSRF guard). */
export async function requireSuperAdmin(request) {
  if (request.method !== 'GET') {
    const origin = request.headers.get('origin');
    const host = new URL(request.url).host;
    if (origin && new URL(origin).host !== host) return json({ error: 'bad_origin' }, 403);
    if (!(request.headers.get('content-type') || '').includes('application/json')) return json({ error: 'bad_request' }, 415);
  }
  const s = await sessionFrom(request);
  if (!s) return json({ error: 'signed_out', message: 'กรุณาเข้าสู่ระบบ' }, 401);
  if (!isSuperAdmin(s.e)) return json({ error: 'forbidden', message: 'เฉพาะ Super Admin' }, 403);
  return { email: s.e };
}

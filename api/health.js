// GET /api/health → which settings the server can see (yes/no and counts only, never values).
// Open https://<your-portal>/api/health after a deploy to check the Environment Variables.
import { env, json } from './_lib/auth.js';
import { superAdmins } from './_lib/access.js';
import { hasStore, cmd } from './_lib/store.js';

export async function GET() {
  const secret = env('AUTH_SECRET');
  let redis = hasStore() ? 'configured' : 'missing';
  if (hasStore()) {
    try { redis = (await cmd('PING')) === 'PONG' ? 'ok' : 'unexpected reply'; }
    catch (e) { redis = 'error: ' + String(e.message).slice(0, 80); }
  }
  return json({
    deployment: env('VERCEL_ENV', 'unknown'),
    SUPER_ADMINS: superAdmins().length ? `${superAdmins().length} address(es)` : 'MISSING',
    AUTH_SECRET: !secret ? 'MISSING' : secret.length < 32 ? `too short (${secret.length} chars, need 32+)` : 'ok',
    RESEND_API_KEY: env('RESEND_API_KEY') ? 'ok' : 'MISSING',
    MAIL_FROM: env('MAIL_FROM') ? 'set' : 'not set (uses Resend test sender)',
    redis
  });
}

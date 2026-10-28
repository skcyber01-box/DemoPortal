// Vercel Routing Middleware — every page and file needs a signed-in session,
// except the login page itself and the login API.
import { next } from '@vercel/functions';
import { sessionFrom } from './api/_lib/auth.js';
import { isSuperAdmin } from './api/_lib/access.js';

export const config = {
  matcher: [
    '/((?!login\\.html|api/|assets/login\\.css|assets/login\\.js|favicon\\.ico).*)',
    '/api/_lib/(.*)'
  ]
};

export default async function middleware(request) {
  // server-only modules (project list, auth code) are never downloadable
  if (new URL(request.url).pathname.startsWith('/api/_lib/')) {
    return new Response('Not found', { status: 404 });
  }
  let session = null;
  try {
    session = await sessionFrom(request);
  } catch (err) {
    // AUTH_SECRET missing or too short: fail closed
    return new Response('Demo Portal ยังตั้งค่าไม่ครบ (AUTH_SECRET) กรุณาตรวจสอบ Environment Variables ใน Vercel', {
      status: 500, headers: { 'content-type': 'text/plain; charset=utf-8' }
    });
  }
  if (session) {
    // the settings page is for Super Admins only
    const path = new URL(request.url).pathname;
    if (/^\/(admin\.html|assets\/admin\.(js|css))$/.test(path) && !isSuperAdmin(session.e)) {
      return new Response(null, { status: 302, headers: { location: '/', 'cache-control': 'no-store' } });
    }
    return next();
  }

  const url = new URL(request.url);
  const wantsPage = (request.headers.get('accept') || '').includes('text/html');
  if (!wantsPage) {
    return new Response('Unauthorized', { status: 401, headers: { 'cache-control': 'no-store' } });
  }
  const login = new URL('/login.html', url);
  const back = url.pathname + url.search;
  if (back !== '/') login.searchParams.set('next', back);
  // the browser keeps the #fragment across this redirect, so deep links survive
  return new Response(null, { status: 302, headers: { location: login.pathname + login.search, 'cache-control': 'no-store' } });
}

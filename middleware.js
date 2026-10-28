// Vercel Routing Middleware — every page and file needs a signed-in session,
// except the login page itself and the login API.
// No npm imports here on purpose: middleware runs on Vercel's Edge runtime, which has
// no Node.js built-ins (fs, os, ...). Everything below uses Web standard APIs only.
import { sessionFrom, loginRequired } from './api/_lib/auth.js';
import { isSuperAdmin } from './api/_lib/access.js';

export const config = {
  matcher: [
    '/((?!login\\.html|api/|assets/login\\.css|assets/login\\.js|favicon\\.ico).*)',
    '/api/_lib/(.*)'
  ]
};

// Tell Vercel to continue to the requested file (same as `next()` from @vercel/functions)
function next() {
  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}

function failClosed(message) {
  return new Response(message, { status: 500, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
}

export default async function middleware(request) {
  try {
    return await gate(request);
  } catch (err) {
    console.error('[middleware]', err && (err.stack || err.message));
    return failClosed('Demo Portal ขัดข้องชั่วคราว กรุณาลองใหม่ (ดูรายละเอียดใน Vercel Logs)');
  }
}

async function gate(request) {
  // server-only modules (project list, auth code) are never downloadable
  if (new URL(request.url).pathname.startsWith('/api/_lib/')) {
    return new Response('Not found', { status: 404 });
  }
  // login switched off (LOGIN_REQUIRED not set to 1): everything is open except the settings page
  if (!loginRequired()) {
    if (/^\/(admin\.html|assets\/admin\.(js|css))$/.test(new URL(request.url).pathname)) {
      return new Response(null, { status: 302, headers: { location: '/', 'cache-control': 'no-store' } });
    }
    return next();
  }

  let session = null;
  try {
    session = await sessionFrom(request);
  } catch (err) {
    // AUTH_SECRET missing or too short: fail closed
    return failClosed('Demo Portal ยังตั้งค่าไม่ครบ (AUTH_SECRET) กรุณาตรวจสอบ Environment Variables ใน Vercel');
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

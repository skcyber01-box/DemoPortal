// POST /api/auth/verify  { pin }  → sets the session cookie
import {
  PENDING_COOKIE, SESSION_COOKIE, MAX_ATTEMPTS, PIN_TTL_SEC,
  pinHash, sign, verify, readCookie, setCookie, clearCookie,
  sessionDays, safeEqual, json, readJson, ConfigError
} from '../_lib/auth.js';
import { hasStore, bump, setCount } from '../_lib/store.js';
import { accessFor, recordLogin } from '../_lib/access.js';

export async function POST(request) {
  try {
    const { pin: raw } = await readJson(request);
    const pin = String(raw || '').replace(/\D/g, '');

    const pending = await verify(readCookie(request, PENDING_COOKIE));
    if (!pending || pending.t !== 'p') {
      return json({ error: 'expired', message: 'รหัสหมดอายุแล้ว กรุณาขอรหัสใหม่' }, 400,
        [clearCookie(PENDING_COOKIE, '/api/auth')]);
    }
    if (pin.length !== 6) {
      return json({ error: 'invalid_pin', message: 'กรุณาใส่รหัส 6 หลัก' }, 400);
    }

    // server-side attempt counter: replaying an old cookie doesn't reset it
    if (hasStore()) {
      const tries = await bump('odp:try:' + pending.j, PIN_TTL_SEC);
      if (tries > MAX_ATTEMPTS) {
        console.log(`[auth] too many attempts ${pending.e}`);
        return json({ error: 'too_many', message: 'ใส่รหัสผิดเกินกำหนด กรุณาขอรหัสใหม่' }, 400,
          [clearCookie(PENDING_COOKIE, '/api/auth')]);
      }
    }

    const ok = safeEqual(await pinHash(pending.e, pin, pending.x), pending.h);
    if (!ok) {
      const attempts = (pending.a || 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        console.log(`[auth] too many attempts ${pending.e}`);
        return json({ error: 'too_many', message: 'ใส่รหัสผิดเกินกำหนด กรุณาขอรหัสใหม่' }, 400,
          [clearCookie(PENDING_COOKIE, '/api/auth')]);
      }
      const left = MAX_ATTEMPTS - attempts;
      const ttl = pending.x - Math.floor(Date.now() / 1000);
      const token = await sign({ ...pending, a: attempts });
      return json({ error: 'wrong_pin', message: `รหัสไม่ถูกต้อง ลองได้อีก ${left} ครั้ง`, attemptsLeft: left }, 400,
        [setCookie(PENDING_COOKIE, token, { maxAge: ttl, path: '/api/auth' })]);
    }

    // burn the PIN so the same cookie + PIN can't be used twice
    if (hasStore()) await setCount('odp:try:' + pending.j, 999, PIN_TTL_SEC);

    // access may have been withdrawn while the PIN was in the mailbox
    if (!(await accessFor(pending.e))) {
      return json({ error: 'not_allowed', message: 'อีเมลนี้ไม่มีสิทธิ์เข้าดู Demo แล้ว กรุณาติดต่อผู้ดูแลพอร์ทัล' }, 403,
        [clearCookie(PENDING_COOKIE, '/api/auth')]);
    }
    await recordLogin(pending.e).catch(() => {});

    const days = sessionDays();
    const session = await sign({ t: 's', e: pending.e, x: Math.floor(Date.now() / 1000) + days * 86400 });
    console.log(`[auth] login ${pending.e}`);

    return json({ ok: true, email: pending.e }, 200, [
      clearCookie(PENDING_COOKIE, '/api/auth'),
      setCookie(SESSION_COOKIE, session, { maxAge: days * 86400 })
    ]);
  } catch (err) {
    console.error('[auth] verify failed:', err && err.message);
    const msg = err instanceof ConfigError ? 'ระบบยังตั้งค่าไม่ครบ: ' + err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
    return json({ error: 'server', message: msg }, 500);
  }
}

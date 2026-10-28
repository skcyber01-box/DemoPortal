// POST /api/auth/request  { email }  → emails a 6-digit PIN
import {
  PENDING_COOKIE, PIN_TTL_SEC, RESEND_AFTER_SEC,
  normalizeEmail, validEmail, newPin, newId, pinHash,
  sign, verify, readCookie, setCookie, json, readJson, ConfigError
} from '../_lib/auth.js';
import { sendPin } from '../_lib/mail.js';
import { hasStore, bump, warnNoStore } from '../_lib/store.js';
import { accessFor, superAdmins } from '../_lib/access.js';

const MAX_SENDS_PER_HOUR = 10;

export async function POST(request) {
  try {
    const { email: raw } = await readJson(request);
    const email = normalizeEmail(raw);

    if (!validEmail(email)) {
      return json({ error: 'invalid_email', message: 'รูปแบบอีเมลไม่ถูกต้อง' }, 400);
    }
    warnNoStore();
    if (!(await accessFor(email))) {
      const admins = superAdmins();
      console.log(`[auth] denied ${email}` + (admins.length
        ? ` (SUPER_ADMINS has ${admins.length} address(es))`
        : ' (SUPER_ADMINS is empty: add it in Vercel → Settings → Environment Variables, then Redeploy)'));
      return json({ error: 'not_allowed', message: 'อีเมลนี้ยังไม่มีสิทธิ์เข้าดู Demo กรุณาติดต่อผู้ดูแลพอร์ทัลเพื่อขอสิทธิ์' }, 403);
    }

    // cool-down: one PIN per minute for the same email in this browser
    const prev = await verify(readCookie(request, PENDING_COOKIE));
    if (prev && prev.t === 'p' && prev.e === email) {
      const wait = prev.s + RESEND_AFTER_SEC - Math.floor(Date.now() / 1000);
      if (wait > 0) {
        return json({ error: 'too_soon', message: `ส่งรหัสใหม่ได้อีกครั้งใน ${wait} วินาที`, retryAfter: wait }, 429);
      }
    }

    // server-side cap per address
    if (hasStore() && (await bump('odp:send:' + email, 3600)) > MAX_SENDS_PER_HOUR) {
      console.log(`[auth] send cap reached ${email}`);
      return json({ error: 'too_many_sends', message: 'ขอรหัสบ่อยเกินไป กรุณารอ 1 ชั่วโมงแล้วลองใหม่' }, 429);
    }

    const now = Math.floor(Date.now() / 1000);
    const exp = now + PIN_TTL_SEC;
    const pin = newPin();
    const token = await sign({ t: 'p', j: newId(), e: email, h: await pinHash(email, pin, exp), x: exp, s: now, a: 0 });

    await sendPin(email, pin);
    console.log(`[auth] pin sent to ${email}`);

    return json(
      { ok: true, email, expiresIn: PIN_TTL_SEC, resendIn: RESEND_AFTER_SEC },
      200,
      [setCookie(PENDING_COOKIE, token, { maxAge: PIN_TTL_SEC, path: '/api/auth' })]
    );
  } catch (err) {
    console.error('[auth] request failed:', err && err.message);
    if (err instanceof ConfigError) {
      return json({ error: 'config', message: 'ระบบยังตั้งค่าไม่ครบ: ' + err.message }, 500);
    }
    return json({ error: 'send_failed', message: 'ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' }, 502);
  }
}

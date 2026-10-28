// Sends the login PIN by email through Resend (https://resend.com).
import { env, ConfigError } from './auth.js';

export async function sendPin(to, pin) {
  const apiKey = env('RESEND_API_KEY');

  // Local testing only: print the PIN to the server log instead of emailing it.
  if (!apiKey && env('AUTH_DEV_LOG_PIN') === '1' && env('VERCEL_ENV') !== 'production') {
    console.log(`[dev] PIN for ${to}: ${pin}`);
    return;
  }
  if (!apiKey) throw new ConfigError('ยังไม่ได้ตั้งค่า RESEND_API_KEY');

  const from = env('MAIL_FROM', 'OneSpace Demo Portal <onboarding@resend.dev>');
  const minutes = 10;
  const spaced = pin.slice(0, 3) + ' ' + pin.slice(3);

  const text =
`รหัสเข้าสู่ระบบ OneSpace Demo Portal ของคุณคือ

${spaced}

รหัสนี้ใช้ได้ภายใน ${minutes} นาที และใช้ได้ครั้งเดียว
ถ้าคุณไม่ได้ขอรหัสนี้ ไม่ต้องทำอะไร บัญชีของคุณยังปลอดภัย

OneSpace Corporation`;

  const html = `<!doctype html><html lang="th"><body style="margin:0;background:#e9efec;font-family:Tahoma,sans-serif;color:#0f2a24">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#ffffff;border-radius:10px;padding:32px">
<tr><td style="font-size:15px;color:#50655f;padding-bottom:4px">OneSpace Demo Portal</td></tr>
<tr><td style="font-size:20px;font-weight:bold;padding-bottom:20px">รหัสเข้าสู่ระบบของคุณ</td></tr>
<tr><td style="font-size:38px;font-weight:bold;letter-spacing:8px;color:#0b6e4f;padding:16px 0;background:#dcece5;border-radius:8px;text-align:center">${spaced}</td></tr>
<tr><td style="font-size:15px;line-height:1.6;color:#50655f;padding-top:20px">รหัสนี้ใช้ได้ภายใน ${minutes} นาที และใช้ได้ครั้งเดียว<br>ถ้าคุณไม่ได้ขอรหัสนี้ ไม่ต้องทำอะไร บัญชีของคุณยังปลอดภัย</td></tr>
</table>
<p style="font-size:13px;color:#7d8f8a;margin-top:16px">OneSpace Corporation</p>
</td></tr></table></body></html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `${pin} คือรหัสเข้าสู่ระบบ OneSpace Demo Portal`,
      text,
      html
    })
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${detail.slice(0, 300)}`);
  }
}

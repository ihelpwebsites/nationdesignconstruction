// Notification email. Sends ONLY through a configured provider (Resend) to a VERIFIED business inbox.
// Without both, the message is stored in the outbox with status 'not_configured' and the admin dashboard says so.
import { run, now, newId, getSetting } from './db.mjs';
import { EMAIL } from '../config.mjs';

/** The inbox that receives lead/trade notifications: admin → Business details → Notification inbox (must be verified). */
export function notificationInbox() {
  const n = getSetting('notify', {});
  return n.email && n.verified ? n.email : null;
}
export const emailReady = () => Boolean(EMAIL.provider && EMAIL.from && notificationInbox());

export async function notify(kind, subject, text) {
  const id = newId('msg');
  const to = notificationInbox();
  run('INSERT INTO outbox (id, kind, recipient, subject, body, status, created_at) VALUES (?,?,?,?,?,?,?)', id, kind, to, subject, text, 'pending', now());
  if (!emailReady()) {
    run('UPDATE outbox SET status = ?, detail = ? WHERE id = ?', 'not_configured', !EMAIL.provider ? 'No email provider configured (RESEND_API_KEY).' : !EMAIL.from ? 'EMAIL_FROM not set.' : 'No verified notification inbox.', id);
    return { sent: false, reason: 'not_configured' };
  }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${EMAIL.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: EMAIL.from, to: [to], subject, text }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw new Error(`provider ${r.status}: ${(await r.text()).slice(0, 200)}`);
    run('UPDATE outbox SET status = ?, sent_at = ? WHERE id = ?', 'sent', now(), id);
    return { sent: true };
  } catch (e) {
    run('UPDATE outbox SET status = ?, detail = ? WHERE id = ?', 'failed', String(e.message).slice(0, 300), id);
    console.error('notify failed', e.message);
    return { sent: false, reason: 'failed' };
  }
}

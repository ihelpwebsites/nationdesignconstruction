// Notification email. Leads are ALWAYS stored first; email is a best-effort notification on top.
// Sends only through a configured provider (Resend: RESEND_API_KEY + EMAIL_FROM on the server) to a VERIFIED inbox
// (admin → Business details). Every message is queued in `outbox`; failures are retried with backoff and shown on
// the admin dashboard. The customer's address goes in Reply-To — never in From.
import { run, all, now, newId, getSetting } from './db.mjs';
import { EMAIL } from '../config.mjs';

const MAX_ATTEMPTS = 6;

/** The inbox that receives lead/trade notifications. */
export function notificationInbox() {
  const n = getSetting('notify', {});
  return n.email && n.verified ? n.email : null;
}
export const emailReady = () => Boolean(EMAIL.provider && EMAIL.from && notificationInbox());
export function emailBlocker() {
  if (!EMAIL.provider) return 'no email provider is configured (RESEND_API_KEY)';
  if (!EMAIL.from) return 'EMAIL_FROM is not set';
  if (!notificationInbox()) return 'no verified notification inbox is set';
  return null;
}

async function deliver(msg) {
  const to = notificationInbox();
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${EMAIL.apiKey}`, 'content-type': 'application/json', 'idempotency-key': msg.id },
    body: JSON.stringify({ from: EMAIL.from, to: [to], subject: msg.subject, text: msg.body, ...(msg.reply_to ? { reply_to: msg.reply_to } : {}) }),
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`provider ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return to;
}

async function attempt(msg) {
  const attempts = (msg.attempts || 0) + 1;
  try {
    const to = await deliver(msg);
    run('UPDATE outbox SET status = ?, recipient = ?, sent_at = ?, attempts = ?, detail = NULL WHERE id = ?', 'sent', to, now(), attempts, msg.id);
    return true;
  } catch (e) {
    const next = attempts >= MAX_ATTEMPTS ? null : new Date(Date.now() + 2 ** attempts * 60e3).toISOString();
    run('UPDATE outbox SET status = ?, attempts = ?, next_attempt_at = ?, detail = ? WHERE id = ?', next ? 'retrying' : 'failed', attempts, next, String(e.message).slice(0, 300), msg.id);
    console.error('notify failed', msg.id, e.message);
    return false;
  }
}

/** Queue a notification and try it once now. Never throws; the caller's stored record is unaffected. */
export async function notify(kind, subject, text, { replyTo = null } = {}) {
  const msg = { id: newId('msg'), kind, subject, body: text, reply_to: replyTo, attempts: 0 };
  run('INSERT INTO outbox (id, kind, recipient, subject, body, status, created_at, reply_to, attempts) VALUES (?,?,?,?,?,?,?,?,0)',
    msg.id, kind, notificationInbox(), subject, text, 'pending', now(), replyTo);
  const blocker = emailBlocker();
  if (blocker) { run('UPDATE outbox SET status = ?, detail = ? WHERE id = ?', 'not_configured', blocker, msg.id); return { sent: false, reason: 'not_configured' }; }
  try { return { sent: await attempt(msg) }; } catch { return { sent: false }; }
}

/** Retry worker: due retries, plus recent unsent messages once email becomes configured. */
export async function retryOutbox() {
  if (emailBlocker()) return 0;
  const due = all(`SELECT * FROM outbox WHERE (status = 'retrying' AND next_attempt_at <= ?)
    OR (status IN ('pending', 'not_configured') AND created_at >= ?) ORDER BY created_at LIMIT 20`, now(), new Date(Date.now() - 3 * 864e5).toISOString());
  let sent = 0;
  for (const m of due) if (await attempt(m)) sent++;
  return sent;
}

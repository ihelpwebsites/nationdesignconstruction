// Email through Resend. Leads are ALWAYS stored first; email is best-effort on top and can never undo a saved lead.
//  - Internal notifications (new inquiry / trade application / documents) go to the business inbox
//    (admin override → NOTIFY_EMAIL → hello@nationdesignconstruction.com), Reply-To = the customer's validated address.
//  - Customer confirmations go to the customer, Reply-To = hello@ (EMAIL.replyTo).
//  - From is always our verified sender (EMAIL_FROM, default notify@notify.nationdesignconstruction.com) — never a
//    customer's address. Every message is queued in `outbox`; failures retry with backoff and show on the dashboard.
import { run, all, now, newId, getSetting } from './db.mjs';
import { EMAIL } from '../config.mjs';

const MAX_ATTEMPTS = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/** The inbox that receives internal notifications. */
export function notificationInbox() {
  const n = getSetting('notify', {});
  return n.email && n.verified ? n.email : EMAIL.notifyTo;
}
export const emailReady = () => Boolean(EMAIL.provider && EMAIL.from && notificationInbox());
export function emailBlocker() {
  if (!EMAIL.provider) return 'the RESEND_API_KEY secret is not set on the server';
  if (!EMAIL.from) return 'EMAIL_FROM is not set';
  if (!notificationInbox()) return 'no notification inbox is set';
  return null;
}

async function deliver(msg) {
  const to = msg.kind === 'confirmation' ? msg.recipient : notificationInbox();
  if (!to || !EMAIL_RE.test(to)) throw new Error('no valid recipient');
  const r = await fetch(EMAIL.apiUrl, {
    method: 'POST',
    headers: { authorization: `Bearer ${EMAIL.apiKey}`, 'content-type': 'application/json', 'idempotency-key': msg.id },
    body: JSON.stringify({ from: EMAIL.from, to: [to], subject: msg.subject, text: msg.body, ...(msg.reply_to ? { reply_to: msg.reply_to } : {}) }),
    signal: AbortSignal.timeout(10000),
  });
  const body = await r.text();
  if (!r.ok) throw new Error(`provider ${r.status}: ${body.slice(0, 200)}`);
  let providerId = null; try { providerId = JSON.parse(body).id || null; } catch { /* ignore */ }
  return { to, providerId };
}

async function attempt(msg) {
  const attempts = (msg.attempts || 0) + 1;
  try {
    const { to, providerId } = await deliver(msg);
    run('UPDATE outbox SET status = ?, recipient = ?, sent_at = ?, attempts = ?, detail = ? WHERE id = ?', 'sent', to, now(), attempts, providerId ? `provider id ${providerId}` : null, msg.id);
    return true;
  } catch (e) {
    const next = attempts >= MAX_ATTEMPTS ? null : new Date(Date.now() + 2 ** attempts * 60e3).toISOString();
    run('UPDATE outbox SET status = ?, attempts = ?, next_attempt_at = ?, detail = ? WHERE id = ?', next ? 'retrying' : 'failed', attempts, next, String(e.message).slice(0, 300), msg.id);
    console.error('email failed', msg.id, msg.kind, String(e.message).slice(0, 120)); // no addresses or content in logs
    return false;
  }
}

function queue(kind, recipient, subject, text, replyTo) {
  const msg = { id: newId('msg'), kind, recipient, subject, body: text, reply_to: replyTo, attempts: 0 };
  run('INSERT INTO outbox (id, kind, recipient, subject, body, status, created_at, reply_to, attempts) VALUES (?,?,?,?,?,?,?,?,0)',
    msg.id, kind, recipient, subject, text, 'pending', now(), replyTo);
  return msg;
}

/** Internal notification to the business inbox. Never throws. */
export async function notify(kind, subject, text, { replyTo = null } = {}) {
  const msg = queue(kind, notificationInbox(), subject, text, replyTo && EMAIL_RE.test(replyTo) ? replyTo : null);
  const blocker = emailBlocker();
  if (blocker) { run('UPDATE outbox SET status = ?, detail = ? WHERE id = ?', 'not_configured', blocker, msg.id); return { sent: false, reason: 'not_configured' }; }
  try { return { sent: await attempt(msg) }; } catch { return { sent: false }; }
}

/** Confirmation to the customer/applicant (Reply-To: our inbox). Never throws; skipped for test records by callers. */
export async function confirm(to, subject, text) {
  if (!EMAIL_RE.test(to || '')) return { sent: false };
  const msg = queue('confirmation', to, subject, text, EMAIL.replyTo);
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
  for (const m of due) {
    // A customer confirmation that could not go out promptly is skipped rather than sent hours or days late.
    if (m.kind === 'confirmation' && m.status !== 'retrying' && Date.now() - Date.parse(m.created_at) > 3600e3) {
      run('UPDATE outbox SET status = ?, detail = ? WHERE id = ?', 'skipped', 'confirmation not sent promptly; skipped', m.id); continue;
    }
    if (await attempt(m)) sent++;
  }
  return sent;
}

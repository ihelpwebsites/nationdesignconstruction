// Staff authentication for /admin. scrypt password hashes, server-side sessions (hashed tokens), per-session
// CSRF token, login throttling with temporary lockout per IP and per email.
import crypto from 'node:crypto';
import { get, run, now, secret, sha256, audit } from './db.mjs';
import { HttpError, cookies, cookie, clientIp } from './http.mjs';
import { COOKIE_SECURE } from '../config.mjs';

const TTL_H = 12;
const COOKIE = COOKIE_SECURE ? '__Host-ndc_staff' : 'ndc_staff';
const MAX_FAILS = 8, WINDOW_MS = 15 * 60e3, LOCK_MS = 15 * 60e3;

export function hashPassword(pw) {
  if (typeof pw !== 'string' || pw.length < 12) throw new HttpError(400, 'Passwords must be at least 12 characters.');
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}
export function verifyPassword(pw, stored) {
  const [alg, s, k] = String(stored).split('$');
  if (alg !== 'scrypt' || !s || !k) return false;
  const key = crypto.scryptSync(String(pw), Buffer.from(s, 'base64'), 64, { N: 16384, r: 8, p: 1 });
  const want = Buffer.from(k, 'base64');
  return want.length === key.length && crypto.timingSafeEqual(key, want);
}
const DUMMY = hashPassword('dummy-password-for-timing');

function lockedOut(key) {
  const r = get('SELECT * FROM login_failures WHERE key = ?', key);
  return r?.locked_until && r.locked_until > now();
}
function recordFailure(key) {
  const r = get('SELECT * FROM login_failures WHERE key = ?', key);
  const t = Date.now();
  if (!r || t - Date.parse(r.first_at) > WINDOW_MS) { run('INSERT OR REPLACE INTO login_failures (key, count, first_at, locked_until) VALUES (?,?,?,NULL)', key, 1, new Date(t).toISOString()); return; }
  const n = r.count + 1;
  run('UPDATE login_failures SET count = ?, locked_until = ? WHERE key = ?', n, n >= MAX_FAILS ? new Date(t + LOCK_MS).toISOString() : null, key);
}

export function login(req, email, password) {
  const ipKey = `ip:${clientIp(req)}`, emKey = `em:${String(email || '').toLowerCase().slice(0, 160)}`;
  if (lockedOut(ipKey) || lockedOut(emKey)) throw new HttpError(429, 'Too many failed sign-in attempts. Please wait 15 minutes and try again.');
  const user = get('SELECT * FROM staff WHERE email = ? AND disabled = 0', String(email || '').toLowerCase().trim());
  const ok = verifyPassword(password || '', user?.pw_hash || DUMMY);
  if (!user || !ok) { recordFailure(ipKey); recordFailure(emKey); audit(`login:${String(email).slice(0, 80)}`, 'staff.login.failed'); throw new HttpError(401, 'Email or password is incorrect.'); }
  run('DELETE FROM login_failures WHERE key IN (?, ?)', ipKey, emKey);
  const token = secret(), csrf = secret();
  run('INSERT INTO sessions (token_hash, subject, csrf, created_at, expires_at) VALUES (?,?,?,?,?)', sha256(token), user.id, csrf, now(), new Date(Date.now() + TTL_H * 3600e3).toISOString());
  audit(user.id, 'staff.login');
  return cookie(COOKIE, token, { maxAge: TTL_H * 3600, secure: COOKIE_SECURE, path: '/' });
}
export function logout(req) {
  const token = cookies(req)[COOKIE];
  if (token) run('DELETE FROM sessions WHERE token_hash = ?', sha256(token));
  return cookie(COOKIE, '', { maxAge: 0, secure: COOKIE_SECURE, path: '/' });
}
/** Returns { user, session } or null. */
export function currentStaff(req) {
  const token = cookies(req)[COOKIE];
  if (!token) return null;
  const s = get('SELECT * FROM sessions WHERE token_hash = ?', sha256(token));
  if (!s || s.expires_at < now()) return null;
  const user = get('SELECT id, email, name FROM staff WHERE id = ? AND disabled = 0', s.subject);
  return user ? { user, session: s } : null;
}
export function checkCsrf(staff, token) {
  const a = Buffer.from(String(token || '')), b = Buffer.from(staff.session.csrf);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new HttpError(403, 'Session check failed. Reload the page and try again.');
}

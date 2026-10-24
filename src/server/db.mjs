// Storage: SQLite via Node's built-in node:sqlite (no packages). One file at $DATA_DIR/ndc.db.
// Private uploads live in $DATA_DIR/private/<random id> — outside any web root, served only to signed-in staff.
// Published photos live in $DATA_DIR/media/<id>.<ext> and are served publicly only while published.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(import.meta.dirname, '..', '..', 'data'));
export const PRIVATE_DIR = path.join(DATA_DIR, 'private');
export const MEDIA_DIR = path.join(DATA_DIR, 'media');
fs.mkdirSync(PRIVATE_DIR, { recursive: true });
fs.mkdirSync(MEDIA_DIR, { recursive: true });

export const db = new DatabaseSync(process.env.DB_FILE || path.join(DATA_DIR, 'ndc.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;');

db.exec(`
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT, updated_by TEXT);
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, pw_hash TEXT NOT NULL,
  disabled INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, subject TEXT NOT NULL, csrf TEXT NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS login_failures (key TEXT PRIMARY KEY, count INTEGER NOT NULL, first_at TEXT NOT NULL, locked_until TEXT);
CREATE TABLE IF NOT EXISTS services (
  slug TEXT PRIMARY KEY, availability TEXT NOT NULL, min_project INTEGER, pricing TEXT NOT NULL DEFAULT '{}',
  overrides TEXT NOT NULL DEFAULT '{}', updated_at TEXT, updated_by TEXT);
CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY, ref TEXT UNIQUE NOT NULL, status TEXT NOT NULL, market TEXT, project_type TEXT, service TEXT,
  location TEXT, readiness TEXT, plans TEXT, budget TEXT, timing TEXT, name TEXT NOT NULL, email TEXT NOT NULL,
  phone TEXT, description TEXT, extra TEXT, consent_contact INTEGER NOT NULL, consent_marketing INTEGER NOT NULL,
  below_minimum INTEGER NOT NULL DEFAULT 0, source_page TEXT, ip_hash TEXT, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS trade_applications (
  id TEXT PRIMARY KEY, ref TEXT UNIQUE NOT NULL, status TEXT NOT NULL, company TEXT NOT NULL, contact_name TEXT NOT NULL,
  email TEXT NOT NULL, phone TEXT NOT NULL, trades TEXT NOT NULL, counties TEXT NOT NULL, license_info TEXT,
  gl_status TEXT NOT NULL, wc_status TEXT NOT NULL, project_size TEXT, crew_capacity TEXT, availability TEXT,
  examples TEXT, approved_scope TEXT NOT NULL DEFAULT '{"services":[],"counties":[]}', notes TEXT,
  consent_marketing INTEGER NOT NULL DEFAULT 0, ip_hash TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS trade_documents (
  id TEXT PRIMARY KEY, application_id TEXT NOT NULL REFERENCES trade_applications(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, file_id TEXT REFERENCES files(id), expires_on TEXT, note TEXT, created_at TEXT NOT NULL, created_by TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS upload_links (
  token_hash TEXT PRIMARY KEY, application_id TEXT NOT NULL REFERENCES trade_applications(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL, used_count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, created_by TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY, owner_kind TEXT NOT NULL, owner_id TEXT NOT NULL, name TEXT NOT NULL, mime TEXT NOT NULL,
  size INTEGER NOT NULL, sha256 TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL, title TEXT NOT NULL, caption TEXT, alt TEXT NOT NULL, ext TEXT NOT NULL,
  width INTEGER, height INTEGER, rights TEXT NOT NULL, page TEXT, status TEXT NOT NULL, sort INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL, recipient TEXT, subject TEXT NOT NULL, body TEXT NOT NULL,
  status TEXT NOT NULL, detail TEXT, created_at TEXT NOT NULL, sent_at TEXT);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL,
  entity TEXT, entity_id TEXT, detail TEXT);
CREATE INDEX IF NOT EXISTS inquiries_created ON inquiries(created_at);
CREATE INDEX IF NOT EXISTS trades_created ON trade_applications(created_at);
CREATE INDEX IF NOT EXISTS files_owner ON files(owner_kind, owner_id);
`);

export const now = () => new Date().toISOString();
export const newId = (prefix, bytes = 9) => `${prefix}_${crypto.randomBytes(bytes).toString('base64url')}`;
export const secret = () => crypto.randomBytes(32).toString('base64url');
export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
export const J = (s, d = null) => { if (s == null) return d; try { return JSON.parse(s); } catch { return d; } };

export const get = (sql, ...a) => db.prepare(sql).get(...a);
export const all = (sql, ...a) => db.prepare(sql).all(...a);
export const run = (sql, ...a) => db.prepare(sql).run(...a);
export function tx(fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
}
export function audit(actor, action, entity = null, entityId = null, detail = null) {
  run('INSERT INTO audit (at, actor, action, entity, entity_id, detail) VALUES (?,?,?,?,?,?)', now(), String(actor), action, entity, entityId, detail == null ? null : JSON.stringify(detail));
}

// Human-friendly reference numbers (NDC-7K3QF2). Unambiguous alphabet.
const ALPHA = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export function makeRef(prefix) {
  const b = crypto.randomBytes(6);
  return `${prefix}-${[...b].map((x) => ALPHA[x % ALPHA.length]).join('')}`;
}

// ---- settings (business facts, notification inbox) ----------------------------------------------------
export function getSetting(key, fallback = null) {
  const r = get('SELECT value FROM settings WHERE key = ?', key);
  return r ? J(r.value, fallback) : fallback;
}
export function setSetting(key, value, by = 'system') {
  run('INSERT INTO settings (key, value, updated_at, updated_by) VALUES (?,?,?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by',
    key, JSON.stringify(value), now(), by);
}

// Restore drill: copies a backup made by tools/backup.mjs into a fresh, isolated data folder (never production),
// verifies row counts and every stored file's checksum, then boots the server on the restored copy and checks it
// serves pages and refuses unauthenticated access to records and files.
// Usage: node tools/restore-check.mjs <backupDir>
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';

const src = path.resolve(process.argv[2] || '');
const man = JSON.parse(fs.readFileSync(path.join(src, 'manifest.json'), 'utf8'));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ndc-restore-'));
fs.cpSync(src, dir, { recursive: true });

const db = new DatabaseSync(path.join(dir, 'ndc.db'));
assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok', 'database integrity');
for (const [t, n] of Object.entries(man.counts)) assert.equal(db.prepare(`SELECT COUNT(*) n FROM "${t}"`).get().n, n, `row count ${t}`);
for (const [rel, sum] of Object.entries(man.files)) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, rel))).digest('hex'), sum, rel);
// Every upload the database refers to is present and matches the checksum recorded at upload time.
const rows = db.prepare('SELECT id, sha256 FROM files').all();
for (const r of rows) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, 'private', r.id))).digest('hex'), r.sha256, `upload ${r.id}`);
db.close();

const port = 4689;
const p = spawn(process.execPath, [path.join(import.meta.dirname, '..', 'src/server/main.mjs'), String(port)], { env: { ...process.env, DATA_DIR: dir, SITE_ENV: 'development' }, stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let up = false; for (let i = 0; i < 50 && !up; i++) { try { up = (await fetch(`http://localhost:${port}/healthz`)).ok; } catch { await sleep(150); } }
  assert.ok(up, 'server boots on restored data');
  assert.equal((await fetch(`http://localhost:${port}/`)).status, 200);
  assert.equal((await fetch(`http://localhost:${port}/admin/inquiries/`, { redirect: 'manual' })).status, 303);
  if (rows[0]) assert.equal((await fetch(`http://localhost:${port}/admin/files/${rows[0].id}`, { redirect: 'manual' })).status, 303);
  console.log(`restore OK → ${dir}\n${JSON.stringify(man.counts)}\n${rows.length} uploads verified by checksum`);
} finally { p.kill(); }

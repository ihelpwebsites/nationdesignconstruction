// Consistent backup of the site's data: SQLite database (VACUUM INTO — safe while the server is running) plus the
// private uploads and published media folders, with a manifest of row counts and file checksums.
// Usage: node tools/backup.mjs [dataDir=./data] [outDir=../backups/ndc-<timestamp>]
// On Render: run it in the service Shell with dataDir=/var/data, then download the folder (or rely on the daily disk
// snapshots: Render → nationdc → Disks → Snapshots). Restoring a snapshot overwrites production — test restores with
// tools/restore-check.mjs on a copy instead.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const dataDir = path.resolve(process.argv[2] || 'data');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.resolve(process.argv[3] || path.join('..', 'backups', `ndc-${stamp}`));
fs.mkdirSync(out, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'ndc.db'));
db.exec(`VACUUM INTO '${path.join(out, 'ndc.db').replace(/'/g, "''")}'`);
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((r) => r.name);
const counts = Object.fromEntries(tables.map((t) => [t, db.prepare(`SELECT COUNT(*) n FROM "${t}"`).get().n]));
db.close();

const files = {};
for (const sub of ['private', 'media']) {
  const src = path.join(dataDir, sub);
  if (!fs.existsSync(src)) continue;
  fs.mkdirSync(path.join(out, sub), { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const buf = fs.readFileSync(path.join(src, name));
    fs.writeFileSync(path.join(out, sub, name), buf);
    files[`${sub}/${name}`] = crypto.createHash('sha256').update(buf).digest('hex');
  }
}
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({ createdAt: new Date().toISOString(), source: dataDir, counts, files }, null, 1));
console.log(`backup → ${out}\n${JSON.stringify(counts)}\n${Object.keys(files).length} files`);

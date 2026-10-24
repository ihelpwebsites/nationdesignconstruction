// Full-page screenshots via headless Edge, split into viewable crops (dev tool).
// Usage: node tools/shots.mjs <width> <height> <name>=<url> ...   → scratch/shots/<name>-<n>.png
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const [w, h, ...pairs] = process.argv.slice(2);
const out = join(import.meta.dirname, '..', 'scratch', 'shots');
mkdirSync(out, { recursive: true });
const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
for (const pair of pairs) {
  const i = pair.indexOf('='), name = pair.slice(0, i), url = pair.slice(i + 1);
  const full = join(out, `${name}-full.png`);
  if (existsSync(full)) rmSync(full);
  execFileSync(edge, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${join(tmpdir(), 'ndc-shots')}`, `--window-size=${w},${h}`, '--virtual-time-budget=6000', `--screenshot=${full}`, url], { stdio: 'ignore', timeout: 90000 });
  const chunk = Number(w) < 600 ? 1400 : 2000;
  for (let y = 0, n = 0; y < Number(h); y += chunk, n++) {
    try { execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', full, '-vf', `crop=${w}:${Math.min(chunk, h - y)}:0:${y},scale=${Math.min(900, w)}:-1`, join(out, `${name}-${n}.png`)]); } catch { break; }
  }
  console.log(name, 'done');
}

// Builds the responsive photo set in public/img: <file>-<width>.avif and .webp for every entry in src/data/images.mjs.
//  - Unsplash images: fetched from the Unsplash CDN in each format (encoded from the original, not re-compressed).
//  - Local sources (entry.source): encoded with ffmpeg (libaom AVIF, libwebp) from the supplied master.
// Skips files that already exist. Run: node --use-system-ca tools/fetch-images.mjs
import { writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMAGES, WIDTHS } from '../src/data/images.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'public/img');
mkdirSync(dir, { recursive: true });
const kb = (p) => Math.round(statSync(p).size / 1024);

for (const [key, img] of Object.entries(IMAGES)) {
  const base = img.file || key;
  for (const w of img.widths || WIDTHS) {
    const h = Math.round(w * 2 / 3);
    for (const fmt of ['webp', 'avif']) {
      const out = join(dir, `${base}-${w}.${fmt}`);
      if (existsSync(out)) continue;
      if (img.source) {
        const scale = `scale=${w}:${h}:flags=lanczos`;
        const args = fmt === 'webp'
          ? ['-y', '-loglevel', 'error', '-i', join(root, img.source), '-vf', scale, '-c:v', 'libwebp', '-quality', '86', '-compression_level', '6', out]
          : ['-y', '-loglevel', 'error', '-i', join(root, img.source), '-vf', `${scale},format=yuv420p`, '-c:v', 'libaom-av1', '-still-picture', '1', '-crf', '20', '-cpu-used', '3', out];
        execFileSync('ffmpeg', args);
      } else {
        const q = fmt === 'avif' ? (w >= 1200 ? 50 : 55) : (w >= 1200 ? 62 : 68);
        const url = `https://images.unsplash.com/photo-${img.photo}?w=${w}&h=${h}&fit=crop&crop=entropy&fm=${fmt}&q=${q}`;
        const r = await fetch(url);
        if (!r.ok) { console.error('FAIL', r.status, key, w, fmt); continue; }
        writeFileSync(out, Buffer.from(await r.arrayBuffer()));
      }
      console.log(`${base}-${w}.${fmt} ${kb(out)} KB`);
    }
  }
}

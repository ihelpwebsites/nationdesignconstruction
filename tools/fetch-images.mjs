// Downloads the licensed photos in src/data/images.mjs from the Unsplash CDN as WebP at each width.
// Run: node --use-system-ca tools/fetch-images.mjs   (skips files that already exist)
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMAGES, WIDTHS } from '../src/data/images.mjs';

const dir = join(dirname(fileURLToPath(import.meta.url)), '../public/img');
mkdirSync(dir, { recursive: true });
for (const [key, img] of Object.entries(IMAGES)) {
  for (const w of WIDTHS) {
    const out = join(dir, `${key}-${w}.webp`);
    if (existsSync(out)) continue;
    // 3:2 crop, WebP, quality tuned per size
    const q = w >= 1200 ? 62 : 68;
    const url = `https://images.unsplash.com/photo-${img.photo}?w=${w}&h=${Math.round(w * 2 / 3)}&fit=crop&crop=entropy&fm=webp&q=${q}`;
    const r = await fetch(url);
    if (!r.ok) { console.error('FAIL', r.status, key, w); continue; }
    const b = Buffer.from(await r.arrayBuffer());
    writeFileSync(out, b);
    console.log(`${key}-${w}.webp ${Math.round(b.length / 1024)} KB`);
  }
}

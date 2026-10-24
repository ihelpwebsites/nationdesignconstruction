// Downloads the self-hosted web fonts (OFL, via Fontsource on jsDelivr) into public/fonts and brand/src.
// Run with: node --use-system-ca tools/fetch-fonts.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
const base = 'https://cdn.jsdelivr.net/npm';
const files = [
  ['@fontsource/instrument-serif@5.2.8/files/instrument-serif-latin-400-normal.woff2', 'public/fonts/instrument-serif-400.woff2'],
  ['@fontsource/instrument-serif@5.2.8/files/instrument-serif-latin-400-italic.woff2', 'public/fonts/instrument-serif-400-italic.woff2'],
  ['@fontsource-variable/instrument-sans@5.2.8/files/instrument-sans-latin-wght-normal.woff2', 'public/fonts/instrument-sans-var.woff2'],
  ['@fontsource/instrument-sans@5.2.8/files/instrument-sans-latin-600-normal.woff', 'brand/src/instrument-sans-600.woff'],
  ['@fontsource/instrument-sans@5.2.8/files/instrument-sans-latin-500-normal.woff', 'brand/src/instrument-sans-500.woff'],
];
for (const [src, out] of files) {
  const r = await fetch(`${base}/${src}`);
  if (!r.ok) { console.error('FAIL', r.status, src); continue; }
  const b = Buffer.from(await r.arrayBuffer());
  writeFileSync(out, b); console.log(out, b.length);
}

// Cache-busting versions, computed from file contents at startup:
//   ASSET_VERSION — /css and /js        BRAND_VERSION — /brand (logo, icons, social card)
// Versioned URLs are cached for a year; any file change produces a new URL, so browsers never keep stale branding.
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const pub = join(import.meta.dirname, '..', '..', 'public');
const h = createHash('sha1');
for (const f of ['css/site.css', 'js/site.js', 'js/forms.js', 'css/admin.css']) { try { h.update(readFileSync(join(pub, f))); } catch { /* not yet built */ } }
export const ASSET_VERSION = h.digest('hex').slice(0, 10);

const b = createHash('sha1');
for (const f of readdirSync(join(pub, 'brand')).sort()) b.update(f).update(readFileSync(join(pub, 'brand', f)));
export const BRAND_VERSION = b.digest('hex').slice(0, 10);
/** URL for a file in public/brand with its version stamp. */
export const brand = (file) => `/brand/${file}?v=${BRAND_VERSION}`;

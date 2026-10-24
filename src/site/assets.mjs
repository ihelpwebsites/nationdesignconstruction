// Cache-busting version for /css and /js: a hash of the files' contents, computed at startup.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const pub = join(import.meta.dirname, '..', '..', 'public');
const h = createHash('sha1');
for (const f of ['css/site.css', 'js/site.js', 'js/forms.js', 'css/admin.css']) { try { h.update(readFileSync(join(pub, f))); } catch { /* not yet built */ } }
export const ASSET_VERSION = h.digest('hex').slice(0, 10);

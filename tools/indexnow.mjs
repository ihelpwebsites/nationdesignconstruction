// Notify IndexNow-participating search engines (Bing and others) about the site's URLs.
// The key file public/<key>.txt is public by design (it proves we control the site). Usage: node --use-system-ca tools/indexnow.mjs
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
const pub = join(import.meta.dirname, '..', 'public');
const key = readdirSync(pub).find((f) => /^[0-9a-f]{32}\.txt$/.test(f)).slice(0, 32);
const host = 'nationdesignconstruction.com';
const xml = await (await fetch(`https://${host}/sitemap.xml`)).text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const r = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList }),
});
console.log('IndexNow', r.status, r.statusText, `${urlList.length} URLs`);

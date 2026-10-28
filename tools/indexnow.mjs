// Notify IndexNow-participating search engines (Bing and others) about added, changed or removed URLs.
// The key file public/<key>.txt is public by design (it proves we control the site).
// Usage: node --use-system-ca tools/indexnow.mjs [--since YYYY-MM-DD | /path/ …]
//   no arguments      → every sitemap URL (first submission only — don't resend unchanged pages)
//   --since DATE      → sitemap URLs whose <lastmod> is on or after DATE (normal use after a deploy)
//   /path/ …          → just these paths (e.g. a removed page, which is no longer in the sitemap)
// A 200/202 response means the URLs were received (202 = key validation pending) — not that they're indexed.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
const pub = join(import.meta.dirname, '..', 'public');
const key = readdirSync(pub).find((f) => /^[0-9a-f]{32}\.txt$/.test(f)).slice(0, 32);
const host = 'nationdesignconstruction.com';
const args = process.argv.slice(2);
let urlList;
if (args[0] && args[0] !== '--since') urlList = args.map((p) => `https://${host}${p}`);
else {
  const xml = await (await fetch(`https://${host}/sitemap.xml`)).text();
  const rows = [...xml.matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)];
  urlList = rows.filter(([, , d]) => !args[1] || d >= args[1]).map(([, u]) => u);
}
if (!urlList.length) { console.log('IndexNow: nothing to submit'); process.exit(0); }
const r = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList }),
});
console.log('IndexNow', r.status, r.statusText, `${urlList.length} URLs`, urlList.map((u) => u.replace(`https://${host}`, '')).join(' '));

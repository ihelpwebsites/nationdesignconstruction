// Crawl inventory: BFS from the home page + every sitemap URL. One row per URL with status, indexability, canonical,
// title/description/H1, internal links, crawl depth, JSON-LD types (and parse errors), sitemap inclusion and lastmod.
// Usage: node --use-system-ca tools/crawl.mjs [baseUrl] [outName]   → docs/crawl/<outName>.csv + .json
import fs from 'node:fs';
import path from 'node:path';

const BASE = (process.argv[2] || 'https://nationdesignconstruction.com').replace(/\/$/, '');
const OUT = process.argv[3] || 'inventory';
const UA = 'NationSiteInventory/1.0 (+owner audit)';

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
const strip = (s) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const metaContent = (html, name) => { const m = html.match(new RegExp(`<meta[^>]+(?:name|property)="${name}"[^>]*content="([^"]*)"`, 'i')) || html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]*(?:name|property)="${name}"`, 'i')); return m ? decode(m[1]) : ''; };

async function fetchText(u) {
  const r = await fetch(u, { redirect: 'manual', headers: { 'user-agent': UA } });
  return { status: r.status, headers: r.headers, text: r.status === 200 ? await r.text() : '' };
}

const sm = await fetchText(BASE + '/sitemap.xml');
const sitemap = new Map([...sm.text.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod><\/url>/g)].map((m) => [m[1].replace(/^https?:\/\/[^/]+/, ''), m[2]]));

const rows = new Map();
const queue = [['/', 0]];
for (const p of sitemap.keys()) queue.push([p, null]);
const depth = new Map([['/', 0]]);
const inlinks = new Map();

while (queue.length) {
  const [p, d] = queue.shift();
  if (rows.has(p)) continue;
  const r = await fetchText(BASE + p);
  const html = r.text;
  const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const types = []; const ldErrors = [];
  for (const b of ldBlocks) {
    try {
      const walk = (o) => { if (Array.isArray(o)) return o.forEach(walk); if (o && typeof o === 'object') { if (o['@type']) types.push([].concat(o['@type']).join('+')); Object.values(o).forEach(walk); } };
      walk(JSON.parse(b));
    } catch (e) { ldErrors.push(e.message); }
  }
  const links = [...new Set([...html.matchAll(/<a\s[^>]*href="([^"#]*)(?:#[^"]*)?"/g)].map((m) => decode(m[1]))
    .filter((h) => h.startsWith('/') && !h.startsWith('//') || h.startsWith(BASE))
    .map((h) => h.replace(BASE, '').split('?')[0]).filter((h) => h && !/\.\w+$/.test(h)))];
  for (const l of links) {
    if (!inlinks.has(l)) inlinks.set(l, new Set());
    inlinks.get(l).add(p);
    const nd = (depth.get(p) ?? 99) + 1;
    if (!depth.has(l) || depth.get(l) > nd) depth.set(l, nd);
    if (!rows.has(l) && !l.startsWith('/admin')) queue.push([l, nd]);
  }
  const canon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || '';
  rows.set(p, {
    url: p, status: r.status, location: r.headers.get('location') || '',
    robotsMeta: metaContent(html, 'robots'), xRobots: r.headers.get('x-robots-tag') || '',
    canonical: canon.replace(BASE, ''), selfCanonical: canon === BASE + p,
    title: strip((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || ''), description: metaContent(html, 'description'),
    h1Count: (html.match(/<h1[\s>]/g) || []).length, h1: strip((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || ''),
    internalLinks: links.length, ldTypes: [...new Set(types)].join(' '), ldErrors: ldErrors.join('; '),
    inSitemap: sitemap.has(p), lastmod: sitemap.get(p) || '',
  });
}
for (const r of rows.values()) { r.depth = depth.get(r.url) ?? ''; r.inlinks = inlinks.get(r.url)?.size || 0; }

const list = [...rows.values()].sort((a, b) => a.url.localeCompare(b.url));
const dir = path.resolve(import.meta.dirname, '..', 'docs', 'crawl');
fs.mkdirSync(dir, { recursive: true });
const cols = ['url', 'status', 'location', 'robotsMeta', 'xRobots', 'canonical', 'selfCanonical', 'title', 'description', 'h1Count', 'h1', 'internalLinks', 'inlinks', 'depth', 'ldTypes', 'ldErrors', 'inSitemap', 'lastmod'];
const csv = [cols.join(','), ...list.map((r) => cols.map((c) => `"${String(r[c]).replace(/"/g, '""')}"`).join(','))].join('\n');
fs.writeFileSync(path.join(dir, `${OUT}.csv`), csv);
fs.writeFileSync(path.join(dir, `${OUT}.json`), JSON.stringify(list, null, 1));

// Summary
const ok = list.filter((r) => r.status === 200);
const indexableRows = ok.filter((r) => !/noindex/i.test(r.robotsMeta + r.xRobots));
const dup = (k) => { const m = new Map(); for (const r of indexableRows) m.set(r[k], (m.get(r[k]) || 0) + 1); return [...m].filter(([, n]) => n > 1); };
const count = (t) => ok.filter((r) => r.ldTypes.split(' ').includes(t)).length;
const s = {
  base: BASE, crawled: list.length, status: Object.fromEntries([...new Set(list.map((r) => r.status))].map((st) => [st, list.filter((r) => r.status === st).length])),
  sitemapUrls: sitemap.size, sitemapNot200: [...sitemap.keys()].filter((u) => rows.get(u)?.status !== 200),
  sitemapNoindex: [...sitemap.keys()].filter((u) => /noindex/i.test((rows.get(u)?.robotsMeta || '') + (rows.get(u)?.xRobots || ''))),
  sitemapBadCanonical: [...sitemap.keys()].filter((u) => !rows.get(u)?.selfCanonical),
  sitemapUnlinked: [...sitemap.keys()].filter((u) => u !== '/' && !(inlinks.get(u)?.size)),
  indexableNotInSitemap: indexableRows.filter((r) => !r.inSitemap).map((r) => r.url),
  maxDepth: Math.max(...ok.map((r) => Number(r.depth) || 0)),
  h1NotOne: ok.filter((r) => r.h1Count !== 1).map((r) => r.url),
  dupTitles: dup('title'), dupDescriptions: dup('description'), missingDescription: indexableRows.filter((r) => !r.description).map((r) => r.url),
  ldErrors: ok.filter((r) => r.ldErrors).map((r) => r.url),
  schema: { GeneralContractor: count('GeneralContractor'), WebSite: count('WebSite'), BreadcrumbList: count('BreadcrumbList'), FAQPage: count('FAQPage'), Service: count('Service') },
  lastmodDates: Object.fromEntries([...new Set([...sitemap.values()])].map((d) => [d, [...sitemap.values()].filter((x) => x === d).length])),
  non200: list.filter((r) => r.status !== 200).map((r) => `${r.url} ${r.status} ${r.location}`),
};
fs.writeFileSync(path.join(dir, `${OUT}-summary.json`), JSON.stringify(s, null, 1));
console.log(JSON.stringify(s, null, 1));

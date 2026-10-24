// End-to-end tests against real server processes (development + production modes) with throwaway data dirs.
// Usage: node tools/test.mjs [--base https://live-site]   (with --base: read-only checks against a deployed site)
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';

const ROOT = join(import.meta.dirname, '..');
const results = [];
let failed = 0;
async function test(name, fn) {
  try { await fn(); results.push(`  ok   ${name}`); }
  catch (e) { failed++; results.push(`  FAIL ${name}\n       ${String(e.message).split('\n').slice(0, 4).join('\n       ')}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function startServer(port, env) {
  const dir = mkdtempSync(join(tmpdir(), 'ndc-test-'));
  const p = spawn(process.execPath, [join(ROOT, 'src/server/main.mjs'), String(port)], { env: { ...process.env, DATA_DIR: dir, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; p.stdout.on('data', (d) => { log += d; }); p.stderr.on('data', (d) => { log += d; });
  return { p, dir, log: () => log, async ready() { for (let i = 0; i < 50; i++) { try { if ((await fetch(`http://localhost:${port}/healthz`)).ok) return; } catch { /* starting */ } await sleep(150); } throw new Error('server did not start\n' + log); } };
}

const ADMIN = { email: 'owner@example.test', password: 'test-password-1234' };
const DEV = 4611, PROD = 4612;
const dev = startServer(DEV, { SITE_ENV: 'development', FORM_RATE_PER_HOUR: '50', BOOTSTRAP_ADMIN_EMAIL: ADMIN.email, BOOTSTRAP_ADMIN_PASSWORD: ADMIN.password });
const prod = startServer(PROD, { SITE_ENV: 'production', SITE_URL: 'https://nationdesignconstruction.com' });
await Promise.all([dev.ready(), prod.ready()]);
const D = `http://localhost:${DEV}`, P = `http://localhost:${PROD}`;
const get = (u, o = {}) => fetch(u, { redirect: 'manual', ...o });
const text = async (u, o) => (await get(u, o)).text();

// ---------------------------------------------------------------- routes & pages
const PAGES = ['/', '/residential/', '/commercial/', '/services/', '/process/', '/about/', '/pricing/', '/design-inspiration/', '/start/', '/trade-partners/', '/privacy/',
  '/residential/custom-homes/', '/residential/additions/', '/residential/whole-home-renovations/', '/commercial/new-construction/', '/commercial/build-outs/', '/commercial/site-development/',
  '/services/design-preconstruction/', '/services/kitchen-renovation/', '/services/sinkhole-remediation/', '/services/roofing/', '/services/hauling-debris-removal/'];
await test('core pages return 200 with one h1, title, description, canonical', async () => {
  const titles = new Set();
  for (const p of PAGES) {
    const r = await get(P + p); assert.equal(r.status, 200, p);
    const h = await r.text();
    assert.equal((h.match(/<h1[\s>]/g) || []).length, 1, `${p}: h1 count`);
    const t = h.match(/<title>([^<]+)<\/title>/)[1]; assert.ok(!titles.has(t), `${p}: duplicate title ${t}`); titles.add(t);
    assert.match(h, /<meta name="description" content="[^"]{40,}">/, `${p}: description`);
    assert.ok(h.includes(`<link rel="canonical" href="https://nationdesignconstruction.com${p}">`), `${p}: canonical`);
  }
});
await test('every service and category page renders (75 services, 14 categories)', async () => {
  const sm = await text(P + '/services/');
  const links = [...new Set([...sm.matchAll(/href="(\/services\/[a-z0-9-]+\/)"/g)].map((m) => m[1]))];
  assert.ok(links.length >= 85, `only ${links.length} service links`);
  for (const l of links) { const r = await get(P + l); assert.equal(r.status, 200, l); await r.arrayBuffer(); }
});
await test('404 page is useful and returns 404', async () => {
  const r = await get(P + '/no-such-page/'); assert.equal(r.status, 404);
  const h = await r.text(); assert.match(h, /couldn’t find that page/); assert.match(h, /noindex/); assert.match(h, /href="\/services\/"/);
  assert.equal((await get(P + '/services/not-a-service/')).status, 404);
});
await test('clean URLs: trailing slash and lowercase redirects', async () => {
  let r = await get(P + '/about'); assert.equal(r.status, 301); assert.equal(r.headers.get('location'), '/about/');
  r = await get(P + '/About/'); assert.equal(r.status, 301); assert.equal(r.headers.get('location'), '/about/');
});

// ---------------------------------------------------------------- indexing / SEO
await test('production: indexable core pages, robots allows crawl, sitemap lists canonical URLs', async () => {
  const h = await text(P + '/'); assert.match(h, /<meta name="robots" content="index, follow/);
  assert.equal((await get(P + '/')).headers.get('x-robots-tag'), null);
  const robots = await text(P + '/robots.txt'); assert.match(robots, /Allow: \//); assert.match(robots, /Disallow: \/admin\//); assert.match(robots, /Sitemap: https:\/\/nationdesignconstruction.com\/sitemap.xml/);
  const sm = await text(P + '/sitemap.xml'); assert.match(sm, /<loc>https:\/\/nationdesignconstruction.com\/<\/loc>/); assert.ok(!sm.includes('localhost'));
  assert.ok(!sm.includes('/services/kitchen-renovation/'), 'preview services must not be in the sitemap');
  assert.ok(sm.includes('/services/design-preconstruction/'), 'category pages are in the sitemap');
});
await test('production: preview services are noindex; admin & brand pages are noindex', async () => {
  const r = await get(P + '/services/kitchen-renovation/'); assert.match(r.headers.get('x-robots-tag') || '', /noindex/); assert.match(await r.text(), /content="noindex, follow"/);
  assert.match(await text(P + '/brand/'), /noindex/);
  assert.match((await get(P + '/admin/login/')).headers.get('x-robots-tag'), /noindex/);
});
await test('development: everything noindex', async () => {
  const r = await get(D + '/'); assert.match(r.headers.get('x-robots-tag'), /noindex/); assert.match(await r.text(), /content="noindex, follow"/);
  assert.match(await text(D + '/robots.txt'), /noindex/);
});
await test('production: www → canonical host 301, http → https 301', async () => {
  let r = await get(P + '/about/?x=1', { headers: { 'x-forwarded-host': 'www.nationdesignconstruction.com' } }); assert.equal(r.status, 301); assert.equal(r.headers.get('location'), 'https://nationdesignconstruction.com/about/?x=1');
  r = await get(P + '/about/', { headers: { 'x-forwarded-host': 'nationdesignconstruction.com', 'x-forwarded-proto': 'http' } }); assert.equal(r.status, 301); assert.equal(r.headers.get('location'), 'https://nationdesignconstruction.com/about/');
});
await test('security headers present (CSP, HSTS in production, nosniff, frame deny)', async () => {
  const r = await get(P + '/'); const csp = r.headers.get('content-security-policy');
  assert.match(csp, /default-src 'self'/); assert.match(csp, /frame-ancestors 'none'/); assert.ok(!/script-src[^;]*unsafe-inline/.test(csp));
  assert.match(r.headers.get('strict-transport-security'), /max-age=31536000/); assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
});
await test('structured data is valid JSON and contains no invented facts', async () => {
  for (const p of ['/', '/services/kitchen-renovation/', '/residential/custom-homes/']) {
    const h = await text(P + p);
    const blocks = [...h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
    assert.ok(blocks.length >= 2, p);
    const s = JSON.stringify(blocks);
    for (const banned of ['aggregateRating', 'review', 'foundingDate', 'telephone', 'address', 'award', 'priceRange']) assert.ok(!s.includes(`"${banned}"`), `${p}: ${banned}`);
  }
});
await test('all internal links on core pages resolve (crawl)', async () => {
  const seen = new Set(), queue = ['/'], bad = [];
  while (queue.length && seen.size < 400) {
    const p = queue.shift(); if (seen.has(p)) continue; seen.add(p);
    const r = await get(P + p); const h = await r.text();
    if (r.status !== 200) { bad.push(`${p} → ${r.status}`); continue; }
    for (const m of h.matchAll(/href="(\/[^"#?]*)/g)) { const u = m[1]; if (!seen.has(u) && !/\.(svg|png|ico|css|js|webmanifest|xml|webp)$/.test(u) && !u.startsWith('/admin')) queue.push(u); }
  }
  assert.deepEqual(bad, []); assert.ok(seen.size > 100, `crawled ${seen.size}`);
});
await test('images have alt text; form fields have labels', async () => {
  for (const p of ['/', '/start/', '/trade-partners/', '/services/']) {
    const h = await text(P + p);
    for (const m of h.matchAll(/<img\b[^>]*>/g)) assert.match(m[0], /\salt="/, `${p}: ${m[0].slice(0, 80)}`);
    for (const m of h.matchAll(/<(input|select|textarea)\b[^>]*\bid="([^"]+)"/g)) assert.ok(h.includes(`for="${m[2]}"`), `${p}: no label for #${m[2]}`);
  }
});
await test('no placeholder prices, fake claims or lorem ipsum in rendered pages', async () => {
  for (const p of PAGES) {
    const h = (await text(P + p)).replace(/<script[\s\S]*?<\/script>/g, '');
    assert.ok(!/lorem ipsum|TODO|placeholder text|\$0\b|\$X|5-star|licensed and insured|fully licensed|years of experience|award-winning/i.test(h.replace(/placeholder="[^"]*"/g, '')), `${p}`);
  }
});

// ---------------------------------------------------------------- inquiry form
async function token(base, page = '/start/') { const h = await text(base + page); return h.match(/name="_t" value="([^"]+)"/)[1]; }
function inquiryForm(t, extra = {}) {
  const f = new FormData();
  const v = { _t: t, market: 'residential', project_type: 'Kitchen or bathroom', service: 'kitchen-renovation', location: 'Tampa 33602', readiness: 'plans', budget: '$75,000 – $150,000',
    timing: 'Within 3 months', name: 'Test Person', email: 'test@example.com', phone: '(813) 555-0100', description: 'Kitchen remodel with an island and new layout.', consent_contact: '1', ...extra };
  for (const [k, val] of Object.entries(v)) [].concat(val).forEach((x) => f.append(k, x));
  return f;
}
const post = (base, path, body, headers = {}) => fetch(base + path, { method: 'POST', body, headers: { accept: 'application/json', origin: base, ...headers } });

let inquiryRef;
await test('inquiry: too-fast submission is rejected (timing token)', async () => {
  const r = await post(D, '/api/inquiry', inquiryForm(await token(D))); assert.equal(r.status, 400); const j = await r.json(); assert.equal(j.ok, false);
});
const T1 = await token(D), T2 = await token(D), T3 = await token(D), T4 = await token(D), T5 = await token(D);
await sleep(2700);
await test('inquiry: validation errors are returned per field and nothing is saved', async () => {
  const r = await post(D, '/api/inquiry', inquiryForm(T1, { email: 'not-an-email', location: '', consent_contact: '' })); assert.equal(r.status, 422);
  const j = await r.json(); assert.ok(j.fields.email && j.fields.location && j.fields.consent_contact);
});
await test('inquiry: honeypot rejects bots', async () => {
  const r = await post(D, '/api/inquiry', inquiryForm(T2, { website: 'http://spam.example' })); assert.equal(r.status, 400);
});
await test('inquiry: unsupported upload type is rejected by content, not extension', async () => {
  const f = inquiryForm(T3); f.append('files', new Blob([Buffer.from('MZ\x90\x00 fake exe')], { type: 'application/pdf' }), 'plans.pdf');
  const r = await post(D, '/api/inquiry', f); assert.equal(r.status, 422); assert.match((await r.json()).fields.files, /supported file type/);
});
await test('inquiry: genuine submission with a PDF is saved and returns a reference', async () => {
  const f = inquiryForm(T4, { plans: ['Architectural drawings', 'Structural engineering'] });
  f.append('files', new Blob([Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF')], { type: 'application/pdf' }), 'floor-plan.pdf');
  const r = await post(D, '/api/inquiry', f); const j = await r.json();
  assert.equal(r.status, 200, JSON.stringify(j)); assert.equal(j.ok, true); assert.match(j.ref, /^NDC-[2-9A-Z]{6}$/); assert.equal(j.notified, false, 'no inbox configured → not notified');
  inquiryRef = j.ref;
  assert.equal(readdirSync(join(dev.dir, 'private')).length, 1, 'file stored in private storage');
});
await test('inquiry: cross-origin POST refused', async () => {
  const r = await post(D, '/api/inquiry', inquiryForm(T5), { origin: 'https://evil.example' }); assert.equal(r.status, 403);
});
await test('inquiry: no-JS submission gets a server-rendered confirmation page', async () => {
  await sleep(100);
  const f = inquiryForm(await token(D)); await sleep(2700);
  const r = await fetch(D + '/api/inquiry', { method: 'POST', body: f, headers: { origin: D } }); assert.equal(r.status, 200); assert.match(await r.text(), /we have your project details/);
});
await test('selected service carries into the form', async () => {
  const h = await text(D + '/start/?service=roofing&type=A+specific+service');
  assert.match(h, /Selected: <strong>Roof Installation, Replacement &amp; Repair<\/strong>/); assert.match(h, /<option value="roofing"[^>]*selected/);
});

// ---------------------------------------------------------------- admin & privacy
await test('admin: unauthenticated access redirects to sign-in; files and data are not public', async () => {
  let r = await get(D + '/admin/'); assert.equal(r.status, 303); assert.equal(r.headers.get('location'), '/admin/login/');
  r = await get(D + '/admin/inquiries/'); assert.equal(r.status, 303);
  const fid = readdirSync(join(dev.dir, 'private'))[0];
  r = await get(D + `/admin/files/${fid}`); assert.equal(r.status, 303);
  assert.equal((await fetch(D + `/private/${fid}`)).status, 404); assert.equal((await fetch(D + '/data/ndc.db')).status, 404);
});
let cookie = '', csrfTok = '';
await test('admin: wrong password refused; correct password signs in', async () => {
  let r = await fetch(D + '/admin/login/', { method: 'POST', redirect: 'manual', headers: { origin: D, 'content-type': 'application/x-www-form-urlencoded' }, body: `email=${ADMIN.email}&password=wrong-password-123` });
  assert.equal(r.status, 401);
  r = await fetch(D + '/admin/login/', { method: 'POST', redirect: 'manual', headers: { origin: D, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(ADMIN).toString() });
  assert.equal(r.status, 303); cookie = r.headers.get('set-cookie').split(';')[0]; assert.match(r.headers.get('set-cookie'), /HttpOnly/);
  const h = await text(D + '/admin/', { headers: { cookie } }); csrfTok = h.match(/name="_csrf" value="([^"]+)"/)[1];
  assert.match(h, /Email notifications are <strong>off<\/strong>/);
});
await test('admin: inquiry is listed with its attachment downloadable only when signed in', async () => {
  const h = await text(D + '/admin/inquiries/', { headers: { cookie } }); assert.ok(h.includes(inquiryRef));
  const id = h.match(new RegExp(`href="/admin/inquiries/(inq_[\\w-]+)/">${inquiryRef}<`))[1];
  const d = await text(D + `/admin/inquiries/${id}/`, { headers: { cookie } }); const fid = d.match(/href="\/admin\/files\/(file_[\w-]+)"/)[1];
  const r = await get(D + `/admin/files/${fid}`, { headers: { cookie } }); assert.equal(r.status, 200); assert.match(r.headers.get('content-disposition'), /attachment/);
  assert.match(Buffer.from(await r.arrayBuffer()).toString('latin1'), /^%PDF/);
});
const form = (o) => new URLSearchParams(o).toString();
const adminPost = (path, body, extraHeaders = {}) => fetch(D + path, { method: 'POST', redirect: 'manual', headers: { cookie, origin: D, 'content-type': 'application/x-www-form-urlencoded', ...extraHeaders }, body });
await test('admin: POST without CSRF token is refused', async () => {
  const r = await adminPost('/admin/services/roofing/', form({ availability: 'published' })); assert.equal(r.status, 403);
});
await test('pricing: incomplete published pricing is saved as draft and never shown', async () => {
  const r = await adminPost('/admin/services/roofing/', form({ _csrf: csrfTok, availability: 'published', status: 'published', basis: 'range', low: '9', unit: 'sqft' }));
  assert.equal(r.status, 303); assert.match(decodeURIComponent(r.headers.get('location')), /draft/);
  const h = await text(D + '/services/roofing/'); assert.ok(!/\$9/.test(h)); assert.match(h, /Pricing on request|Priced after an assessment/);
});
await test('pricing: complete reviewed pricing appears on the service page and pricing guide', async () => {
  await adminPost('/admin/services/roofing/', form({ _csrf: csrfTok, availability: 'published', status: 'published', basis: 'range', low: '9', high: '14', unit: 'sqft', reviewedOn: '2026-10-20', geography: 'Test county', min_project: '30000' }));
  const h = await text(D + '/services/roofing/'); assert.match(h, /\$9 – \$14/); assert.match(h, /reviewed October 20, 2026/); assert.match(h, /content="index|noindex/);
  assert.match(await text(D + '/pricing/'), /\$9 – \$14/);
});
await test('availability: hidden service returns 404 and leaves the directory', async () => {
  await adminPost('/admin/services/ev-charging/', form({ _csrf: csrfTok, availability: 'hidden', status: 'draft' }));
  assert.equal((await get(D + '/services/ev-charging/')).status, 404);
  assert.ok(!(await text(D + '/services/')).includes('/services/ev-charging/'));
});
await test('project minimum flags a below-minimum inquiry', async () => {
  const t = await token(D); await sleep(2700);
  const r = await post(D, '/api/inquiry', inquiryForm(t, { service: 'roofing', budget: 'Under $25,000' })); assert.equal(r.status, 200);
  const h = await text(D + '/admin/inquiries/', { headers: { cookie } }); assert.match(h, /below min/);
});

// ---------------------------------------------------------------- trade partners
let tradeId;
await test('trade application: saved, never auto-approved', async () => {
  const t = await token(D, '/trade-partners/'); await sleep(2700);
  const f = new FormData();
  for (const [k, v] of Object.entries({ _t: t, company: 'Test Tile Co', contact_name: 'Pat', email: 'pat@example.com', phone: '813-555-0101', gl_status: 'Active policy', wc_status: 'Active policy', project_size: '$10,000 – $50,000', crew_capacity: 'One crew of three', examples: 'Two bathrooms in 2026, portfolio at example.com', consent_contact: '1' })) f.append(k, v);
  f.append('trades', 'Tile'); f.append('counties', 'Hillsborough'); f.append('counties', 'Pinellas');
  const r = await post(D, '/api/trade-application', f); const j = await r.json(); assert.equal(r.status, 200, JSON.stringify(j)); assert.match(j.ref, /^TP-/);
  const h = await text(D + '/admin/trades/', { headers: { cookie } }); tradeId = h.match(/href="\/admin\/trades\/(trd_[\w-]+)\/"/)[1];
  assert.match(h, /b-new/);
});
await test('trade approval requires specific services and counties', async () => {
  let r = await adminPost(`/admin/trades/${tradeId}/`, form({ _csrf: csrfTok, action: 'review', status: 'approved' }));
  assert.match(decodeURIComponent(r.headers.get('location')), /needs at least one service/);
  r = await adminPost(`/admin/trades/${tradeId}/`, `${form({ _csrf: csrfTok, action: 'review', status: 'approved' })}&scope_services=tile&scope_counties=Hillsborough`);
  assert.match(decodeURIComponent(r.headers.get('location')), /Saved/);
  assert.match(await text(D + `/admin/trades/${tradeId}/`, { headers: { cookie } }), /b-approved/);
});
await test('trade documents: private upload link accepts files and tracks expiration', async () => {
  const r = await adminPost(`/admin/trades/${tradeId}/`, form({ _csrf: csrfTok, action: 'link' }));
  const link = new URL(r.headers.get('location'), D).searchParams.get('link'); assert.ok(link);
  assert.equal((await get(D + `/trade-partners/documents/${link}/`)).status, 200);
  const f = new FormData(); f.append('kind', 'General liability certificate'); f.append('expires_on', '2026-11-01');
  f.append('files', new Blob([Buffer.from('%PDF-1.4 coi')]), 'coi.pdf');
  const u = await post(D, `/api/trade-docs/${link}`, f); assert.equal(u.status, 200, await u.clone().text());
  const h = await text(D + `/admin/trades/${tradeId}/`, { headers: { cookie } }); assert.match(h, /General liability certificate/); assert.match(h, /November 1, 2026/);
  assert.equal((await post(D, '/api/trade-docs/not-a-real-token-123456789', new FormData())).status, 404);
});

// ---------------------------------------------------------------- photos & facts
await test('business facts appear only when verified', async () => {
  await adminPost('/admin/settings/', form({ _csrf: csrfTok, action: 'facts', phone: '(813) 555-0199' }));
  assert.ok(!(await text(D + '/')).includes('555-0199'));
  await adminPost('/admin/settings/', form({ _csrf: csrfTok, action: 'facts', phone: '(813) 555-0199', phone_verified: '1' }));
  assert.ok((await text(D + '/')).includes('555-0199'));
});
await test('photos: drafts are private; published photos are served', async () => {
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082', 'hex');
  const f = new FormData(); for (const [k, v] of Object.entries({ _csrf: csrfTok, action: 'upload', kind: 'project', title: 'Test project', alt: 'A test image', rights: '1' })) f.append(k, v);
  f.append('file', new Blob([png]), 'x.png');
  let r = await fetch(D + '/admin/photos/', { method: 'POST', redirect: 'manual', headers: { cookie, origin: D }, body: f }); assert.equal(r.status, 303);
  const h = await text(D + '/admin/photos/', { headers: { cookie } }); const id = h.match(/preview\/(ph_[\w-]+)/)[1];
  assert.equal((await get(D + `/media/${id}.png`)).status, 404, 'draft must not be public');
  await adminPost('/admin/photos/', form({ _csrf: csrfTok, id, action: 'publish' }));
  assert.equal((await get(D + `/media/${id}.png`)).status, 200);
  assert.match(await text(D + '/'), /Recent work/);
});
await test('admin login is throttled after repeated failures', async () => {
  let last;
  for (let i = 0; i < 9; i++) last = await fetch(D + '/admin/login/', { method: 'POST', redirect: 'manual', headers: { origin: D, 'content-type': 'application/x-www-form-urlencoded' }, body: 'email=nobody@example.com&password=wrong-password-xx' });
  assert.equal(last.status, 429);
});

dev.p.kill(); prod.p.kill();
await sleep(300);
for (const s of [dev, prod]) { try { rmSync(s.dir, { recursive: true, force: true }); } catch { /* windows file lock */ } }
console.log(results.join('\n'));
console.log(`\n${results.length - failed}/${results.length} passed`);
if (failed) { console.log('\n--- dev log ---\n' + dev.log().slice(-1500)); process.exit(1); }

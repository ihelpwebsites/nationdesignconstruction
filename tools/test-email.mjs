// Email path test: runs the server against a local stand-in for the Resend API and checks exactly what would be sent.
// Usage: node tools/test-email.mjs
import { spawn } from 'node:child_process';
import http from 'node:http';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';

const ROOT = join(import.meta.dirname, '..');
const sent = [];
let failNext = 0;
const mock = http.createServer((req, res) => {
  let b = ''; req.on('data', (c) => { b += c; });
  req.on('end', () => {
    if (failNext > 0) { failNext--; res.writeHead(500).end('{"message":"temporary"}'); return; }
    sent.push({ auth: req.headers.authorization, idem: req.headers['idempotency-key'], ...JSON.parse(b) });
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ id: `mock_${sent.length}` }));
  });
}).listen(4699);

const PORT = 4698, B = `http://localhost:${PORT}`;
const p = spawn(process.execPath, [join(ROOT, 'src/server/main.mjs'), String(PORT)], {
  env: { ...process.env, DATA_DIR: mkdtempSync(join(tmpdir(), 'ndc-mail-')), SITE_ENV: 'development', RESEND_API_KEY: 're_test_dummy', RESEND_API_URL: 'http://localhost:4699/emails', FORM_RATE_PER_HOUR: '50' },
  stdio: 'ignore',
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 50; i++) { try { if ((await fetch(B + '/healthz')).ok) break; } catch { /* starting */ } await sleep(150); }

async function submit(fields) {
  const h = await (await fetch(B + '/start/')).text();
  const t = h.match(/name="_t" value="([^"]+)"/)[1], k = h.match(/name="_idem" value="([^"]+)"/)[1];
  await sleep(2700);
  const f = new FormData();
  for (const [a, v] of Object.entries({ _t: t, _idem: k, market: 'residential', project_type: 'Kitchen or bathroom', location: 'Tampa 33602', readiness: 'unsure', budget: 'Not sure yet', timing: 'Not sure yet', name: 'Pat Customer', email: 'pat.customer@gmail.com', phone: '(813) 555-0100', description: 'Kitchen remodel, new island.', consent_contact: '1', ...fields })) f.append(a, v);
  return (await fetch(B + '/api/inquiry', { method: 'POST', body: f, headers: { accept: 'application/json', origin: B } })).json();
}

let ok = 0;
const check = async (name, fn) => { try { await fn(); ok++; console.log('  ok  ', name); } catch (e) { console.log('  FAIL', name, '\n      ', e.message.split('\n').filter(Boolean).slice(0, 5).join(' ')); process.exitCode = 1; } };

await check('genuine inquiry → notification to hello@ (Reply-To customer) + confirmation to customer (Reply-To hello@)', async () => {
  const r = await submit({}); assert.equal(r.ok, true); await sleep(800);
  const n = sent.find((m) => m.subject.includes(r.ref) && m.subject.startsWith('New inquiry'));
  const c = sent.find((m) => m.subject.includes(r.ref) && m.subject.startsWith('We received'));
  assert.ok(n && c, 'both messages sent');
  assert.deepEqual(n.to, ['hello@nationdesignconstruction.com']); assert.equal(n.reply_to, 'pat.customer@gmail.com');
  assert.equal(n.from, 'Nation Design & Construction <notify@notify.nationdesignconstruction.com>');
  assert.deepEqual(c.to, ['pat.customer@gmail.com']); assert.equal(c.reply_to, 'hello@nationdesignconstruction.com'); assert.equal(c.from, n.from);
  assert.ok(!c.text.includes('Budget') && !c.text.includes('/admin/'), 'confirmation contains no internal details');
  assert.equal(n.auth, 'Bearer re_test_dummy');
});
await check('test submissions notify the inbox but never email the (example.com) address', async () => {
  const before = sent.length; const r = await submit({ name: 'Website Test Mail', email: 'audit@example.com' }); await sleep(800);
  const mine = sent.slice(before);
  assert.ok(mine.some((m) => m.subject.startsWith('[TEST] New inquiry') && m.subject.includes(r.ref)));
  assert.ok(!mine.some((m) => (m.to || []).includes('audit@example.com')));
});
await check('provider failure keeps the lead and retries the notification', async () => {
  failNext = 2; const before = sent.length;
  const r = await submit({ name: 'Website Test Retry', email: 'retry@example.com' }); assert.equal(r.ok, true, 'lead accepted even though email failed');
  await sleep(800); assert.ok(!sent.slice(before).some((m) => m.subject.includes(r.ref)), 'first attempt failed as arranged');
});
await check('a retried inquiry (same submission key) sends no second notification or confirmation', async () => {
  failNext = 0;
  const h = await (await fetch(B + '/start/')).text();
  const t = h.match(/name="_t" value="([^"]+)"/)[1], k = h.match(/name="_idem" value="([^"]+)"/)[1];
  await sleep(2700);
  const body = () => { const f = new FormData(); for (const [a, v] of Object.entries({ _t: t, _idem: k, market: 'commercial', project_type: 'Build-out or tenant improvement', location: 'Tampa 33602', readiness: 'plans', budget: 'Not sure yet', timing: 'Not sure yet', name: 'Sam Retry', email: 'sam.retry@gmail.com', phone: '(813) 555-0102', description: 'Office build-out, 3,000 sq ft.', consent_contact: '1' })) f.append(a, v); return f; };
  const one = await (await fetch(B + '/api/inquiry', { method: 'POST', body: body(), headers: { accept: 'application/json', origin: B } })).json();
  const two = await (await fetch(B + '/api/inquiry', { method: 'POST', body: body(), headers: { accept: 'application/json', origin: B } })).json();
  assert.equal(one.ok, true, JSON.stringify(one)); assert.equal(two.ref, one.ref); assert.equal(two.duplicate, true); await sleep(800);
  const got = sent.filter((m) => m.subject.includes(one.ref)).map((m) => m.subject.slice(0, 14)); assert.equal(got.length, 2, 'exactly one notification + one confirmation: ' + got.join(' | '));
});
await check('trade application → hello@ gets every answer (Reply-To applicant); applicant gets a confirmation', async () => {
  const h = await (await fetch(B + '/trade-partners/')).text();
  const t = h.match(/name="_t" value="([^"]+)"/)[1]; await sleep(2700);
  const f = new FormData();
  for (const [a, v] of Object.entries({ _t: t, company: 'Bayside Tile LLC', contact_name: 'Lee Partner', email: 'lee.partner@gmail.com', phone: '813-555-0103', license_info: 'Contractor license on file (test)', gl_status: 'Active policy', wc_status: 'Active policy', project_size: '$10,000 – $50,000', crew_capacity: 'Two crews of three', availability: 'From next month', examples: 'Two bathroom remodels in 2026; references on request.', consent_contact: '1' })) f.append(a, v);
  f.append('trades', 'Tile'); f.append('counties', 'Hillsborough');
  const r = await (await fetch(B + '/api/trade-application', { method: 'POST', body: f, headers: { accept: 'application/json', origin: B } })).json();
  assert.equal(r.ok, true); await sleep(800);
  const n = sent.find((m) => m.subject.startsWith('Trade partner application') && m.subject.includes(r.ref));
  assert.ok(n, 'notification sent'); assert.deepEqual(n.to, ['hello@nationdesignconstruction.com']); assert.equal(n.reply_to, 'lee.partner@gmail.com');
  for (const s of ['Bayside Tile LLC', 'Lee Partner', '813-555-0103', 'Tile', 'Hillsborough', 'Contractor license on file', 'General liability: Active policy', 'Two crews of three', 'From next month', 'Two bathroom remodels']) assert.ok(n.text.includes(s), `missing ${s}`);
  const c = sent.find((m) => (m.to || []).includes('lee.partner@gmail.com')); assert.ok(c, 'confirmation sent: ' + sent.slice(-3).map((m) => m.subject).join(' | ')); assert.equal(c.reply_to, 'hello@nationdesignconstruction.com');
});
p.kill();

// ---- Backlog: notifications created while email was off (any age) are listed and can be replayed by staff ----
await check('backlog: old unsent staff notifications replay from admin; tests left out; confirmations never sent late', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ndc-mail-bl-'));
  const PORT2 = 4697, B2 = `http://localhost:${PORT2}`;
  const start = (env) => { const c = spawn(process.execPath, [join(ROOT, 'src/server/main.mjs'), String(PORT2)], { env: { ...process.env, DATA_DIR: dir, SITE_ENV: 'development', FORM_RATE_PER_HOUR: '50', RESEND_API_URL: 'http://localhost:4699/emails', BOOTSTRAP_ADMIN_EMAIL: 'owner@example.test', BOOTSTRAP_ADMIN_PASSWORD: 'test-password-1234', ...env }, stdio: 'ignore' }); return c; };
  const up = async () => { for (let i = 0; i < 60; i++) { try { if ((await fetch(B2 + '/healthz')).ok) return; } catch { /* starting */ } await sleep(150); } throw new Error('no server'); };
  let s = start({ RESEND_API_KEY: '' }); await up();
  const sub = async (fields) => {
    const h = await (await fetch(B2 + '/start/')).text(); const t = h.match(/name="_t" value="([^"]+)"/)[1], k = h.match(/name="_idem" value="([^"]+)"/)[1]; await sleep(2700);
    const f = new FormData(); for (const [a, v] of Object.entries({ _t: t, _idem: k, market: 'residential', project_type: 'Kitchen or bathroom', location: 'Tampa 33602', readiness: 'unsure', budget: 'Not sure yet', timing: 'Not sure yet', phone: '(813) 555-0104', description: 'Bathroom remodel.', consent_contact: '1', ...fields })) f.append(a, v);
    return (await fetch(B2 + '/api/inquiry', { method: 'POST', body: f, headers: { accept: 'application/json', origin: B2 } })).json();
  };
  const real = await sub({ name: 'Robin Backlog', email: 'robin.backlog@gmail.com' });
  const testRec = await sub({ name: 'Website Test Backlog', email: 'bl@example.com' });
  s.kill(); await sleep(400);
  // Age the backlog by ten days (beyond the automatic three-day window).
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(join(dir, 'ndc.db')); db.prepare('UPDATE outbox SET created_at = ?').run(new Date(Date.now() - 10 * 864e5).toISOString()); db.close();
  const before = sent.length;
  s = start({ RESEND_API_KEY: 're_test_dummy' }); await up(); await sleep(1500);
  assert.equal(sent.length, before, 'nothing older than 3 days is sent automatically');
  const lr = await fetch(B2 + '/admin/login/', { method: 'POST', redirect: 'manual', headers: { origin: B2, 'content-type': 'application/x-www-form-urlencoded' }, body: 'email=owner%40example.test&password=test-password-1234' });
  const cookie = lr.headers.get('set-cookie').split(';')[0];
  const dash = await (await fetch(B2 + '/admin/', { headers: { cookie } })).text();
  assert.match(dash, /2 staff notifications not delivered<\/strong> \(1 about real submissions, 1 about test records\)/);
  assert.match(dash, new RegExp(`1 customer confirmation not sent.*${real.ref}`));
  const csrf = dash.match(/name="_csrf" value="([^"]+)"/)[1];
  const rr = await fetch(B2 + '/admin/email/', { method: 'POST', redirect: 'manual', headers: { cookie, origin: B2, 'content-type': 'application/x-www-form-urlencoded' }, body: `_csrf=${encodeURIComponent(csrf)}` });
  assert.equal(rr.status, 303); assert.match(decodeURIComponent(rr.headers.get('location')), /Sent 1, failed 0, test records left out 1/);
  const mine = sent.slice(before);
  assert.equal(mine.length, 1); assert.ok(mine[0].subject.includes(real.ref)); assert.deepEqual(mine[0].to, ['hello@nationdesignconstruction.com']); assert.equal(mine[0].reply_to, 'robin.backlog@gmail.com');
  assert.ok(!mine.some((m) => (m.to || []).includes('robin.backlog@gmail.com')), 'late confirmation never sent');
  assert.ok(!mine.some((m) => m.subject.includes(testRec.ref)));
  s.kill();
});
console.log(`${ok}/6 email checks passed`);
mock.close();

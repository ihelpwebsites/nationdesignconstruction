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
const check = async (name, fn) => { try { await fn(); ok++; console.log('  ok  ', name); } catch (e) { console.log('  FAIL', name, '\n      ', e.message.split('\n')[0]); process.exitCode = 1; } };

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
console.log(`${ok}/3 email checks passed`);
p.kill(); mock.close();

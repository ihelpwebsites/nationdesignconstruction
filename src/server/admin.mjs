// Protected management area (/admin). Server-rendered HTML forms, no client framework.
// Every route except /admin/login requires a staff session; every POST requires same-origin + the session CSRF token.
import fs from 'node:fs';
import path from 'node:path';
import { HttpError, readForm, checkOrigin, sniff, rateLimit, clientIp } from './http.mjs';
import { get, all, run, now, newId, audit, tx, J, getSetting, setSetting, PRIVATE_DIR, MEDIA_DIR } from './db.mjs';
import { login, logout, currentStaff, checkCsrf, hashPassword, verifyPassword } from './auth.mjs';
import { service, services, updateService, rawService, AVAILABILITY, invalidate, categories } from './services.mjs';
import { createUploadLink, DOC_KINDS, storeFiles } from './forms.mjs';
import { emailReady, notificationInbox } from './email.mjs';
import { FACT_FIELDS } from '../data/business.mjs';
import { TRADE_STATUSES, TRADE_STATUS_LABEL, INQUIRY_STATUSES, INQUIRY_STATUS_LABEL } from '../data/trades.mjs';
import { FL_COUNTIES } from '../data/counties.mjs';
import { CATEGORIES, SERVICES } from '../data/catalog.mjs';
import { esc, attr, list, fmtDateTime, fmtDate, money, UNIT_NAME } from '../site/html.mjs';
import { EMAIL, SITE_URL, UPLOAD } from '../config.mjs';
import { ASSET_VERSION } from '../site/assets.mjs';
import { PHOTO_KINDS } from './photos.mjs';

const one = (v) => (Array.isArray(v) ? v[0] : v) ?? '';
const many = (v) => (v == null ? [] : [].concat(v));
const str = (v, max = 500) => String(one(v)).trim().slice(0, max);
const intOrNull = (v) => { const s = String(one(v)).replace(/[$,\s]/g, ''); if (!s) return null; const n = Math.round(Number(s)); if (!Number.isFinite(n) || n < 0) throw new HttpError(400, `“${one(v)}” is not a valid amount.`); return n; };

function page(res, title, body, staff, { status = 200, headers = {} } = {}) {
  const nav = staff ? `<nav class="a-nav" aria-label="Admin"><a href="/admin/">Dashboard</a><a href="/admin/inquiries/">Inquiries</a><a href="/admin/trades/">Trade partners</a><a href="/admin/services/">Services &amp; pricing</a><a href="/admin/photos/">Photos</a><a href="/admin/settings/">Business details</a>
    <form method="post" action="/admin/logout"><input type="hidden" name="_csrf" value="${attr(staff.session.csrf)}"><button class="linkbtn">Sign out</button></form></nav>` : '';
  res.writeHead(status, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...headers });
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} · Admin · Nation Design &amp; Construction</title><link rel="icon" href="/brand/favicon.svg"><link rel="stylesheet" href="/css/site.css?v=${ASSET_VERSION}"><link rel="stylesheet" href="/css/admin.css?v=${ASSET_VERSION}"></head>
<body class="admin"><header class="a-head"><a href="/admin/" class="a-brand"><img src="/brand/nation-logo-ivory-tight.svg" alt="Nation Design &amp; Construction" height="36" width="159"><span>Admin</span></a>${nav}</header>
<main class="a-main" id="main">${body}</main></body></html>`);
}
const csrf = (staff) => `<input type="hidden" name="_csrf" value="${attr(staff.session.csrf)}">`;
const flash = (url) => { const m = url.searchParams.get('msg'); return m ? `<div class="alert ok" role="status">${esc(m)}</div>` : ''; };
const back = (res, to, msg) => { res.writeHead(303, { location: to + (msg ? (to.includes('?') ? '&' : '?') + 'msg=' + encodeURIComponent(msg) : '') }); res.end(); };
const badge = (s, labels) => `<span class="badge b-${attr(s)}">${esc(labels[s] || s)}</span>`;

async function postForm(req, staff, limit = 64e3) {
  checkOrigin(req);
  const form = await readForm(req, limit);
  checkCsrf(staff, one(form.fields._csrf));
  return form;
}

// ---- image dimensions (JPEG / PNG / WebP) for published photos ----
function dims(buf, mime) {
  try {
    if (mime === 'image/png') return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
    if (mime === 'image/webp') {
      const k = buf.toString('latin1', 12, 16);
      if (k === 'VP8X') return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
      if (k === 'VP8 ') return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
      if (k === 'VP8L') { const b = buf.readUInt32LE(21); return [1 + (b & 0x3fff), 1 + ((b >> 14) & 0x3fff)]; }
    }
    if (mime === 'image/jpeg') {
      let i = 2;
      while (i < buf.length) {
        if (buf[i] !== 0xff) { i++; continue; }
        const m = buf[i + 1], len = buf.readUInt16BE(i + 2);
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
        i += 2 + len;
      }
    }
  } catch { /* fall through */ }
  return [null, null];
}

// =========================================================================================================
export async function handleAdmin(req, res, url) {
  const p = url.pathname.endsWith('/') ? url.pathname : url.pathname + '/';

  // ---- login ----
  if (p === '/admin/login/') {
    if (req.method === 'POST') {
      checkOrigin(req);
      rateLimit(`adminlogin:${clientIp(req)}`, 30, 15 * 60e3);
      const { fields } = await readForm(req, 8e3);
      try {
        const setCookie = login(req, str(fields.email, 160), String(one(fields.password)).slice(0, 200));
        res.writeHead(303, { location: '/admin/', 'set-cookie': setCookie }); res.end(); return;
      } catch (e) {
        if (!(e instanceof HttpError)) throw e;
        return page(res, 'Sign in', loginForm(e.message, str(fields.email, 160)), null, { status: e.status });
      }
    }
    return page(res, 'Sign in', loginForm(), null);
  }
  const staff = currentStaff(req);
  if (!staff) { if (req.method === 'GET') return back(res, '/admin/login/'); throw new HttpError(401, 'Please sign in.'); }
  if (p === '/admin/logout/' && req.method === 'POST') { await postForm(req, staff); res.writeHead(303, { location: '/admin/login/', 'set-cookie': logout(req) }); res.end(); return; }

  let m;
  if (p === '/admin/') return dashboard(res, staff, url);
  if (p === '/admin/inquiries/') return inquiries(res, staff, url);
  if ((m = p.match(/^\/admin\/inquiries\/(inq_[\w-]+)\/$/))) return req.method === 'POST' ? inquiryUpdate(req, res, staff, m[1]) : inquiry(res, staff, url, m[1]);
  if (p === '/admin/inquiries.csv/') return inquiriesCsv(res, staff);
  if ((m = p.match(/^\/admin\/files\/(file_[\w-]+)\/?$/))) return fileDownload(res, staff, m[1]);
  if (p === '/admin/trades/') return trades(res, staff, url);
  if ((m = p.match(/^\/admin\/trades\/(trd_[\w-]+)\/$/))) return req.method === 'POST' ? tradeUpdate(req, res, staff, m[1]) : trade(res, staff, url, m[1]);
  if (p === '/admin/services/') return req.method === 'POST' ? servicesBulk(req, res, staff) : servicesList(res, staff, url);
  if ((m = p.match(/^\/admin\/services\/([a-z0-9-]+)\/$/))) return req.method === 'POST' ? serviceSave(req, res, staff, m[1]) : serviceEdit(res, staff, url, m[1]);
  if ((m = url.pathname.match(/^\/admin\/photos\/preview\/(ph_[\w-]+)$/))) return photoPreview(res, m[1]);
  if (p === '/admin/photos/') return req.method === 'POST' ? photoPost(req, res, staff) : photos(res, staff, url);
  if (p === '/admin/settings/') return req.method === 'POST' ? settingsSave(req, res, staff) : settings(res, staff, url);
  throw new HttpError(404, 'Not found');
}

function loginForm(error = '', email = '') {
  return `<section class="a-login"><h1 class="h2">Sign in</h1>
  ${error ? `<div class="alert err" role="alert">${esc(error)}</div>` : ''}
  <form class="form" method="post" action="/admin/login/">
    <div class="field"><label for="l-email">Email</label><input id="l-email" name="email" type="email" autocomplete="username" required value="${attr(email)}"></div>
    <div class="field"><label for="l-pw">Password</label><input id="l-pw" name="password" type="password" autocomplete="current-password" required></div>
    <button class="btn" type="submit">Sign in</button></form></section>`;
}

// ---- dashboard ----
function dashboard(res, staff, url) {
  const counts = Object.fromEntries(all('SELECT status, COUNT(*) n FROM inquiries GROUP BY status').map((r) => [r.status, r.n]));
  const tcounts = Object.fromEntries(all('SELECT status, COUNT(*) n FROM trade_applications GROUP BY status').map((r) => [r.status, r.n]));
  const recent = all('SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 8');
  const expiring = all(`SELECT d.*, t.company, t.id app FROM trade_documents d JOIN trade_applications t ON t.id = d.application_id
    WHERE d.expires_on IS NOT NULL AND d.expires_on <= date('now', '+30 day') AND t.status != 'inactive' ORDER BY d.expires_on LIMIT 10`);
  const failed = all("SELECT * FROM outbox WHERE status IN ('failed','not_configured') ORDER BY created_at DESC LIMIT 5");
  const svc = services({ includeHidden: true });
  const pub = svc.filter((s) => s.availability === 'published').length;
  const priced = svc.filter((s) => s.price).length;
  const warn = [];
  if (!emailReady()) warn.push(`Email notifications are <strong>off</strong>: ${!EMAIL.provider ? 'no email provider is configured (RESEND_API_KEY)' : !EMAIL.from ? 'EMAIL_FROM is not set' : 'no verified notification inbox is set'}. New submissions are saved here; check this page regularly. <a href="/admin/settings/">Business details</a>`);
  if (!getSetting('business', {}).license?.verified) warn.push('No verified contractor license number is shown on the site. Florida generally requires it in advertising — add it under <a href="/admin/settings/">Business details</a> once confirmed.');
  page(res, 'Dashboard', `${flash(url)}<h1 class="h2">Dashboard</h1>
  ${list(warn, (w) => `<div class="alert info mt-2">${w}</div>`)}
  <div class="a-stats">
    <a href="/admin/inquiries/?status=new"><strong>${counts.new || 0}</strong><span>New inquiries</span></a>
    <a href="/admin/inquiries/"><strong>${Object.values(counts).reduce((a, b) => a + b, 0)}</strong><span>All inquiries</span></a>
    <a href="/admin/trades/?status=new"><strong>${tcounts.new || 0}</strong><span>New trade applications</span></a>
    <a href="/admin/services/"><strong>${pub}/${svc.length}</strong><span>Services published</span></a>
    <a href="/admin/services/"><strong>${priced}</strong><span>Services with public pricing</span></a>
  </div>
  <h2 class="h3 mt-4">Recent inquiries</h2>${inquiryTable(recent)}
  ${expiring.length ? `<h2 class="h3 mt-4">Trade documents expiring within 30 days</h2><table class="a-table"><thead><tr><th>Partner</th><th>Document</th><th>Expires</th></tr></thead><tbody>${list(expiring, (d) => `<tr><td><a href="/admin/trades/${d.app}/">${esc(d.company)}</a></td><td>${esc(d.kind)}</td><td>${esc(fmtDate(d.expires_on))}</td></tr>`)}</tbody></table>` : ''}
  ${failed.length ? `<h2 class="h3 mt-4">Notifications not delivered</h2><table class="a-table"><thead><tr><th>When</th><th>Subject</th><th>Status</th></tr></thead><tbody>${list(failed, (o) => `<tr><td>${esc(fmtDateTime(o.created_at))}</td><td>${esc(o.subject)}</td><td>${esc(o.status)} — ${esc(o.detail || '')}</td></tr>`)}</tbody></table>` : ''}`, staff);
}

// ---- inquiries ----
function inquiryTable(rows) {
  if (!rows.length) return '<p class="muted">Nothing yet.</p>';
  return `<div class="a-scroll"><table class="a-table"><thead><tr><th>Received</th><th>Ref</th><th>Name</th><th>Project</th><th>Location</th><th>Budget</th><th>Status</th></tr></thead><tbody>
  ${list(rows, (r) => `<tr><td>${esc(fmtDateTime(r.created_at))}</td><td><a href="/admin/inquiries/${r.id}/">${esc(r.ref)}</a></td><td>${esc(r.name)}</td><td>${esc(r.market)} · ${esc(r.project_type)}${r.service ? ` · ${esc(service(r.service)?.name || r.service)}` : ''}</td><td>${esc(r.location)}</td><td>${esc(r.budget)}${r.below_minimum ? ' <span class="badge b-warn">below min</span>' : ''}</td><td>${badge(r.status, INQUIRY_STATUS_LABEL)}</td></tr>`)}
  </tbody></table></div>`;
}
function inquiries(res, staff, url) {
  const st = url.searchParams.get('status');
  const rows = st && INQUIRY_STATUSES.includes(st) ? all('SELECT * FROM inquiries WHERE status = ? ORDER BY created_at DESC LIMIT 500', st) : all('SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 500');
  page(res, 'Inquiries', `${flash(url)}<div class="a-title"><h1 class="h2">Customer inquiries</h1><a class="btn small ghost" href="/admin/inquiries.csv">Export CSV</a></div>
  <p class="chips mt-2"><a href="/admin/inquiries/">All</a>${list(INQUIRY_STATUSES, (s) => `<a href="?status=${s}"${s === st ? ' aria-current="true"' : ''}>${INQUIRY_STATUS_LABEL[s]}</a>`)}</p>
  <div class="mt-3">${inquiryTable(rows)}</div>`, staff);
}
function inquiry(res, staff, url, id) {
  const r = get('SELECT * FROM inquiries WHERE id = ?', id);
  if (!r) throw new HttpError(404, 'Not found');
  const files = all("SELECT * FROM files WHERE owner_kind = 'inquiry' AND owner_id = ? ORDER BY created_at", id);
  const extra = J(r.extra, {}), plans = J(r.plans, []);
  const svc = r.service ? service(r.service) : null;
  page(res, r.ref, `${flash(url)}<p><a href="/admin/inquiries/">← Inquiries</a></p>
  <div class="a-title"><h1 class="h2">${esc(r.ref)} · ${esc(r.name)}</h1>${badge(r.status, INQUIRY_STATUS_LABEL)}</div>
  <div class="a-grid"><div>
    <dl class="a-dl">
      <dt>Received</dt><dd>${esc(fmtDateTime(r.created_at))}</dd>
      <dt>Contact</dt><dd><a href="mailto:${attr(r.email)}">${esc(r.email)}</a> · <a href="tel:${attr(r.phone)}">${esc(r.phone)}</a></dd>
      <dt>Permissions</dt><dd>Project contact: ${r.consent_contact ? 'yes' : 'no'} · Marketing: ${r.consent_marketing ? '<strong>yes</strong>' : 'no'}</dd>
      <dt>Project</dt><dd>${esc(r.market)} · ${esc(r.project_type)}${svc ? ` · <a href="${svc.path}" target="_blank" rel="noopener">${esc(svc.name)}</a>` : ''}</dd>
      <dt>Location</dt><dd>${esc(r.location)}</dd>
      <dt>Readiness</dt><dd>${esc({ design: 'Needs design and construction', plans: 'Has plans', unsure: 'Not sure' }[r.readiness] || r.readiness)}${plans.length ? `<br><span class="muted">${esc(plans.join(', '))}</span>` : ''}</dd>
      ${extra.property ? `<dt>Property</dt><dd>${esc(extra.property)}</dd>` : ''}${extra.occupied ? `<dt>Occupied during work</dt><dd>${esc(extra.occupied)}</dd>` : ''}
      <dt>Budget</dt><dd>${esc(r.budget)}${r.below_minimum ? ` <span class="badge b-warn">below the configured minimum${svc?.minProject ? ` (${money(svc.minProject)})` : ''}</span>` : ''}</dd>
      <dt>Timing</dt><dd>${esc(r.timing)}</dd>
      <dt>Description</dt><dd class="pre">${esc(r.description)}</dd>
      <dt>Attachments</dt><dd>${files.length ? `<ul>${list(files, (f) => `<li><a href="/admin/files/${f.id}">${esc(f.name)}</a> <span class="muted">${Math.round(f.size / 1024)} KB</span></li>`)}</ul>` : 'None'}</dd>
      <dt>Submitted from</dt><dd>${esc(r.source_page || '')}</dd>
    </dl></div>
    <form class="form panel" method="post">${csrf(staff)}
      <div class="field"><label for="i-status">Status</label><select id="i-status" name="status">${list(INQUIRY_STATUSES, (s) => `<option value="${s}"${s === r.status ? ' selected' : ''}>${INQUIRY_STATUS_LABEL[s]}</option>`)}</select></div>
      <div class="field"><label for="i-notes">Internal notes</label><textarea id="i-notes" name="notes" rows="8">${esc(r.notes || '')}</textarea></div>
      <button class="btn" type="submit">Save</button></form>
  </div>`, staff);
}
async function inquiryUpdate(req, res, staff, id) {
  const { fields } = await postForm(req, staff);
  const st = one(fields.status);
  if (!INQUIRY_STATUSES.includes(st)) throw new HttpError(400, 'Invalid status.');
  const r = run('UPDATE inquiries SET status = ?, notes = ?, updated_at = ? WHERE id = ?', st, str(fields.notes, 10000), now(), id);
  if (!r.changes) throw new HttpError(404, 'Not found');
  audit(staff.user.id, 'inquiry.update', 'inquiry', id, { status: st });
  back(res, `/admin/inquiries/${id}/`, 'Saved.');
}
function inquiriesCsv(res, staff) {
  const rows = all('SELECT * FROM inquiries ORDER BY created_at DESC');
  const cols = ['ref', 'created_at', 'status', 'name', 'email', 'phone', 'market', 'project_type', 'service', 'location', 'readiness', 'budget', 'timing', 'consent_marketing', 'description'];
  const q = (v) => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; }; // neutralize spreadsheet formulas
  audit(staff.user.id, 'inquiry.export');
  res.writeHead(200, { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="inquiries.csv"', 'cache-control': 'no-store' });
  res.end([cols.join(','), ...rows.map((r) => cols.map((c) => q(r[c])).join(','))].join('\r\n'));
}
function fileDownload(res, staff, id) {
  const f = get('SELECT * FROM files WHERE id = ?', id);
  if (!f) throw new HttpError(404, 'Not found');
  const full = path.join(PRIVATE_DIR, f.id);
  if (!fs.existsSync(full)) throw new HttpError(404, 'File missing from storage.');
  audit(staff.user.id, 'file.download', 'file', id);
  res.writeHead(200, { 'content-type': f.mime, 'content-disposition': `attachment; filename="${f.name.replace(/"/g, '')}"`, 'cache-control': 'no-store, private', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; sandbox" });
  res.end(fs.readFileSync(full));
}

// ---- trade partners ----
function trades(res, staff, url) {
  const st = url.searchParams.get('status');
  const rows = st && TRADE_STATUSES.includes(st) ? all('SELECT * FROM trade_applications WHERE status = ? ORDER BY created_at DESC', st) : all('SELECT * FROM trade_applications ORDER BY created_at DESC');
  page(res, 'Trade partners', `${flash(url)}<h1 class="h2">Trade-partner applications</h1>
  <p class="chips mt-2"><a href="/admin/trades/">All</a>${list(TRADE_STATUSES, (s) => `<a href="?status=${s}"${s === st ? ' aria-current="true"' : ''}>${TRADE_STATUS_LABEL[s]}</a>`)}</p>
  ${rows.length ? `<div class="a-scroll mt-3"><table class="a-table"><thead><tr><th>Received</th><th>Company</th><th>Trades</th><th>Counties</th><th>Status</th></tr></thead><tbody>
  ${list(rows, (r) => `<tr><td>${esc(fmtDateTime(r.created_at))}</td><td><a href="/admin/trades/${r.id}/">${esc(r.company)}</a><br><span class="muted small">${esc(r.ref)}</span></td><td>${esc(J(r.trades, []).join(', '))}</td><td>${esc(J(r.counties, []).slice(0, 6).join(', '))}${J(r.counties, []).length > 6 ? '…' : ''}</td><td>${badge(r.status, TRADE_STATUS_LABEL)}</td></tr>`)}
  </tbody></table></div>` : '<p class="muted mt-3">No applications yet.</p>'}`, staff);
}
function trade(res, staff, url, id) {
  const r = get('SELECT * FROM trade_applications WHERE id = ?', id);
  if (!r) throw new HttpError(404, 'Not found');
  const docs = all('SELECT d.*, f.name fname, f.size FROM trade_documents d LEFT JOIN files f ON f.id = d.file_id WHERE d.application_id = ? ORDER BY d.created_at DESC', id);
  const scope = J(r.approved_scope, { services: [], counties: [] });
  const newLink = url.searchParams.get('link');
  const today = new Date().toISOString().slice(0, 10);
  page(res, r.company, `${flash(url)}<p><a href="/admin/trades/">← Trade partners</a></p>
  <div class="a-title"><h1 class="h2">${esc(r.company)}</h1>${badge(r.status, TRADE_STATUS_LABEL)}</div>
  ${newLink ? `<div class="alert ok mt-2">Private upload link (valid 14 days — copy it now, it won’t be shown again):<br><code class="sel">${esc(SITE_URL)}/trade-partners/documents/${esc(newLink)}/</code></div>` : ''}
  <div class="a-grid"><div>
    <dl class="a-dl">
      <dt>Reference</dt><dd>${esc(r.ref)} · received ${esc(fmtDateTime(r.created_at))}</dd>
      <dt>Contact</dt><dd>${esc(r.contact_name)} · <a href="mailto:${attr(r.email)}">${esc(r.email)}</a> · ${esc(r.phone)}</dd>
      <dt>Trades</dt><dd>${esc(J(r.trades, []).join(', '))}</dd>
      <dt>Counties</dt><dd>${esc(J(r.counties, []).join(', '))}</dd>
      <dt>License info</dt><dd>${esc(r.license_info || '—')} <span class="muted small">(self-reported — verify independently)</span></dd>
      <dt>General liability</dt><dd>${esc(r.gl_status)}</dd><dt>Workers’ comp</dt><dd>${esc(r.wc_status)}</dd>
      <dt>Typical project size</dt><dd>${esc(r.project_size || '')}</dd><dt>Crew &amp; capacity</dt><dd>${esc(r.crew_capacity || '')}</dd>
      <dt>Availability</dt><dd>${esc(r.availability || '—')}</dd><dt>Project examples</dt><dd class="pre">${esc(r.examples || '')}</dd>
      <dt>Updates opt-in</dt><dd>${r.consent_marketing ? 'Yes' : 'No'}</dd>
    </dl>
    <h2 class="h3 mt-4">Documents</h2>
    ${docs.length ? `<table class="a-table"><thead><tr><th>Type</th><th>File</th><th>Expires</th><th>Added</th></tr></thead><tbody>${list(docs, (d) => `<tr><td>${esc(d.kind)}</td><td>${d.file_id ? `<a href="/admin/files/${d.file_id}">${esc(d.fname)}</a>` : '—'}</td><td>${d.expires_on ? `${esc(fmtDate(d.expires_on))}${d.expires_on < today ? ' <span class="badge b-warn">expired</span>' : ''}` : '—'}</td><td>${esc(fmtDate(d.created_at))} · ${esc(d.created_by === 'applicant' ? 'applicant' : 'staff')}</td></tr>`)}</tbody></table>` : '<p class="muted">No documents yet.</p>'}
    <form class="form panel mt-3" method="post" enctype="multipart/form-data">${csrf(staff)}<input type="hidden" name="action" value="doc">
      <h3>Add a document received by email or in person</h3>
      <div class="two-col"><div class="field"><label for="d-k">Type</label><select id="d-k" name="kind">${list(DOC_KINDS, (k) => `<option>${esc(k)}</option>`)}</select></div>
      <div class="field"><label for="d-e">Expiration date</label><input id="d-e" type="date" name="expires_on"></div></div>
      <div class="field"><label for="d-f">File</label><input id="d-f" type="file" name="files" required accept=".pdf,image/*"></div>
      <button class="btn small" type="submit">Add document</button></form>
    <form class="panel mt-3" method="post">${csrf(staff)}<input type="hidden" name="action" value="link">
      <h3>Request documents securely</h3><p class="small muted">Creates a private upload link (valid 14 days) to send to the applicant. Status changes to “Documents needed”.</p>
      <button class="btn small ghost" type="submit">Create upload link</button></form>
  </div>
  <form class="form panel" method="post">${csrf(staff)}<input type="hidden" name="action" value="review">
    <div class="field"><label for="t-st">Status</label><select id="t-st" name="status">${list(TRADE_STATUSES, (s) => `<option value="${s}"${s === r.status ? ' selected' : ''}>${TRADE_STATUS_LABEL[s]}</option>`)}</select>
      <p class="hint">Approval is never automatic. To approve, select the specific services and counties below.</p></div>
    <fieldset><legend>Approved for services</legend><div class="a-checks">${list(CATEGORIES, (c) => `<details><summary>${esc(c.name)} <span class="muted small">(${SERVICES.filter((s) => s.category === c.slug && scope.services.includes(s.slug)).length})</span></summary>${list(SERVICES.filter((s) => s.category === c.slug), (s) => `<label class="check small"><input type="checkbox" name="scope_services" value="${s.slug}"${scope.services.includes(s.slug) ? ' checked' : ''}> ${esc(s.name)}</label>`)}</details>`)}</div></fieldset>
    <fieldset><legend>Approved for counties</legend><details><summary>${scope.counties.length} selected</summary><div class="a-checks cols">${list(FL_COUNTIES, (c) => `<label class="check small"><input type="checkbox" name="scope_counties" value="${attr(c)}"${scope.counties.includes(c) ? ' checked' : ''}> ${esc(c)}</label>`)}</div></details></fieldset>
    <div class="field"><label for="t-n">Internal notes</label><textarea id="t-n" name="notes" rows="6">${esc(r.notes || '')}</textarea></div>
    <button class="btn" type="submit">Save review</button>
  </form></div>`, staff);
}
async function tradeUpdate(req, res, staff, id) {
  const r = get('SELECT * FROM trade_applications WHERE id = ?', id);
  if (!r) throw new HttpError(404, 'Not found');
  const { fields, files } = await postForm(req, staff, UPLOAD.maxTotalBytes + 1e6);
  const action = one(fields.action);
  if (action === 'link') {
    const token = createUploadLink(id, staff.user.id);
    if (['new', 'reviewing'].includes(r.status)) run('UPDATE trade_applications SET status = ?, updated_at = ? WHERE id = ?', 'documents_needed', now(), id);
    audit(staff.user.id, 'trade.uploadlink', 'trade', id);
    return back(res, `/admin/trades/${id}/?link=${encodeURIComponent(token)}`);
  }
  if (action === 'doc') {
    const f = files.filter((x) => x.field === 'files');
    if (!f.length) throw new HttpError(400, 'Choose a file.');
    for (const x of f) { x.mime = sniff(x.data); if (!x.mime || !UPLOAD.types.includes(x.mime)) throw new HttpError(400, 'Unsupported file type.'); if (x.data.length > UPLOAD.maxFileBytes) throw new HttpError(400, 'File too large.'); }
    const kind = DOC_KINDS.includes(one(fields.kind)) ? one(fields.kind) : 'Other';
    const exp = /^\d{4}-\d{2}-\d{2}$/.test(one(fields.expires_on)) ? one(fields.expires_on) : null;
    tx(() => { for (const fid of storeFiles('trade', id, f)) run('INSERT INTO trade_documents (id, application_id, kind, file_id, expires_on, created_at, created_by) VALUES (?,?,?,?,?,?,?)', newId('tdoc'), id, kind, fid, exp, now(), staff.user.id); });
    audit(staff.user.id, 'trade.doc.add', 'trade', id, { kind });
    return back(res, `/admin/trades/${id}/`, 'Document added.');
  }
  const status = one(fields.status);
  if (!TRADE_STATUSES.includes(status)) throw new HttpError(400, 'Invalid status.');
  const svc = many(fields.scope_services).filter((s) => SERVICES.some((x) => x.slug === s));
  const cty = many(fields.scope_counties).filter((c) => FL_COUNTIES.includes(c));
  if (status === 'approved' && (!svc.length || !cty.length)) return back(res, `/admin/trades/${id}/`, 'Not saved: approval needs at least one service and one county.');
  run('UPDATE trade_applications SET status = ?, approved_scope = ?, notes = ?, updated_at = ? WHERE id = ?', status, JSON.stringify({ services: svc, counties: cty }), str(fields.notes, 10000), now(), id);
  audit(staff.user.id, 'trade.review', 'trade', id, { status, services: svc.length, counties: cty.length });
  back(res, `/admin/trades/${id}/`, 'Saved.');
}

// ---- services & pricing ----
function servicesList(res, staff, url) {
  const svc = services({ includeHidden: true });
  page(res, 'Services & pricing', `${flash(url)}<h1 class="h2">Services &amp; pricing</h1>
  <p class="muted max-60"><strong>Published</strong> = listed and indexed by search engines. <strong>Preview</strong> = listed and reachable with an “availability being confirmed” note, not indexed. <strong>Hidden</strong> = removed from the site. Project minimum is used to flag inquiries below it (blank = none).</p>
  <form method="post" class="mt-3">${csrf(staff)}
  <div class="a-scroll"><table class="a-table"><thead><tr><th>Service</th><th>Category</th><th>Availability</th><th>Project minimum ($)</th><th>Public pricing</th></tr></thead><tbody>
  ${list(svc, (s) => `<tr><td><a href="/admin/services/${s.slug}/">${esc(s.name)}</a></td><td class="small">${esc(s.categoryName)}</td>
    <td><select name="av_${s.slug}" aria-label="Availability for ${attr(s.name)}">${list(AVAILABILITY, (a) => `<option value="${a}"${a === s.availability ? ' selected' : ''}>${a}</option>`)}</select></td>
    <td><input name="min_${s.slug}" inputmode="numeric" value="${s.minProject ?? ''}" aria-label="Project minimum for ${attr(s.name)}" size="9"></td>
    <td class="small">${s.price ? `Shown · reviewed ${esc(fmtDate(s.price.reviewedOn))}` : s.priceFields?.status === 'published' ? '<span class="badge b-warn">incomplete</span>' : 'Request pricing'}</td></tr>`)}
  </tbody></table></div><p class="mt-3"><button class="btn" type="submit">Save all</button></p></form>`, staff);
}
async function servicesBulk(req, res, staff) {
  const { fields } = await postForm(req, staff, 256e3);
  for (const s of SERVICES) {
    const raw = rawService(s.slug);
    const av = one(fields[`av_${s.slug}`]) || raw.availability;
    const min = fields[`min_${s.slug}`] === undefined ? raw.min_project : intOrNull(fields[`min_${s.slug}`]);
    if (av !== raw.availability || min !== raw.min_project) updateService(s.slug, { availability: av, min_project: min }, staff.user.id);
  }
  audit(staff.user.id, 'services.bulk');
  back(res, '/admin/services/', 'Saved.');
}
function serviceEdit(res, staff, url, slug) {
  const s = service(slug);
  if (!s) throw new HttpError(404, 'Not found');
  const p = s.priceFields || {};
  const ov = rawService(slug).overrides || {};
  page(res, s.name, `${flash(url)}<p><a href="/admin/services/">← Services</a></p><div class="a-title"><h1 class="h2">${esc(s.name)}</h1><a href="${s.path}" target="_blank" rel="noopener">View page ↗</a></div>
  <form class="form" method="post">${csrf(staff)}
  <div class="a-grid">
    <div class="panel"><h2 class="h3">Pricing shown on the service page</h2>
      <p class="small muted">Numbers appear only when status is “Published” and the basis, amount(s), unit and last-reviewed date are complete. Enter validated prices only — never placeholders or discounts.</p>
      <div class="two-col">
        <div class="field"><label for="p-st">Status</label><select id="p-st" name="status"><option value="draft"${p.status !== 'published' ? ' selected' : ''}>Draft (not shown)</option><option value="published"${p.status === 'published' ? ' selected' : ''}>Published</option></select></div>
        <div class="field"><label for="p-b">Basis</label><select id="p-b" name="basis"><option value="range"${p.basis !== 'starting' ? ' selected' : ''}>Typical range</option><option value="starting"${p.basis === 'starting' ? ' selected' : ''}>Starting price</option></select></div>
        <div class="field"><label for="p-lo">Low / starting amount ($)</label><input id="p-lo" name="low" inputmode="numeric" value="${p.low ?? ''}"></div>
        <div class="field"><label for="p-hi">High amount ($, for a range)</label><input id="p-hi" name="high" inputmode="numeric" value="${p.high ?? ''}"></div>
        <div class="field"><label for="p-u">Unit</label><select id="p-u" name="unit">${list(Object.entries(UNIT_NAME), ([k, v]) => `<option value="${k}"${(p.unit || s.unit) === k ? ' selected' : ''}>${v}</option>`)}</select></div>
        <div class="field"><label for="p-min">Minimum project size ($)</label><input id="p-min" name="minimumProject" inputmode="numeric" value="${p.minimumProject ?? ''}"></div>
      </div>
      <div class="field"><label for="p-inc">Included scope</label><textarea id="p-inc" name="included" rows="3">${esc(p.included || '')}</textarea></div>
      <div class="field"><label for="p-ex">Exclusions &amp; assumptions</label><textarea id="p-ex" name="assumptions" rows="3">${esc(p.assumptions || '')}</textarea></div>
      <div class="field"><label for="p-geo">Geographic applicability</label><input id="p-geo" name="geography" value="${attr(p.geography || '')}" placeholder="e.g. Hillsborough and Pinellas counties"></div>
      <div class="field"><label for="p-rev">Last reviewed</label><input id="p-rev" name="reviewedOn" type="date" value="${attr(p.reviewedOn || '')}"></div>
    </div>
    <div class="stack-lg">
      <div class="panel"><h2 class="h3">Availability</h2>
        <div class="field"><label for="s-av">Status</label><select id="s-av" name="availability">${list(AVAILABILITY, (a) => `<option value="${a}"${a === s.availability ? ' selected' : ''}>${a}</option>`)}</select></div>
        <div class="field"><label for="s-min">Inquiry project minimum ($)</label><input id="s-min" name="min_project" inputmode="numeric" value="${s.minProject ?? ''}"><p class="hint">Inquiries with a budget below this are flagged, and the form shows a gentle note. Leave blank for none.</p></div></div>
      <div class="panel"><h2 class="h3">Text overrides <span class="muted small">(optional)</span></h2>
        <div class="field"><label for="o-sum">Summary (meta description, ≤155 characters)</label><textarea id="o-sum" name="ov_summary" rows="3" maxlength="160" placeholder="${attr(s.summary)}">${esc(ov.summary || '')}</textarea></div>
        <div class="field"><label for="o-int">Introduction (blank line between paragraphs)</label><textarea id="o-int" name="ov_intro" rows="8" placeholder="Leave blank to keep the current text">${esc(ov.intro || '')}</textarea></div></div>
    </div>
  </div>
  <p class="mt-3"><button class="btn" type="submit">Save service</button></p></form>`, staff);
}
async function serviceSave(req, res, staff, slug) {
  if (!service(slug)) throw new HttpError(404, 'Not found');
  const { fields } = await postForm(req, staff);
  const pricing = {
    status: one(fields.status) === 'published' ? 'published' : 'draft', basis: one(fields.basis) === 'starting' ? 'starting' : 'range',
    low: intOrNull(fields.low), high: intOrNull(fields.high), unit: UNIT_NAME[one(fields.unit)] ? one(fields.unit) : null,
    minimumProject: intOrNull(fields.minimumProject), included: str(fields.included, 600), assumptions: str(fields.assumptions, 600),
    geography: str(fields.geography, 200), reviewedOn: /^\d{4}-\d{2}-\d{2}$/.test(one(fields.reviewedOn)) ? one(fields.reviewedOn) : null,
  };
  let msg = 'Saved.';
  if (pricing.status === 'published') {
    const missing = [];
    if (!pricing.low) missing.push('amount');
    if (pricing.basis === 'range' && !(pricing.high >= pricing.low)) missing.push('a high amount at least the low amount');
    if (!pricing.reviewedOn) missing.push('last-reviewed date');
    if (missing.length) { pricing.status = 'draft'; msg = `Saved as draft — to publish pricing add: ${missing.join(', ')}.`; }
  }
  const ovSummary = str(fields.ov_summary, 160), ovIntro = String(one(fields.ov_intro)).trim().slice(0, 4000);
  updateService(slug, {
    availability: one(fields.availability), min_project: intOrNull(fields.min_project), pricing,
    overrides: { ...(ovSummary ? { summary: ovSummary } : {}), ...(ovIntro ? { intro: ovIntro } : {}) },
  }, staff.user.id);
  audit(staff.user.id, 'service.update', 'service', slug, { pricing: pricing.status });
  back(res, `/admin/services/${slug}/`, msg);
}

// ---- photos ----
function photos(res, staff, url) {
  const rows = all('SELECT * FROM photos ORDER BY created_at DESC');
  page(res, 'Photos', `${flash(url)}<h1 class="h2">Photos &amp; project content</h1>
  <p class="muted max-60">Completed-project photos appear on the home page and a Projects page only when published, and only for work you are authorized to show. Concepts and renderings always carry a “Design concept” label.</p>
  <form class="form panel mt-3" method="post" enctype="multipart/form-data">${csrf(staff)}<input type="hidden" name="action" value="upload">
    <div class="two-col">
      <div class="field"><label for="ph-k">Type</label><select id="ph-k" name="kind">${list(Object.entries(PHOTO_KINDS), ([k, v]) => `<option value="${k}">${esc(v)}</option>`)}</select></div>
      <div class="field"><label for="ph-f">Image (JPG, PNG or WebP, max ${UPLOAD.maxFileBytes / 1e6} MB)</label><input id="ph-f" type="file" name="file" accept="image/jpeg,image/png,image/webp" required></div>
      <div class="field"><label for="ph-t">Title</label><input id="ph-t" name="title" required maxlength="120"></div>
      <div class="field"><label for="ph-a">Image description (alt text)</label><input id="ph-a" name="alt" required maxlength="200" placeholder="What the image shows, for screen readers"></div>
    </div>
    <div class="field"><label for="ph-c">Caption (optional)</label><input id="ph-c" name="caption" maxlength="240"></div>
    <label class="check"><input type="checkbox" name="rights" value="1" required> <span>I confirm we own this image or have permission to publish it, and that a completed-project photo shows our work with the owner’s permission.</span></label>
    <button class="btn" type="submit">Upload (saved as draft)</button></form>
  ${rows.length ? `<div class="a-photos mt-4">${list(rows, (p) => `<div class="panel"><img src="/admin/photos/preview/${p.id}" alt="${attr(p.alt)}" loading="lazy">
    <strong>${esc(p.title)}</strong><span class="small muted">${esc(PHOTO_KINDS[p.kind])} · ${esc(p.status)}</span>
    <form method="post">${csrf(staff)}<input type="hidden" name="id" value="${p.id}">
      <button class="btn small" name="action" value="${p.status === 'published' ? 'unpublish' : 'publish'}">${p.status === 'published' ? 'Unpublish' : 'Publish'}</button>
      <button class="btn small ghost" name="action" value="delete">Delete</button></form></div>`)}</div>` : '<p class="muted mt-3">No photos uploaded yet.</p>'}`, staff);
}
async function photoPost(req, res, staff) {
  const { fields, files } = await postForm(req, staff, UPLOAD.maxFileBytes + 1e6);
  const action = one(fields.action);
  if (action === 'upload') {
    const f = files.find((x) => x.field === 'file');
    if (!f) throw new HttpError(400, 'Choose an image.');
    const mime = sniff(f.data);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) throw new HttpError(400, 'Use a JPG, PNG or WebP image.');
    if (one(fields.rights) !== '1') throw new HttpError(400, 'Please confirm you have the right to publish this image.');
    const kind = PHOTO_KINDS[one(fields.kind)] ? one(fields.kind) : 'concept';
    const id = newId('ph', 10), ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[mime];
    const [w, h] = dims(f.data, mime);
    fs.writeFileSync(path.join(MEDIA_DIR, `${id}.${ext}`), f.data);
    run('INSERT INTO photos (id, kind, title, caption, alt, ext, width, height, rights, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      id, kind, str(fields.title, 120), str(fields.caption, 240), str(fields.alt, 200), ext, w, h, `confirmed by ${staff.user.email} ${now()}`, 'draft', now(), now());
    audit(staff.user.id, 'photo.upload', 'photo', id);
    invalidate();
    return back(res, '/admin/photos/', 'Uploaded as a draft. Publish it when ready.');
  }
  const id = str(fields.id, 40);
  const p = get('SELECT * FROM photos WHERE id = ?', id);
  if (!p) throw new HttpError(404, 'Not found');
  if (action === 'publish' || action === 'unpublish') run('UPDATE photos SET status = ?, updated_at = ? WHERE id = ?', action === 'publish' ? 'published' : 'draft', now(), id);
  else if (action === 'delete') { run('DELETE FROM photos WHERE id = ?', id); fs.rmSync(path.join(MEDIA_DIR, `${id}.${p.ext}`), { force: true }); }
  audit(staff.user.id, `photo.${action}`, 'photo', id);
  invalidate();
  back(res, '/admin/photos/', 'Done.');
}
export function photoPreview(res, id) {
  const p = get('SELECT * FROM photos WHERE id = ?', id);
  if (!p) throw new HttpError(404, 'Not found');
  res.writeHead(200, { 'content-type': { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[p.ext], 'cache-control': 'no-store, private' });
  res.end(fs.readFileSync(path.join(MEDIA_DIR, `${p.id}.${p.ext}`)));
}

// ---- business details & account ----
function settings(res, staff, url) {
  const b = getSetting('business', {});
  const n = getSetting('notify', {});
  const users = all('SELECT id, email, name, disabled, created_at FROM staff ORDER BY created_at');
  page(res, 'Business details', `${flash(url)}<h1 class="h2">Business details</h1>
  <p class="muted max-60">Facts appear on the public site only when filled in <strong>and</strong> marked verified. Do not enter anything you can’t back up.</p>
  <form class="form mt-3" method="post">${csrf(staff)}<input type="hidden" name="action" value="facts">
    ${list(FACT_FIELDS, (f) => `<div class="panel"><div class="field"><label for="b-${f.key}">${esc(f.label)}</label><p class="hint">${esc(f.help)}</p>
      <input id="b-${f.key}" name="${f.key}" value="${attr(b[f.key]?.value || '')}" placeholder="${attr(f.placeholder || '')}" maxlength="300"></div>
      <label class="check"><input type="checkbox" name="${f.key}_verified" value="1"${b[f.key]?.verified ? ' checked' : ''}> <span>Verified — show on the website</span></label></div>`)}
    <div class="panel"><div class="field"><label for="n-email">Notification inbox (receives new inquiries and applications)</label>
      <p class="hint">Mark verified only after confirming this mailbox exists and receives mail. Email provider: ${EMAIL.provider ? `configured (sender ${esc(EMAIL.from || 'EMAIL_FROM not set')})` : '<strong>not configured</strong> — set RESEND_API_KEY and EMAIL_FROM on the server'}.</p>
      <input id="n-email" name="notify_email" type="email" value="${attr(n.email || '')}"></div>
      <label class="check"><input type="checkbox" name="notify_verified" value="1"${n.verified ? ' checked' : ''}> <span>Verified mailbox</span></label>
      <p class="small mt-1">Status: ${emailReady() ? `<strong>on</strong> — sending to ${esc(notificationInbox())}` : '<strong>off</strong>'}</p></div>
    <button class="btn" type="submit">Save business details</button></form>
  <h2 class="h3 mt-5">Change your password</h2>
  <form class="form panel mt-2 max-60" method="post">${csrf(staff)}<input type="hidden" name="action" value="password">
    <div class="field"><label for="pw-c">Current password</label><input id="pw-c" type="password" name="current" autocomplete="current-password" required></div>
    <div class="field"><label for="pw-n">New password (12+ characters)</label><input id="pw-n" type="password" name="next" autocomplete="new-password" minlength="12" required></div>
    <button class="btn small" type="submit">Change password</button></form>
  <h2 class="h3 mt-5">Staff accounts</h2>
  <table class="a-table"><thead><tr><th>Name</th><th>Email</th><th>Status</th></tr></thead><tbody>${list(users, (u) => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${u.disabled ? 'disabled' : 'active'}</td></tr>`)}</tbody></table>
  <form class="form panel mt-2 max-60" method="post">${csrf(staff)}<input type="hidden" name="action" value="adduser">
    <h3>Add a staff account</h3>
    <div class="field"><label for="u-n">Name</label><input id="u-n" name="name" required maxlength="80"></div>
    <div class="field"><label for="u-e">Email</label><input id="u-e" name="email" type="email" required maxlength="160"></div>
    <div class="field"><label for="u-p">Temporary password (12+ characters — share it privately)</label><input id="u-p" name="password" type="password" minlength="12" required autocomplete="new-password"></div>
    <button class="btn small" type="submit">Add account</button></form>`, staff);
}
async function settingsSave(req, res, staff) {
  const { fields } = await postForm(req, staff);
  const action = one(fields.action);
  if (action === 'facts') {
    const b = {};
    for (const f of FACT_FIELDS) b[f.key] = { value: str(fields[f.key], 300), verified: one(fields[`${f.key}_verified`]) === '1' && !!str(fields[f.key], 300) };
    setSetting('business', b, staff.user.id);
    const email = str(fields.notify_email, 160).toLowerCase();
    setSetting('notify', { email, verified: one(fields.notify_verified) === '1' && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email) }, staff.user.id);
    audit(staff.user.id, 'settings.update');
    invalidate();
    return back(res, '/admin/settings/', 'Saved.');
  }
  if (action === 'password') {
    const u = get('SELECT * FROM staff WHERE id = ?', staff.user.id);
    if (!verifyPassword(String(one(fields.current)), u.pw_hash)) return back(res, '/admin/settings/', 'Current password is incorrect.');
    run('UPDATE staff SET pw_hash = ? WHERE id = ?', hashPassword(String(one(fields.next))), u.id);
    run('DELETE FROM sessions WHERE subject = ? AND token_hash != ?', u.id, staff.session.token_hash);
    audit(u.id, 'staff.password');
    return back(res, '/admin/settings/', 'Password changed. Other sessions were signed out.');
  }
  if (action === 'adduser') {
    const email = str(fields.email, 160).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) throw new HttpError(400, 'Enter a valid email.');
    if (get('SELECT 1 FROM staff WHERE email = ?', email)) return back(res, '/admin/settings/', 'That email already has an account.');
    run('INSERT INTO staff (id, email, name, pw_hash, created_at) VALUES (?,?,?,?,?)', newId('stf'), email, str(fields.name, 80) || email, hashPassword(String(one(fields.password))), now());
    audit(staff.user.id, 'staff.add', 'staff', email);
    return back(res, '/admin/settings/', 'Account added.');
  }
  throw new HttpError(400, 'Unknown action.');
}
export { categories };

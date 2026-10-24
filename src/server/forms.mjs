// Public form handling: customer inquiries and trade-partner applications.
// Spam controls: same-origin check, honeypot field, signed timing token (too-fast / stale submissions rejected),
// per-IP rate limits, optional Cloudflare Turnstile. Uploads: type sniffed from bytes, size limits, private storage.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { HttpError, readForm, rateLimit, clientIp, sniff, checkOrigin, EXT } from './http.mjs';
import { run, get, now, newId, makeRef, sha256, tx, audit, PRIVATE_DIR } from './db.mjs';
import { service } from './services.mjs';
import { notify, confirm } from './email.mjs';
import { CONFIRMED } from '../data/business.mjs';
import { track } from './events.mjs';
import { FORM_SECRET, TURNSTILE, UPLOAD, BUDGETS, TIMINGS, PLAN_ITEMS, BUDGET_CEIL, SITE_URL } from '../config.mjs';
import { PROJECT_TYPES } from '../site/pages/start.mjs';
import { TRADES, PROJECT_SIZES, INSURANCE_STATUS } from '../data/trades.mjs';
import { FL_COUNTIES } from '../data/counties.mjs';

const KEY = FORM_SECRET || crypto.randomBytes(32).toString('hex');
const MIN_FILL_MS = 2500;
const RATE = Number(process.env.FORM_RATE_PER_HOUR || 6);   // per IP per form, per hour
const MAX_AGE_MS = 24 * 3600e3;

export function formToken() {
  const t = Date.now().toString(36);
  const sig = crypto.createHmac('sha256', KEY).update(t).digest('base64url').slice(0, 22);
  return `${t}.${sig}`;
}
function checkToken(tok) {
  const [t, sig] = String(tok || '').split('.');
  const good = t && sig && crypto.timingSafeEqual(Buffer.from(crypto.createHmac('sha256', KEY).update(t).digest('base64url').slice(0, 22)), Buffer.from(sig.padEnd(22).slice(0, 22)));
  if (!good) throw new HttpError(400, 'This form expired. Please reload the page and try again.');
  const age = Date.now() - parseInt(t, 36);
  if (age < MIN_FILL_MS) throw new HttpError(400, 'That was submitted very quickly. Please check the form and send it again.');
  if (age > MAX_AGE_MS) throw new HttpError(400, 'This form expired. Please reload the page and try again.');
}
async function checkTurnstile(token, ip) {
  if (!TURNSTILE.secret) return;
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', body: new URLSearchParams({ secret: TURNSTILE.secret, response: String(token || ''), remoteip: ip }), signal: AbortSignal.timeout(8000),
  }).then((x) => x.json()).catch(() => ({ success: false }));
  if (!r.success) throw new HttpError(400, 'Please complete the verification check and try again.');
}

const one = (v) => (Array.isArray(v) ? v[0] : v) ?? '';
const many = (v) => (v == null ? [] : [].concat(v));
const clean = (v, max) => String(one(v)).replace(/\s+/g, ' ').trim().slice(0, max);
const cleanText = (v, max) => String(one(v)).replace(/\r\n/g, '\n').trim().slice(0, max);
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;

class FieldErrors extends HttpError {
  constructor(errors) { super(422, 'Please correct the highlighted fields.', { fields: errors }); }
}

function validateFiles(files) {
  const out = [];
  let total = 0;
  for (const f of files) {
    if (out.length >= UPLOAD.maxFiles) throw new FieldErrors({ files: `Please attach no more than ${UPLOAD.maxFiles} files.` });
    if (f.data.length > UPLOAD.maxFileBytes) throw new FieldErrors({ files: `“${f.filename}” is larger than ${UPLOAD.maxFileBytes / 1e6} MB.` });
    total += f.data.length;
    const mime = sniff(f.data);
    if (!mime || !UPLOAD.types.includes(mime)) throw new FieldErrors({ files: `“${f.filename}” isn’t a supported file type. Use PDF, JPG, PNG, WebP or HEIC.` });
    out.push({ ...f, mime });
  }
  if (total > UPLOAD.maxTotalBytes) throw new FieldErrors({ files: `Attachments total more than ${UPLOAD.maxTotalBytes / 1e6} MB.` });
  return out;
}
/** Writes validated files to private storage and records them. Must run inside the caller's transaction. */
export function storeFiles(ownerKind, ownerId, files) {
  const ids = [];
  for (const f of files) {
    const id = newId('file', 12);
    fs.writeFileSync(path.join(PRIVATE_DIR, id), f.data, { mode: 0o600 });
    const base = f.filename.replace(/\.[^.]*$/, '').replace(/[^\w .()-]/g, '_').slice(0, 100) || 'file';
    run('INSERT INTO files (id, owner_kind, owner_id, name, mime, size, sha256, created_at) VALUES (?,?,?,?,?,?,?,?)',
      id, ownerKind, ownerId, `${base}.${EXT[f.mime]}`, f.mime, f.data.length, sha256(f.data), now());
    ids.push(id);
  }
  return ids;
}

/** Per-page-load submission key (hidden field). A retried submission with the same key returns the original record. */
export const newSubmissionKey = () => crypto.randomBytes(18).toString('base64url');
const idemOf = (fields) => { const k = String(one(fields._idem) || ''); return /^[\w-]{16,64}$/.test(k) ? sha256('idem:' + k) : null; };
// Controlled tests are marked so they never mix with genuine leads.
const isTestSubmission = (name, email) => /^website test\b/i.test(name) || /@example\.(com|test|org)$/i.test(email);

async function common(req, bucket, max) {
  checkOrigin(req);
  const ip = clientIp(req);
  rateLimit(`${bucket}:${ip}`, max, 3600e3, 'Too many submissions from this connection. Please try again later.');
  const { fields, files } = await readForm(req, UPLOAD.maxTotalBytes + 1e6);
  if (clean(fields.website, 200)) throw new HttpError(400, 'Submission rejected.'); // honeypot
  checkToken(one(fields._t));
  await checkTurnstile(one(fields['cf-turnstile-response']), ip);
  return { fields, files, ipHash: sha256(`${ip}|${KEY}`).slice(0, 16) };
}

// ---------------------------------------------------------------------------------------------------------
export async function handleInquiry(req) {
  const { fields, files, ipHash } = await common(req, 'inq', RATE);
  const idem = idemOf(fields);
  if (idem) { const prev = get('SELECT ref FROM inquiries WHERE idem_key = ?', idem); if (prev) return { ok: true, ref: prev.ref, duplicate: true }; }
  const e = {};
  const market = one(fields.market);
  if (!['residential', 'commercial'].includes(market)) e.market = 'Choose residential or commercial.';
  const projectType = clean(fields.project_type, 80);
  if (!PROJECT_TYPES[market]?.includes(projectType) && !Object.values(PROJECT_TYPES).flat().includes(projectType)) e.project_type = 'Choose the type of project.';
  const svcSlug = clean(fields.service, 80);
  const svc = svcSlug ? service(svcSlug) : null;
  const location = clean(fields.location, 120);
  if (location.length < 2) e.location = 'Tell us where the project is (city and ZIP, or county).';
  const readiness = one(fields.readiness);
  if (!['design', 'plans', 'unsure'].includes(readiness)) e.readiness = 'Choose one option.';
  const plans = many(fields.plans).filter((p) => PLAN_ITEMS.includes(p));
  const budget = one(fields.budget);
  if (!BUDGETS.includes(budget)) e.budget = 'Choose an approximate budget, or “Not sure yet”.';
  const timing = one(fields.timing);
  if (!TIMINGS.includes(timing)) e.timing = 'Choose a timeframe, or “Not sure yet”.';
  const name = clean(fields.name, 100);
  if (name.length < 2) e.name = 'Enter your name.';
  const email = clean(fields.email, 160).toLowerCase();
  if (!EMAIL_RE.test(email)) e.email = 'Enter a valid email address, like name@example.com.';
  const phone = clean(fields.phone, 40);
  if (phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a phone number including area code.';
  const description = cleanText(fields.description, 3000);
  if (description.length < 10) e.description = 'Add a sentence or two about the project.';
  if (one(fields.consent_contact) !== '1') e.consent_contact = 'We need your permission to contact you about this project.';
  if (Object.keys(e).length) throw new FieldErrors(e);
  const valid = validateFiles(files.filter((f) => f.field === 'files'));

  const extra = {};
  for (const k of ['property', 'occupied']) { const v = clean(fields[k], 40); if (v) extra[k] = v; }
  const minProject = svc?.minProject || null;
  const below = minProject && BUDGET_CEIL[budget] != null && BUDGET_CEIL[budget] < minProject ? 1 : 0;

  const id = newId('inq'), ref = makeRef('NDC'), t = now(), test = isTestSubmission(name, email) ? 1 : 0;
  try {
    tx(() => {
      run(`INSERT INTO inquiries (id, ref, status, market, project_type, service, location, readiness, plans, budget, timing, name, email, phone,
        description, extra, consent_contact, consent_marketing, below_minimum, source_page, ip_hash, created_at, updated_at, idem_key, is_test)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        id, ref, 'new', market, projectType, svc?.slug || null, location, readiness, JSON.stringify(plans), budget, timing, name, email, phone,
        description, JSON.stringify(extra), 1, one(fields.consent_marketing) === '1' ? 1 : 0, below, clean(fields.source, 200), ipHash, t, t, idem, test);
      storeFiles('inquiry', id, valid);
      audit('public', 'inquiry.create', 'inquiry', id);
    });
  } catch (err) {
    // A concurrent retry with the same key won the race: return the stored record instead of failing.
    const prev = idem && get('SELECT ref FROM inquiries WHERE idem_key = ?', idem);
    if (prev) return { ok: true, ref: prev.ref, duplicate: true };
    throw err;
  }
  track('inquiry_submitted', svc?.slug || market);
  const text = [`New project inquiry ${ref}`, '', `${name} · ${email} · ${phone}`, `${market} — ${projectType}${svc ? ` — ${svc.name}` : ''}`, `Location: ${location}`,
    `Readiness: ${readiness}${plans.length ? ` (${plans.join(', ')})` : ''}`, `Budget: ${budget} · Timing: ${timing}${below ? ' · BELOW configured minimum' : ''}`, '', description, '',
    `${valid.length} attachment(s). Open in admin: ${SITE_URL}/admin/inquiries/${id}`].join('\n');
  // Stored durably above; the notification is queued and retried independently and can never undo the lead.
  notify('inquiry', `${test ? '[TEST] ' : ''}New inquiry ${ref}: ${projectType}`, text, { replyTo: email }).catch(() => {});
  if (!test) confirm(email, `We received your project details (${ref}) — Nation Design & Construction`, [
    `Hello ${name},`, '',
    `Thank you for telling us about your project. Your reference is ${ref}.`, '',
    'We’ll review what you sent, including any plans or photos, and contact you using the details you provided.', '',
    `If you have more to add, reply to this email or call ${CONFIRMED.phone}.`, '', 'Nation Design & Construction', SITE_URL,
  ].join('\n')).catch(() => {});
  return { ok: true, ref };
}

// ---------------------------------------------------------------------------------------------------------
export async function handleTradeApplication(req) {
  const { fields, ipHash } = await common(req, 'trade', Math.max(4, RATE - 2));
  const idem = idemOf(fields);
  if (idem) { const prev = get('SELECT ref FROM trade_applications WHERE idem_key = ?', idem); if (prev) return { ok: true, ref: prev.ref, duplicate: true }; }
  const e = {};
  const company = clean(fields.company, 120); if (company.length < 2) e.company = 'Enter your company name.';
  const contact = clean(fields.contact_name, 100); if (contact.length < 2) e.contact_name = 'Enter a contact name.';
  const email = clean(fields.email, 160).toLowerCase(); if (!EMAIL_RE.test(email)) e.email = 'Enter a valid email address.';
  const phone = clean(fields.phone, 40); if (phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a phone number including area code.';
  const trades = many(fields.trades).filter((t) => TRADES.includes(t));
  const otherTrade = clean(fields.trades_other, 120);
  if (!trades.length && !otherTrade) e.trades = 'Choose at least one trade or describe your specialty.';
  const counties = many(fields.counties).filter((c) => FL_COUNTIES.includes(c));
  if (!counties.length) e.counties = 'Choose at least one county you serve.';
  const license = cleanText(fields.license_info, 300);
  const gl = one(fields.gl_status); if (!INSURANCE_STATUS.gl.includes(gl)) e.gl_status = 'Choose your general liability status.';
  const wc = one(fields.wc_status); if (!INSURANCE_STATUS.wc.includes(wc)) e.wc_status = 'Choose your workers’ compensation status.';
  const size = one(fields.project_size); if (!PROJECT_SIZES.includes(size)) e.project_size = 'Choose a typical project size.';
  const crew = clean(fields.crew_capacity, 200); if (!crew) e.crew_capacity = 'Tell us your crew size and capacity.';
  const availability = clean(fields.availability, 200);
  const examples = cleanText(fields.examples, 2000); if (examples.length < 10) e.examples = 'Describe two recent projects or share a portfolio link.';
  if (one(fields.consent_contact) !== '1') e.consent_contact = 'We need your permission to contact you about prequalification.';
  if (Object.keys(e).length) throw new FieldErrors(e);
  const id = newId('trd'), ref = makeRef('TP'), t = now();
  const test = isTestSubmission(contact, email) || /^website test\b/i.test(company) ? 1 : 0;
  try {
    run(`INSERT INTO trade_applications (id, ref, status, company, contact_name, email, phone, trades, counties, license_info, gl_status, wc_status,
      project_size, crew_capacity, availability, examples, consent_marketing, ip_hash, created_at, updated_at, idem_key, is_test) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      id, ref, 'new', company, contact, email, phone, JSON.stringify(otherTrade ? [...trades, `Other: ${otherTrade}`] : trades), JSON.stringify(counties), license,
      gl, wc, size, crew, availability, examples, one(fields.consent_marketing) === '1' ? 1 : 0, ipHash, t, t, idem, test);
  } catch (err) {
    const prev = idem && get('SELECT ref FROM trade_applications WHERE idem_key = ?', idem);
    if (prev) return { ok: true, ref: prev.ref, duplicate: true };
    throw err;
  }
  audit('public', 'trade.create', 'trade', id);
  track('trade_application_submitted');
  notify('trade', `Trade partner application ${ref}: ${company}`, `${company} (${contact}, ${email}, ${phone})\nTrades: ${trades.join(', ')}${otherTrade ? `, ${otherTrade}` : ''}\nCounties: ${counties.join(', ')}\n\nReview: ${SITE_URL}/admin/trades/${id}`, { replyTo: email }).catch(() => {});
  if (!test) confirm(email, `We received your application (${ref}) — Nation Design & Construction`, [
    `Hello ${contact},`, '',
    `Thank you for applying to work with Nation Design & Construction. Your reference is ${ref}.`, '',
    'We review every application individually. If it’s a fit, we’ll contact you and send a private link for insurance certificates, licenses and references — please don’t send documents by reply to this email.', '',
    `Questions? Reply to this email or call ${CONFIRMED.phone}.`, '', 'Nation Design & Construction', SITE_URL,
  ].join('\n')).catch(() => {});
  return { ok: true, ref };
}

// ---------------------------------------------------------------------------------------------------------
// Secure document upload for trade partners after review (one link per request, hashed, expiring).
export function createUploadLink(applicationId, by, days = 14) {
  const token = crypto.randomBytes(24).toString('base64url');
  run('INSERT INTO upload_links (token_hash, application_id, expires_at, created_at, created_by) VALUES (?,?,?,?,?)',
    sha256(token), applicationId, new Date(Date.now() + days * 864e5).toISOString(), now(), by);
  return token;
}
export function uploadLink(token) {
  const l = get('SELECT * FROM upload_links WHERE token_hash = ?', sha256(String(token || '')));
  if (!l || l.expires_at < now() || l.revoked_at) return null;
  return { ...l, app: get('SELECT id, ref, company, status FROM trade_applications WHERE id = ?', l.application_id) };
}
export const DOC_KINDS = ['General liability certificate', 'Workers’ compensation certificate or exemption', 'License', 'W-9', 'Reference list', 'Other'];

export async function handleTradeDocs(req, token) {
  checkOrigin(req);
  rateLimit(`tdoc:${clientIp(req)}`, 20, 3600e3);
  const link = uploadLink(token);
  if (!link || !link.app || link.app.status === 'inactive') throw new HttpError(404, 'This upload link is no longer valid. Please contact us for a new one.');
  if (link.used_count >= 30) throw new HttpError(429, 'This link has reached its upload limit. Please contact us for a new one.');
  const { fields, files } = await readForm(req, UPLOAD.maxTotalBytes + 1e6);
  const kind = DOC_KINDS.includes(one(fields.kind)) ? one(fields.kind) : 'Other';
  const valid = validateFiles(files.filter((f) => f.field === 'files'));
  if (!valid.length) throw new FieldErrors({ files: 'Choose at least one file to upload.' });
  const expires = /^\d{4}-\d{2}-\d{2}$/.test(one(fields.expires_on)) ? one(fields.expires_on) : null;
  tx(() => {
    const ids = storeFiles('trade', link.app.id, valid);
    for (const fid of ids) run('INSERT INTO trade_documents (id, application_id, kind, file_id, expires_on, note, created_at, created_by) VALUES (?,?,?,?,?,?,?,?)',
      newId('tdoc'), link.app.id, kind, fid, expires, 'Uploaded by applicant', now(), 'applicant');
    run('UPDATE upload_links SET used_count = used_count + ? WHERE token_hash = ?', ids.length, link.token_hash);
    audit('applicant', 'trade.docs.upload', 'trade', link.app.id, { count: ids.length, kind });
  });
  await notify('trade', `Documents uploaded: ${link.app.ref} ${link.app.company}`, `${valid.length} file(s) (${kind}) uploaded.\n${SITE_URL}/admin/trades/${link.app.id}`);
  return { ok: true, count: valid.length };
}

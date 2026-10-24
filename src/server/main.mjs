// Nation Design & Construction — web server. One Node process, no dependencies.
//   Public pages are server-rendered from src/site (cached in memory, invalidated when admin edits content).
//   /api/*   public form endpoints      /admin/*  protected management area      /media/* published photos
// Usage: node src/server/main.mjs [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { PORT, SITE_URL, CANONICAL_HOST, INDEXING, ENV, TURNSTILE } from '../config.mjs';
import { get, run, now, newId, audit, MEDIA_DIR } from './db.mjs';
import { HttpError, sendJson, readBody, checkOrigin, rateLimit, clientIp } from './http.mjs';
import { track, crawlerOf, CLIENT_EVENTS, safeLabel } from './events.mjs';
import { retryOutbox } from './email.mjs';
import { hashPassword } from './auth.mjs';
import { route } from '../site/router.mjs';
import { handleInquiry, handleTradeApplication, handleTradeDocs } from './forms.mjs';
import { handleAdmin } from './admin.mjs';
import { contentVersion } from './services.mjs';
import { publishedPhoto } from './photos.mjs';
import { receivedPage } from '../site/pages/start.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const PUBLIC = path.join(ROOT, 'public');
const port = Number(process.argv[2] || PORT);

run('DELETE FROM sessions WHERE expires_at < ?', now());
setInterval(() => run('DELETE FROM sessions WHERE expires_at < ?', now()), 3600e3).unref();
// Notification retries (no-op until email is configured).
setInterval(() => { retryOutbox().catch((e) => console.error('outbox', e.message)); }, 60e3).unref();
// First admin from environment variables (hosted first run), only while no staff account exists. Never logged.
if (process.env.BOOTSTRAP_ADMIN_EMAIL && process.env.BOOTSTRAP_ADMIN_PASSWORD && !get('SELECT 1 FROM staff LIMIT 1')) {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase().trim();
  run('INSERT INTO staff (id, email, name, pw_hash, created_at) VALUES (?,?,?,?,?)', newId('stf'), email, process.env.BOOTSTRAP_ADMIN_NAME || 'Admin', hashPassword(process.env.BOOTSTRAP_ADMIN_PASSWORD), now());
  audit('system', 'staff.bootstrap', 'staff', email);
  console.log('Created first admin account'); // no personal data in logs
}

const TYPES = { '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.xml': 'application/xml; charset=utf-8', '.heic': 'image/heic' };

// The only inline script is the one-line "js" class toggle in <head>; it is allowed by hash.
const INLINE_JS_HASH = crypto.createHash('sha256').update("document.documentElement.classList.add('js')").digest('base64');
const TS = TURNSTILE.siteKey ? ' https://challenges.cloudflare.com' : '';
const CSP = [
  "default-src 'self'", `script-src 'self' 'sha256-${INLINE_JS_HASH}'${TS}`, "style-src 'self' 'unsafe-inline'", "img-src 'self' data:", "font-src 'self'",
  `connect-src 'self'${TS}`, ...(TS ? [`frame-src${TS}`] : []), "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", "object-src 'none'",
].join('; ');
function securityHeaders(res) {
  res.setHeader('content-security-policy', CSP);
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
  res.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  res.setHeader('x-frame-options', 'DENY');
  if (SITE_URL.startsWith('https://')) res.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains');
}
function compressible(type) { return /text|json|xml|svg|javascript/.test(type); }
function sendBody(req, res, status, type, body, headers = {}) {
  const h = { 'content-type': type, ...headers };
  let out = Buffer.isBuffer(body) ? body : Buffer.from(body);
  if (compressible(type) && out.length > 1024) {
    const ae = String(req.headers['accept-encoding'] || '');
    h.vary = 'Accept-Encoding';
    if (ae.includes('br')) { out = zlib.brotliCompressSync(out, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }); h['content-encoding'] = 'br'; }
    else if (ae.includes('gzip')) { out = zlib.gzipSync(out); h['content-encoding'] = 'gzip'; }
  }
  res.writeHead(status, h);
  res.end(req.method === 'HEAD' ? undefined : out);
}

// Rendered-page cache (keyed by path + content version). Pages with forms carry a time token, so they're not cached.
// Paths rendered by the router even though they have file extensions.
const GENERATED = new Set(['/robots.txt', '/llms.txt', '/sitemap.xml', '/site.webmanifest']);
const cache = new Map();
const query0 = (url) => Object.fromEntries(url.searchParams);
const UNCACHED = new Set(['/start/', '/trade-partners/']);

function staticFile(req, res, pathname) {
  let clean;
  try { clean = decodeURIComponent(pathname); } catch { return false; }
  if (clean.includes('\0') || clean.includes('..')) return false;
  const full = path.join(PUBLIC, clean);
  if (!full.startsWith(PUBLIC + path.sep)) return false;
  const st = fs.statSync(full, { throwIfNoEntry: false });
  if (!st?.isFile()) return false;
  const type = TYPES[path.extname(full)] || 'application/octet-stream';
  const etag = `W/"${st.size.toString(16)}-${Math.round(st.mtimeMs).toString(16)}"`;
  // Long-lived caching only for URLs that change when the file changes (?v= stamp) and for photos/fonts, which are
  // never edited in place. Everything else — including unversioned /brand/ and /favicon.ico — revalidates hourly.
  const versioned = /^\/(img|fonts)\//.test(pathname) || /[?&]v=/.test(req.url);
  const headers = { etag, 'cache-control': versioned ? 'public, max-age=31536000, immutable' : 'public, max-age=3600' };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); res.end(); return true; }
  sendBody(req, res, 200, type, fs.readFileSync(full), headers);
  return true;
}

const server = http.createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url, `http://${req.headers.host || 'localhost'}`); } catch { res.writeHead(400).end(); return; }
  try {
    if (url.pathname === '/healthz') { res.writeHead(200, { 'content-type': 'text/plain', 'cache-control': 'no-store' }).end('ok'); return; }
    // One canonical host: www (or any other alias) → canonical, preserving path and query.
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
    if (ENV === 'production' && host && host !== CANONICAL_HOST && (host.replace(/^www\./, '') === CANONICAL_HOST.replace(/^www\./, '') || host.endsWith('.onrender.com'))) {
      res.writeHead(301, { location: `${SITE_URL}${url.pathname}${url.search}` }).end(); return;
    }
    if (ENV === 'production' && req.headers['x-forwarded-proto'] === 'http') { res.writeHead(301, { location: `${SITE_URL}${url.pathname}${url.search}` }).end(); return; }
    securityHeaders(res);
    if (!INDEXING) res.setHeader('x-robots-tag', 'noindex, follow');

    if (url.pathname.startsWith('/admin')) { res.setHeader('x-robots-tag', 'noindex, nofollow'); return await handleAdmin(req, res, url); }
    if (url.pathname === '/api/event') {
      // Aggregate counts only (no cookies, no personal data). Always 204 so it can't be used to probe anything.
      if (req.method === 'POST') {
        try {
          checkOrigin(req);
          rateLimit(`ev:${clientIp(req)}`, 120, 3600e3);
          const body = JSON.parse((await readBody(req, 2048)).toString('utf8') || '{}');
          if (CLIENT_EVENTS.has(body.e)) track(body.e, safeLabel(body.l));
        } catch { /* ignore malformed or limited events */ }
      }
      res.writeHead(204, { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' }).end(); return;
    }
    if (url.pathname.startsWith('/api/')) {
      res.setHeader('x-robots-tag', 'noindex, nofollow');
      if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed.');
      const wantsJson = String(req.headers.accept || '').includes('application/json');
      let result;
      try {
        if (url.pathname === '/api/inquiry') result = await handleInquiry(req);
        else if (url.pathname === '/api/trade-application') result = await handleTradeApplication(req);
        else if (url.pathname.startsWith('/api/trade-docs/')) result = await handleTradeDocs(req, url.pathname.slice('/api/trade-docs/'.length));
        else throw new HttpError(404, 'Not found.');
      } catch (e) {
        if (!(e instanceof HttpError)) { console.error(e); e = new HttpError(500, 'Something went wrong on our side and your submission was not saved. Please try again.'); }
        if (wantsJson) return sendJson(res, e.status, { ok: false, error: e.message, fields: e.extra?.fields || null });
        const fields = e.extra?.fields ? `<ul>${Object.values(e.extra.fields).map((m) => `<li>${String(m).replace(/[<&]/g, '')}</li>`).join('')}</ul>` : '';
        return sendBody(req, res, e.status, 'text/html; charset=utf-8', `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not sent</title><link rel="stylesheet" href="/css/site.css"><main class="wrap section"><h1 class="h2">Your form was not sent.</h1><p class="lede mt-2">${e.message}</p>${fields}<p class="mt-3">Use your browser’s back button to return to the form — what you entered should still be there.</p><p class="mt-3"><a class="btn" href="${url.pathname === '/api/inquiry' ? '/start/' : '/trade-partners/'}">Open the form again</a></p></main>`);
      }
      if (wantsJson) return sendJson(res, 200, result);
      if (url.pathname === '/api/inquiry') return sendBody(req, res, 200, 'text/html; charset=utf-8', receivedPage(result.ref), { 'cache-control': 'no-store' });
      return sendBody(req, res, 200, 'text/html; charset=utf-8', `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Received</title><link rel="stylesheet" href="/css/site.css"><main class="wrap section"><h1 class="h2">Received — thank you.</h1>${result.ref ? `<p class="lede">Reference ${result.ref}.</p>` : ''}<p class="mt-3"><a class="btn" href="/">Back to home</a></p></main>`);
    }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { allow: 'GET, HEAD' }).end(); return; }

    if (url.pathname.startsWith('/media/')) {
      const m = url.pathname.match(/^\/media\/([\w-]+)\.(jpg|png|webp)$/);
      const p = m && publishedPhoto(m[1]);
      if (!p || p.ext !== m[2]) throw new HttpError(404, 'Not found');
      return sendBody(req, res, 200, TYPES['.' + p.ext], fs.readFileSync(path.join(MEDIA_DIR, `${p.id}.${p.ext}`)), { 'cache-control': 'public, max-age=86400' });
    }
    if (path.extname(url.pathname) && !GENERATED.has(url.pathname) && staticFile(req, res, url.pathname)) return;

    // Clean URLs: lowercase + trailing slash for pages.
    if (!path.extname(url.pathname) && !url.pathname.endsWith('/')) { res.writeHead(301, { location: url.pathname + '/' + url.search }).end(); return; }
    if (/[A-Z]/.test(url.pathname) && !path.extname(url.pathname) && !url.pathname.startsWith('/trade-partners/documents/')) { res.writeHead(301, { location: url.pathname.toLowerCase() + url.search }).end(); return; }

    const bot = crawlerOf(req.headers['user-agent']);
    if (bot) { track('crawler', bot); console.log(`crawler ${bot} ${url.pathname}`); } // claimed user agent; not verified
    if (url.pathname === '/start/' && query0(url).service) track('start_view_from_service', safeLabel(query0(url).service));
    const key = `${url.pathname}|${contentVersion()}`;
    const query = Object.fromEntries(url.searchParams);
    const cacheable = !UNCACHED.has(url.pathname) && !url.pathname.startsWith('/trade-partners/documents/') && !url.search;
    let page = cacheable ? cache.get(key) : null;
    if (!page) {
      page = route(url.pathname, query);
      if (cacheable && page.status === 200) { if (cache.size > 500) cache.clear(); cache.set(key, page); }
    }
    if (page.redirect) { res.writeHead(301, { location: page.redirect }).end(); return; }
    if (page.noindex) res.setHeader('x-robots-tag', 'noindex, follow');
    return sendBody(req, res, page.status, page.type || 'text/html; charset=utf-8', page.body, { 'cache-control': page.status === 200 && cacheable ? 'no-cache' : 'no-store' });
  } catch (err) {
    if (err?.status && err.status < 500) {
      if (err.status === 404) { const p = route('/__404__', {}); return sendBody(req, res, 404, 'text/html; charset=utf-8', p.body, { 'cache-control': 'no-store' }); }
      if (!res.headersSent) res.writeHead(err.status, { 'content-type': 'text/plain; charset=utf-8' }).end(err.message); return;
    }
    console.error(err);
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain' }).end('Server error');
  }
});
server.requestTimeout = 120000;
server.listen(port, () => console.log(`Nation Design & Construction on http://localhost:${port} (${ENV}, indexing ${INDEXING ? 'on' : 'off'}, canonical ${SITE_URL})`));

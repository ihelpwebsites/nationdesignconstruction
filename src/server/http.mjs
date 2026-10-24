// Small HTTP helpers (no framework). Adapted from the OWR build.
export class HttpError extends Error {
  constructor(status, message, extra) { super(message); this.status = status; this.extra = extra; }
}

export function sendJson(res, status, body, headers = {}) {
  const buf = Buffer.from(JSON.stringify(body));
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow', ...headers });
  res.end(buf);
}

export async function readBody(req, limit) {
  const declared = Number(req.headers['content-length'] || 0);
  if (declared > limit) throw new HttpError(413, `That upload is too large. The limit is ${Math.round(limit / 1e6)} MB in total.`);
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw new HttpError(413, `That upload is too large. The limit is ${Math.round(limit / 1e6)} MB in total.`);
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}

/** Parses application/x-www-form-urlencoded or multipart/form-data. Returns { fields: {name: string|string[]}, files: [] }. */
export async function readForm(req, limit) {
  const type = String(req.headers['content-type'] || '');
  const body = await readBody(req, limit);
  if (type.startsWith('application/x-www-form-urlencoded')) {
    const fields = {};
    for (const [k, v] of new URLSearchParams(body.toString('utf8'))) add(fields, k, v);
    return { fields, files: [] };
  }
  const m = type.match(/^multipart\/form-data;.*boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!m) throw new HttpError(415, 'Unsupported form encoding.');
  return parseMultipart(body, m[1] || m[2]);
}
function add(obj, k, v) {
  if (k in obj) obj[k] = [].concat(obj[k], v); else obj[k] = v;
}
function parseMultipart(buf, boundary) {
  const fields = {}, files = [];
  const delim = Buffer.from(`--${boundary}`);
  let pos = buf.indexOf(delim);
  if (pos < 0) throw new HttpError(400, 'Malformed form data.');
  let parts = 0;
  while (true) {
    pos += delim.length;
    if (buf[pos] === 0x2d && buf[pos + 1] === 0x2d) break; // closing --
    pos += 2; // CRLF
    const headEnd = buf.indexOf('\r\n\r\n', pos);
    if (headEnd < 0) throw new HttpError(400, 'Malformed form data.');
    const head = buf.subarray(pos, headEnd).toString('utf8');
    const next = buf.indexOf(delim, headEnd + 4);
    if (next < 0) throw new HttpError(400, 'Malformed form data.');
    const data = buf.subarray(headEnd + 4, next - 2); // strip CRLF before delimiter
    if (++parts > 60) throw new HttpError(400, 'Too many form fields.');
    const disp = head.match(/content-disposition:[^\r\n]*/i)?.[0] || '';
    const name = disp.match(/\bname="([^"]*)"/i)?.[1];
    const filename = disp.match(/\bfilename="([^"]*)"/i)?.[1];
    if (name != null) {
      if (filename != null) { if (data.length) files.push({ field: name, filename: filename.replace(/[\\/]/g, '_').slice(0, 140), data }); }
      else add(fields, name, data.toString('utf8'));
    }
    pos = next;
  }
  return { fields, files };
}

export function cookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i <= 0) continue;
    try { out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); } catch { /* ignore that cookie */ }
  }
  return out;
}

export function cookie(name, value, { maxAge, path = '/', secure } = {}) {
  return [`${name}=${encodeURIComponent(value)}`, `Path=${path}`, 'HttpOnly', 'SameSite=Lax',
    secure ? 'Secure' : null, maxAge != null ? `Max-Age=${maxAge}` : null].filter(Boolean).join('; ');
}

/** State-changing requests must come from our own origin (defence in depth with SameSite cookies + CSRF token). */
export function checkOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  let originHost;
  try { originHost = new URL(origin).host; } catch { originHost = null; }
  if (originHost !== host) throw new HttpError(403, 'Cross-origin request refused.');
}

// Fixed-window rate limit per key. In-memory: fine for one process.
const windows = new Map();
let calls = 0;
export function rateLimit(key, max, windowMs, message = 'Too many requests. Please wait a few minutes and try again.') {
  const t = Date.now();
  if (++calls % 500 === 0) for (const [k, w] of windows) if (t - w.start > w.ms) windows.delete(k);
  const w = windows.get(key);
  if (!w || t - w.start > windowMs) { windows.set(key, { start: t, n: 1, ms: windowMs }); return; }
  if (++w.n > max) throw new HttpError(429, message);
}

// Client IP. Only the X-Forwarded-For entry TRUST_PROXY_HOPS from the right is trusted.
const HOPS = Number(process.env.TRUST_PROXY_HOPS || 0);
export function clientIp(req) {
  if (HOPS > 0) {
    const xff = String(req.headers['x-forwarded-for'] || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (xff.length >= HOPS) return xff[xff.length - HOPS];
  }
  return req.socket.remoteAddress || 'unknown';
}

// Upload type check by magic bytes (never trust the browser's content-type).
export function sniff(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (buf.subarray(4, 8).toString() === 'ftyp' && /heic|heix|mif1|hevc/.test(buf.subarray(8, 12).toString())) return 'image/heic';
  if (buf.subarray(0, 5).toString() === '%PDF-') return 'application/pdf';
  return null;
}
export const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'application/pdf': 'pdf' };

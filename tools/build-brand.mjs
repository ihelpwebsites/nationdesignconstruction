// Generates the Nation Design & Construction logo set as outlined SVG (no font dependency), plus PNG/ICO
// rasters via headless Edge. Output: public/brand/ (served) — the SVGs are the editable masters.
// Usage: node tools/build-brand.mjs [--png]
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public/brand');
mkdirSync(out, { recursive: true });

export const COLORS = { ivory: '#F6F2EA', charcoal: '#1E1D1B', bronze: '#9C6B3C', bronzeLight: '#C99A69', stone: '#D8D0C2', black: '#000000', white: '#FFFFFF' };

// ---------- minimal WOFF 1.0 → glyph outline reader (TrueType glyf, simple glyphs) ----------
function readWoff(file) {
  const b = readFileSync(file);
  const numTables = b.readUInt16BE(12);
  const tables = {};
  for (let i = 0; i < numTables; i++) {
    const o = 44 + i * 20;
    const tag = b.toString('latin1', o, o + 4);
    const off = b.readUInt32BE(o + 4), comp = b.readUInt32BE(o + 8), orig = b.readUInt32BE(o + 12);
    const raw = b.subarray(off, off + comp);
    tables[tag] = comp < orig ? inflateSync(raw) : raw;
  }
  const head = tables.head, upm = head.readUInt16BE(18), locFmt = head.readInt16BE(50);
  const numGlyphs = tables.maxp.readUInt16BE(4), numH = tables.hhea.readUInt16BE(34);
  const adv = (g) => tables.hmtx.readUInt16BE(4 * Math.min(g, numH - 1));
  const loca = (g) => (locFmt ? tables.loca.readUInt32BE(g * 4) : tables.loca.readUInt16BE(g * 2) * 2);
  // cmap format 4
  const cm = tables.cmap; let sub = null;
  for (let i = 0; i < cm.readUInt16BE(2); i++) {
    const pid = cm.readUInt16BE(4 + i * 8), eid = cm.readUInt16BE(6 + i * 8), off = cm.readUInt32BE(8 + i * 8);
    if (cm.readUInt16BE(off) === 4 && (pid === 3 && eid === 1 || pid === 0)) { sub = off; break; }
  }
  const segX2 = cm.readUInt16BE(sub + 6), ends = sub + 14, starts = ends + segX2 + 2, deltas = starts + segX2, ros = deltas + segX2;
  const glyphIndex = (code) => {
    for (let i = 0; i < segX2 / 2; i++) {
      const end = cm.readUInt16BE(ends + i * 2); if (code > end) continue;
      const start = cm.readUInt16BE(starts + i * 2); if (code < start) return 0;
      const delta = cm.readInt16BE(deltas + i * 2), ro = cm.readUInt16BE(ros + i * 2);
      if (!ro) return (code + delta) & 0xffff;
      const g = cm.readUInt16BE(ros + i * 2 + ro + (code - start) * 2);
      return g ? (g + delta) & 0xffff : 0;
    }
    return 0;
  };
  // returns contours: arrays of {x,y,on}
  const contours = (g) => {
    const s = loca(g), e = loca(g + 1); if (e <= s) return [];
    const d = tables.glyf.subarray(s, e); const n = d.readInt16BE(0);
    if (n < 0) throw new Error('composite glyph not supported: ' + g);
    const endPts = []; for (let i = 0; i < n; i++) endPts.push(d.readUInt16BE(10 + i * 2));
    const nPts = endPts[n - 1] + 1; let p = 10 + n * 2; p += 2 + d.readUInt16BE(p);
    const flags = [];
    while (flags.length < nPts) { const f = d[p++]; flags.push(f); if (f & 8) { let r = d[p++]; while (r--) flags.push(f); } }
    const xs = [], ys = []; let v = 0;
    for (const f of flags) { if (f & 2) { const dx = d[p++]; v += f & 16 ? dx : -dx; } else if (!(f & 16)) { v += d.readInt16BE(p); p += 2; } xs.push(v); }
    v = 0;
    for (const f of flags) { if (f & 4) { const dy = d[p++]; v += f & 32 ? dy : -dy; } else if (!(f & 32)) { v += d.readInt16BE(p); p += 2; } ys.push(v); }
    const res = []; let st = 0;
    for (const en of endPts) { const c = []; for (let i = st; i <= en; i++) c.push({ x: xs[i], y: ys[i], on: !!(flags[i] & 1) }); res.push(c); st = en + 1; }
    return res;
  };
  return { upm, glyphIndex, adv, contours, numGlyphs };
}

const f = (n) => +n.toFixed(2);
// Text → outlined path data. Origin = left baseline at (x, y); size = cap-height in px; tracking in em.
function textPath(font, text, x, y, capPx, tracking) {
  const capH = font.upm * 0.7; // Instrument Sans cap height ≈ 0.7 em
  const k = capPx / capH; let cx = x; const parts = [];
  for (const ch of text) {
    const g = font.glyphIndex(ch.codePointAt(0));
    for (const c of font.contours(g)) {
      // expand implied on-curve points (TrueType quadratic)
      const pts = []; const L = c.length;
      for (let i = 0; i < L; i++) {
        const a = c[i], b = c[(i + 1) % L]; pts.push(a);
        if (!a.on && !b.on) pts.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, on: true });
      }
      let s = pts.findIndex((q) => q.on); const seq = pts.slice(s).concat(pts.slice(0, s));
      const T = (q) => `${f(cx + q.x * k)} ${f(y - q.y * k)}`;
      let dStr = `M${T(seq[0])}`;
      for (let i = 1; i <= seq.length; i++) {
        const q = seq[i % seq.length];
        if (q.on) dStr += `L${T(q)}`; else { const n = seq[(i + 1) % seq.length]; dStr += `Q${T(q)} ${T(n)}`; i++; }
      }
      parts.push(dStr + 'Z');
    }
    cx += font.adv(g) * k + tracking * capPx / 0.7;
  }
  return { d: parts.join(''), width: cx - x - tracking * capPx / 0.7 };
}

// ---------- geometric NATION wordmark (drawn, not typeset) ----------
// Cap height 30, stroke 6. Each glyph returns [pathData, advanceWidth].
const R = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}Z`;
const P = (...pts) => 'M' + pts.map(([a, b]) => `${f(a)} ${f(b)}`).join('L') + 'Z';
const GLYPHS = {
  N: () => [R(0, 0, 6, 30) + R(22, 0, 6, 30) + P([0, 0], [7.2, 0], [28, 30], [20.8, 30]), 28],
  A: () => [P([0, 30], [11.3, 0], [18.7, 0], [7, 30]) + P([11.3, 0], [18.7, 0], [30, 30], [23, 30]) + R(6.5, 19, 17, 5.5), 30],
  T: () => [R(0, 0, 26, 6) + R(10, 0, 6, 30), 26],
  I: () => [R(0, 0, 6, 30), 6],
  O: () => [`M15 0A15 15 0 1 1 15 30A15 15 0 1 1 15 0ZM15 6A9 9 0 1 0 15 24A9 9 0 1 0 15 6Z`, 30],
};
function wordmark(x, y, scale, tracking = 9) {
  let cx = 0; const parts = [];
  for (const ch of 'NATION') {
    const [d, w] = GLYPHS[ch]();
    parts.push(`<path transform="translate(${f(x + cx * scale)} ${f(y)}) scale(${scale})" d="${d}"/>`);
    cx += w + tracking;
  }
  return { svg: parts.join(''), width: (cx - tracking) * scale };
}

// ---------- the N monogram mark: two piers, a free-standing diagonal brace, and a ground line ----------
// 48×48 box. `brace` colour can differ (bronze accent) from piers.
function mark(x, y, s, main, brace) {
  const t = (d) => `<path transform="translate(${f(x)} ${f(y)}) scale(${s})" d="${d}"/>`;
  return `<g fill="${main}">${t(R(6, 4, 8, 34) + R(34, 4, 8, 34) + R(2, 41, 44, 3))}</g>` +
    `<g fill="${brace}">${t(P([14, 4], [20.5, 4], [34, 31.5], [34, 38], [27.5, 38], [14, 10.5]))}</g>`;
}

const font = readWoff(join(root, 'brand/src/instrument-sans-600.woff'));

function lockupHorizontal({ fg, accent, sub, bg }) {
  // mark 72px tall, wordmark cap height 42, descriptor beneath
  const H = 96, markS = 1.75, mk = mark(0, 6, markS, fg, accent);
  const wm = wordmark(108, 12, 1.4);
  const line = textPath(font, 'DESIGN & CONSTRUCTION', 108, 82, 11.2, 0.0);
  // stretch tracking so the descriptor matches the wordmark width
  const extra = (wm.width - line.width) / ('DESIGN & CONSTRUCTION'.length - 1);
  const line2 = textPath(font, 'DESIGN & CONSTRUCTION', 108, 82, 11.2, extra * 0.7 / 11.2);
  const W = Math.ceil(108 + wm.width + 4);
  return svgDoc(W, H, bg, `${mk}<g fill="${fg}">${wm.svg}</g><path fill="${sub}" d="${line2.d}"/>`);
}
function lockupStacked({ fg, accent, sub, bg }) {
  const wm = wordmark(0, 0, 1.6); const W = Math.ceil(wm.width), mS = 2.2, mW = 48 * mS;
  const mk = mark((W - mW) / 2, 0, mS, fg, accent);
  const wm2 = wordmark(0, 128, 1.6);
  const base = textPath(font, 'DESIGN & CONSTRUCTION', 0, 200, 12.6, 0);
  const extra = (W - base.width) / 20; const line = textPath(font, 'DESIGN & CONSTRUCTION', 0, 200, 12.6, extra * 0.7 / 12.6);
  return svgDoc(W, 206, bg, `${mk}<g fill="${fg}">${wm2.svg}</g><path fill="${sub}" d="${line.d}"/>`);
}
function markOnly({ fg, accent, bg, pad = 0, size = 48, radius = 0 }) {
  const S = size, s = (S - pad * 2) / 48;
  const back = bg ? `<rect width="${S}" height="${S}" rx="${radius}" fill="${bg}"/>` : '';
  return svgDoc(S, S, null, back + mark(pad, pad, s, fg, accent));
}
function svgDoc(w, h, bg, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Nation Design &amp; Construction">` +
    `<title>Nation Design &amp; Construction</title>${bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}${inner}</svg>\n`;
}

const C = COLORS;
const files = {
  // full colour, for light backgrounds (ivory/white)
  'logo-horizontal-light.svg': lockupHorizontal({ fg: C.charcoal, accent: C.bronze, sub: C.charcoal }),
  // full colour, for dark backgrounds (charcoal/photos)
  'logo-horizontal-dark.svg': lockupHorizontal({ fg: C.ivory, accent: C.bronzeLight, sub: C.ivory }),
  'logo-horizontal-black.svg': lockupHorizontal({ fg: C.black, accent: C.black, sub: C.black }),
  'logo-horizontal-white.svg': lockupHorizontal({ fg: C.white, accent: C.white, sub: C.white }),
  'logo-stacked-light.svg': lockupStacked({ fg: C.charcoal, accent: C.bronze, sub: C.charcoal }),
  'logo-stacked-dark.svg': lockupStacked({ fg: C.ivory, accent: C.bronzeLight, sub: C.ivory }),
  'logo-stacked-black.svg': lockupStacked({ fg: C.black, accent: C.black, sub: C.black }),
  'logo-stacked-white.svg': lockupStacked({ fg: C.white, accent: C.white, sub: C.white }),
  'mark-light.svg': markOnly({ fg: C.charcoal, accent: C.bronze }),
  'mark-dark.svg': markOnly({ fg: C.ivory, accent: C.bronzeLight }),
  'mark-black.svg': markOnly({ fg: C.black, accent: C.black }),
  'mark-white.svg': markOnly({ fg: C.white, accent: C.white }),
  'favicon.svg': markOnly({ fg: C.ivory, accent: C.bronzeLight, bg: C.charcoal, size: 64, pad: 10, radius: 12 }),
  'app-icon.svg': markOnly({ fg: C.ivory, accent: C.bronzeLight, bg: C.charcoal, size: 512, pad: 104, radius: 0 }),
  'logo-horizontal-light-on-ivory.svg': lockupHorizontal({ fg: C.charcoal, accent: C.bronze, sub: C.charcoal, bg: C.ivory }),
  'logo-horizontal-dark-on-charcoal.svg': lockupHorizontal({ fg: C.ivory, accent: C.bronzeLight, sub: C.ivory, bg: C.charcoal }),
};
for (const [n, s] of Object.entries(files)) writeFileSync(join(out, n), s);
console.log('wrote', Object.keys(files).length, 'SVGs to public/brand');

// ---------- rasters (PNG via headless Edge, ICO wraps PNGs) ----------
if (process.argv.includes('--png')) {
  const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
  const tmp = join(tmpdir(), 'ndc-brand'); mkdirSync(tmp, { recursive: true });
  const shot = (svgName, px, pngName, bg = null) => {
    const html = join(tmp, pngName + '.html');
    writeFileSync(html, `<html><body style="margin:0;background:${bg || 'transparent'}"><img src="file:///${join(out, svgName).replace(/\\/g, '/')}" style="width:${px[0]}px;height:${px[1]}px;display:block"></body></html>`);
    const dest = join(out, pngName); if (existsSync(dest)) rmSync(dest);
    execFileSync(edge, ['--headless', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${join(tmp, 'profile')}`, '--default-background-color=00000000',
      `--window-size=${px[0]},${px[1]}`, `--screenshot=${dest}`, 'file:///' + html.replace(/\\/g, '/')], { stdio: 'ignore' });
    console.log('png', pngName);
  };
  shot('favicon.svg', [32, 32], 'favicon-32.png');
  shot('favicon.svg', [16, 16], 'favicon-16.png');
  shot('app-icon.svg', [180, 180], 'apple-touch-icon.png');
  shot('app-icon.svg', [512, 512], 'icon-512.png');
  shot('app-icon.svg', [192, 192], 'icon-192.png');
  const dims = (n) => { const s = readFileSync(join(out, n), 'utf8').match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/); return [+s[1], +s[2]]; };
  for (const n of ['logo-horizontal-light', 'logo-horizontal-dark', 'logo-stacked-light', 'logo-stacked-dark', 'logo-horizontal-black', 'logo-horizontal-white']) {
    const [w, h] = dims(n + '.svg'); const k = 1600 / w; shot(n + '.svg', [1600, Math.round(h * k)], n + '.png');
  }
  // ICO containing 16 + 32 PNGs
  const pngs = ['favicon-16.png', 'favicon-32.png'].map((n) => readFileSync(join(out, n)));
  const hdr = Buffer.alloc(6 + 16 * pngs.length); hdr.writeUInt16LE(1, 2); hdr.writeUInt16LE(pngs.length, 4);
  let off = hdr.length;
  pngs.forEach((p, i) => { const sz = [16, 32][i]; const o = 6 + i * 16; hdr[o] = sz; hdr[o + 1] = sz; hdr.writeUInt16LE(1, o + 4); hdr.writeUInt16LE(32, o + 6); hdr.writeUInt32LE(p.length, o + 8); hdr.writeUInt32LE(off, o + 12); off += p.length; });
  writeFileSync(join(root, 'public/favicon.ico'), Buffer.concat([hdr, ...pngs]));
  console.log('favicon.ico');
}

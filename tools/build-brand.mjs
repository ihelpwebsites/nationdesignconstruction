// Rasterizes the approved NATION vector assets (public/brand/*.svg) into favicons, app icons and the social-sharing
// image via headless Edge. The SVG masters come from tools/logo-trace (traced from the approved artwork).
// Usage (PowerShell): node tools/build-brand.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const root = join(import.meta.dirname, '..');
const brand = join(root, 'public/brand');
const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const tmp = join(tmpdir(), 'ndc-brand'); mkdirSync(tmp, { recursive: true });
const url = (f) => 'file:///' + f.replace(/\\/g, '/').replace(/ /g, '%20');

function shot(html, [w, h], out) {
  const file = join(tmp, out + '.html');
  writeFileSync(file, `<!doctype html><html><body style="margin:0;background:transparent">${html}</body></html>`);
  const dest = join(out.startsWith('/') ? '' : brand, out);
  if (existsSync(dest)) rmSync(dest);
  execFileSync(edge, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', `--user-data-dir=${join(tmp, 'profile')}`,
    '--default-background-color=00000000', `--window-size=${w},${h}`, `--screenshot=${dest}`, url(file)], { stdio: 'ignore', timeout: 60000 });
  console.log('png', out);
}
const img = (svg, w, h, style = '') => `<img src="${url(join(brand, svg))}" width="${w}" height="${h}" style="display:block;${style}">`;

shot(img('nation-favicon.svg', 16, 16), [16, 16], 'nation-favicon-16.png');
shot(img('nation-favicon.svg', 32, 32), [32, 32], 'nation-favicon-32.png');
shot(img('nation-app-icon.svg', 180, 180), [180, 180], 'nation-apple-touch-icon.png');
shot(img('nation-app-icon.svg', 192, 192), [192, 192], 'nation-icon-192.png');
shot(img('nation-app-icon.svg', 512, 512), [512, 512], 'nation-icon-512.png');
// Social sharing card: approved logo centred on warm ivory with generous clear space.
shot(`<div style="width:1200px;height:630px;background:#F6F2EA;display:grid;place-items:center">${img('nation-logo.svg', 880, 217)}</div>`, [1200, 630], 'nation-og-image.png');

// favicon.ico wrapping the 16 + 32 PNGs
const pngs = ['nation-favicon-16.png', 'nation-favicon-32.png'].map((n) => readFileSync(join(brand, n)));
const hdr = Buffer.alloc(6 + 16 * pngs.length); hdr.writeUInt16LE(1, 2); hdr.writeUInt16LE(pngs.length, 4);
let off = hdr.length;
pngs.forEach((p, i) => { const sz = [16, 32][i]; const o = 6 + i * 16; hdr[o] = sz; hdr[o + 1] = sz; hdr.writeUInt16LE(1, o + 4); hdr.writeUInt16LE(32, o + 6); hdr.writeUInt32LE(p.length, o + 8); hdr.writeUInt32LE(off, o + 12); off += p.length; });
writeFileSync(join(root, 'public/favicon.ico'), Buffer.concat([hdr, ...pngs]));
console.log('favicon.ico');

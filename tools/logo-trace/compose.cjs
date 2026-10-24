const fs = require('fs'), path = require('path');
const OUT = path.resolve(__dirname, '../../public/brand');
const { symV, txtV, full, sym } = JSON.parse(fs.readFileSync(path.join(__dirname, 'trace.json'), 'utf8'));
const C = { bronze: '#795C38', charcoal: '#202428', ivory: '#F6F2EA', bronzeLight: '#C99A69' };
const svg = (vb, w, h, inner, label = 'Nation Design &amp; Construction') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w}" height="${h}" role="img" aria-label="${label}"><title>${label}</title>${inner}</svg>\n`;
const OFF = Number(process.env.OFF ?? -0.2);   // calibrated: best pixel match to the approved raster
const shift = (tf) => tf.replace(/translate\((\S+) (\S+)\)/, (m, x, y) => `translate(${+x + OFF} ${+y + OFF})`);
const p = (v, fill) => `<path fill="${fill}" fill-rule="evenodd" transform="${shift(v.tf)}" d="${v.d}"/>`;
const fullVB = `${full.x0} ${full.y0} ${full.w} ${full.h}`;
const pad = 10, symVB = `${sym.x0 - pad} ${sym.y0 - pad} ${sym.w + 2 * pad} ${sym.h + 2 * pad}`;
const files = {
  'nation-logo.svg': svg(fullVB, full.w, full.h, p(symV, C.bronze) + p(txtV, C.charcoal)),
  'nation-logo-ivory.svg': svg(fullVB, full.w, full.h, p(symV, C.bronzeLight) + p(txtV, C.ivory)),
  'nation-logo-bronze-ivory.svg': svg(fullVB, full.w, full.h, p(symV, C.bronze) + p(txtV, C.ivory)),
  'nation-logo-black.svg': svg(fullVB, full.w, full.h, p(symV, '#000') + p(txtV, '#000')),
  'nation-logo-white.svg': svg(fullVB, full.w, full.h, p(symV, '#fff') + p(txtV, '#fff')),
  'nation-symbol.svg': svg(symVB, sym.w + 2 * pad, sym.h + 2 * pad, p(symV, C.bronze), 'Nation symbol'),
  'nation-symbol-light.svg': svg(symVB, sym.w + 2 * pad, sym.h + 2 * pad, p(symV, C.bronzeLight), 'Nation symbol'),
};
// Tight crops (4 px margin) for UI placements where CSS provides the clear space.
const T = 4, tightVB = `${full.x0 + 24 - T} ${full.y0 + 24 - T} ${full.w - 48 + 2 * T} ${full.h - 48 + 2 * T}`, tw = full.w - 48 + 2 * T, th = full.h - 48 + 2 * T;
files['nation-logo-tight.svg'] = svg(tightVB, tw, th, p(symV, C.bronze) + p(txtV, C.charcoal));
files['nation-logo-ivory-tight.svg'] = svg(tightVB, tw, th, p(symV, C.bronzeLight) + p(txtV, C.ivory));
// favicon / app icon: symbol centred on warm ivory
const S = Math.max(sym.w, sym.h), cx = sym.x0 + sym.w / 2, cy = sym.y0 + sym.h / 2;
const icon = (padFrac, radius) => { const side = S * (1 + 2 * padFrac); const x = cx - side / 2, y = cy - side / 2;
  return svg(`${x} ${y} ${side} ${side}`, 512, 512, `<rect x="${x}" y="${y}" width="${side}" height="${side}" rx="${side * radius}" fill="${C.ivory}"/>` + p(symV, C.bronze), 'Nation'); };
files['nation-favicon.svg'] = icon(0.12, 0.18);
files['nation-app-icon.svg'] = icon(0.22, 0);
for (const [n, s] of Object.entries(files)) fs.writeFileSync(path.join(OUT, n), s);
console.log(Object.keys(files).map((n) => `${n} ${fs.statSync(path.join(OUT, n)).size}`).join('\n'));

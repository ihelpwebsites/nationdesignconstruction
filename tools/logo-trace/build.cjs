// Builds the approved NATION logo assets from the approved raster:
//  1) transparent rasters (ink unmixed from the ivory background, exact edge anti-aliasing kept)
//  2) traced vectors (potrace on 3x-upscaled per-ink masks), verified against the raster afterwards
const Jimp = require('jimp');
const potrace = require('potrace');
const fs = require('fs');
const path = require('path');
const OUT = path.resolve(__dirname, '../../public/brand');
const SRC = path.resolve(__dirname, '../../brand/src/approved-logo-reference.png');
const BG = [254, 253, 247];
const BRONZE = [121, 92, 56], DARK = [32, 36, 40];
const SPLIT_X = 505;                       // symbol is left of this, lettering right
const BOX = { x0: 132, y0: 262, x1: 1665, y1: 603 };   // ink bounding box (measured)
const SYM = { x0: 132, y0: 262, x1: 453, y1: 603 };

const trace = (img, opts) => new Promise((res, rej) => { const p = new potrace.Potrace(opts); p.loadImage(img, (e) => e ? rej(e) : res(p)); });

(async () => {
  const src = await Jimp.read(SRC);
  const { width: W, height: H, data } = src.bitmap;
  // alpha per pixel for the ink assigned to its side of the split
  const alpha = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, ink = x < SPLIT_X ? BRONZE : DARK;
    let num = 0, den = 0;
    for (let c = 0; c < 3; c++) { num += (BG[c] - data[i + c]) * (BG[c] - ink[c]); den += (BG[c] - ink[c]) ** 2; }
    let a = num / den; a = a < 0.035 ? 0 : a > 0.97 ? 1 : a;   // drop paper noise, solidify cores
    alpha[y * W + x] = a;
  }
  const crop = (b, pad) => ({ x0: b.x0 - pad, y0: b.y0 - pad, w: b.x1 - b.x0 + 1 + 2 * pad, h: b.y1 - b.y0 + 1 + 2 * pad });

  async function raster(name, box, colors, scale = 1) {
    const img = new Jimp(box.w, box.h, 0x00000000);
    for (let y = 0; y < box.h; y++) for (let x = 0; x < box.w; x++) {
      const sx = x + box.x0, sy = y + box.y0;
      if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue;
      const a = alpha[sy * W + sx]; if (!a) continue;
      const col = sx < SPLIT_X ? colors.symbol : colors.text;
      const j = (y * box.w + x) * 4; img.bitmap.data[j] = col[0]; img.bitmap.data[j + 1] = col[1]; img.bitmap.data[j + 2] = col[2]; img.bitmap.data[j + 3] = Math.round(a * 255);
    }
    if (scale !== 1) img.resize(Math.round(box.w * scale), Math.round(box.h * scale), Jimp.RESIZE_BICUBIC);
    await img.writeAsync(path.join(OUT, name));
    return img;
  }
  const IVORY = [246, 242, 234], BRONZE_LIGHT = [201, 154, 105], BLACK = [0, 0, 0], WHITE = [255, 255, 255];
  const full = crop(BOX, 24), sym = crop(SYM, 0);
  await raster('nation-logo.png', full, { symbol: BRONZE, text: DARK });
  await raster('nation-logo-ivory.png', full, { symbol: BRONZE_LIGHT, text: IVORY });
  await raster('nation-symbol.png', sym, { symbol: BRONZE, text: BRONZE });

  // ---- vector trace (per ink, 3x upscale for smooth curves) ----
  async function tracePart(b, opts) {
    const S = 3, w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1;
    const m = new Jimp(w, h, 0xffffffff);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = Math.round(255 * (1 - alpha[(y + b.y0) * W + x + b.x0])); const j = (y * w + x) * 4; m.bitmap.data[j] = m.bitmap.data[j + 1] = m.bitmap.data[j + 2] = v; }
    m.resize(w * S, h * S, Jimp.RESIZE_BICUBIC);
    const p = await trace(m, { threshold: 128, turdSize: 20, optTolerance: 0.2, ...opts });
    const d = p.getPathTag('#000').match(/ d="([^"]+)"/)[1];
    // scale back to source pixel units and offset into the full-logo coordinate space
    const scaled = d.replace(/-?\d+(\.\d+)?/g, (n, _g, off, str) => n); // placeholder (transform applied via attribute)
    return { d: scaled, tf: `translate(${b.x0} ${b.y0}) scale(${1 / S})` };
  }
  const symV = await tracePart({ x0: SYM.x0 - 2, y0: SYM.y0 - 2, x1: SYM.x1 + 2, y1: SYM.y1 + 2 }, { alphaMax: 0.0 });   // straight planes → polygons
  const txtV = await tracePart({ x0: 540, y0: 300, x1: BOX.x1 + 2, y1: BOX.y1 + 2 }, { alphaMax: 1.0 });
  fs.writeFileSync(path.join(__dirname, 'trace.json'), JSON.stringify({ symV, txtV, full, sym }));
  console.log('ok', full, sym);
})();

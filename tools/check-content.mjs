// Validates service/overview content files against src/content/SCHEMA.md.
// Usage: node tools/check-content.mjs [category-slug ...]   (no args = everything present)
import { existsSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { CATEGORIES, SERVICES, OVERVIEWS, serviceBySlug } from '../src/data/catalog.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const wanted = process.argv.slice(2);
const errors = [];
const warn = [];

// Phrases that usually mean an invented fact or a banned claim.
const BANNED = [
  /\$\s?\d/, /\b\d+\s?%/, /\bstarting at\b/i, /\bguarantee/i, /\bwarrant(y|ies) (of|for) \d/i,
  /\b\d+\s?(-|–|to)\s?\d+\s?(days?|weeks?|months?)\b/i, /\b\d+\s?(days?|weeks?|months?|years?)\b/i,
  /\bour (licensed|certified|in-house|own) /i, /\bour (crews?|engineers?|architects?|electricians?|plumbers?|roofers?|designers?|team of)\b/i,
  /\byears of experience\b/i, /\baward/i, /\bbest\b/i, /!/, /\bfully (licensed|insured)\b/i, /\blicensed and insured\b/i,
  /\bpermanent(ly)? fix/i, /\bfree (estimate|quote|consultation)/i, /\bstatute\b|§|\bF\.S\./i,
];

function checkText(where, s) {
  if (typeof s !== 'string' || !s.trim()) { errors.push(`${where}: empty or not a string`); return; }
  for (const re of BANNED) if (re.test(s)) warn.push(`${where}: matches ${re} → "${s.slice(0, 110)}"`);
  if (/<[a-z]|\*\*|\]\(/i.test(s)) errors.push(`${where}: contains HTML/Markdown`);
}
function arr(where, a, min, max, fn = checkText) {
  if (!Array.isArray(a)) { errors.push(`${where}: missing array`); return; }
  if (a.length < min || a.length > max) warn.push(`${where}: ${a.length} items (expected ${min}–${max})`);
  a.forEach((x, i) => fn(`${where}[${i}]`, x));
}

function checkPage(slug, p, isOverview) {
  const w = (k) => `${slug}.${k}`;
  checkText(w('summary'), p.summary);
  if (p.summary && p.summary.length > 160) warn.push(`${w('summary')}: ${p.summary.length} chars`);
  if (p.title && p.title.length > 60) warn.push(`${w('title')}: ${p.title.length} chars`);
  arr(w('intro'), p.intro, 2, 4);
  arr(w('whoFor'), p.whoFor, 3, 7);
  arr(w('included'), p.included, 5, 12);
  arr(w('exclusions'), p.exclusions, 3, 7);
  arr(w('options'), p.options, 3, 7, (wh, o) => { checkText(wh + '.title', o?.title); checkText(wh + '.text', o?.text); });
  if (p.partnerRole != null) checkText(w('partnerRole'), p.partnerRole);
  if (!p.pricing) errors.push(`${w('pricing')}: missing`);
  else { arr(w('pricing.how'), p.pricing.how, 1, 3); arr(w('pricing.factors'), p.pricing.factors, 4, 9); }
  arr(w('stages'), p.stages, 4, 8, (wh, o) => { checkText(wh + '.title', o?.title); checkText(wh + '.text', o?.text); });
  arr(w('scheduling'), p.scheduling, 3, 6);
  arr(w('faqs'), p.faqs, 3, 6, (wh, o) => { checkText(wh + '.q', o?.q); checkText(wh + '.a', o?.a); });
  arr(w('related'), p.related, 2, 6, (wh, r) => { if (!serviceBySlug[r] && !OVERVIEWS.some((o) => o.slug === r)) errors.push(`${wh}: unknown slug "${r}"`); if (r === slug) errors.push(`${wh}: links to itself`); });
  if (process.env.REQUIRE_V2 !== '0') {
    if (!p.standalone || !['yes', 'either', 'with-project'].includes(p.standalone.mode)) errors.push(`${w('standalone')}: missing or bad mode (yes | either | with-project)`);
    else checkText(w('standalone.text'), p.standalone.text);
    arr(w('startWith'), p.startWith, 3, 7);
  }
  if (isOverview) arr(w('services'), p.services, 4, 20, (wh, r) => { if (!serviceBySlug[r]) errors.push(`${wh}: unknown service slug "${r}"`); });
}

let checked = 0;
for (const c of CATEGORIES) {
  if (wanted.length && !wanted.includes(c.slug)) continue;
  const f = join(root, 'src/content/services', `${c.slug}.mjs`);
  if (!existsSync(f)) { if (wanted.length) errors.push(`${c.slug}: file missing`); continue; }
  const mod = (await import(pathToFileURL(f).href + '?t=' + Date.now())).default;
  for (const s of SERVICES.filter((s) => s.category === c.slug)) {
    if (!mod[s.slug]) { errors.push(`${c.slug}: no content for "${s.slug}"`); continue; }
    checkPage(s.slug, mod[s.slug], false); checked++;
  }
  for (const k of Object.keys(mod)) if (serviceBySlug[k]?.category !== c.slug) errors.push(`${c.slug}: unexpected key "${k}"`);
}
if (!wanted.length || wanted.includes('overviews')) {
  const f = join(root, 'src/content/overviews.mjs');
  if (existsSync(f)) {
    const mod = (await import(pathToFileURL(f).href + '?t=' + Date.now())).default;
    for (const o of OVERVIEWS) { if (!mod[o.slug]) errors.push(`overviews: no content for "${o.slug}"`); else { checkPage(o.slug, mod[o.slug], true); checked++; } }
  } else if (wanted.includes('overviews')) errors.push('overviews: file missing');
}

for (const x of warn) console.log('WARN  ' + x);
for (const x of errors) console.log('ERROR ' + x);
console.log(`${checked} pages checked, ${errors.length} errors, ${warn.length} warnings`);
process.exit(errors.length ? 1 : 0);

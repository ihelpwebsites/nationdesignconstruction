// Merges the static catalog + written content with the owner's settings stored in the database
// (availability, project minimum, pricing fields, optional text overrides).
import { CATEGORIES, SERVICES, OVERVIEWS, DEFAULT_AVAILABILITY, categoryBySlug, serviceBySlug } from '../data/catalog.mjs';
import { all, get, run, now, J, getSetting, setSetting } from './db.mjs';
import overviewContent from '../content/overviews.mjs';

const content = {};
for (const c of CATEGORIES) Object.assign(content, (await import(`../content/services/${c.slug}.mjs`)).default);

export const AVAILABILITY = ['published', 'preview', 'hidden'];

// Seed a row for every catalog service (never overwrites owner edits).
for (const s of SERVICES) {
  run('INSERT OR IGNORE INTO services (slug, availability, pricing, overrides) VALUES (?,?,?,?)', s.slug, DEFAULT_AVAILABILITY, '{}', '{}');
}

// 2026-10-24: the owner confirmed the intended service scope (new construction, renovations, design and engineering
// coordination, site work, structure, exterior, MEP, finishes, pools/outdoor, landscape, low voltage, cleanup,
// engineered specialty repairs), which covers every catalog service. Services still in their seeded 'preview' state
// and never edited by the owner are published once. Owner edits (updated_by set) are never overridden.
if (!getSetting('migration.publishScope.2026-10-24')) {
  const r = run("UPDATE services SET availability = 'published', updated_at = ? WHERE availability = 'preview' AND updated_by IS NULL", now());
  setSetting('migration.publishScope.2026-10-24', { published: Number(r.changes), at: now() });
}

// A version number bumps on every owner edit so rendered-page caches can be invalidated.
let version = 1;
export const contentVersion = () => version;
export const bump = () => { version++; };

let rows = null;
function state() {
  if (!rows) rows = Object.fromEntries(all('SELECT * FROM services').map((r) => [r.slug, { ...r, pricing: J(r.pricing, {}), overrides: J(r.overrides, {}) }]));
  return rows;
}
export function invalidate() { rows = null; bump(); }

/** Pricing is shown as numbers only when the owner has published a complete, reviewed entry. */
export function publicPrice(p) {
  if (!p || p.status !== 'published' || !p.reviewedOn || !p.unit) return null;
  if (p.basis === 'range' && (p.low > 0) && (p.high >= p.low)) return p;
  if (p.basis === 'starting' && p.low > 0) return p;
  return null;
}

export function service(slug) {
  const base = serviceBySlug[slug];
  if (!base) return null;
  const st = state()[slug] || { availability: DEFAULT_AVAILABILITY, pricing: {}, overrides: {} };
  const c = content[slug] || {};
  const ov = st.overrides || {};
  return {
    ...base, ...c,
    summary: ov.summary || c.summary,
    intro: ov.intro ? ov.intro.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean) : c.intro,
    category: base.category,
    categoryName: categoryBySlug[base.category].name,
    path: `/services/${slug}/`,
    availability: st.availability,
    minProject: st.min_project ?? null,
    pricing: c.pricing,                 // written explanation: { how, factors }
    priceFields: st.pricing || {},      // owner-entered figures (admin)
    price: publicPrice(st.pricing),     // figures cleared for public display, or null
    updatedAt: st.updated_at,
    ownerEditedAt: st.updated_by ? st.updated_at : null,
  };
}

export const listed = (s) => s && s.availability !== 'hidden';
export const indexable = (s) => s && s.availability === 'published';

export function services({ includeHidden = false } = {}) {
  return SERVICES.map((s) => service(s.slug)).filter((s) => includeHidden || listed(s));
}
export function categories() {
  const svc = services();
  return CATEGORIES.map((c) => ({
    ...c, path: `/services/${c.slug}/`,
    services: svc.filter((s) => s.category === c.slug || (s.alsoIn || []).includes(c.slug)),
  }));
}
export const category = (slug) => categories().find((c) => c.slug === slug) || null;

export function overview(slug) {
  const o = OVERVIEWS.find((x) => x.slug === slug);
  return o ? { ...o, ...overviewContent[slug] } : null;
}
export const overviews = (market) => OVERVIEWS.filter((o) => !market || o.market === market || (market === 'residential' && o.slug === 'site-development')).map((o) => overview(o.slug));

/** Owner edits from admin. */
export function updateService(slug, patch, by) {
  if (!serviceBySlug[slug]) throw new Error('unknown service');
  const cur = state()[slug];
  const next = {
    availability: AVAILABILITY.includes(patch.availability) ? patch.availability : cur.availability,
    min_project: patch.min_project === undefined ? cur.min_project : patch.min_project,
    pricing: patch.pricing === undefined ? cur.pricing : patch.pricing,
    overrides: patch.overrides === undefined ? cur.overrides : patch.overrides,
  };
  run('UPDATE services SET availability = ?, min_project = ?, pricing = ?, overrides = ?, updated_at = ?, updated_by = ? WHERE slug = ?',
    next.availability, next.min_project, JSON.stringify(next.pricing || {}), JSON.stringify(next.overrides || {}), now(), by, slug);
  invalidate();
}
export function rawService(slug) { return state()[slug]; }
export { content as serviceContent };

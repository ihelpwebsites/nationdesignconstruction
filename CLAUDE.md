# Nation Design & Construction — website (CLAUDE.md)

Public site for **nationdesignconstruction.com** (new company; premium design-focused residential & commercial
construction, starting in Florida), plus inquiry form, trade-partner prequalification and a protected admin.
Owner facts still needed: `docs/OWNER-INPUTS.md`. Deployment & DNS: `docs/DEPLOYMENT.md`.

## Non-negotiables
1. **Never invent facts**: licensing, insurance, bonding, years, completed projects, reviews, staff, awards,
   guarantees, phone, address, hours, response times, service areas. Owner-supplied facts live in admin →
   Business details and render only when marked verified (`src/data/business.mjs` → `facts()`).
2. **Delivery model is honest**: trade/design-professional work is done by specialist subcontractors and licensed
   partners; the company coordinates, supervises and controls quality. Never imply the company holds a specialty
   license or employs every trade. Service content rules: `src/content/SCHEMA.md` (checked by `tools/check-content.mjs`).
3. **Pricing**: no dollar figures unless the owner publishes a complete, reviewed entry in admin → Services
   (`publicPrice()` in `src/server/services.mjs`). Assessment-based wording for engineering/sinkhole/unknown conditions.
   Project minimums are per service (admin), never a universal threshold.
4. **Photos**: `src/data/images.mjs` = licensed Unsplash stock, always captioned "Representative photo, not our
   project". Concepts are always labeled "Design concept". Owner project photos only via admin with rights confirmation.
5. **Indexing**: production indexes complete pages; services default to `preview` (reachable, noindex, not in
   sitemap) until the owner publishes them. Dev is always noindex. Never ship production globally noindexed.
6. **Private data**: uploads in `$DATA_DIR/private` (never under `public/`), downloadable only by signed-in staff.
   Admin POSTs require same-origin + CSRF. Email notifications only via configured provider + verified inbox.

## Brand (approved 2026-10-24)
The approved logo is `brand/src/approved-logo-reference.png` (owner's "Restored Bronze NATION Logo"). Never redraw it,
swap its font, or bring back the old N mark. Vector files in `public/brand/nation-*.svg` were traced from that raster
(`tools/logo-trace/`, potrace; calibrated, ≈97.7% pixel overlap) — re-run `build.cjs` then `compose.cjs` there (after
`npm i` in that folder) only if the artwork changes; then `node tools/build-brand.mjs` (PowerShell) for icons/og-image.
Header uses `nation-logo-tight.svg` at 264 px wide (keeps DESIGN & CONSTRUCTION readable); dark backgrounds use
`nation-logo-ivory-tight.svg`. The approved story text lives in `src/content/story.mjs` — do not reword it.

## Architecture (Node ≥ 22.13, no npm dependencies)
```
src/config.mjs           env (SITE_ENV, SITE_URL, DATA_DIR, RESEND_*, TURNSTILE_*, FORM_SECRET …)
src/data/                catalog.mjs (categories/services/overviews), images.mjs, business.mjs, trades.mjs, counties.mjs
src/content/             services/<category>.mjs + overviews.mjs (long-form copy), company.mjs (process/FAQ)
src/site/                layout.mjs (head/header/mega-menu/footer), router.mjs (+ sitemap/robots/llms.txt), pages/*.mjs
src/server/              main.mjs (http, redirects, headers, cache), forms.mjs, admin.mjs, auth.mjs, db.mjs (node:sqlite), services.mjs, email.mjs
public/                  css, js (site.js, forms.js), fonts (OFL, self-hosted), img (WebP), brand (logo set)
tools/                   test.mjs (e2e), check-content.mjs, build-brand.mjs, fetch-images.mjs, fetch-fonts.mjs, shots.mjs
```
Preview: launch config **nationdc** (parent `.claude/launch.json`, port 4600). Local data in `data/` (git-ignored).

## Verify every change
`node tools/check-content.mjs && node tools/test.mjs`
Headless screenshots: `node tools/shots.mjs 1440 4000 name=http://localhost:4600/path/` → `scratch/shots/`
(Edge headless can't go below ~500px wide; use the browser pane's mobile preset for phone checks.)

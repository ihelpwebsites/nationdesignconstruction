# Technical cleanup — completion report (2026-10-27)

Site: https://nationdesignconstruction.com · Deployed commits `ff74297` and `01edc7c` (manual deploy on Render) ·
Rollback: Render → Events → earlier deploy, or `git tag checkpoint-pre-cleanup-2026-10-27`.
Licensing, service selections, logo, brand story, design and photo choices were not changed.

**Status labels used below:** *Live-verified* = checked on the production site after deploy · *Locally tested* =
covered by the automated suites (51 site tests, 6 email-path tests) · *Not done* = needs credentials or owner input.

## 1. Confirmed defects and fixes

| # | Defect (reconfirmed before fixing) | Fix | Status |
|---|---|---|---|
| 1 | Home said Foundations & Structure = 6, Cleanup = 3; the pricing guide listed 5 and 2 (cross-listed services were left out). | One source, `categories()`; the pricing guide lists what each category page shows. Live check: all 14 categories match on home, category page and pricing guide (e.g. 6/6/6 and 3/3/3). | Live-verified |
| 2 | Residential page showed "0 services" for Commercial Construction; market tiles didn't say what the count was. | Empty categories are skipped; tiles read e.g. "6 residential services". | Live-verified |
| 3 | Home FAQ said "some services publish typical pricing guidance", but none do. Pricing FAQ implied some prices were listed. | Wording now correct, and adapts automatically if the owner publishes reviewed figures. FAQ markup comes from the same text (test confirms they match). | Live-verified |
| 4 | Every sitemap lastmod was 2026-10-24, hard-coded in `lastmod.mjs`; admin edits only moved a service's own date. | Per-page code dates (changed pages now 2026-10-27, no invented history), plus admin edit dates spread to the affected categories, listings and complete-project pages, plus published-photo dates. | Live-verified (6 pages dated 10-27, 101 dated 10-24) |
| 5 | Search (`/services/?q=`) and form-preset (`/start/?service=`) URLs were indexable duplicates. | `noindex, follow` (header and meta) for functional parameters; tracking parameters (utm_*, gclid…) keep `index` with the clean canonical. | Live-verified |
| 6 | An unknown or expired upload link returned 200 ("isn't valid"), a soft 404; robots.txt hid its noindex from crawlers. | Real 404 + noindex; robots only disallows /admin/ and /api/. | Live-verified |
| 7 | A `/start/?service=<hidden>` link could still name a hidden service, and a lead could be attached to it. | Hidden services are excluded there too (sitemap, menus, directory, category, related, start selector, llms.txt were already correct; now tested). | Locally tested (staging only — your live selections untouched) |
| 8 | **Form JavaScript loaded without a version stamp** (1-hour cache), so after a deploy visitors could run old form code. Same for the no-JS result pages' CSS. | All local scripts and stylesheets carry `?v=<content hash>`. | Live-verified |
| 9 | **Accessibility:** radio-group errors (residential/commercial, readiness, trades, counties) weren't linked to the controls, so screen readers didn't announce them on focus. | The shared form script links every control in a group to its error text. | Locally tested (browser) |
| 10 | **Reflow:** at 320 px (≈400% zoom) the home page's mini form overflowed by 19 px. | Two-column choices stack below 360 px. Home, start, contact, services, pricing, trade and service pages checked at 320 px with no horizontal scroll. | Locally tested (browser) |
| 11 | Notification backlog older than 3 days could never be sent, and failures were only partly visible. | Admin → Dashboard → **Email delivery**: every undelivered staff notification at any age, real vs test, retry count and reason; a "Send these" button once email is on (test records excluded unless ticked); unsent customer confirmations listed by reference (never sent late). | Locally tested (6/6 email suite, including a 10-day-old backlog replay) |
| 12 | Launch-day test inquiry NDC-YSEVBF predates the test flag, so a replay would have emailed it as a real lead. | One-time migration with the same test rule; ran on production and flagged 1 record. | Live-verified (server shell) |
| 13 | Email-failure log lines could include provider text that echoes an address. | Logs keep the status only. | Locally tested |
| 14 | No /contact/ page (404). | New page with confirmed phone/email, a project-form link and a trade-partner route; no office, hours or response-time claims; ContactPage markup; footer and mobile menu links; in the sitemap and llms.txt. | Live-verified |
| 15 | Privacy notice didn't mention that the network-address hash is still linkable, or the server logs and new counts. | Wording updated: keyed hash treated as personal data, Render and own logs, landing/referral counts, session-storage flag. | Live-verified |
| 16 | Report said "no dollar amounts anywhere", though the form legitimately offers budget ranges. | SITE-REPORT corrected: no advertised service prices; customer budget ranges are the customer's own choice. | Done |

**Checked and found correct (not changed):**
- Redirects: http, www, onrender.com, missing trailing slash and uppercase all 301 to the canonical URL in one hop.
- Genuine 404s for missing pages, with no redirect-to-home.
- Self-canonicals on all 107 pages; sitemap equals the indexable set.
- One H1 per page; unique titles and descriptions.
- Schema: one GeneralContractor `#org` on all pages, Service with provider pointing to it (81), BreadcrumbList (106), FAQPage (85, matching the visible text), WebSite (home), and the new ContactPage. No parse errors.
- llms.txt: links resolve, no ranking instructions.
- Crawlers: Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User and PerplexityBot user agents receive byte-identical HTML to a browser, with a 200 status.
- Security:
  - Auth: scrypt, 12-hour sessions, `__Host-` HttpOnly Secure SameSite=Lax cookie, CSRF on every admin POST, login lockout.
  - Data access: any signed-in staff member can see all records (single-owner model); file downloads are staff-only with `attachment`, `nosniff` and sandbox CSP; uploads checked by magic bytes, with sanitized names and private storage outside public/.
  - Upload links are hashed, expire after 14 days and can be revoked; CSV export neutralizes spreadsheet formulas; no secrets reach the browser.
- Bing's "alt attribute missing (4)" notice on the home page is about 4 decorative images that intentionally use `alt=""`. This is correct practice, so they were left unchanged.

**Optional hardening, not done:**
- Idle-session timeout (sessions currently end after 12 hours regardless of activity).
- Per-user roles, if more staff are added.
- Off-site copies of the on-disk backups.

## 2. Files changed

- **Templates and data:**
  - `src/site/router.mjs` (sitemap dates, contact route, upload-link 404, robots, llms.txt)
  - `src/site/layout.mjs` (versioned scripts, contact links)
  - `src/site/pages/static.mjs` (pricing list and FAQ, market tiles, contact page, privacy)
  - `src/site/pages/start.mjs`
  - `src/content/company.mjs`
  - `src/data/lastmod.mjs`
- **Server:**
  - `src/server/main.mjs` (query-string noindex, form-rejection events, versioned CSS)
  - `src/server/email.mjs` (backlog, replay, failure events)
  - `src/server/admin.mjs` (Email delivery panel, activity summary)
  - `src/server/forms.mjs` (hidden-service guard, test-flag migration)
  - `src/server/events.mjs`
- **Browser:** `public/js/forms.js` (error linking, upload/start/failure events), `public/js/site.js` (landing/referral counts), `public/css/site.css`
- **Tools:** new `tools/crawl.mjs`, `tools/backup.mjs` and `tools/restore-check.mjs`; updated `tools/indexnow.mjs` (`--since`), `tools/test.mjs` (+8 tests) and `tools/test-email.mjs` (+3)
- **Docs:** this report, `docs/crawl/` (baseline and final inventories), `SITE-REPORT-2026-10-27.md` (corrected), `DEPLOYMENT.md`, `OWNER-INPUTS.md`, `CLAUDE.md`

## 3. Evidence

| Check | Before | After |
|---|---|---|
| Live crawl (`docs/crawl/baseline-live*` → `final-live*`) | 106 URLs, all 200, self-canonical, 0 schema errors | 107 URLs, all 200, self-canonical, 0 schema errors, max depth 1, no duplicate titles or descriptions |
| Sitemap lastmod | 106 × 2026-10-24 | 101 × 2026-10-24, 6 × 2026-10-27 (/, /residential/, /commercial/, /pricing/, /privacy/, /contact/) |
| Category counts (home / category / pricing) | 6 / 6 / 5 and 3 / 3 / 2 | 14 of 14 categories equal |
| `/services/?q=roof` | indexable | `noindex, follow`, canonical `/services/` |
| Bad upload link | 200 | 404 + noindex |
| `forms.js` URL | `/js/forms.js` (1 h cache) | `/js/forms.js?v=614ad7836e` (immutable) |
| Automated tests | 43 + 3 | 51/51 + 6/6 passing |
| Backup / restore drill | none | Production copy written on the server before deploy; local drill restored the DB and an uploaded PDF into an isolated folder, checksums matched, server booted, admin and file URLs still required sign-in |

PageSpeed (lab, Lighthouse mobile on a Moto G-class device with throttling, pagespeed.web.dev, 2026-10-27), scores are Performance · Accessibility · Best practices · SEO:

| Page | Scores | LCP | CLS |
|---|---|---|---|
| Home | 97 · 100 · 100 · 100 | 2.2 s | 0 |
| Kitchen service | 100 · 100 · 100 · 100 | 1.2 s | 0 |
| /start/ | 100 · 100 · 100 · 100 | 1.3 s | 0.02 |
| /contact/ | 100 · 100 · 100 · 100 | 1.4 s | 0 |

The baseline was home 98 with LCP 2.0 s, so this is within run-to-run variance. There is still **no real-user (field) data**, so Core Web Vitals have not been assessed.

Manual checks:
- Mobile menu: focus moves into it, Escape closes it, and focus returns to the toggle.
- Form steps: focus moves to each step heading.
- Back keeps entered data.
- The first invalid field is focused and its error is announced.

## 4. Search status (checked 2026-10-27)

| | Google | Bing | IndexNow |
|---|---|---|---|
| Accessible to crawlers | Yes (robots allows; live fetch 200) | Yes | n/a |
| Submitted for discovery | Sitemap resubmitted: Success, 107 discovered | Sitemap: Success, 106 discovered (read Oct 25) | Oct 24: 106 URLs (202). Oct 27: 6 changed URLs (200 OK = received, key validated) |
| Crawled | Home last crawled Oct 26, 10:45 PM (Googlebot smartphone) | Home crawled | — |
| Indexed (URL Inspection) | **Indexed:** /, /residential/, /services/kitchens-bathrooms-custom-spaces/, /services/kitchen-renovation/. **Discovered – not indexed:** /commercial/, /contact/. Indexing was requested for /, /commercial/ and /contact/. Google-selected canonical = declared. The Pages summary report still shows 0 indexed (it lags). | Home: "Indexed successfully" | "Received" is not the same as indexed |
| Impressions / clicks | 12 impressions, 5 clicks (Oct 24–25 data) | not checked | — |
| Problems | No manual actions, no security issues | — | — |

Crawler visits counted by the site so far are claimed user agents and **not verified**: GPTBot 203, ClaudeBot 164, Googlebot 134, Bingbot 30, OAI-SearchBot 19, ChatGPT-User 10, PerplexityBot 8. They are labeled "claimed" in admin. The Indexing API was not used (it isn't for ordinary pages).

## 5. Remaining blockers

- **Email is still off:** checked on the server Oct 27, `RESEND_API_KEY` is not set. Inbox delivery, Reply-To on real mail, and customer confirmations therefore **cannot be verified live yet**. They are only verified against a local stand-in for Resend.
- **Unnotified inquiries since launch day** (no notification was ever sent for any of them):
  - **NDC-X6AUQS** (Oct 24, outside email address): possibly a real customer.
  - NDC-4MSZ9P and NDC-MTKZPE: from your own email domain.
- **Owner facts** (licensing is handled separately): service area, leadership, insurance statement, real project photos.

## 6. Your actions

1. Open admin → Inquiries → **NDC-X6AUQS**. If it's a real customer, reply personally; their confirmation was never sent. Close NDC-4MSZ9P and NDC-MTKZPE if they were your own tests.
2. Add the Resend key. The Resend form is pre-filled in Chrome: click **Add**, then **Copy**. Then go to Render → nationdc → Environment → `RESEND_API_KEY` → **Save, rebuild, and deploy**.
3. After that deploy: admin → Dashboard → **Email delivery** → **Send these**. Confirm the messages arrive at hello@ (check spam too), then tell me so I can run a controlled live test of the customer confirmation and Reply-To.

// Sitemap <lastmod> dates for content that lives in code. Update a page's date ONLY when its main content materially
// changes (not for header/footer/caption tweaks), and never to "today" on every build. Dates driven by admin edits
// (service availability/text/pricing, published photos) are computed in src/site/router.mjs and win when newer.
export const SITE_LAUNCH = '2026-10-24';

export const PAGE_DATES = {
  '/': '2026-10-27',               // service counts per category, pricing FAQ answer corrected
  '/about/': '2026-10-24',
  '/residential/': '2026-10-27',   // category tiles now state how many services apply to residential work
  '/commercial/': '2026-10-27',    // same, for commercial
  '/services/': '2026-10-24',
  '/process/': '2026-10-24',
  '/pricing/': '2026-10-27',       // per-service list includes cross-listed services; pricing FAQ corrected
  '/design-inspiration/': '2026-10-24',
  '/start/': '2026-10-24',
  '/trade-partners/': '2026-10-24',
  '/privacy/': '2026-10-27',       // 2026-10-26 photography wording; 2026-10-27 logs, analytics and email wording
  '/contact/': '2026-10-27',       // new page
};
// Service, complete-project and category pages (content + v2 "getting started" fields added 2026-10-24).
export const SERVICE_CONTENT_DATE = '2026-10-24';
export const OVERVIEW_CONTENT_DATE = '2026-10-24';
export const CATEGORY_CONTENT_DATE = '2026-10-24';

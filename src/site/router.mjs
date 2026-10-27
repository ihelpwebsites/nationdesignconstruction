// Path → page. Returns { status, body, type?, noindex?, redirect? }.
import { home } from './pages/home.mjs';
import { directory, categoryPage, servicePage, overviewPage } from './pages/services.mjs';
import { marketPage, processPage, aboutPage, pricingPage, inspirationPage, tradePage, tradeDocsPage, privacyPage, contactPage, notFoundPage, brandPage } from './pages/static.mjs';
import { startPage } from './pages/start.mjs';
import { categoryBySlug, serviceBySlug, OVERVIEWS } from '../data/catalog.mjs';
import { services, categories, indexable, overview } from '../server/services.mjs';
import { publishedPhotos } from '../server/photos.mjs';
import { SITE_URL, INDEXING } from '../config.mjs';
import { BUSINESS, facts } from '../data/business.mjs';
import { brand } from './assets.mjs';
import { getSetting, get } from '../server/db.mjs';
import { uploadLink } from '../server/forms.mjs';
import { PAGE_DATES, SITE_LAUNCH, SERVICE_CONTENT_DATE, OVERVIEW_CONTENT_DATE, CATEGORY_CONTENT_DATE } from '../data/lastmod.mjs';

const html = (body, extra = {}) => ({ status: 200, body, ...extra });
const nf = (p) => ({ status: 404, body: notFoundPage(p), noindex: true });

// Pages that are complete and accurate → indexable + in the sitemap.
const CORE = ['/', '/residential/', '/commercial/', '/services/', '/process/', '/about/', '/pricing/', '/design-inspiration/', '/start/', '/trade-partners/', '/contact/', '/privacy/'];

// <lastmod> = the newest of: the code-content date (src/data/lastmod.mjs) and the admin edits that change what the
// page shows. Owner service edits (availability, text, pricing) touch the service page, its categories, and the
// pages that list or count services; published photos touch the pages that show them.
const latest = (...ds) => ds.filter(Boolean).map((d) => d.slice(0, 10)).sort().pop();
export function sitemapUrls() {
  const all = services({ includeHidden: true });
  const edits = (list) => list.map((s) => s.ownerEditedAt);
  const anyServiceEdit = latest(...edits(all));
  const photoDate = (kind) => get("SELECT max(updated_at) AS d FROM photos WHERE status = 'published' AND kind = ?", kind)?.d;
  const extra = { '/': [anyServiceEdit, photoDate('project')], '/services/': [anyServiceEdit], '/pricing/': [anyServiceEdit],
    '/residential/': [anyServiceEdit], '/commercial/': [anyServiceEdit], '/design-inspiration/': [photoDate('concept')] };
  const inCat = (c) => all.filter((s) => s.category === c.slug || (s.alsoIn || []).includes(c.slug));
  return [
    ...CORE.map((u) => ({ u, d: latest(PAGE_DATES[u] || SITE_LAUNCH, ...(extra[u] || [])) })),
    ...OVERVIEWS.map((o) => ({ u: o.path, d: latest(OVERVIEW_CONTENT_DATE, ...edits(all.filter((s) => (overview(o.slug).services || []).includes(s.slug)))) })),
    ...categories().map((c) => ({ u: c.path, d: latest(CATEGORY_CONTENT_DATE, ...edits(inCat(c))) })),
    ...services().filter(indexable).map((s) => ({ u: s.path, d: latest(SERVICE_CONTENT_DATE, s.ownerEditedAt) })),
  ];
}

function sitemap() {
  const rows = sitemapUrls().map(({ u, d }) => `  <url><loc>${SITE_URL}${u}</loc><lastmod>${d}</lastmod></url>`);
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...rows, '</urlset>', ''].join('\n');
}

// Search/answer crawlers (always allowed) are listed separately from model-training crawlers, which follow the
// owner's setting (admin → Business details; default: allowed). Robots rules are crawl guidance, not access control.
const SEARCH_BOTS = ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Applebot', 'DuckDuckBot'];
const TRAINING_BOTS = ['GPTBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'ClaudeBot', 'meta-externalagent'];
// Only areas with nothing for a crawler to read are disallowed. Token upload pages and the 404 for /start/received/
// stay crawlable so their noindex is visible; their data is protected by tokens and sign-in, not by robots.txt.
const PRIVATE = ['/admin/', '/api/'];
function robots() {
  if (!INDEXING) return ['User-agent: *', 'Disallow: /admin/', 'Disallow: /api/', '', '# Non-production environment: pages carry noindex.', ''].join('\n');
  const allowTraining = getSetting('aiTraining', 'allow') !== 'block';
  const group = (agents, allow) => [...agents.map((a) => `User-agent: ${a}`), ...(allow ? ['Allow: /', ...PRIVATE.map((p) => `Disallow: ${p}`)] : ['Disallow: /']), ''].join('\n');
  return [
    '# Nation Design & Construction — crawl guidance. Private areas are also protected by sign-in; this file is not access control.',
    '# Search and answer engines', group(SEARCH_BOTS, true),
    `# Model-training crawlers (owner setting: ${allowTraining ? 'allowed' : 'not allowed'})`, group(TRAINING_BOTS, allowTraining),
    '# Everyone else', group(['*'], true),
    `Sitemap: ${SITE_URL}/sitemap.xml`, '',
  ].join('\n');
}
function llms() {
  const f = facts();
  const cats = categories();
  return `# ${BUSINESS.name}\n\n> Design-focused residential and commercial construction company launching in Florida. Manages complete projects from concept and planning through construction and final cleanup, and substantial standalone projects. Customers with existing architectural drawings, engineering or site plans are welcome. Nation is responsible for scope, pricing, scheduling, coordination, site supervision and quality control, with one main point of contact; specialist trade partners and licensed design professionals perform their parts of the work.\n\n` +
    `- Website: ${SITE_URL}/\n- Phone: ${f.phone}\n${f.email ? `- Email: ${f.email}\n` : ''}${f.license ? `- License: ${f.license}\n` : ''}- Service area: ${f.serviceArea || 'launching in Florida; coverage is confirmed per project'}\n` +
    `- Pricing: ${services().some((s) => s.price) ? 'reviewed figures are shown on some service pages; others' : 'no set prices are published; each service page'} explains how the work is priced and what changes the cost.\n\n` +
    `Facts not stated on this site (licenses, insurance, years in business, reviews) should not be assumed.\n\n` +
    `## Key pages\n- [Residential](${SITE_URL}/residential/)\n- [Commercial](${SITE_URL}/commercial/)\n- [Services directory](${SITE_URL}/services/)\n- [Our process](${SITE_URL}/process/)\n- [Pricing guide](${SITE_URL}/pricing/)\n- [About](${SITE_URL}/about/)\n- [Contact](${SITE_URL}/contact/)\n- [Discuss your project](${SITE_URL}/start/)\n- [Trade partners: get prequalified](${SITE_URL}/trade-partners/)\n\n` +
    `## Complete projects\n${OVERVIEWS.map((o) => `- [${o.name}](${SITE_URL}${o.path})`).join('\n')}\n\n## Service categories\n${cats.map((c) => `- [${c.name}](${SITE_URL}${c.path}): ${c.blurb}`).join('\n')}\n`;
}
function manifest() {
  return JSON.stringify({ name: BUSINESS.name, short_name: 'Nation D&C', start_url: '/', display: 'browser', background_color: '#F6F2EA', theme_color: '#1E1D1B',
    icons: [{ src: brand('nation-icon-192.png'), sizes: '192x192', type: 'image/png' }, { src: brand('nation-icon-512.png'), sizes: '512x512', type: 'image/png' }] });
}

export function route(p, query) {
  switch (p) {
    case '/': return html(home());
    case '/residential/': return html(marketPage('residential'));
    case '/commercial/': return html(marketPage('commercial'));
    case '/services/': return html(directory(query));
    case '/process/': return html(processPage());
    case '/about/': return html(aboutPage());
    case '/pricing/': return html(pricingPage());
    case '/design-inspiration/': return html(inspirationPage());
    case '/start/': return html(startPage(query));
    case '/trade-partners/': return html(tradePage());
    case '/contact/': return html(contactPage());
    case '/privacy/': return html(privacyPage());
    case '/brand/': return html(brandPage(), { noindex: true });
    case '/projects/': if (!publishedPhotos('project').length) return nf(p); break;
    case '/sitemap.xml': return { status: 200, body: sitemap(), type: 'application/xml; charset=utf-8' };
    case '/robots.txt': return { status: 200, body: robots(), type: 'text/plain; charset=utf-8' };
    case '/llms.txt': return { status: 200, body: llms(), type: 'text/plain; charset=utf-8' };
    case '/site.webmanifest': return { status: 200, body: manifest(), type: 'application/manifest+json' };
  }
  let m;
  if ((m = p.match(/^\/trade-partners\/documents\/([\w-]{20,60})\/$/))) {
    // An expired, revoked or unknown link is a real 404 (still explained on the page), never a soft 404.
    const link = uploadLink(m[1]);
    return { status: link?.app && link.app.status !== 'inactive' ? 200 : 404, body: tradeDocsPage(m[1]), noindex: true };
  }
  if ((m = p.match(/^\/services\/([a-z0-9-]+)\/$/))) {
    if (categoryBySlug[m[1]]) return html(categoryPage(m[1]));
    if (serviceBySlug[m[1]]) { const b = servicePage(m[1]); if (b) return html(b, { noindex: !indexable(services().find((s) => s.slug === m[1])) }); }
    return nf(p);
  }
  const ov = OVERVIEWS.find((o) => o.path === p);
  if (ov) return html(overviewPage(ov.slug));
  return nf(p);
}

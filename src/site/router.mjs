// Path → page. Returns { status, body, type?, noindex?, redirect? }.
import { home } from './pages/home.mjs';
import { directory, categoryPage, servicePage, overviewPage } from './pages/services.mjs';
import { marketPage, processPage, aboutPage, pricingPage, inspirationPage, tradePage, tradeDocsPage, privacyPage, notFoundPage, brandPage } from './pages/static.mjs';
import { startPage } from './pages/start.mjs';
import { categoryBySlug, serviceBySlug, OVERVIEWS } from '../data/catalog.mjs';
import { services, categories, indexable } from '../server/services.mjs';
import { publishedPhotos } from '../server/photos.mjs';
import { SITE_URL, INDEXING } from '../config.mjs';
import { BUSINESS, facts } from '../data/business.mjs';

const html = (body, extra = {}) => ({ status: 200, body, ...extra });
const nf = (p) => ({ status: 404, body: notFoundPage(p), noindex: true });

// Pages that are complete and accurate → indexable + in the sitemap.
const CORE = ['/', '/residential/', '/commercial/', '/services/', '/process/', '/about/', '/pricing/', '/design-inspiration/', '/start/', '/trade-partners/', '/privacy/'];

export function sitemapUrls() {
  return [
    ...CORE,
    ...OVERVIEWS.map((o) => o.path),
    ...categories().map((c) => c.path),
    ...services().filter(indexable).map((s) => s.path),
  ];
}

function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls().map((u) => `  <url><loc>${SITE_URL}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`;
}
function robots() {
  if (!INDEXING) return 'User-agent: *\nDisallow: /admin/\nDisallow: /api/\n\n# Non-production environment: pages carry noindex.\n';
  return `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /trade-partners/documents/\nDisallow: /start/received/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}
function llms() {
  const f = facts();
  const cats = categories();
  return `# ${BUSINESS.name}\n\n> Design-focused residential and commercial construction company, starting in Florida. Manages complete projects from concept and planning through construction and final cleanup, and substantial standalone projects. Customers with existing architectural drawings, engineering or site plans are welcome. Trade and design-professional work is performed by specialist subcontractors and licensed professional partners; the company manages coordination, logistics, supervision and quality control, with one main point of contact.\n\n` +
    `Facts not stated on this site (licenses, insurance, years in business, reviews) should not be assumed.${f.license ? ` License: ${f.license}.` : ''}${f.serviceArea ? ` Service area: ${f.serviceArea}.` : ' Service area: starting in Florida; coverage confirmed per project.'}\n\n` +
    `## Key pages\n- [Residential](${SITE_URL}/residential/)\n- [Commercial](${SITE_URL}/commercial/)\n- [Services directory](${SITE_URL}/services/)\n- [Our process](${SITE_URL}/process/)\n- [Pricing guide](${SITE_URL}/pricing/)\n- [About](${SITE_URL}/about/)\n- [Discuss your project](${SITE_URL}/start/)\n\n` +
    `## Complete projects\n${OVERVIEWS.map((o) => `- [${o.name}](${SITE_URL}${o.path})`).join('\n')}\n\n## Service categories\n${cats.map((c) => `- [${c.name}](${SITE_URL}${c.path}): ${c.blurb}`).join('\n')}\n`;
}
function manifest() {
  return JSON.stringify({ name: BUSINESS.name, short_name: 'Nation D&C', start_url: '/', display: 'browser', background_color: '#F6F2EA', theme_color: '#1E1D1B',
    icons: [{ src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' }] });
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
    case '/privacy/': return html(privacyPage());
    case '/brand/': return html(brandPage(), { noindex: true });
    case '/projects/': if (!publishedPhotos('project').length) return nf(p); break;
    case '/sitemap.xml': return { status: 200, body: sitemap(), type: 'application/xml; charset=utf-8' };
    case '/robots.txt': return { status: 200, body: robots(), type: 'text/plain; charset=utf-8' };
    case '/llms.txt': return { status: 200, body: llms(), type: 'text/plain; charset=utf-8' };
    case '/site.webmanifest': return { status: 200, body: manifest(), type: 'application/manifest+json' };
  }
  let m;
  if ((m = p.match(/^\/trade-partners\/documents\/([\w-]{20,60})\/$/))) return html(tradeDocsPage(m[1]), { noindex: true });
  if ((m = p.match(/^\/services\/([a-z0-9-]+)\/$/))) {
    if (categoryBySlug[m[1]]) return html(categoryPage(m[1]));
    if (serviceBySlug[m[1]]) { const b = servicePage(m[1]); if (b) return html(b, { noindex: !indexable(services().find((s) => s.slug === m[1])) }); }
    return nf(p);
  }
  const ov = OVERVIEWS.find((o) => o.path === p);
  if (ov) return html(overviewPage(ov.slug));
  return nf(p);
}

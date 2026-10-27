// Page shell: <head>, header with Services mega-menu, mobile drawer, footer.
import { esc, attr, icon, list } from './html.mjs';
import { BUSINESS, facts } from '../data/business.mjs';
import { IMAGES, WIDTHS } from '../data/images.mjs';
import { categories } from '../server/services.mjs';
import { SITE_URL, INDEXING, ENV, TURNSTILE } from '../config.mjs';
import { ASSET_VERSION, BRAND_VERSION, brand } from './assets.mjs';

export const NAV = [
  { href: '/residential/', label: 'Residential' },
  { href: '/commercial/', label: 'Commercial' },
  { href: '/services/', label: 'Services', mega: true },
  { href: '/process/', label: 'Our Process' },
  { href: '/about/', label: 'About' },
];

/** srcset for a photo key in one format (avif | webp). */
export function srcsetFor(key, fmt) {
  const img = IMAGES[key];
  const base = img.file || key;
  return (img.widths || WIDTHS).map((w) => `/img/${base}-${w}.${fmt} ${w}w`).join(', ');
}
/** Responsive <picture> (AVIF with WebP fallback) for a photo key. Hero images load eagerly; others lazy-load. */
export function pic(key, { sizes = '(min-width: 1000px) 50vw, 100vw', eager = false, cls = '', alt } = {}) {
  const img = IMAGES[key];
  if (!img) return '';
  const base = img.file || key;
  const load = eager ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"';
  const pos = img.position ? ` style="object-position:${attr(img.position)}"` : '';
  return `<picture><source type="image/avif" srcset="${srcsetFor(key, 'avif')}" sizes="${attr(sizes)}">` +
    `<img src="/img/${base}-1200.webp" srcset="${srcsetFor(key, 'webp')}" sizes="${attr(sizes)}" width="1200" height="800" alt="${attr(alt ?? img.alt)}" decoding="async" ${load}${cls ? ` class="${cls}"` : ''}${pos}></picture>`;
}
export function credit(key) {
  const img = IMAGES[key];
  if (!img) return '';
  return `Photo: <a href="${attr(img.page)}" rel="nofollow noopener" target="_blank">${esc(img.credit)} / Unsplash</a>${img.edited ? ' (edited)' : ''}`;
}

/** Click-to-call link for the confirmed number. */
export function phoneLink(cls = '', label) {
  const f = facts();
  return `<a${cls ? ` class="${cls}"` : ''} href="tel:${attr(f.phoneE164)}" data-track="phone">${label ? esc(label) : esc(f.phone)}</a>`;
}
/** Email link — only once the mailbox is verified in admin; otherwise empty. */
export function emailLink(cls = '') {
  const f = facts();
  return f.email ? `<a${cls ? ` class="${cls}"` : ''} href="mailto:${attr(f.email)}" data-track="email">${esc(f.email)}</a>` : '';
}

/** "Prefer to talk?" panel — phone first; email only when verified. The form stays the primary action. */
export function contactPanel({ heading = 'Prefer to talk?', note = 'Or use the project form — it lets you attach plans and photos.' } = {}) {
  const f = facts();
  return `<div class="panel contact-panel"><h2>${esc(heading)}</h2>${phoneLink('tel')}${f.email ? `<p class="small">${emailLink()}</p>` : ''}<p class="small muted">${esc(note)}</p></div>`;
}

function megaMenu(cats) {
  return `<div class="mega" id="mega-services" hidden>
  <div class="wrap">
    <div>
      <p class="eyebrow">Services</p>
      <ul class="mega-cats">${list(cats, (c) => `<li><a href="${c.path}"><strong>${esc(c.name)}</strong><span>${esc(c.blurb)}</span></a></li>`)}</ul>
    </div>
    <div class="mega-side">
      <h2>Find a specific service</h2>
      <form class="search" action="/services/" method="get" role="search">
        ${icon('search')}<label class="sr-only" for="mega-q">Search services</label>
        <input id="mega-q" type="search" name="q" placeholder="e.g. impact windows, slab, EV charger" autocomplete="off">
      </form>
      <a class="textlink" href="/services/">Browse all services ${icon('arrow')}</a>
      <p class="small muted">Complete projects</p>
      <ul>
        <li><a href="/residential/custom-homes/">Custom homes</a></li>
        <li><a href="/residential/additions/">Home additions</a></li>
        <li><a href="/residential/whole-home-renovations/">Whole-home renovations</a></li>
        <li><a href="/commercial/new-construction/">Commercial new construction</a></li>
        <li><a href="/commercial/build-outs/">Commercial build-outs</a></li>
        <li><a href="/commercial/site-development/">Site development</a></li>
      </ul>
      <a class="textlink" href="/pricing/">How pricing works ${icon('arrow')}</a>
    </div>
  </div>
</div>`;
}

function drawer(cats, current) {
  return `<div class="drawer" id="drawer" hidden role="dialog" aria-modal="true" aria-label="Menu">
  <div class="wrap">
    <div class="bar">
      <a class="brand" href="/"><img src="${brand('nation-logo-tight.svg')}" alt="Nation Design &amp; Construction — home" width="264" height="60"></a>
      <button class="menu-toggle" type="button" data-close-drawer>${icon('close')}<span>Close</span></button>
    </div>
    <nav aria-label="Mobile">
      <ul>
        <li><a class="top" href="/residential/"${current === '/residential/' ? ' aria-current="page"' : ''}>Residential</a></li>
        <li><a class="top" href="/commercial/"${current === '/commercial/' ? ' aria-current="page"' : ''}>Commercial</a></li>
        <li>
          <button class="top" type="button" aria-expanded="false" aria-controls="drawer-services">Services ${icon('chevron')}</button>
          <div class="sub" id="drawer-services" hidden>
            <ul><li><a href="/services/"><strong>All services &amp; search</strong></a></li></ul>
            ${list(cats, (c, i) => `<button class="cat-toggle" type="button" aria-expanded="false" aria-controls="dc-${i}">${esc(c.name)} ${icon('chevron')}</button>
            <div class="cat-list" id="dc-${i}" hidden><ul>
              <li><a href="${c.path}">Overview: ${esc(c.short)}</a></li>
              ${list(c.services, (s) => `<li><a href="${s.path}">${esc(s.name)}</a></li>`)}
            </ul></div>`)}
          </div>
        </li>
        <li><a class="top" href="/process/">Our Process</a></li>
        <li><a class="top" href="/about/">About</a></li>
        <li><a class="top" href="/pricing/">Pricing Guide</a></li>
        <li><a class="top" href="/contact/"${current === '/contact/' ? ' aria-current="page"' : ''}>Contact</a></li>
      </ul>
    </nav>
    <div class="cta"><a class="btn" href="/start/">Discuss Your Project ${icon('arrow')}</a>
      <p class="drawer-contact">${phoneLink('btn ghost', 'Call ' + facts().phone)}${emailLink('textlink')}</p></div>
  </div>
</div>`;
}

function header(current) {
  const cats = categories();
  const isCurrent = (href) => current === href || (href !== '/' && current.startsWith(href));
  return `<header class="site-header">
  <div class="wrap bar">
    <a class="brand" href="/"><img src="${brand('nation-logo-tight.svg')}" alt="Nation Design &amp; Construction — home" width="264" height="60"></a>
    <nav class="nav" aria-label="Main">
      <ul>
        ${list(NAV, (n) => n.mega
          ? `<li><button class="navlink" type="button" aria-expanded="false" aria-controls="mega-services"${isCurrent(n.href) ? ' data-current' : ''}>${n.label} ${icon('chevron')}</button></li>`
          : `<li><a href="${n.href}"${isCurrent(n.href) ? ' aria-current="page"' : ''}>${n.label}</a></li>`)}
        <li class="nav-phone">${phoneLink()}</li>
        <li><a class="btn" href="/start/">Discuss Your Project</a></li>
      </ul>
    </nav>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="drawer">${icon('menu')}<span>Menu</span></button>
  </div>
  ${megaMenu(cats)}
</header>
${drawer(cats, current)}`;
}

function footer() {
  const f = facts();
  const year = new Date().getFullYear();
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="foot-top">
      <div class="foot-brand">
        <img src="${brand('nation-logo-ivory-tight.svg')}" alt="Nation Design &amp; Construction" width="300" height="68" loading="lazy">
        <p class="max-40">Design-focused residential and commercial construction, launching in Florida. One accountable point of contact from first conversation to final cleanup.</p>
        <p class="foot-contact">${phoneLink('foot-phone')}${f.email ? `<br>${emailLink()}` : ''}</p>
        ${f.address ? `<p>${esc(f.address)}</p>` : ''}
      </div>
      <div><h2>Build with us</h2><ul>
        <li><a href="/residential/">Residential</a></li><li><a href="/commercial/">Commercial</a></li>
        <li><a href="/services/">All services</a></li><li><a href="/pricing/">Pricing guide</a></li>
        <li><a href="/start/">Discuss your project</a></li></ul></div>
      <div><h2>Company</h2><ul>
        <li><a href="/process/">Our process</a></li><li><a href="/about/">About</a></li>
        <li><a href="/design-inspiration/">Design inspiration</a></li><li><a href="/contact/">Contact</a></li><li><a href="/privacy/">Privacy</a></li></ul></div>
      <div><h2>Trade partners</h2><ul>
        <li><a href="/trade-partners/">Get prequalified</a></li></ul></div>
    </div>
    <div class="foot-bottom">
      <span>© ${year} ${esc(BUSINESS.name)}${f.license ? ` · License ${esc(f.license)}` : ''}</span>
    </div>
  </div>
</footer>`;
}

export function organizationLd() {
  const f = facts();
  const org = {
    '@context': 'https://schema.org', '@type': 'GeneralContractor', '@id': `${SITE_URL}/#org`,
    name: BUSINESS.name, url: `${SITE_URL}/`, logo: `${SITE_URL}${brand('nation-logo.png')}`, image: `${SITE_URL}${brand('nation-icon-512.png')}`,
    description: 'Design-focused residential and commercial construction company managing complete projects from concept and planning through construction and final cleanup.',
  };
  org.telephone = f.phoneE164;
  if (f.email) org.email = f.email;
  // Coverage is stated only once the owner verifies it — never implied statewide.
  if (f.serviceArea) org.areaServed = f.serviceArea;
  org.contactPoint = [{ '@type': 'ContactPoint', telephone: f.phoneE164, contactType: 'customer service', availableLanguage: 'English', ...(f.email ? { email: f.email } : {}) }];
  return org;
}

/**
 * page: { title, description, path, body, noindex, jsonld: [], current, ogImage, bodyClass, scripts: [] }
 */
export function layout(page) {
  const canonical = `${SITE_URL}${page.path}`;
  const robots = !INDEXING || page.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large';
  const title = page.title === BUSINESS.name ? page.title : `${page.title} | ${BUSINESS.name}`;
  const og = page.ogImage ? `${SITE_URL}/img/${IMAGES[page.ogImage]?.file || page.ogImage}-1200.webp` : `${SITE_URL}${brand('nation-og-image.png')}`;
  const ld = [organizationLd(), ...(page.jsonld || [])];
  // Preload the hero in AVIF (what the <picture> selects in all current browsers) with the same sizes as the image.
  const preload = page.preloadImage ? `<link rel="preload" as="image" type="image/avif" imagesrcset="${srcsetFor(page.preloadImage, 'avif')}" imagesizes="100vw" fetchpriority="high">` : '';
  return `<!doctype html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${attr(page.description)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${attr(canonical)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${attr(BUSINESS.name)}">
<meta property="og:title" content="${attr(page.title)}"><meta property="og:description" content="${attr(page.description)}">
<meta property="og:url" content="${attr(canonical)}"><meta property="og:image" content="${attr(og)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#1E1D1B">
<link rel="icon" href="/favicon.ico?v=${BRAND_VERSION}" sizes="32x32"><link rel="icon" href="${brand('nation-favicon.svg')}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${brand('nation-apple-touch-icon.png')}"><link rel="manifest" href="/site.webmanifest?v=${BRAND_VERSION}">
<link rel="preload" href="/fonts/instrument-sans-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/instrument-serif-400.woff2" as="font" type="font/woff2" crossorigin>
${preload}
<link rel="stylesheet" href="/css/site.css?v=${ASSET_VERSION}">
<script>document.documentElement.classList.add('js')</script>
${ld.map((x) => `<script type="application/ld+json">${JSON.stringify(x).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head>
<body class="${attr(page.bodyClass || '')}">
<a class="skip" href="#main">Skip to content</a>
${header(page.current || page.path)}
<main id="main" tabindex="-1">
${page.body}
</main>
${footer()}
<script src="/js/site.js?v=${ASSET_VERSION}" defer></script>
${(page.scripts || []).map((s) => `<script src="${attr(s.startsWith('/') ? `${s}?v=${ASSET_VERSION}` : s)}" defer></script>`).join('\n')}
</body>
</html>`;
}

export function crumbs(items) {
  // items: [{ href, label }] — last item is the current page (no link)
  const ld = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [{ href: '/', label: 'Home' }, ...items].map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.label, item: `${SITE_URL}${it.href}` })),
  };
  const html = `<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li>${list(items, (it, i) => i === items.length - 1 ? `<li aria-current="page">${esc(it.label)}</li>` : `<li><a href="${it.href}">${esc(it.label)}</a></li>`)}</ol></nav>`;
  return { html, ld };
}

export function ctaBand({ title = 'Tell us about your project.', text = 'A short form — three steps, a few minutes. Share plans or photos if you have them. We’ll review it and follow up using the contact details you provide.', href = '/start/', label = 'Discuss Your Project' } = {}) {
  return `<section class="cta-band on-dark" aria-labelledby="cta-h"><div class="wrap">
  <div><p class="eyebrow">Start here</p><h2 id="cta-h">${esc(title)}</h2></div>
  <div class="stack"><p>${esc(text)}</p><div class="actions"><a class="btn light" href="${attr(href)}">${esc(label)} ${icon('arrow')}</a>${phoneLink('cta-phone', 'Or call ' + facts().phone)}</div></div>
</div></section>`;
}

export function faqBlock(faqs, { id = 'faq', heading = 'Questions & answers' } = {}) {
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
  const html = `<div class="faq" id="${id}">${list(faqs, (f) => `<details><summary>${esc(f.q)}</summary><div class="answer"><p>${esc(f.a)}</p></div></details>`)}</div>`;
  return { html, ld, heading };
}
export { ENV, TURNSTILE };

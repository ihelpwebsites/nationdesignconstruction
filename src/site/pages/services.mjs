// Services directory, category pages, individual service pages and whole-project overview pages.
import { esc, attr, icon, list, money, UNIT_LABEL, fmtDate } from '../html.mjs';
import { layout, crumbs, pic, credit, ctaBand, faqBlock, contactPanel } from '../layout.mjs';
import { categories, category, service, overview, services as allServices, listed, indexable } from '../../server/services.mjs';
import { CATEGORY_IMAGE, OVERVIEW_IMAGE } from '../../data/images.mjs';
import { OVERVIEWS, serviceBySlug } from '../../data/catalog.mjs';
import { SITE_URL } from '../../config.mjs';
import { facts } from '../../data/business.mjs';

const DELIVERY_TAG = {
  professional: 'Licensed professional partner',
  licensed: 'Licensed trade partner',
  assessment: 'Assessment first',
};

function linkFor(slug) {
  const s = service(slug);
  if (s && listed(s)) return { href: s.path, label: s.name, summary: s.summary };
  const o = OVERVIEWS.find((x) => x.slug === slug);
  if (o) { const ov = overview(slug); return { href: o.path, label: o.name, summary: ov?.summary }; }
  return null;
}

// ---- Directory -------------------------------------------------------------------------------------------
export function directory(query = {}) {
  const cats = categories();
  const q = String(query.q || '').slice(0, 80);
  const c = crumbs([{ href: '/services/', label: 'Services' }]);
  const body = `
<section class="page-hero"><div class="wrap">
  ${c.html}
  <p class="eyebrow">Services</p>
  <h1>Every part of the build, in one directory.</h1>
  <p class="lede">Search by what you need — a material, a room, a system, a problem — or filter by category. Complete projects bring these services together under one plan and one budget.</p>
</div></section>
<div class="dir-tools" data-directory-tools><div class="wrap row">
  <div class="search">${icon('search')}<label class="sr-only" for="dir-q">Search services</label>
    <input id="dir-q" type="search" placeholder="Search services, e.g. pavers, repiping, slab" value="${attr(q)}" autocomplete="off" aria-controls="dir-results" data-dir-search></div>
  <div class="filters" role="group" aria-label="Filter by category">
    <button type="button" aria-pressed="true" data-filter="">All</button>
    ${list(cats, (cat) => `<button type="button" aria-pressed="false" data-filter="${cat.slug}">${esc(cat.short)}</button>`)}
  </div>
</div></div>
<section class="section tight" id="dir-results">
  <div class="wrap">
    <div class="dir-status"><p class="small muted" role="status" data-dir-count></p><button type="button" class="textlink small" data-dir-reset hidden>Clear search &amp; filters</button></div>
    ${list(cats, (cat) => `<div class="dir-cat" data-cat="${cat.slug}">
      <div class="split"><div><h2><a href="${cat.path}">${esc(cat.name)}</a></h2><p class="muted">${esc(cat.blurb)}</p></div></div>
      <ul class="dir-list">${list(cat.services, (s) => `<li data-search="${attr([s.name, s.summary, ...(s.covers || []), cat.name].join(' ').toLowerCase())}">
        <a href="${s.path}"><strong>${esc(s.name)}</strong><span>${esc(s.summary)}</span>${DELIVERY_TAG[s.delivery] ? `<span class="tag partner">${DELIVERY_TAG[s.delivery]}</span>` : ''}</a></li>`)}</ul>
    </div>`)}
    <div class="dir-empty" data-dir-empty hidden><h2 class="h3">No services match that search.</h2><p class="muted">Try a broader word, <button type="button" class="textlink" data-dir-reset>clear the search and filters</button>, or <a href="/start/">describe your project</a> and we’ll tell you how we’d approach it.</p></div>
    <div class="note mt-5"><strong>Planning a complete project?</strong> See <a href="/residential/custom-homes/">custom homes</a>, <a href="/residential/additions/">additions</a>, <a href="/residential/whole-home-renovations/">whole-home renovations</a>, <a href="/commercial/new-construction/">commercial new construction</a>, <a href="/commercial/build-outs/">build-outs</a> and <a href="/commercial/site-development/">site development</a>. A complete-project budget already includes the individual trades it needs.</div>
  </div>
</section>
${ctaBand()}`;
  return layout({
    title: 'Construction Services Directory', description: 'Search Nation Design & Construction’s full service directory: design, engineering coordination, site work, structure, exterior, MEP, interiors, outdoor living, commercial and repairs.',
    path: '/services/', body, jsonld: [c.ld],
  });
}

// ---- Category ---------------------------------------------------------------------------------------------
export function categoryPage(slug) {
  const cat = category(slug);
  if (!cat) return null;
  const img = CATEGORY_IMAGE[slug];
  const c = crumbs([{ href: '/services/', label: 'Services' }, { href: cat.path, label: cat.name }]);
  const body = `
<section class="page-hero with-media"><div class="wrap">
  <div>${c.html}<p class="eyebrow">Service category</p><h1>${esc(cat.name)}</h1><p class="lede">${esc(cat.blurb)}</p></div>
  ${img ? `<figure><div class="fig r32">${pic(img, { eager: true, sizes: '(min-width: 960px) 45vw, 100vw' })}</div><figcaption class="credit">${credit(img)}</figcaption></figure>` : ''}
</div></section>
<section class="section"><div class="wrap">
  <div class="grid c3">${list(cat.services, (s) => `<a class="card" href="${s.path}"><div class="card-body">
    ${DELIVERY_TAG[s.delivery] ? `<span class="tag partner">${DELIVERY_TAG[s.delivery]}</span>` : ''}
    <h2 class="card-title">${esc(s.name)}</h2><p>${esc(s.summary)}</p></div><div class="card-foot"><span class="textlink">Details &amp; pricing ${icon('arrow')}</span></div></a>`)}</div>
  <p class="mt-5 muted max-60">Looking for something else? <a href="/services/">Search all services</a> or <a href="/start/">describe your project</a>.</p>
</div></section>
${ctaBand()}`;
  return layout({
    title: `${cat.name} Services`, description: `${cat.blurb} Explore ${cat.name.toLowerCase()} services from Nation Design & Construction.`.slice(0, 160),
    path: cat.path, body, jsonld: [c.ld], current: '/services/', ogImage: img,
  });
}

// ---- Shared long-form sections (service + overview pages) -----------------------------------------------
const MANAGED_ROLE = 'We are responsible for the scope, schedule, coordination, site supervision and quality checks, and we are your single point of contact. The hands-on work is carried out by specialist trade partners we select and supervise for this kind of work.';
const STANDALONE_LABEL = { yes: 'Can be hired on its own', either: 'On its own or within a larger project', 'with-project': 'Usually part of a larger project' };
const UNIT_BASIS = { sqft: 'usually by the square foot', lf: 'usually by the linear foot', project: 'as a fixed project price', assessment: 'after an assessment' };
function pricingSection(p, s, isOverview) {
  const price = s.price;
  const assessment = s.unit === 'assessment' || s.delivery === 'assessment';
  const figure = price ? `<div class="price-box">
      <p class="small muted">Typical pricing · reviewed ${esc(fmtDate(price.reviewedOn))}</p>
      <p class="figure">${price.basis === 'range' ? `${money(price.low)} – ${money(price.high)}` : `From ${money(price.low)}`} <span class="small muted">${UNIT_LABEL[price.unit] || ''}</span></p>
      <dl>
        ${price.minimumProject ? `<dt>Minimum project</dt><dd>${money(price.minimumProject)}</dd>` : ''}
        ${price.included ? `<dt>Includes</dt><dd>${esc(price.included)}</dd>` : ''}
        ${price.assumptions ? `<dt>Excludes &amp; assumes</dt><dd>${esc(price.assumptions)}</dd>` : ''}
        ${price.geography ? `<dt>Applies to</dt><dd>${esc(price.geography)}</dd>` : ''}
      </dl>
      <p class="small muted">Guidance only — your price comes from a defined scope after we review your project.</p>
    </div>` : `<div class="note"><strong>${assessment ? 'Priced in two steps: assessment, then repair.' : `Priced from a defined scope, ${UNIT_BASIS[s.unit] || 'per project'}.`}</strong> ${assessment
      ? 'The scope of this work can’t be known until testing, inspection or engineering is complete, so the assessment is priced first and the work is priced once the findings and repair design are in hand.'
      : 'We don’t publish a planning range for this service yet, because a figure that ignores your site, selections and access would mislead more than help. With the information listed under “What we need to price it”, we can give you a written scope and price.'}</div>`;
  return `<section id="pricing" aria-labelledby="pricing-h"><h2 id="pricing-h">How pricing works</h2>
    <div class="stack">${list(p.how, (x) => `<p>${esc(x)}</p>`)}</div>
    <div class="mt-4">${figure}</div>
    <h3 class="mt-4">What changes the cost</h3><ul class="ticks mt-2">${list(p.factors, (x) => `<li>${esc(x)}</li>`)}</ul>
    ${!isOverview ? `<p class="small muted mt-3">If this work is part of a larger project, it’s priced within that project’s budget — please don’t add separate estimates together. <a href="/pricing/">Read the pricing guide</a>.</p>` : ''}
    <div class="actions mt-4"><a class="btn ghost" href="${attr(isOverview ? `/start/?market=${s.market}&type=${encodeURIComponent(TYPE_FOR[s.slug] || '')}` : `/start/?service=${s.slug}&type=A+specific+service`)}">${assessment ? 'Request an assessment' : 'Request pricing'} ${icon('arrow')}</a></div>
  </section>`;
}

function longForm(s, { isOverview = false } = {}) {
  const sections = [
    ['overview', 'Overview'], ['who', 'Who it’s for'], ['scope', 'What’s included'], ['options', 'Options & upgrades'],
    ['pricing', 'Pricing'], ['stages', 'Stages & scheduling'], ['faq', 'Questions'], ['related', 'Related'],
  ];
  const related = (s.related || []).map(linkFor).filter(Boolean);
  const faq = faqBlock(s.faqs || []);
  const html = `
<div class="svc-main">
  <section id="overview" aria-labelledby="ov-h"><h2 id="ov-h" class="sr-only">Overview</h2>
    <div class="prose stack">${list(s.intro, (p) => `<p>${esc(p)}</p>`)}</div>
    <div class="note mt-4"><strong>Who does what.</strong> ${esc(s.partnerRole || MANAGED_ROLE)}</div>
  </section>
  ${s.standalone || s.startWith ? `<section id="start" aria-labelledby="start-h"><h2 id="start-h">Getting started</h2>
    <div class="two-col">
      ${s.standalone ? `<div><h3>${STANDALONE_LABEL[s.standalone.mode] || 'Hiring this service'}</h3><p class="mt-1">${esc(s.standalone.text)}</p></div>` : ''}
      ${s.startWith ? `<div><h3>What we need to price it</h3><ul class="ticks mt-2">${list(s.startWith, (x) => `<li>${esc(x)}</li>`)}</ul>
        <p class="small muted mt-2">Don’t have all of it? Send what you have — we’ll tell you what’s missing.</p></div>` : ''}
    </div></section>` : ''}
  <section id="who" aria-labelledby="who-h"><h2 id="who-h">Who it’s for</h2><ul class="ticks">${list(s.whoFor, (x) => `<li>${esc(x)}</li>`)}</ul></section>
  <section id="scope" aria-labelledby="scope-h"><h2 id="scope-h">What’s included</h2>
    <div class="two-col">
      <div><h3 class="mb">Typically included</h3><ul class="ticks mt-2">${list(s.included, (x) => `<li>${esc(x)}</li>`)}</ul></div>
      <div><h3>Common exclusions</h3><ul class="ticks minus mt-2">${list(s.exclusions, (x) => `<li>${esc(x)}</li>`)}</ul>
      <p class="small muted mt-2">Every proposal lists its own inclusions and exclusions in writing.</p></div>
    </div></section>
  <section id="options" aria-labelledby="opt-h"><h2 id="opt-h">Materials, design options &amp; upgrades</h2>
    <div class="options">${list(s.options, (o) => `<div class="option"><h3>${esc(o.title)}</h3><p>${esc(o.text)}</p></div>`)}</div></section>
  ${pricingSection(s.pricing, s, isOverview)}
  <section id="stages" aria-labelledby="st-h"><h2 id="st-h">Typical stages</h2>
    <ol class="stages">${list(s.stages, (x) => `<li><div><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></div></li>`)}</ol>
    <h3 class="mt-4">What affects the schedule</h3><ul class="ticks mt-2">${list(s.scheduling, (x) => `<li>${esc(x)}</li>`)}</ul></section>
  ${isOverview && s.services?.length ? `<section id="services" aria-labelledby="sv-h"><h2 id="sv-h">Services within this project</h2>
    <ul class="chips">${list(s.services.map((x) => service(x)).filter(listed), (x) => `<li><a href="${x.path}">${esc(x.name)}</a></li>`)}</ul></section>` : ''}
  <section id="faq" aria-labelledby="faq-h"><h2 id="faq-h">Questions &amp; answers</h2>${faq.html}</section>
  ${related.length ? `<section id="related" aria-labelledby="rel-h"><h2 id="rel-h">Related</h2>
    <div class="grid c2">${list(related, (r) => `<a class="card" href="${r.href}"><div class="card-body"><h3>${esc(r.label)}</h3>${r.summary ? `<p>${esc(r.summary)}</p>` : ''}</div></a>`)}</div></section>` : ''}
</div>`;
  return { html, faq, sections: sections.filter(([id]) => id !== 'related' || related.length) };
}

function aside(s, { href, label, statusNote }) {
  return `<aside class="svc-aside"><div class="sticky">
    <div class="panel dark on-dark"><h2>Talk to us about ${esc(s.name.toLowerCase())}</h2>
      <p class="small">Tell us about the project — with plans or photos if you have them.</p>
      <a class="btn light" href="${attr(href)}">${esc(label)} ${icon('arrow')}</a></div>
    ${contactPanel({ heading: 'Prefer to talk it through?', note: 'Call, or send the project form with plans and photos.' })}
    ${statusNote || ''}
    <nav class="panel" aria-label="On this page"><h2>On this page</h2><ul class="toc">
      <li><a href="#overview">Overview</a></li>${s.startWith ? '<li><a href="#start">Getting started</a></li>' : ''}<li><a href="#who">Who it’s for</a></li><li><a href="#scope">What’s included</a></li>
      <li><a href="#options">Options &amp; upgrades</a></li><li><a href="#pricing">Pricing</a></li><li><a href="#stages">Stages &amp; scheduling</a></li>
      <li><a href="#faq">Questions</a></li></ul></nav>
  </div></aside>`;
}

// ---- Service page -----------------------------------------------------------------------------------------
export function servicePage(slug) {
  const s = service(slug);
  if (!s || !listed(s)) return null;
  const cat = category(s.category);
  const img = CATEGORY_IMAGE[s.category];
  const c = crumbs([{ href: '/services/', label: 'Services' }, { href: cat.path, label: cat.name }, { href: s.path, label: s.name }]);
  const lf = longForm(s);
  const preview = s.availability !== 'published';
  const statusNote = preview ? `<div class="note status small"><strong>Availability being confirmed.</strong> We’re confirming partner availability for this service area by area. Tell us where your project is and we’ll confirm whether and how we can deliver it.</div>` : '';
  const f = facts();
  const svcLd = {
    '@context': 'https://schema.org', '@type': 'Service', name: s.name, description: s.summary, url: `${SITE_URL}${s.path}`,
    serviceType: s.name, provider: { '@id': `${SITE_URL}/#org` }, ...(f.serviceArea ? { areaServed: f.serviceArea } : {}),
    category: cat.name, ...(s.price ? { offers: { '@type': 'Offer', priceSpecification: { '@type': 'PriceSpecification', priceCurrency: 'USD', minPrice: s.price.low, ...(s.price.basis === 'range' ? { maxPrice: s.price.high } : {}) } } } : {}),
  };
  const body = `
<section class="page-hero"><div class="wrap">
  ${c.html}
  <p class="eyebrow">${esc(cat.name)}</p>
  <h1>${esc(s.name)}</h1>
  <p class="lede">${esc(s.summary)}</p>
  <div class="actions mt-4"><a class="btn" href="/start/?service=${s.slug}&type=A+specific+service">Discuss this service ${icon('arrow')}</a>
  ${DELIVERY_TAG[s.delivery] ? `<span class="tag partner">${DELIVERY_TAG[s.delivery]}</span>` : ''}</div>
</div></section>
<section class="section"><div class="wrap svc-layout">
  ${lf.html}
  ${aside(s, { href: `/start/?service=${s.slug}&type=A+specific+service`, label: 'Discuss this service', statusNote })}
</div></section>
${img ? `<section class="section tight stone"><div class="wrap"><figure><div class="fig banner">${pic(img, { sizes: '100vw' })}</div><figcaption class="credit">${credit(img)}</figcaption></figure></div></section>` : ''}
${ctaBand({ title: `Planning ${s.name.toLowerCase()}?`, href: `/start/?service=${s.slug}&type=A+specific+service`, label: 'Discuss this service' })}`;
  return layout({
    title: s.title || s.name, description: s.summary, path: s.path, body, noindex: !indexable(s),
    jsonld: [c.ld, svcLd, ...(s.faqs?.length ? [lf.faq.ld] : [])], current: '/services/', ogImage: img,
  });
}

// ---- Whole-project overview -----------------------------------------------------------------------------
export function overviewPage(slug) {
  const o = overview(slug);
  if (!o) return null;
  const parent = o.market === 'residential' ? { href: '/residential/', label: 'Residential' } : { href: '/commercial/', label: 'Commercial' };
  const img = OVERVIEW_IMAGE[slug];
  const c = crumbs([parent, { href: o.path, label: o.name }]);
  const s = { ...o, price: null, unit: 'project', delivery: 'managed' };
  const lf = longForm(s, { isOverview: true });
  const body = `
<section class="page-hero with-media"><div class="wrap">
  <div>${c.html}<p class="eyebrow">Complete project · ${o.market === 'residential' ? 'Residential' : 'Commercial'}</p><h1>${esc(o.name)}</h1><p class="lede">${esc(o.summary)}</p>
  <div class="actions mt-4"><a class="btn" href="/start/?market=${o.market}&type=${encodeURIComponent(TYPE_FOR[slug] || '')}">Discuss your project ${icon('arrow')}</a></div></div>
  ${img ? `<figure><div class="fig r32">${pic(img, { eager: true, sizes: '(min-width: 960px) 45vw, 100vw' })}</div><figcaption class="credit">${credit(img)}</figcaption></figure>` : ''}
</div></section>
<section class="section"><div class="wrap svc-layout">
  ${lf.html}
  ${aside(o, { href: `/start/?market=${o.market}&type=${encodeURIComponent(TYPE_FOR[slug] || '')}`, label: 'Discuss your project' })}
</div></section>
${ctaBand()}`;
  return layout({
    title: o.title || o.name, description: o.summary, path: o.path, body, current: parent.href,
    jsonld: [c.ld, lf.faq.ld, { '@context': 'https://schema.org', '@type': 'Service', name: o.name, description: o.summary, provider: { '@id': `${SITE_URL}/#org` }, url: `${SITE_URL}${o.path}` }],
    ogImage: img,
  });
}
const TYPE_FOR = {
  'custom-homes': 'New custom home', 'home-additions': 'Home addition', 'whole-home-renovations': 'Whole-home renovation',
  'commercial-new-construction': 'New commercial building', 'commercial-build-outs': 'Build-out or tenant improvement', 'site-development': 'Site development or paving',
};

export { allServices };

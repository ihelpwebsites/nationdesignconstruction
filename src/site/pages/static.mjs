// Market landing pages, process, about, pricing guide, design inspiration, trade partners, privacy, 404, brand.
import { esc, attr, icon, list, UNIT_NAME, money, fmtDate } from '../html.mjs';
import { layout, crumbs, pic, credit, ctaBand, faqBlock, phoneLink, contactPanel } from '../layout.mjs';
import { categories, overviews, services } from '../../server/services.mjs';
import { PROCESS, PRINCIPLES, RESPONSIBILITIES } from '../../content/company.mjs';
import { PAGE_DATES } from '../../data/lastmod.mjs';
import { STORY, STORY_LABEL, STORY_HEADING, STORY_CLOSE } from '../../content/story.mjs';
import { CONCEPTS, conceptArt, MATERIAL_STUDIES, materialArt } from '../concepts.mjs';
import { publishedPhotos } from '../../server/photos.mjs';
import { formToken, newSubmissionKey, uploadLink, DOC_KINDS } from '../../server/forms.mjs';
import { TRADES, PROJECT_SIZES, INSURANCE_STATUS } from '../../data/trades.mjs';
import { FL_COUNTIES } from '../../data/counties.mjs';
import { facts } from '../../data/business.mjs';
import { TURNSTILE, UPLOAD } from '../../config.mjs';
import { brand } from '../assets.mjs';

// ---- Residential / Commercial ------------------------------------------------------------------------
const MARKET = {
  residential: {
    title: 'Residential Design & Construction', h1: 'Homes designed around how you live — and built the way they were drawn.',
    lede: 'Custom homes, additions, whole-home renovations and the spaces inside and around them. Planned carefully, priced clearly and managed by one point of contact.',
    img: 'living-wood-ceiling', img2: 'kitchen-marble',
    intro: ['A home project touches everything at once: design decisions, budget, permits, neighbors, HOA rules, and the household that has to live through it. We organize all of it into one plan, with the decisions you need to make laid out in the order they matter.', 'Bring us an idea and we’ll coordinate the design with licensed architects, engineers and interior designers. Bring us a full set of drawings and we’ll review them, price them line by line, and build them.'],
    points: ['Design and selections resolved before construction starts', 'Allowances shown clearly for finishes you haven’t chosen yet', 'Work sequenced to protect the parts of the home you’re living in', 'Daily site cleanup and a final clean before turnover'],
    cats: ['design-preconstruction', 'kitchens-bathrooms-custom-spaces', 'interiors-finishes', 'pools-outdoor-living', 'roofing-exterior', 'landscaping-property', 'technology-low-voltage', 'specialty-repairs'],
    faqs: [
      { q: 'Can we live in the house during a renovation?', a: 'Often, yes — depending on the scope. We plan phasing, dust and access control, and utility shutdowns around the household, and tell you up front if a part of the work makes the home impractical to occupy for a period.' },
      { q: 'Do you build on my lot from my architect’s plans?', a: 'Yes. We review the plans and engineering for completeness and buildability, flag anything that affects permitting or price, and keep your architect involved during construction for questions and site observations.' },
      { q: 'How do HOA approvals fit in?', a: 'Many Florida communities require architectural review before permitting. We help assemble the submission with your design team and build the review time into the schedule.' },
    ],
  },
  commercial: {
    title: 'Commercial Construction & Build-Outs', h1: 'Commercial space delivered on a schedule your business can plan around.',
    lede: 'Tenant improvements, offices, retail, restaurants, ground-up buildings and site development — coordinated with landlords, design teams and inspectors.',
    img: 'office-exterior-dusk', img2: 'restaurant-bright',
    intro: ['For a business, the cost of construction includes the cost of delay. We plan commercial work backwards from the date you need the space — permits, long-lead equipment, inspections, utility work and the certificate of occupancy — and keep landlords, tenants and design teams informed throughout.', 'We work from architect- and engineer-prepared construction documents, or coordinate those professionals for you when you’re starting with a space and a program.'],
    points: ['Schedules built around opening dates, lease terms and operating hours', 'Landlord and tenant scope separated clearly against the work letter', 'Phased or after-hours work where a space must stay operating', 'Inspection and close-out documents organized for occupancy'],
    cats: ['commercial-construction', 'design-preconstruction', 'site-plans-engineering', 'demolition-site-preparation', 'foundations-structure', 'electrical-plumbing-hvac', 'technology-low-voltage', 'landscaping-property'],
    faqs: [
      { q: 'Can you work in an occupied building?', a: 'Yes, with planning. We agree on work hours, noise and dust controls, access routes and shutdown windows with the landlord or property manager before work starts.' },
      { q: 'Do you handle the permit drawings?', a: 'Commercial permits require drawings prepared and sealed by licensed design professionals. We coordinate that team for you or work with yours, and manage the plan review and inspection process.' },
      { q: 'Can you price from a landlord’s work letter?', a: 'Yes. We separate landlord-provided work from tenant scope so each party sees exactly what they are paying for.' },
    ],
  },
};
export function marketPage(m) {
  const d = MARKET[m];
  const ovs = overviews(m);
  const cats = categories().filter((c) => d.cats.includes(c.slug));
  const c = crumbs([{ href: `/${m}/`, label: m === 'residential' ? 'Residential' : 'Commercial' }]);
  const faq = faqBlock(d.faqs);
  const body = `
<section class="hero on-dark" aria-labelledby="mh">
  <div class="hero-media">${pic(d.img, { eager: true, sizes: '100vw', alt: '' })}</div>
  <div class="wrap">
    <p class="eyebrow">${m === 'residential' ? 'Residential' : 'Commercial'}</p>
    <h1 id="mh">${esc(d.h1)}</h1><p class="lede">${esc(d.lede)}</p>
    <div class="actions"><a class="btn light" href="/start/?market=${m}">Discuss your project ${icon('arrow')}</a><a class="btn ghost-light" href="/services/">All services</a></div>
    <p class="photo-note">${credit(d.img)}</p>
  </div>
</section>
<section class="section"><div class="wrap split">
  <div class="stack">${c.html}${list(d.intro, (p, i) => `<p class="${i ? '' : 'lede'}">${esc(p)}</p>`)}<ul class="ticks mt-2">${list(d.points, (p) => `<li>${esc(p)}</li>`)}</ul></div>
  <figure><div class="fig r43">${pic(d.img2, { sizes: '(min-width: 960px) 45vw, 100vw' })}</div><figcaption class="credit">${credit(d.img2)}</figcaption></figure>
</div></section>
<section class="section stone"><div class="wrap">
  <div class="section-head"><p class="eyebrow">Complete projects</p><h2>Managed from concept to closeout.</h2></div>
  <div class="grid c3">${list(ovs, (o) => `<a class="card" href="${o.path}"><div class="card-body"><h3>${esc(o.name)}</h3><p>${esc(o.summary)}</p></div><div class="card-foot"><span class="textlink">Explore ${icon('arrow')}</span></div></a>`)}</div>
</div></section>
<section class="section"><div class="wrap">
  <div class="section-head split"><div><p class="eyebrow">Standalone projects</p><h2>Substantial single-scope work, done properly.</h2></div><p class="lede">Not every project is a whole building. These categories are the ones ${m} clients ask about most.</p></div>
  <div class="cat-grid">${list(cats, (cat) => `<a class="cat-tile" href="${cat.path}"><h3>${esc(cat.name)}</h3><p>${esc(cat.blurb)}</p><span class="more">${cat.services.filter((s) => s.markets.includes(m)).length} services ${icon('arrow')}</span></a>`)}</div>
</div></section>
<section class="section stone"><div class="wrap split top"><div><p class="eyebrow">Questions</p><h2>${m === 'residential' ? 'Homeowners often ask' : 'Business owners often ask'}</h2></div><div>${faq.html}</div></div></section>
${ctaBand()}`;
  return layout({ title: d.title, description: d.lede, path: `/${m}/`, body, jsonld: [c.ld, faq.ld], preloadImage: d.img, ogImage: d.img });
}

// ---- Process ------------------------------------------------------------------------------------------
export function processPage() {
  const c = crumbs([{ href: '/process/', label: 'Our Process' }]);
  const body = `
<section class="page-hero with-media"><div class="wrap">
  <div>${c.html}<p class="eyebrow">Our process</p><h1>How a project moves from idea to handover.</h1>
  <p class="lede">The same sequence runs every project, large or small: decisions in the right order, documented scope, and one person keeping it all moving.</p></div>
  <figure><div class="fig r32">${pic('framing-aerial', { eager: true, sizes: '(min-width: 960px) 45vw, 100vw' })}</div><figcaption class="credit">${credit('framing-aerial')}</figcaption></figure>
</div></section>
<section class="section"><div class="wrap">
  <ol class="steps cols">${list(PROCESS, (s, i) => `<li id="${s.id}"><span class="n">${String(i + 1).padStart(2, '0')}</span><div><h2 class="h3">${esc(s.title)}</h2><p>${esc(s.text)}</p></div></li>`)}</ol>
</div></section>
<section class="section dark on-dark"><div class="wrap">
  <div class="section-head split"><div><p class="eyebrow">Operating principles</p><h2>What you can expect from us on every project.</h2></div></div>
  <div class="principles">${list(PRINCIPLES, (p) => `<div class="principle">${icon(p.icon)}<h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></div>`)}</div>
</div></section>
<section class="section"><div class="wrap split top">
  <div><p class="eyebrow">Communication</p><h2>One main point of contact.</h2></div>
  <div class="prose stack">
    <p>Your project lead coordinates designers, engineers, trade partners, suppliers and inspectors, and is the person you call. Updates come on a schedule agreed at the start — not only when something goes wrong.</p>
    <p>Decisions you need to make are listed with the date they’re needed by, so selections don’t hold up the work. When a change is requested or a condition is discovered, you receive the cost and schedule effect in writing before the work proceeds.</p>
    <p>Scope, pricing, changes, scheduling and quality checks are handled the same way on every project: in writing, before the work they affect.</p>
    <p>${phoneLink('textlink', `Call ${facts().phone}`)}</p>
  </div>
</div></section>
<section class="section stone" id="responsibilities" aria-labelledby="resp-h"><div class="wrap">
  <div class="section-head split"><div><p class="eyebrow">Accountability</p><h2 id="resp-h">Who is responsible for what.</h2></div>
    <p class="lede">We lead the project and answer for the result. Licensed professionals and specialist trades carry out the parts of the work their licenses and skills require.</p></div>
  <div class="resp-grid">${list(RESPONSIBILITIES, (r, i) => `<div class="resp${i === 0 ? ' lead' : ''}"><h3>${esc(r.who)}</h3><ul class="ticks">${list(r.items, (x) => `<li>${esc(x)}</li>`)}</ul></div>`)}</div>
</div></section>
${ctaBand()}`;
  return layout({ title: 'Our Design & Construction Process', description: 'How Nation Design & Construction runs a project: conversation, discovery, design or plan review, scope and pricing, permits, construction, quality checks and turnover.', path: '/process/', body, jsonld: [c.ld] });
}

// ---- About --------------------------------------------------------------------------------------------
export function aboutPage() {
  const c = crumbs([{ href: '/about/', label: 'About' }]);
  const f = facts();
  const body = `
<section class="page-hero"><div class="wrap">
  ${c.html}<p class="eyebrow">About</p><h1>A construction company that takes design seriously.</h1>
  <p class="lede">Nation Design &amp; Construction is a residential and commercial construction company launching in Florida. We handle complete projects — from concept and planning through construction and final cleanup — as well as substantial standalone projects, and we welcome clients who already have drawings, engineering or site plans.</p>
</div></section>

<section class="story" id="our-story" aria-labelledby="story-h"><div class="wrap story-grid">
  <div class="story-mark"><img src="${brand('nation-symbol.svg')}" alt="" aria-hidden="true" width="342" height="362" loading="lazy" decoding="async"></div>
  <div class="story-text">
    <p class="eyebrow">${esc(STORY_LABEL)}</p>
    <h2 id="story-h">${esc(STORY_HEADING)}</h2>
    ${list(STORY, (p, i) => `<p${i === 0 ? ' class="story-first"' : ''}>${esc(p)}</p>`)}
    <p class="story-close">${esc(STORY_CLOSE)}</p>
  </div>
</div></section>

<section class="section stone" aria-labelledby="approach-h"><div class="wrap split top">
  <div class="prose stack">
    <p class="eyebrow">Our approach</p>
    <h2 id="approach-h">How we work</h2>
    <p>Clients usually have to choose between a design-led firm that hands drawings to someone else to build, and a builder for whom design is an afterthought. We close that gap. If you need design, we coordinate it from early layouts through construction documents; if you already have plans, we read them carefully, price them honestly and build them faithfully.</p>
    <p>We are responsible for the scope, the price, the schedule, site supervision and quality checks — and we are your one main point of contact from the first conversation to the final walkthrough. Specialist trade partners and licensed design professionals, chosen for the specific work and prequalified by service and area, carry out their parts under our coordination (<a href="/process/#responsibilities">who is responsible for what</a>).</p>
    <p>${f.serviceArea ? `We serve ${esc(f.serviceArea)}.` : 'We’re launching in Florida. Tell us where your project is and we’ll confirm, before any site visit, whether it’s an area we serve.'}</p>
    ${f.leadership || f.license || f.insurance ? `<dl class="facts">${f.leadership ? `<dt>Leadership</dt><dd>${esc(f.leadership)}</dd>` : ''}${f.license ? `<dt>License</dt><dd>${esc(f.license)}</dd>` : ''}${f.insurance ? `<dt>Insurance</dt><dd>${esc(f.insurance)}</dd>` : ''}</dl>` : ''}
    <p><a class="textlink" href="/process/">See our process, step by step ${icon('arrow')}</a></p>
  </div>
  <div class="stack-lg">
    <figure><div class="fig r43">${pic('drafting-hands', { sizes: '(min-width: 960px) 45vw, 100vw' })}</div><figcaption class="credit">${credit('drafting-hands')}</figcaption></figure>
    ${contactPanel({ heading: 'Talk to us', note: 'Or send your project details through the form — you can attach plans and photos.' })}
  </div>
</div></section>
${ctaBand({ title: 'Tell us what this place will mean to you.' })}`;
  return layout({ title: 'About Nation Design & Construction', description: 'A design-focused residential and commercial construction company launching in Florida — complete projects or work from your existing plans, with one point of contact.', path: '/about/', body, jsonld: [c.ld] });
}

// ---- Pricing guide ------------------------------------------------------------------------------------
export function pricingPage() {
  const c = crumbs([{ href: '/pricing/', label: 'Pricing Guide' }]);
  const cats = categories();
  const faq = faqBlock([
    { q: 'Why don’t you list prices for every service?', a: 'We only publish pricing guidance that has been checked against real projects in the areas we serve. Until then, each service page explains how the work is priced and what changes the cost, and you can request pricing for your project.' },
    { q: 'Can I add up service prices to estimate a whole project?', a: 'Please don’t. A complete-project budget already includes the individual trades it needs, along with shared costs like supervision, permits and cleanup. Adding separate service estimates together double-counts and misleads.' },
    { q: 'What is an allowance?', a: 'A budget amount for an item you haven’t selected yet — tile, fixtures, appliances. When you make the selection, the actual cost replaces the allowance and the difference is shown to you.' },
    { q: 'What is assessment-based pricing?', a: 'For engineering, foundation, sinkhole and other work where hidden conditions decide the scope, we price the investigation first. The repair is priced once the findings and the engineer’s design are in hand.' },
  ]);
  const body = `
<section class="page-hero"><div class="wrap">
  ${c.html}<p class="eyebrow">Pricing guide</p><h1>How we price — and what moves the number.</h1>
  <p class="lede">We price from a defined scope, show how the price is built, and explain what could change it. This guide explains the approach; each service page has its own pricing section.</p>
</div></section>
<section class="section"><div class="wrap split top">
  <div class="prose stack">
    <h2>From range to contract price</h2>
    <p><strong>Early range.</strong> In the first conversations we discuss budget openly and, where enough is known, give a broad range so you can decide whether to proceed.</p>
    <p><strong>Refined budget.</strong> As design develops — or once we’ve reviewed your existing plans — the budget is built from quantities, specifications and trade-partner pricing.</p>
    <p><strong>Contract price.</strong> A defined scope with written inclusions, exclusions and allowances. Changes afterwards are priced and approved in writing before the work proceeds.</p>
    <h2>Units we price in</h2>
    <p>Some work is naturally priced per square foot (flooring, roofing, slabs), per linear foot (cabinetry, fencing, gutters), per project (a kitchen, a generator installation) or per assessment (engineering investigations, sinkhole evaluation). The unit is shown with each service.</p>
    <h2>What affects almost every price</h2>
    <ul><li>Site access, existing conditions and anything hidden behind walls or below grade</li><li>Design and engineering requirements, including wind and flood requirements where they apply</li><li>Material and finish selections</li><li>Permit, plan review and inspection requirements of the local jurisdiction</li><li>Schedule constraints such as occupied spaces or after-hours work</li><li>Lead times and market conditions for materials and equipment</li></ul>
  </div>
  <div class="stack-lg"><div class="note"><strong>Complete projects include their trades.</strong> If you’re planning a whole home, addition or build-out, the project budget already includes every service it needs. Don’t add individual service estimates on top.</div>
  <div class="panel"><h2>Request pricing</h2><p class="small muted">Tell us about the project and we’ll explain how we’d price it.</p><a class="btn" href="/start/">Discuss your project ${icon('arrow')}</a></div></div>
</div></section>
<section class="section stone"><div class="wrap">
  <div class="section-head"><p class="eyebrow">By service</p><h2>Pricing basis for each service</h2><p class="lede">Each link opens the pricing section of that service page.</p></div>
  ${list(cats, (cat) => `<div class="dir-cat"><h3 class="h3">${esc(cat.name)}</h3><ul class="dir-list">${list(cat.services.filter((s) => s.category === cat.slug), (s) => `<li><a href="${s.path}#pricing"><strong>${esc(s.name)}</strong><span>${s.price ? `${s.price.basis === 'range' ? `${money(s.price.low)} – ${money(s.price.high)}` : `From ${money(s.price.low)}`} · ${UNIT_NAME[s.price.unit]} · reviewed ${fmtDate(s.price.reviewedOn)}` : s.unit === 'assessment' || s.delivery === 'assessment' ? 'Assessment-based pricing' : `${UNIT_NAME[s.unit]} basis · pricing on request`}</span></a></li>`)}</ul></div>`)}
</div></section>
<section class="section"><div class="wrap split top"><div><p class="eyebrow">Questions</p><h2>Pricing questions</h2></div><div>${faq.html}</div></div></section>
${ctaBand()}`;
  return layout({ title: 'Construction Pricing Guide', description: 'How Nation Design & Construction prices residential and commercial work: early ranges, refined budgets, contract prices, allowances and assessment-based pricing.', path: '/pricing/', body, jsonld: [c.ld, faq.ld] });
}

// ---- Design inspiration ------------------------------------------------------------------------------
export function inspirationPage() {
  const c = crumbs([{ href: '/design-inspiration/', label: 'Design Inspiration' }]);
  const uploaded = publishedPhotos('concept');
  const body = `
<section class="page-hero"><div class="wrap">
  ${c.html}<p class="eyebrow">Design inspiration</p><h1>Concepts, clearly labeled.</h1>
  <p class="lede">Design concepts that show how we think about layout, light and use. Every item on this page is a concept — none of it is a photograph of a completed project.</p>
</div></section>
<section class="section"><div class="wrap">
  <div class="grid c3">${list(CONCEPTS, (cn) => `<article class="concept"><div class="art"><span class="label-chip">Design concept</span>${conceptArt(cn.id)}</div><div class="body"><p class="small muted">${esc(cn.kind)}</p><h2 class="h3">${esc(cn.title)}</h2><p>${esc(cn.text)}</p></div></article>`)}
  ${list(uploaded, (p) => `<article class="concept"><div class="art"><span class="label-chip">Design concept</span><img src="/media/${p.id}.${p.ext}" alt="${attr(p.alt)}" loading="lazy" width="${p.width || 1200}" height="${p.height || 900}" style="object-fit:cover;width:100%;height:100%"></div><div class="body"><h2 class="h3">${esc(p.title)}</h2>${p.caption ? `<p>${esc(p.caption)}</p>` : ''}</div></article>`)}</div>
</div></section>
<section class="section stone" aria-labelledby="mat-h"><div class="wrap">
  <div class="section-head split"><div><p class="eyebrow">Material studies</p><h2 id="mat-h">Palettes chosen for Florida light and daily use.</h2></div>
    <p class="lede">Illustrative palette boards — colors and textures are drawn, not photographs or product specifications. Final selections are made with you from physical samples.</p></div>
  <div class="grid c3">${list(MATERIAL_STUDIES, (m) => `<article class="concept"><div class="art"><span class="label-chip">Material study</span>${materialArt(m)}</div><div class="body"><h3>${esc(m.title)}</h3><p>${esc(m.text)}</p></div></article>`)}</div>
</div></section>
${ctaBand({ title: 'Have an idea of your own?' })}`;
  return layout({ title: 'Design Inspiration', description: 'Clearly labeled design concepts and material studies from Nation Design & Construction — layouts, massing studies and palettes for homes, outdoor living and commercial spaces.', path: '/design-inspiration/', body, jsonld: [c.ld] });
}

// ---- Trade partners ----------------------------------------------------------------------------------
export function tradePage() {
  const c = crumbs([{ href: '/trade-partners/', label: 'Trade Partners' }]);
  const body = `
<section class="page-hero"><div class="wrap">
  ${c.html}<p class="eyebrow">Trade partners</p><h1>Get prequalified.</h1>
  <p class="lede">We work with specialist subcontractors and professional partners who take pride in organized, high-quality work. Start with a short application; we’ll request documents securely after review.</p>
</div></section>
<section class="section tight"><div class="wrap split top">
  <div class="form-shell">
    <div class="alert err" role="alert" tabindex="-1" data-form-error hidden></div>
    <form class="form" id="trade" action="/api/trade-application" method="post" novalidate data-simple-form>
      <input type="hidden" name="_t" value="${attr(formToken())}"><input type="hidden" name="_idem" value="${attr(newSubmissionKey())}">
      <div class="hp" aria-hidden="true"><label>Leave this empty <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
      <div class="two-col">
        <div class="field"><label for="t-company">Company name <span class="req" aria-hidden="true">*</span></label><input id="t-company" name="company" required maxlength="120" autocomplete="organization" aria-describedby="err-company"><p class="error-text" id="err-company"></p></div>
        <div class="field"><label for="t-contact">Contact name <span class="req" aria-hidden="true">*</span></label><input id="t-contact" name="contact_name" required maxlength="100" autocomplete="name" aria-describedby="err-contact_name"><p class="error-text" id="err-contact_name"></p></div>
        <div class="field"><label for="t-email">Email <span class="req" aria-hidden="true">*</span></label><input id="t-email" name="email" type="email" required maxlength="160" autocomplete="email" aria-describedby="err-email"><p class="error-text" id="err-email"></p></div>
        <div class="field"><label for="t-phone">Phone <span class="req" aria-hidden="true">*</span></label><input id="t-phone" name="phone" type="tel" required maxlength="40" autocomplete="tel" aria-describedby="err-phone"><p class="error-text" id="err-phone"></p></div>
      </div>
      <fieldset><legend>Trades &amp; specialties <span class="req" aria-hidden="true">*</span></legend>
        <details class="panel"><summary>Choose trades (${TRADES.length} options)</summary><div class="choices c2 mt-2">${list(TRADES, (t) => `<label class="check"><input type="checkbox" name="trades" value="${attr(t)}"> ${esc(t)}</label>`)}</div></details>
        <div class="field mt-2"><label for="t-other">Other specialty</label><input id="t-other" name="trades_other" maxlength="120"></div>
        <p class="error-text" id="err-trades"></p></fieldset>
      <fieldset><legend>Florida counties you serve <span class="req" aria-hidden="true">*</span></legend>
        <details class="panel"><summary>Choose counties</summary><div class="choices c3 mt-2">${list(FL_COUNTIES, (cn) => `<label class="check"><input type="checkbox" name="counties" value="${attr(cn)}"> ${esc(cn)}</label>`)}</div></details>
        <p class="error-text" id="err-counties"></p></fieldset>
      <div class="field"><label for="t-license">License information <span class="muted small">(where applicable)</span></label><p class="hint">License type and number, and the name it’s issued to — used to check license status during review.</p><input id="t-license" name="license_info" maxlength="300"></div>
      <div class="two-col">
        <div class="field"><label for="t-gl">General liability insurance <span class="req" aria-hidden="true">*</span></label><select id="t-gl" name="gl_status" required aria-describedby="err-gl_status"><option value="">Choose one</option>${list(INSURANCE_STATUS.gl, (x) => `<option>${esc(x)}</option>`)}</select><p class="error-text" id="err-gl_status"></p></div>
        <div class="field"><label for="t-wc">Workers’ compensation <span class="req" aria-hidden="true">*</span></label><select id="t-wc" name="wc_status" required aria-describedby="err-wc_status"><option value="">Choose one</option>${list(INSURANCE_STATUS.wc, (x) => `<option>${esc(x)}</option>`)}</select><p class="error-text" id="err-wc_status"></p></div>
        <div class="field"><label for="t-size">Typical project size <span class="req" aria-hidden="true">*</span></label><select id="t-size" name="project_size" required aria-describedby="err-project_size"><option value="">Choose one</option>${list(PROJECT_SIZES, (x) => `<option>${esc(x)}</option>`)}</select><p class="error-text" id="err-project_size"></p></div>
        <div class="field"><label for="t-crew">Crew size &amp; capacity <span class="req" aria-hidden="true">*</span></label><input id="t-crew" name="crew_capacity" required maxlength="200" placeholder="e.g. two crews of four" aria-describedby="err-crew_capacity"><p class="error-text" id="err-crew_capacity"></p></div>
      </div>
      <div class="field"><label for="t-avail">Current availability</label><input id="t-avail" name="availability" maxlength="200" placeholder="e.g. booking from next month"></div>
      <div class="field"><label for="t-ex">Two recent projects, or a portfolio link <span class="req" aria-hidden="true">*</span></label><textarea id="t-ex" name="examples" required maxlength="2000" rows="4" aria-describedby="err-examples"></textarea><p class="error-text" id="err-examples"></p></div>
      <label class="check"><input type="checkbox" name="consent_contact" value="1" required> <span>You may contact me about prequalification. <span class="req" aria-hidden="true">*</span></span></label><p class="error-text" id="err-consent_contact"></p>
      <label class="check"><input type="checkbox" name="consent_marketing" value="1"> <span>Optional: send me occasional updates about upcoming work.</span></label>
      <p class="small muted">Please don’t upload insurance certificates or other documents here — after review we’ll send a private link for those. Applications are reviewed individually; submitting doesn’t guarantee work or approval.</p>
      ${TURNSTILE.siteKey ? `<div class="cf-turnstile" data-sitekey="${attr(TURNSTILE.siteKey)}"></div>` : ''}
      <div><button class="btn" type="submit">Submit application ${icon('arrow')}</button></div>
    </form>
    <div class="confirm" data-confirm hidden tabindex="-1"></div>
  </div>
  <aside class="stack-lg">
    <div class="panel"><h2>How prequalification works</h2><ol class="stages">
      <li><div><h3>Short application</h3><p>This form — a few minutes.</p></div></li>
      <li><div><h3>Review</h3><p>We review your trades, coverage and examples.</p></div></li>
      <li><div><h3>Documents</h3><p>If it’s a fit, we send a private link for insurance certificates, licenses and references.</p></div></li>
      <li><div><h3>Approval by scope</h3><p>Approval is specific to the services and counties you cover, and documents are tracked for expiration.</p></div></li>
    </ol></div>
  </aside>
</div></section>`;
  return layout({ title: 'Trade Partners — Get Prequalified', description: 'Specialist subcontractors and professional partners: apply for prequalification with Nation Design & Construction.', path: '/trade-partners/', body, jsonld: [c.ld], scripts: ['/js/forms.js', ...(TURNSTILE.siteKey ? ['https://challenges.cloudflare.com/turnstile/v0/api.js'] : [])] });
}

export function tradeDocsPage(token) {
  const link = uploadLink(token);
  const ok = link && link.app && link.app.status !== 'inactive';
  const body = `<section class="page-hero"><div class="wrap narrow">
  <p class="eyebrow">Trade partners</p><h1>${ok ? 'Upload your documents' : 'This link isn’t valid'}</h1>
  <p class="lede">${ok ? `For application ${esc(link.app.ref)} — ${esc(link.app.company)}. Files are stored privately and only our team can open them.` : 'It may have expired. Please contact us for a new link.'}</p>
</div></section>
${ok ? `<section class="section tight"><div class="wrap narrow"><div class="form-shell">
  <div class="alert err" role="alert" tabindex="-1" data-form-error hidden></div>
  <form class="form" action="/api/trade-docs/${attr(token)}" method="post" enctype="multipart/form-data" novalidate data-simple-form>
    <div class="field"><label for="d-kind">Document type</label><select id="d-kind" name="kind">${list(DOC_KINDS, (k) => `<option>${esc(k)}</option>`)}</select></div>
    <div class="field"><label for="d-exp">Expiration date <span class="muted small">(if it has one)</span></label><input id="d-exp" name="expires_on" type="date"></div>
    <div class="field"><label for="d-files">Files <span class="req" aria-hidden="true">*</span></label><p class="hint">PDF, JPG, PNG, WebP or HEIC · ${UPLOAD.maxFileBytes / 1e6} MB each.</p><input id="d-files" name="files" type="file" multiple required accept=".pdf,image/*" aria-describedby="err-files"><p class="error-text" id="err-files"></p></div>
    <div><button class="btn" type="submit">Upload ${icon('upload')}</button></div>
  </form><div class="confirm" data-confirm hidden tabindex="-1"></div></div></div></section>` : ''}`;
  return layout({ title: 'Upload documents', description: 'Secure document upload for trade partners.', path: '/trade-partners/documents/', body, noindex: true, scripts: ok ? ['/js/forms.js'] : [] });
}

// ---- Privacy -----------------------------------------------------------------------------------------
export function privacyPage() {
  const f = facts();
  const c = crumbs([{ href: '/privacy/', label: 'Privacy' }]);
  const body = `<section class="page-hero"><div class="wrap narrow">${c.html}<p class="eyebrow">Privacy</p><h1>Privacy notice</h1><p class="lede">What this website collects, why, and how it’s handled.</p></div></section>
<section class="section tight"><div class="wrap narrow prose">
  <h2>What we collect</h2>
  <p><strong>Project inquiries:</strong> the details you enter — project type, location, readiness, budget range, timing, name, email, phone, description — and any plans or photos you attach.</p>
  <p><strong>Trade-partner applications:</strong> company and contact details, trades, counties served, license information you provide, insurance status, project size, capacity and project examples; and, if we later request them, documents you upload through a private link.</p>
  <p><strong>Technical data:</strong> to prevent abuse, we keep a one-way hashed form of the network address a form was sent from. Our hosting provider (Render) keeps standard server logs. This site uses no advertising or analytics cookies and no third-party tracking scripts. We count a few events in aggregate — for example how many inquiries were completed, how many times the phone link was tapped, which form steps produced errors, and how often search-engine crawlers visit — as daily totals that contain no names, contact details or form answers. A sign-in cookie is used only for our staff’s management area.${TURNSTILE.siteKey ? ' Forms are protected by Cloudflare Turnstile, which processes limited technical data to tell people from automated traffic.' : ''}</p>
  <h2>How we use it</h2>
  <p>To respond to your inquiry or application and to discuss and deliver your project. Your project-contact permission covers that only. We send news or updates only if you separately opted in, and you can opt out at any time.</p>
  <h2>Who can see it</h2>
  <p>Submissions and uploaded files are stored privately on our hosting provider and are available only to our signed-in staff; uploaded files are never publicly linked. A summary of each new inquiry or application is emailed to our business inbox, and a confirmation is emailed to the address you provide; these emails are sent through our email delivery provider (Resend) and received in our business email (Google Workspace). We may share project information with design professionals or trade partners when needed to prepare pricing or deliver your project. We do not sell personal information.</p>
  <h2>Retention and your choices</h2>
  <p>We keep inquiries and applications for as long as needed to respond and for our business records, and delete them on request where we’re not required to keep them. To ask for a copy, a correction or deletion, call ${esc(f.phone)}${f.email ? ` or email <a href="mailto:${attr(f.email)}">${esc(f.email)}</a>` : ''}, or mention it in a new inquiry.</p>
  <h2>Photography</h2>
  <p>Photographs credited to Unsplash are licensed stock images. Items labeled “design concept” are concepts, not completed projects.</p>
  <p class="small muted">Last updated ${fmtDate(PAGE_DATES['/privacy/'])}.</p>
</div></section>`;
  return layout({ title: 'Privacy Notice', description: 'How Nation Design & Construction handles information submitted through this website.', path: '/privacy/', body, jsonld: [c.ld] });
}

// ---- 404 ---------------------------------------------------------------------------------------------
export function notFoundPage(path) {
  const cats = categories();
  const body = `<section class="page-hero"><div class="wrap">
  <p class="eyebrow">Page not found</p><h1>We couldn’t find that page.</h1>
  <p class="lede">The address may have changed, or the page may not be published yet. Here are the most useful places to go next.</p>
  <form class="search mt-4 max-60" action="/services/" method="get" role="search">${icon('search')}<label class="sr-only" for="nf-q">Search services</label><input id="nf-q" type="search" name="q" placeholder="Search services"></form>
  <div class="actions mt-4"><a class="btn" href="/">Home</a><a class="btn ghost" href="/services/">All services</a><a class="btn ghost" href="/start/">Discuss your project</a></div>
</div></section>
<section class="section tight"><div class="wrap"><h2 class="h3">Service categories</h2><ul class="chips mt-3">${list(cats, (c) => `<li><a href="${c.path}">${esc(c.name)}</a></li>`)}</ul></div></section>`;
  return layout({ title: 'Page not found', description: 'The page you requested could not be found.', path: path || '/404', body, noindex: true });
}

// ---- Brand assets (internal, noindex) -----------------------------------------------------------------
export function brandPage() {
  const files = [
    ['nation-logo', 'Primary logo — light backgrounds', '#F6F2EA', true], ['nation-logo-ivory', 'Logo for dark backgrounds (ivory lettering, light-bronze symbol)', '#1E1D1B', true],
    ['nation-logo-bronze-ivory', 'Dark backgrounds — bronze symbol (use where the bronze has enough contrast)', '#3A3834', false],
    ['nation-logo-black', 'One-color black (forms, single-color print)', '#FFFFFF', false], ['nation-logo-white', 'One-color white (vehicle vinyl, shirts, embroidery)', '#2A2926', false],
    ['nation-symbol', 'Symbol — bronze', '#F6F2EA', true], ['nation-symbol-light', 'Symbol — light bronze for dark backgrounds', '#1E1D1B', false],
  ];
  const body = `<section class="page-hero"><div class="wrap"><p class="eyebrow">Brand</p><h1>Logo &amp; brand assets</h1>
  <p class="lede">The approved NATION logo. SVG files are vector outlines traced from the approved artwork (no fonts needed) — use them for signs, vehicles and shirts. Transparent PNGs are provided for documents.</p></div></section>
<section class="section"><div class="wrap grid c2">${list(files, ([f, label, bg, png]) => `<figure class="panel"><div class="brand-swatch" style="background:${bg}"><img src="${brand(f + '.svg')}" alt="${attr(label)}" loading="lazy"></div>
  <figcaption><strong>${esc(label)}</strong><br><a href="/brand/${f}.svg" download>SVG</a>${png ? ` · <a href="/brand/${f}.png" download>PNG</a>` : ''}</figcaption></figure>`)}
  <figure class="panel"><div class="brand-swatch"><img src="${brand('nation-favicon.svg')}" alt="Favicon" width="64" height="64"> <img src="${brand('nation-apple-touch-icon.png')}" alt="App icon" width="64" height="64"></div><figcaption><strong>Favicon, app icon &amp; social card</strong><br><a href="${brand('nation-favicon.svg')}" download>favicon.svg</a> · <a href="/favicon.ico" download>favicon.ico</a> · <a href="${brand('nation-icon-512.png')}" download>icon-512.png</a> · <a href="${brand('nation-og-image.png')}" download>og-image.png</a></figcaption></figure>
  <div class="panel"><h2>Colors</h2><ul class="ticks"><li>Logo bronze #795C38 · light bronze #C99A69 on dark</li><li>Logo charcoal #202428</li><li>Warm ivory #F6F2EA</li></ul>
  <h2 class="mt-2">Clear space &amp; sizes</h2><p class="small">Keep clear space at least the height of the NATION letters around the logo. Keep the full logo at least 220 px / 60 mm wide so DESIGN &amp; CONSTRUCTION stays readable; below that, use the symbol alone. Never stretch, recolor outside these versions, or redraw the lettering.</p></div>
</div></section>`;
  return layout({ title: 'Brand assets', description: 'Nation Design & Construction logo files and brand colors.', path: '/brand/', body, noindex: true });
}

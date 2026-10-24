import { esc, attr, icon, list } from '../html.mjs';
import { layout, pic, credit, ctaBand, faqBlock } from '../layout.mjs';
import { categories } from '../../server/services.mjs';
import { PROCESS, PRINCIPLES, HOME_FAQS } from '../../content/company.mjs';
import { CONCEPTS, conceptArt } from '../concepts.mjs';
import { publishedPhotos } from '../../server/photos.mjs';
import { inquiryMini } from './start.mjs';
import { PREVIEW_HEADING, PREVIEW_TEXT } from '../../content/story.mjs';

export function home() {
  const cats = categories();
  const faq = faqBlock(HOME_FAQS);
  const portfolio = publishedPhotos('project');
  const evidence = portfolio.length
    ? `<div class="grid c3">${list(portfolio.slice(0, 6), (p) => `<figure><div class="fig r32"><img src="/media/${p.id}.${p.ext}" alt="${attr(p.alt)}" loading="lazy" width="${p.width || 1200}" height="${p.height || 800}"></div><figcaption>${esc(p.title)}${p.caption ? ` — ${esc(p.caption)}` : ''}</figcaption></figure>`)}</div>`
    : `<div class="grid c3">${list(CONCEPTS.slice(0, 3), (c) => `<article class="concept reveal"><div class="art"><span class="label-chip">Design concept</span>${conceptArt(c.id)}</div><div class="body"><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></div></article>`)}</div>`;

  const body = `
<section class="hero on-dark" aria-labelledby="hero-h">
  <div class="hero-media">${pic('hero-home-dusk', { eager: true, sizes: '100vw', alt: '' })}</div>
  <div class="wrap">
    <p class="eyebrow">Residential &amp; Commercial · Florida</p>
    <h1 id="hero-h">Designed with care. Built <em class="serif-em">to the drawing.</em></h1>
    <p class="lede">Nation Design &amp; Construction plans, designs and builds complete residential and commercial projects — or takes your existing plans and builds them properly. One point of contact from concept to final cleanup.</p>
    <div class="actions">
      <a class="btn light" href="/start/">Discuss Your Project ${icon('arrow')}</a>
      <a class="btn ghost-light" href="/process/">How we work</a>
    </div>
    <p class="photo-note">${credit('hero-home-dusk')}</p>
  </div>
</section>

<section class="section tight" aria-labelledby="who-h">
  <div class="wrap split wide-left">
    <div>
      <p class="eyebrow">What we do</p>
      <h2 id="who-h" class="max-60">A design-focused construction company that manages the whole project.</h2>
    </div>
    <div class="stack">
      <p class="lede">From feasibility and design coordination through permits, construction, inspections and turnover, we organize the work, the people and the paperwork — so you deal with one accountable company instead of a dozen separate contractors.</p>
      <p class="muted">The work itself is carried out by specialist trade partners and licensed design professionals. We plan it, coordinate it, supervise it and check it.</p>
    </div>
  </div>
</section>

<section aria-label="Residential and commercial">
  <div class="entries">
    <a class="entry" href="/residential/">
      ${pic('home-pool-white', { sizes: '(min-width: 860px) 50vw, 100vw', alt: '' })}
      <div class="entry-body"><p class="eyebrow">Residential</p><h3>Homes, additions &amp; renovations</h3>
      <p>Custom homes, whole-home renovations, additions, kitchens, baths and outdoor living — designed around how you live.</p>
      <span class="textlink">Residential projects ${icon('arrow')}</span></div>
    </a>
    <a class="entry" href="/commercial/">
      ${pic('office-lounge', { sizes: '(min-width: 860px) 50vw, 100vw', alt: '' })}
      <div class="entry-body"><p class="eyebrow">Commercial</p><h3>Build-outs, new buildings &amp; site work</h3>
      <p>Tenant improvements, offices, retail, restaurants and ground-up construction — scheduled around the date you need to open.</p>
      <span class="textlink">Commercial projects ${icon('arrow')}</span></div>
    </a>
  </div>
</section>

<section class="section" aria-labelledby="paths-h">
  <div class="wrap">
    <div class="section-head split">
      <div><p class="eyebrow">Two ways to start</p><h2 id="paths-h">Wherever your project is today, there’s a clear next step.</h2></div>
      <p class="lede">Some clients come to us with an idea. Others arrive with a full set of permit drawings. Both are equally welcome.</p>
    </div>
    <div class="paths">
      <div class="path reveal">
        <p class="quote">“I need design and construction.”</p>
        <p class="muted">You have a property, a goal and a budget in mind — but no drawings yet.</p>
        <ul>
          <li>${icon('check')}<span>Feasibility and an early budget range before design goes too far</span></li>
          <li>${icon('check')}<span>Design coordinated with licensed architects, engineers and interior designers as required</span></li>
          <li>${icon('check')}<span>Selections and 3D visualization so you can see decisions before they’re built</span></li>
          <li>${icon('check')}<span>Pricing that develops with the design, not after it</span></li>
        </ul>
        <div class="actions"><a class="btn" href="/start/?readiness=design">Start with design ${icon('arrow')}</a><a class="textlink" href="/services/design-preconstruction/">Design &amp; preconstruction ${icon('arrow')}</a></div>
      </div>
      <div class="path reveal">
        <p class="quote">“I already have plans.”</p>
        <p class="muted">You have architectural drawings, engineering or a site plan — and need a builder.</p>
        <ul>
          <li>${icon('check')}<span>A plan review for completeness, buildability and cost drivers</span></li>
          <li>${icon('check')}<span>A line-by-line price with clear inclusions, exclusions and allowances</span></li>
          <li>${icon('check')}<span>Permit coordination with your design team</span></li>
          <li>${icon('check')}<span>Construction managed to the drawings, with your designer kept in the loop</span></li>
        </ul>
        <div class="actions"><a class="btn" href="/start/?readiness=plans">Send us your plans ${icon('arrow')}</a><a class="textlink" href="/pricing/">How pricing works ${icon('arrow')}</a></div>
      </div>
    </div>
  </div>
</section>

<section class="section stone" aria-labelledby="svc-h">
  <div class="wrap">
    <div class="section-head split">
      <div><p class="eyebrow">Services</p><h2 id="svc-h">The full construction lifecycle, coordinated in one place.</h2></div>
      <div class="stack"><p class="lede">Fourteen categories, from preconstruction and engineering through finishes, outdoor living and closeout.</p>
      <div><a class="textlink" href="/services/">Search all services ${icon('arrow')}</a></div></div>
    </div>
    <div class="cat-grid">
      ${list(cats, (c, i) => `<a class="cat-tile" href="${c.path}"><span class="num">${String(i + 1).padStart(2, '0')}</span><h3>${esc(c.name)}</h3><p>${esc(c.blurb)}</p><span class="more">${c.services.length} services ${icon('arrow')}</span></a>`)}
      <a class="cat-tile cat-cta" href="/start/"><span class="num">—</span><h3>Not sure where your project fits?</h3><p>Describe it in your own words and we’ll tell you how we’d approach it.</p><span class="more">Discuss your project ${icon('arrow')}</span></a>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="proc-h">
  <div class="wrap split top">
    <div class="stack-lg">
      <div><p class="eyebrow">Our process</p><h2 id="proc-h">A sequence you can follow, from first call to final walkthrough.</h2></div>
      <figure><div class="fig r43">${pic('drawings-flatlay', { sizes: '(min-width: 960px) 45vw, 100vw' })}</div><figcaption class="credit">${credit('drawings-flatlay')}</figcaption></figure>
    </div>
    <div>
      <ol class="steps">${list(PROCESS.slice(0, 6), (s, i) => `<li><span class="n">${String(i + 1).padStart(2, '0')}</span><div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div></li>`)}</ol>
      <p class="mt-3"><a class="textlink" href="/process/">See all ${PROCESS.length} stages ${icon('arrow')}</a></p>
    </div>
  </div>
</section>

<section class="section dark on-dark" aria-labelledby="approach-h">
  <div class="wrap">
    <div class="section-head split">
      <div><p class="eyebrow">How we approach the work</p><h2 id="approach-h">Scope, pricing, communication and quality — handled deliberately.</h2></div>
      <p class="lede">These aren’t slogans; they’re the documents and routines that run every project.</p>
    </div>
    <div class="principles">${list(PRINCIPLES, (p) => `<div class="principle reveal">${icon(p.icon)}<h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></div>`)}</div>
  </div>
</section>

<section class="section" aria-labelledby="ev-h">
  <div class="wrap">
    <div class="section-head split">
      <div><p class="eyebrow">${portfolio.length ? 'Recent work' : 'Design inspiration'}</p><h2 id="ev-h">${portfolio.length ? 'Projects we have completed.' : 'Concepts that show how we think.'}</h2></div>
      <p class="lede">${portfolio.length ? 'Published with the owners’ permission.' : 'These are clearly labeled design concepts, not completed projects. Our portfolio will appear here as projects are completed and owners agree to share them.'}</p>
    </div>
    ${evidence}
    <p class="mt-4"><a class="textlink" href="/design-inspiration/">Design inspiration ${icon('arrow')}</a></p>
  </div>
</section>

<section class="section stone" aria-labelledby="faq-h">
  <div class="wrap split top">
    <div><p class="eyebrow">Questions</p><h2 id="faq-h">Useful answers before you call.</h2><p class="lede mt-3">If your question isn’t here, include it in your inquiry and we’ll answer it directly.</p></div>
    <div>${faq.html}</div>
  </div>
</section>

<section class="section story-preview" aria-labelledby="meaning-h">
  <div class="wrap story-preview-grid">
    <img class="story-preview-mark" src="/brand/nation-symbol.svg" alt="" aria-hidden="true" width="342" height="362" loading="lazy" decoding="async">
    <div class="stack">
      <h2 id="meaning-h">${esc(PREVIEW_HEADING)}</h2>
      <p class="lede">${esc(PREVIEW_TEXT)}</p>
      <p><a class="textlink" href="/about/#our-story">The meaning behind Nation ${icon('arrow')}</a></p>
    </div>
  </div>
</section>

<section class="section stone" aria-labelledby="start-h">
  <div class="wrap split top">
    <div><p class="eyebrow">Start a conversation</p><h2 id="start-h">Tell us about your project.</h2>
      <p class="lede mt-3">Three short steps. Choose the type of project here and continue on the next page, where you can add plans or photos.</p></div>
    ${inquiryMini()}
  </div>
</section>`;

  return layout({
    title: 'Nation Design & Construction',
    description: 'Design-focused residential and commercial construction in Florida. Complete projects from concept and planning to final cleanup — or built from your existing plans.',
    path: '/', body, jsonld: [faq.ld, { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Nation Design & Construction', url: 'https://nationdesignconstruction.com/' }],
    preloadImage: 'hero-home-dusk',
  });
}

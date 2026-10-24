# Service content — schema and writing rules

Nation Design & Construction is a **new** premium, design-focused residential and commercial construction company,
starting in Florida. It manages complete projects (concept → planning → construction → final cleanup) and substantial
standalone projects. Customers who already have architectural drawings, engineering or site plans are equally welcome.
Delivery model: specialist subcontractors and professional partners do the trade and design-professional work; the
company manages coordination, logistics, supervision, scheduling, quality control, and is the one main point of contact.

Positioning to express (through substance, not slogans): excellent design and workmanship · organized project
management · clear scopes and transparent pricing · careful scheduling and proactive communication · quality control
and accountability · one main point of contact.

## Hard rules (a page that breaks one is rejected)
1. **Never invent facts about the company**: no licenses or license numbers, insurance, bonding, certifications,
   years in business, completed projects, project counts, customer reviews, staff names, awards, warranties,
   guarantees, response times, phone numbers, addresses, service areas beyond "Florida", financing, or partnerships
   with named brands/manufacturers. Do not say "our licensed electricians", "our crews", "our engineers", "our
   in-house designers". Say "licensed electrical contractor partners", "specialist trade partners", "a licensed
   structural engineer", etc.
2. **No dollar amounts, percentages of cost, "starting at" figures, durations in weeks/months, or discounts.**
   Pricing sections explain *how* the work is priced and *what changes the cost*. Scheduling sections explain stages
   and *what affects* timing — no specific durations.
3. **Regulated and professional work** (architecture, engineering, surveying, geotechnical, sinkhole, structural,
   electrical, plumbing, HVAC, roofing, pools, fire protection, low-voltage/alarm, demolition) — state plainly that a
   licensed professional or appropriately licensed contractor performs/seals that work, and what the company's role is
   (scope definition, scheduling, coordination with the rest of the build, site supervision, quality checks,
   keeping the owner informed). Never imply the company itself holds those licenses.
4. **Sinkhole, foundation, concrete restoration, water intrusion, storm damage, geotechnical**: pricing is
   assessment-based — the scope (and so the price) cannot be set until testing/engineering is complete. Do not
   diagnose or promise outcomes ("permanently fixes", "guaranteed").
5. Florida accuracy, stated carefully and generally: Florida Building Code; local building departments issue permits
   and inspections; product approvals (Florida Product Approval / Miami-Dade NOA in HVHZ areas) for windows, doors,
   roofing; wind-load requirements vary by location; flood zones/elevation requirements may apply; HOA/condo approvals
   are common. Do not cite statute numbers, code section numbers, or specific jurisdiction rules you are not certain
   of. Prefer "may", "typically", "depending on your jurisdiction".
6. No competitor names, no copied text, no keyword stuffing, no city names, no "best in Florida" superlatives,
   no exclamation marks. Write for a thoughtful homeowner or business owner, not for search engines.
7. Insurance-claim topics (storm damage): the company does not act as a public adjuster and does not negotiate claims;
   it can provide scope documentation and pricing for the work. Say so neutrally.
8. Overlap: complete-project budgets already include the trades they need. Where natural (one sentence, not every
   page), note that if this service is part of a larger project it is priced within that project's budget rather than
   as a separate estimate to add on top.

## Voice
Calm, precise, confident, premium. Short paragraphs. Concrete nouns (materials, steps, documents) over adjectives.
American English. Sentence-case headings. Second person ("you") for the customer, "we" for the company.
Each page should read as useful on its own — someone should learn something real about the work.

## File format
Each file is an ES module: `export default { '<slug>': { ...page }, ... }` with one entry per slug assigned.
Use plain strings (no HTML, no Markdown). Use typographic apostrophes (’) and en dashes (–) where natural.
Keep the exact slugs given. Every field is required unless marked optional.

```js
export default {
  'kitchen-renovation': {
    summary: '≤ 155 chars. One sentence used for cards and meta description.',
    title: '≤ 60 chars page <title> without brand, e.g. "Kitchen Renovations in Florida"', // optional; default = name
    intro: ['2–3 paragraphs: what the service is, and how we approach it'],
    whoFor: ['4–6 bullets: who this is for / typical situations'],
    included: ['6–10 bullets: work typically included'],
    exclusions: ['3–6 bullets: common exclusions or items priced separately'],
    options: [{ title: 'Option / material / upgrade', text: '1–2 sentences' }],   // 3–6 items
    partnerRole: 'optional, 1–3 sentences: who performs regulated/professional parts and what our role is',
    pricing: {
      how: ['1–2 paragraphs: how this work is priced (unit/project/assessment basis), what an estimate is based on'],
      factors: ['5–8 bullets: what changes the cost'],
    },
    stages: [{ title: 'Stage name', text: '1–2 sentences' }],                      // 4–7 stages, in order
    scheduling: ['3–5 bullets: what affects timing (no durations)'],
    faqs: [{ q: 'Question?', a: '2–4 sentence answer' }],                           // 3–5 FAQs, genuinely useful
    related: ['3–5 slugs from the catalog list you were given'],
    // v2 (2026-10-24)
    standalone: { mode: 'yes' | 'either' | 'with-project',
      text: '1–2 sentences: can a customer hire this on its own, or is it normally part of a larger project? Speak to the substantial-work focus without numbers (no "handyman", no minimum amounts).' },
    startWith: ['3–6 bullets: the information or documents that let us scope and price THIS work, e.g. "Photos of the existing roof and attic", "Survey or plot plan", "HOA architectural guidelines", "Existing drawings or engineering, if any". Specific to the service.'],
  },
};
```

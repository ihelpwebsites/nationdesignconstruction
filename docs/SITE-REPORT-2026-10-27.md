# Nation Design & Construction — Website Report (for outside review)

**Site:** https://nationdesignconstruction.com
**Report date:** October 27, 2026
**Status:** Live and public. New company, launching in Florida.

> **Note to the reviewer (ChatGPT):** Please review this website for business, marketing, legal-risk, SEO,
> conversion, accessibility and technical issues. You can visit the live URL. Please be specific: name the page,
> what's wrong, why it matters, and the exact fix. Separate **must fix before marketing** from **nice to have**.
> The owner's rule is that the site must never invent facts, so please don't recommend adding licenses,
> reviews, years in business, prices or service areas unless the owner supplies real ones.

---

## 1. What the business is

- **Name:** Nation Design & Construction
- **Positioning:** Premium, design-focused residential and commercial construction. Nation manages whole projects
  from concept and planning through construction and final cleanup. It also takes on substantial standalone projects.
- **Delivery model (stated on the site):** Nation is responsible for scope, pricing, scheduling, coordination, site
  supervision and quality control, with one main point of contact. Specialist trade partners and licensed design
  professionals perform their parts of the work. Customers with existing drawings, engineering or site plans are welcome.
- **Market:** Launching in Florida. Coverage is confirmed per project, and the site doesn't claim statewide coverage.
- **Phone:** (813) 804-0555, click-to-call on every page.
- **Email:** hello@nationdesignconstruction.com (Google Workspace inbox), linked on every page.
- **Brand:** The approved bronze "NATION — Design & Construction" logo, plus the owner's approved brand story,
  which appears word for word on About under "Our story" with a short preview on the home page.

## 2. Site structure (107 indexable pages in the sitemap, including /contact/ added 2026-10-27)

| Section | Pages | Notes |
|---|---|---|
| Home | 1 | Hero, residential/commercial paths, how it works, story preview, call to action |
| Residential | 4 | Overview, plus custom homes, additions and whole-home renovations |
| Commercial | 4 | Overview, plus new construction, build-outs and site development |
| Services directory | 90 | Directory page, 14 category pages and 75 detailed service pages |
| Process | 1 | Step-by-step process and a "who is responsible for what" section |
| Pricing guide | 1 | How pricing works. **No advertised service prices** (see section 6). |
| Contact | 1 | Confirmed phone and email, link to the project form (added 2026-10-27) |
| About | 1 | Brand story, company facts and contact panel |
| Design inspiration | 1 | Design concepts and material studies, all labeled "Design concept" |
| Start (inquiry form) | 1 | Three-step project inquiry |
| Trade partners | 1 | Subcontractor prequalification application |
| Privacy | 1 | Privacy notice |

**The 14 service categories (75 services):**
- Design & Preconstruction (6)
- Site Plans & Engineering (5)
- Demolition & Site Preparation (4)
- Foundations & Structure (5)
- Roofing & Building Exterior (7)
- Electrical, Plumbing & HVAC (6)
- Interiors & Finishes (8)
- Kitchens, Bathrooms & Custom Spaces (5)
- Pools & Outdoor Living (5)
- Landscaping & Property Improvements (7)
- Technology & Low Voltage (5)
- Commercial Construction (5)
- Specialty Repairs (5)
- Construction Cleanup & Closeout (2)

**Every service page has:**
- What's included
- How Nation delivers it (who does what)
- Whether it can be hired standalone
- What Nation needs from the customer to price it
- The pricing basis (no figures)
- Related services
- A call to action

**Not on the site:** a dedicated /faq/ page (returns 404). FAQs are inside the pages they answer.

## 3. Forms and where they go

| Form | What happens |
|---|---|
| **Project inquiry** (/start/) | Three steps: project type → details (location, readiness, budget range, timing, description, optional files) → contact. Saved to the database first, then emailed to **hello@** with every answer. Hitting Reply on that email goes to the customer. The customer also gets a confirmation email, and replying to that goes to hello@. |
| **Trade partner application** (/trade-partners/) | Company, contact, trades, counties, license info, insurance status, project size, crew size, availability and references. Emailed to **hello@** with every answer; Reply goes to the applicant. The applicant also gets a confirmation. Applicants are never approved automatically. |
| **Trade document upload** | Private link sent by staff, which expires after 14 days and can be revoked. Accepts PDF and images: up to 6 files, 10 MB each, 30 MB total. File types are checked from the file contents, not just the extension. hello@ is notified. |

**Lead safety:**
- Every submission is saved before any email is attempted.
- Retries and double-clicks don't create duplicates; a repeat returns the same reference number.
- Failed emails retry automatically, up to 6 attempts.
- Spam protection: a hidden honeypot field, a minimum fill time, same-origin checks and a limit of 6 submissions per hour per visitor.
- Marketing consent is optional and unchecked by default.
- Test submissions are marked "[TEST]" and never email the test address.

**⚠ Current email status:**
- Sending runs through Resend, from notify@notify.nationdesignconstruction.com. That domain is verified with DKIM and SPF.
- Checked on the server on October 27: the **Resend API key is still not set**. Until it's added, forms are saved in admin but **no emails go out**.
- Once it's added, notifications from the previous 3 days send automatically; older ones are listed in admin → Dashboard → Email delivery with a button to send them (test records left out). Customer confirmations are never sent late.
- Inbox delivery to hello@ has **not yet been confirmed** with a real send.

## 4. Admin (private, sign-in required)

- Inquiries and trade applications, with status tracking and CSV export.
- Private file downloads, available to signed-in staff only.
- Revoking upload links.
- Services: publish, preview or hide each one, and add reviewed pricing.
- Business details (license, service area, leadership, insurance, address, hours). These show on the site **only
  once ticked "verified"**.
- Photo uploads with a rights confirmation.
- A toggle for AI-training crawlers.
- Security: sign-in throttling, CSRF protection and same-origin checks.

## 5. Facts deliberately NOT shown (waiting on the owner)

The site makes **no** claims about any of these:
- Contractor license number(s), and confirmation that Nation itself is qualified to contract in Florida
- Insurance or bonding
- Years in business, completed projects, reviews or ratings, awards, staff or leadership names
- Office address or hours
- A confirmed list of counties or cities served
- Real project photos

**⚠ Legal flag for review:** in Florida, advertising construction contracting generally requires the company (through a
qualifying agent) to hold the right state contractor license, and the license number usually has to appear in the
advertising. All 75 services are currently published as offerings. The owner has been advised to confirm with counsel,
and to hide services in admin that Nation isn't yet qualified to offer.

## 6. Pricing

- **No advertised service prices.** The Pricing guide and each service explain how the price is set: per project,
  per square foot, by assessment, and so on.
- **Customer budget ranges are different:** the inquiry form asks the customer to choose an approximate budget range
  (for example “$25,000 – $75,000” or “Not sure yet”). Those are the customer’s own budget choices, not Nation’s prices.
- Figures appear only if the owner enters a complete, reviewed price entry for a service in admin (range or starting
  price, unit, minimum, inclusions and exclusions, area, review date).
- Engineering, sinkhole and unknown-condition work is always described as "priced after assessment".

## 7. Photography

- The photos are licensed Unsplash stock, with a credit to the photographer under each one ("Photo: [name] / Unsplash").
- **At the owner's request (October 26), the "Representative photo, not our project" labels were removed sitewide.** The
  site never says the photos are Nation's work, but visitors may assume they are.
- One photo (an architect reviewing plans) is an Unsplash image edited, by the owner, to show the NATION logo on the shirt. It is credited and marked "(edited)".
- **Reviewer question:** is showing unlabeled stock photos, including one with the company logo edited in, a
  trust or advertising risk, and what's the best practice until real project photos exist?
- Design concepts and material studies are labeled "Design concept".

## 8. SEO and search engines

| Item | Status |
|---|---|
| Canonical domain | https://nationdesignconstruction.com. www, http, nationdc.onrender.com and URLs without a trailing slash all 301 to it. |
| Sitemap | /sitemap.xml with 106 URLs and real last-modified dates |
| Robots.txt | Search and answer engines allowed (Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, PerplexityBot, Applebot, DuckDuckBot); admin, API, private upload pages and the thank-you page blocked. AI-training crawlers are allowed (owner setting). |
| llms.txt | Plain-language summary for AI assistants, with key pages and a note not to assume unstated facts |
| Structured data | One GeneralContractor organization (name, logo, phone, email, contact point) and Service entries on service pages. No areaServed, address, ratings or reviews, because none are verified. |
| Titles and meta | Unique title and description on every page; Open Graph image with the brand logo |
| Google Search Console | Domain property verified; sitemap resubmitted Oct 27 (Success, 107 discovered). URL Inspection: home, /residential/, a category and a service page are indexed; /commercial/ and /contact/ were "Discovered – not indexed" (indexing requested). The summary Pages report lags (shows 0 indexed). 12 impressions, 5 clicks so far. No manual actions or security issues. |
| Bing Webmaster Tools | Site imported; sitemap read Oct 25 (Success, 106 URLs). Home page "Indexed successfully". |
| IndexNow | 106 URLs submitted Oct 24 (HTTP 202, key pending); 6 changed URLs submitted Oct 27 (HTTP 200). Received ≠ indexed. |
| Google Business Profile | **Not set up.** Needs a verified address or service area from the owner. |
| Backlinks / citations | None yet (new domain) |

## 9. Performance (Google PageSpeed lab tests, October 24)

| Page | Mobile (Perf · Access. · Best pr. · SEO) | Largest paint |
|---|---|---|
| Home | 98 · 100 · 100 · 100 | 2.0 s mobile, 0.7 s desktop |
| Category page | 100 · 100 · 100 · 100 | 1.5 s |
| Kitchen service page | 100s | 1.4 s |
| /start/ form | 100s | 1.4 s |
| Trade partners | 100s | 1.4 s |

**How the speed is achieved:**
- Images are served as AVIF with a WebP fallback, at responsive sizes.
- The hero image is preloaded.
- Fonts are self-hosted.
- There are no third-party scripts, trackers or cookie banners.

No real-visitor speed data exists yet, because the site is new.

## 10. Security and privacy

- HTTPS everywhere, with HSTS.
- Strict Content-Security-Policy; X-Frame-Options DENY; nosniff; a strict referrer policy; camera, microphone and location disabled.
- Uploaded files are stored privately, outside the public site, and can only be downloaded by signed-in staff.
- Tested live:
  - Admin pages redirect to sign-in.
  - Private paths, the database file and draft media return 404.
  - A cross-origin form post is rejected with 403.
  - A fake upload link returns 404.
- Analytics are first-party aggregate counts only (page events, phone and email clicks, form steps, crawler visits),
  with **no personal data and no cookies for tracking**.
- The privacy notice explains storage, Resend and Google Workspace email, sharing with trade partners when needed,
  no selling of data, and how to request deletion.
- Backups: hosting disk snapshots every 24 hours, kept for 7 days.

## 11. Accessibility

- Lighthouse accessibility score is 100 on every page tested.
- Semantic headings in order, labeled form fields, alt text on every image, keyboard-accessible navigation and
  mobile menu, visible focus states, and sufficient color contrast.

## 12. Technical setup (short)

- **Code:** Node.js server-rendered HTML with no frameworks or third-party dependencies, and a SQLite database. Hosted on Render (Starter plan plus a persistent disk).
- **DNS:** at GoDaddy. Google Workspace MX/SPF for the inbox; Resend records only on the notify. subdomain; DMARC in place.
- **Testing:** 43 automated end-to-end tests, an email-path test and a content-rules check, all passing on the latest version.
- **Latest deploy (October 26):**
  - Trade-application emails now include every answer.
  - The stock-photo labels were removed.

## 13. Open items (owner)

1. **Add the Resend API key** in Render, so form emails actually send. Then confirm a test arrives in hello@.
2. **Confirm Nation's Florida contractor qualification and license number(s)** with counsel. Hide services that can't be offered yet.
3. Supply the service area (counties or cities), leadership name and role, and an insurance statement.
4. Real project photos, with rights. Decide whether stock photos should be labeled again (see section 7).
5. Set up a Google Business Profile.
6. Optional: reviewed pricing for any services where figures should be shown; project minimums.

## 14. Questions for the reviewer

1. Does the home page make clear, within 5 seconds, what Nation does, who it's for and where?
2. Is the "Nation manages, licensed partners perform" delivery model clear and legally safe in the copy?
3. Is the 3-step inquiry form too long or too short for premium leads? Is anything missing, like preferred contact
   time or how they heard about us?
4. With no reviews, photos or license shown yet, what honest trust signals should be added first?
5. Should there be dedicated /contact/ and /faq/ pages?
6. Any SEO improvements for a brand-new local construction site (internal links, location pages without inventing
   coverage, content gaps)?
7. Any wording that over-promises or could be read as a guarantee?

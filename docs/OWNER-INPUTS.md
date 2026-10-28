# Private completion checklist (owner) — updated 2026-10-24

Nothing here appears on the website. Items marked ⛔ block a feature; the rest strengthen trust and search.
Most facts are entered in **admin → Business details** and only appear once you tick **verified**.

## ⛔ Blocking
| Item | Status | What to do |
|---|---|---|
| **Mailbox hello@nationdesignconstruction.com** | ✅ Created by the owner (Google Workspace MX + SPF present). Published sitewide. | Nothing — but confirm the first notification arrives (see next row). |
| **Notification sending** | ⛔ Only the secret is missing. Resend domain `notify.nationdesignconstruction.com` is **verified** (DKIM + send/rsend records at GoDaddy, 2026-10-24); sender, recipient (hello@) and Reply-To are built in. | Resend → API Keys → Create API key → permission **Sending access**, domain **notify.nationdesignconstruction.com** → copy it. Render → nationdc → Environment → Add `RESEND_API_KEY` = (the key) → Save, rebuild and deploy. Then admin → Dashboard → Email delivery → "Send these" to deliver the older backlog (checked 2026-10-27: key still missing; 3 unsent notifications for non-test records). Check hello@ (and spam). |
| **Unnotified inquiries from launch day** | ⚠ Review in admin → Inquiries. **NDC-X6AUQS** (Oct 24, outside email address) may be a real customer who has never been contacted. NDC-4MSZ9P and NDC-MTKZPE came from your own email domain — mark them closed if they were your tests. | Reply to NDC-X6AUQS personally if it's genuine (its customer confirmation was never sent). |
| **Bing Webmaster Tools** | ✅ Imported 2026-10-24; sitemap read (106 URLs); home page indexed (checked 2026-10-27). | Nothing — check bing.com/webmasters in a few days for discovered URLs. |

## ⚠ Contracting qualification (legal — confirm first)
Licensed subcontractors do not qualify Nation itself to contract for construction. In Florida, offering or advertising
contracting generally requires the company (through a qualifying agent) to hold the appropriate certified or registered
contractor license (e.g. general, building or residential) — confirm with counsel which applies and that Nation's legal
entity is qualified. The site makes **no** license, insurance or bonding claims today, but all 75 service pages are
published as offerings. If Nation is not yet qualified, set the services to **preview** or **hidden** in admin → Services
until it is. Once qualified, add the exact license number(s) in admin → Business details (shown in the footer and About).

## Trust facts (shown only once verified)
- **Contractor license number(s)** — Florida generally requires the license number in advertising; confirm with counsel. Shown in the footer and About.
- **Confirmed service area** (counties/cities) — the site currently says "launching in Florida" and confirms coverage per project; it never claims statewide coverage.
- **Leadership** (name and role) and an **insurance statement** you can document — shown on About.
- Optional: office address and hours.

## Decisions
- **Which services to offer now**: all 75 detailed services were published 2026-10-24 based on your stated scope. Hide or set to preview in admin → Services any you can't deliver yet.
- **Validated pricing** (range or starting price, unit, minimum, inclusions/exclusions, area, review date) for any service where you want figures shown. None are invented.
- **Project minimums** per service (optional; flags smaller inquiries — no universal minimum is applied).
- **AI model-training crawlers**: currently allowed (search/answer crawlers are always allowed). Change in admin → Business details if you prefer to opt out.
- **Search Console**: the property was added and verified under the Google account signed in to Chrome (NVR account). Add your business Google account as an owner (Settings → Users and permissions) if it should live there.
- **Real project photos** with owner permission — replaces "design inspiration" on the home page with authentic work.

## Content to sanity-check
- Service pages state that licensed trades and design professionals perform regulated work and that Nation coordinates, supervises and checks it. Confirm this matches how you will contract.
- Commitments written as process (not guarantees): written change pricing before work proceeds; scheduled updates; coverage confirmed before site visits.
- The drafting photo is the Unsplash original with the NATION logo added (supplied by you); it credits the photographer, marked "(edited)". The "Representative photo, not our project" label was removed sitewide at your request (2026-10-26).

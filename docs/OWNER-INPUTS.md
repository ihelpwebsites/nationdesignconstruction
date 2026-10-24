# Private completion checklist (owner) — updated 2026-10-24

Nothing here appears on the website. Items marked ⛔ block a feature; the rest strengthen trust and search.
Most facts are entered in **admin → Business details** and only appear once you tick **verified**.

## ⛔ Blocking
| Item | Status | What to do |
|---|---|---|
| **Mailbox for hello@nationdesignconstruction.com** | ⛔ The domain has **no MX records** (checked 2026-10-24), so this mailbox does not exist. The site therefore shows the phone and form only, never the email. | Set up email hosting for the domain (Google Workspace, Microsoft 365 or GoDaddy email). Add its MX/SPF/DKIM records — don't change the A/CNAME/TXT records listed in DEPLOYMENT.md. Send and receive one message, then in admin tick "verified" for the email and set it as the notification inbox. |
| **Notification sending** | ⛔ No email provider key on the server. Leads are stored safely regardless; notifications queue as "not configured" and are delivered automatically (last 3 days) once set up. | In Resend (or similar), verify a sending subdomain (e.g. notify.nationdesignconstruction.com — add its SPF/DKIM records at GoDaddy), then add `RESEND_API_KEY` and `EMAIL_FROM` in Render → nationdc → Environment yourself. Never paste keys into chat. |
| **Bing Webmaster Tools** | ⛔ Needs your Microsoft or Google sign-in in a browser. (IndexNow already notified Bing of all 106 URLs.) | Sign in at bing.com/webmasters → "Import from Google Search Console". |

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
- The drafting photo is the Unsplash original with the NATION logo added (supplied by you); it stays labeled "Representative photo… (edited)" and credits the photographer.

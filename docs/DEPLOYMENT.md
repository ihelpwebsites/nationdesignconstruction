# Deployment — nationdesignconstruction.com

**Live:** https://nationdesignconstruction.com (Render web service `nationdc`, Starter + 1 GB disk at /var/data,
Blueprint `nation-design-construction` from `render.yaml`). Launched 2026-10-24.

## Source & deploys
- Code: GitHub `ihelpwebsites/nationdesignconstruction` (**public** — the owner chose public over re-authorizing
  Render's GitHub app; it contains no secrets or customer data. Make it private again only after adding the repo to
  the Render GitHub app: github.com/settings/installations → Render → Configure → add repo; needs the GitHub password).
- **Auto-deploy is not active** (Render's GitHub app has no access to this repo, so no webhook). After `git push`,
  deploy from Render → nationdc → Manual Deploy → *Deploy latest commit*. Build command = `node tools/check-content.mjs`
  (a content-rule violation fails the deploy).
- **Rollback:** Render → nationdc → Events → choose an earlier successful deploy → *Rollback*; or `git revert` + deploy.
- The persistent disk means each deploy has a few seconds of downtime (Render stops the old instance first).

## DNS (GoDaddy, nameservers ns13/ns14.domaincontrol.com) — changed 2026-10-24
| Record | Before | After |
|---|---|---|
| A `@` | GoDaddy parking (3.33.130.190 / 15.197.148.33) | `216.24.57.1` (Render) |
| CNAME `www` | `nationdesignconstruction.com.` | `nationdc.onrender.com` |
Untouched: NS, SOA, `_domainconnect` CNAME, `_dmarc` TXT (`p=quarantine`). There are **no MX records** — no mailbox
exists at the domain. When email hosting is added, add its MX/SPF/DKIM records and leave the A/CNAME above alone.

## Canonical host & HTTPS
Render issues and renews the TLS certificates. `www` → apex 301 (Render edge); `http` → `https` 301;
`nationdc.onrender.com` → apex 301 (app). Canonical tags, sitemap and robots all use https://nationdesignconstruction.com.

## Secrets (Render → nationdc → Environment; never in git or chat)
`FORM_SECRET` (generated), `BOOTSTRAP_ADMIN_PASSWORD` (generated — first admin login for the email in
`BOOTSTRAP_ADMIN_EMAIL`; change it in admin → Business details after signing in). Optional later: `RESEND_API_KEY`,
`EMAIL_FROM`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.

## Launch verification (2026-10-24)
- `node tools/test.mjs`: 35/35 (routes, 404, canonical/indexing, redirects, headers, structured data, link crawl,
  labels/alt text, inquiry validation/spam/upload/persistence, admin auth/CSRF/throttling, private files, pricing
  rules, availability, trade approval rules, document links, verified-facts gating, photo publishing).
- Live: all core routes 200, 404 page, `/admin/` → sign-in, www/http/onrender redirects, HSTS + CSP, sitemap (31 URLs),
  robots allows crawl, home `index`, preview services `noindex`.
- Live test inquiry **NDC-YSEVBF** ("WEBSITE TEST - please delete", with a PDF) saved; mark it closed in admin.
- PageSpeed (mobile, lab): home 98 / 100 / 100 / 100, LCP 2.1 s, CLS 0, TBT 0; kitchen service page 100 perf,
  LCP 1.2 s (SEO 69 only because preview pages are intentionally noindex).

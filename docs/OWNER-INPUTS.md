# Business facts & decisions needed from the owner

Nothing below is shown on the site until you provide it (most items go in **admin → Business details** and must be
marked *verified*). The site is honest without them, but some features stay off.

## Blocking a feature
| Item | Why it matters | Where |
|---|---|---|
| **Business inbox that actually receives mail** (e.g. hello@nationdesignconstruction.com) | The domain currently has **no MX records**, so no mailbox exists at it. Lead notifications stay off until an inbox is verified. Submissions are still saved in admin. | Set up email hosting (e.g. Google Workspace / Microsoft 365 / GoDaddy email), then admin → Business details → Notification inbox |
| **Email sending key** (Resend API key + a verified sending domain) | Required to send notification emails from the server. Paste the key into Render yourself — never into chat or code. | Render → nationdc → Environment: `RESEND_API_KEY`, `EMAIL_FROM` |
| **Contractor license number(s)** | Florida generally requires the contractor license number on advertising (confirm with your counsel). Shown in the footer once verified. | admin → Business details |

## Recommended before promoting the site
- **Confirmed service area** (counties/cities you will actually serve). Until then the site says "starting in Florida" and asks for the project location.
- **Public phone number**, and optionally an office address and hours.
- **Which services are available now** — every service starts as *preview* (visible, not indexed, with an "availability being confirmed" note). Switch each to *published* in admin → Services as partners are lined up.
- **Validated pricing** for any service where you want figures shown (range or starting price, unit, minimum, inclusions, exclusions, geography, review date).
- **Project minimums** per service (optional; used to flag smaller inquiries — no universal threshold is applied).
- **Real project photos** (with owner permission) to replace the "design inspiration" section with authentic work.

## Content decisions to confirm (written conservatively; edit or tell us to change)
- Preconstruction/design fees described as typically folded into the project if you build; permits and HOA coordination included in complete-project scope; design-professional, survey, geotechnical and government fees passed through as separate lines.
- Offered services: open-permit research before purchase; recycling of concrete/metal/wood "where practical"; site walk before engineer involvement (sinkhole/foundation); temporary tarping/board-up coordination after storms; phased/after-hours work in occupied buildings; post-occupancy check-in; HVAC filter replacement at turnover.
- Florida statements kept general and hedged (permits for structural/MEP/roof/window work; asbestos survey commonly required before demolition; termite protection for new construction; pool barrier requirements; irrigation rain sensors; wind-mitigation inspections). Worth a quick review by your licensed partners.
- No company warranty is promised anywhere; turnover references manufacturer and (where offered) trade-partner warranties.
- Storm-damage pages state the company is not a public adjuster and provides scope documentation and pricing only.

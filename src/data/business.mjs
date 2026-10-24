// Business facts. Only what the owner has stated is hard-coded here. Contact details, license numbers and
// service areas are entered by the owner in admin → Business details and are shown ONLY once marked verified.
// Never add licensing, insurance, bonding, years in business, reviews, awards, staff or guarantees here.
import { getSetting } from '../server/db.mjs';

export const BUSINESS = {
  name: 'Nation Design & Construction',
  shortName: 'Nation',
  descriptor: 'Residential & Commercial',
  domain: 'nationdesignconstruction.com',
  market: 'Florida',              // stated: "starting in Florida". Specific coverage is NOT confirmed.
};

// Editable facts and their defaults (all unverified/empty until the owner fills them in).
export const FACT_FIELDS = [
  { key: 'email', label: 'Public email address', help: 'Shown on the site and used as the reply-to address. Mark verified only after you have sent and received mail at this address.', verify: true, placeholder: 'hello@nationdesignconstruction.com' },
  { key: 'phone', label: 'Public phone number', help: 'Shown in the header, footer and structured data once verified.', verify: true },
  { key: 'license', label: 'Contractor license number(s)', help: 'Florida generally requires the contractor license number in advertising. Enter exactly as issued (e.g. the certification type and number). Shown in the footer once verified.', verify: true },
  { key: 'serviceArea', label: 'Confirmed service area', help: 'Plain words, e.g. counties you have confirmed you serve. Until set, the site says "starting in Florida" and asks for the project location.', verify: true },
  { key: 'address', label: 'Office address', help: 'Only if customers may visit or you want it published.', verify: true },
  { key: 'hours', label: 'Office hours', help: 'Optional. Only if you will keep them.', verify: true },
];

/** Returns only verified, non-empty facts: { email, phone, license, serviceArea, address, hours }. */
export function facts() {
  const saved = getSetting('business', {});
  const out = {};
  for (const f of FACT_FIELDS) {
    const v = saved[f.key];
    if (v && v.value && String(v.value).trim() && v.verified) out[f.key] = String(v.value).trim();
  }
  return out;
}

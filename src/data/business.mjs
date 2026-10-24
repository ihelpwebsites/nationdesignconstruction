// Business facts — the single source for contact details used in visible copy, links and structured data.
// CONFIRMED holds facts the owner has confirmed in writing (2026-10-24). Other facts are entered in admin →
// Business details and are shown ONLY once marked verified. Never add licensing, insurance, bonding, years in
// business, reviews, awards, staff or guarantees here unless the owner confirms them.
import { getSetting } from '../server/db.mjs';

export const BUSINESS = {
  name: 'Nation Design & Construction',
  shortName: 'Nation',
  descriptor: 'Residential & Commercial',
  domain: 'nationdesignconstruction.com',
  market: 'Florida',              // stated: launching in Florida. Specific coverage is NOT confirmed.
};

// Owner-confirmed contact details (2026-10-24).
export const CONFIRMED = {
  phone: '(813) 804-0555',
  phoneE164: '+18138040555',
  // Public inquiry address. Shown and linked only once the mailbox is verified (admin → Business details → Email
  // "verified"), because the domain had no mail (MX) records on 2026-10-24.
  email: 'hello@nationdesignconstruction.com',
};

export const FACT_FIELDS = [
  { key: 'email', label: 'Public email address', help: 'Mark verified only after you have sent mail to this address and received it. Until then the site shows the phone number and the inquiry form only.', verify: true, placeholder: CONFIRMED.email },
  { key: 'phone', label: 'Public phone number (override)', help: `Leave blank to use the confirmed number ${CONFIRMED.phone}. Only fill this in to change it.`, verify: true },
  { key: 'license', label: 'Contractor license number(s)', help: 'Florida generally requires the contractor license number in advertising. Enter exactly as issued (e.g. the certification type and number). Shown in the footer once verified.', verify: true },
  { key: 'serviceArea', label: 'Confirmed service area', help: 'Plain words, e.g. the counties you have confirmed you serve. Until set, the site says it is launching in Florida and confirms coverage per project.', verify: true },
  { key: 'leadership', label: 'Who leads Nation (name and role)', help: 'Optional. Shown on the About page once verified.', verify: true },
  { key: 'insurance', label: 'Insurance statement', help: 'Optional. Only a statement you can document (e.g. “General liability and workers’ compensation coverage — certificates available on request”).', verify: true },
  { key: 'address', label: 'Office address', help: 'Only if customers may visit or you want it published.', verify: true },
  { key: 'hours', label: 'Office hours', help: 'Optional. Only if you will keep them.', verify: true },
];

/**
 * Verified facts for display: { phone, phoneE164, email?, license?, serviceArea?, leadership?, insurance?, address?, hours? }.
 * The confirmed phone is always present; an admin-verified override replaces it.
 */
export function facts() {
  const saved = getSetting('business', {});
  const out = { phone: CONFIRMED.phone, phoneE164: CONFIRMED.phoneE164 };
  for (const f of FACT_FIELDS) {
    const v = saved[f.key];
    if (v && v.value && String(v.value).trim() && v.verified) out[f.key] = String(v.value).trim();
  }
  if (saved.phone?.verified && saved.phone.value) {
    const digits = saved.phone.value.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
    if (digits.length === 10) out.phoneE164 = `+1${digits}`;
  }
  return out;
}

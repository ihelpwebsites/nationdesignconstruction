// Runtime configuration (environment variables). Secrets are only ever read from the environment.
export const ENV = process.env.SITE_ENV || 'development';           // development | production
export const IS_PROD = ENV === 'production';
export const SITE_URL = (process.env.SITE_URL || 'http://localhost:4600').replace(/\/$/, '');
export const CANONICAL_HOST = new URL(SITE_URL).host;               // e.g. nationdesignconstruction.com
// Search indexing: on by default in production, off everywhere else. INDEXING=off is an explicit kill switch
// (e.g. while a production deploy is being checked). Individual pages can still be noindex (preview services).
export const INDEXING = IS_PROD && process.env.INDEXING !== 'off';
export const COOKIE_SECURE = process.env.COOKIE_SECURE === '1' || SITE_URL.startsWith('https://');
export const PORT = Number(process.env.PORT || 4600);

export const EMAIL = {
  provider: process.env.RESEND_API_KEY ? 'resend' : null,
  apiKey: process.env.RESEND_API_KEY || null,
  apiUrl: process.env.RESEND_API_URL || 'https://api.resend.com/emails',   // overridable for tests only
  // Sender on the Resend-verified subdomain. Never a customer's address.
  from: process.env.EMAIL_FROM || 'Nation Design & Construction <notify@notify.nationdesignconstruction.com>',
  // Internal notifications go here (the owner's confirmed inbox) unless overridden in admin or by NOTIFY_EMAIL.
  notifyTo: process.env.NOTIFY_EMAIL || 'hello@nationdesignconstruction.com',
  // Reply-To on customer confirmations.
  replyTo: process.env.EMAIL_REPLY_TO || 'hello@nationdesignconstruction.com',
};
export const TURNSTILE = { siteKey: process.env.TURNSTILE_SITE_KEY || null, secret: process.env.TURNSTILE_SECRET_KEY || null };
export const FORM_SECRET = process.env.FORM_SECRET || null;          // signs form timing tokens; random per boot if unset

export const UPLOAD = {
  maxFiles: 6,
  maxFileBytes: 10e6,
  maxTotalBytes: 30e6,
  types: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'],
};

// Customer-facing choices in the inquiry form (budget brackets are the customer's own budget, not our prices).
export const BUDGETS = ['Under $25,000', '$25,000 – $75,000', '$75,000 – $150,000', '$150,000 – $500,000', '$500,000 – $1 million', 'Over $1 million', 'Not sure yet'];
export const BUDGET_FLOOR = { 'Under $25,000': 0, '$25,000 – $75,000': 25000, '$75,000 – $150,000': 75000, '$150,000 – $500,000': 150000, '$500,000 – $1 million': 500000, 'Over $1 million': 1000000 };
export const BUDGET_CEIL = { 'Under $25,000': 25000, '$25,000 – $75,000': 75000, '$75,000 – $150,000': 150000, '$150,000 – $500,000': 500000, '$500,000 – $1 million': 1000000, 'Over $1 million': Infinity };
export const TIMINGS = ['As soon as possible', 'Within 3 months', '3 – 6 months', '6 – 12 months', 'More than a year out', 'Not sure yet'];
export const PLAN_ITEMS = ['Architectural drawings', 'Structural engineering', 'Site plan or survey', 'MEP engineering', 'Interior design / selections', 'An issued permit'];

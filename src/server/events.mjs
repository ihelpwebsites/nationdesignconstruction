// First-party, privacy-preserving measurement: daily aggregate counts only — no cookies, no IP addresses, no names,
// contact details, descriptions or files. Successful inquiries are counted server-side only after durable storage.
// Crawler visits are counted by claimed user agent (a user agent can be spoofed; counts are indicative, not verified).
import { run, all } from './db.mjs';

const day = () => new Date().toISOString().slice(0, 10);
export function track(name, label = '') {
  try {
    run('INSERT INTO events (day, name, label, count) VALUES (?,?,?,1) ON CONFLICT(day, name, label) DO UPDATE SET count = count + 1',
      day(), String(name).slice(0, 40), String(label || '').slice(0, 80));
  } catch { /* measurement must never break a request */ }
}

// Browser-reported events: only these names, labels restricted to safe identifiers (page paths, field names).
export const CLIENT_EVENTS = new Set(['phone_click', 'email_click', 'form_error', 'inquiry_step']);
export const safeLabel = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9/_-]/g, '').slice(0, 60);

export const CRAWLERS = [
  ['Googlebot', /Googlebot/i], ['Bingbot', /bingbot/i], ['OAI-SearchBot', /OAI-SearchBot/i], ['ChatGPT-User', /ChatGPT-User/i],
  ['GPTBot', /GPTBot/i], ['PerplexityBot', /PerplexityBot/i], ['ClaudeBot', /ClaudeBot|Claude-User|Claude-SearchBot/i],
  ['Applebot', /Applebot/i], ['DuckDuckBot', /DuckDuckBot/i], ['CCBot', /CCBot/i],
];
export function crawlerOf(ua) {
  for (const [name, re] of CRAWLERS) if (re.test(ua || '')) return name;
  return null;
}

export function summary(days = 30) {
  const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  return all('SELECT name, label, SUM(count) n FROM events WHERE day >= ? GROUP BY name, label ORDER BY name, n DESC', since);
}

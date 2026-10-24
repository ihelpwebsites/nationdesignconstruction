// HTML helpers. Every dynamic value passes through esc() unless it is already-built markup.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const attr = esc;
export const list = (items, fn) => (items || []).map(fn).join('');
export const when = (cond, s) => (cond ? (typeof s === 'function' ? s() : s) : '');
export const money = (n) => (n == null || n === '' ? '' : '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 }));
export const UNIT_LABEL = { sqft: 'per square foot', lf: 'per linear foot', project: 'per project', assessment: 'per assessment' };
export const UNIT_NAME = { sqft: 'Square foot', lf: 'Linear foot', project: 'Project', assessment: 'Assessment' };
export const fmtDate = (iso) => { if (!iso) return ''; const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso); return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); };
export const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/New_York' }) : '');
// Inline SVG icons (stroke style, 24px grid). Decorative unless a label is passed.
const ICONS = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  plan: '<path d="M4 4h16v16H4z"/><path d="M4 10h7v10M11 14h9M15 4v6"/>',
  pencil: '<path d="M4 20l4-1 11-11-3-3L5 16l-1 4z"/><path d="M14 6l3 3"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
  person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-3.5 3.8-5.5 7-5.5s6 2 7 5.5"/>',
  scale: '<path d="M12 4v16M5 20h14M6 8h12M6 8l-3 6h6zM18 8l-3 6h6z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4"/>',
};
export function icon(name, label) {
  const a = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="i" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ${a}>${ICONS[name] || ''}</svg>`;
}

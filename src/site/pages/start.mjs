// "Discuss Your Project" — three-step inquiry form. Works without JavaScript (all steps shown, normal POST);
// with JavaScript it becomes a stepper with inline validation and fetch submission.
import { esc, attr, icon, list, money } from '../html.mjs';
import { layout, crumbs, contactPanel } from '../layout.mjs';
import { services, service, listed } from '../../server/services.mjs';
import { BUDGETS, TIMINGS, PLAN_ITEMS, TURNSTILE, UPLOAD } from '../../config.mjs';
import { formToken, newSubmissionKey } from '../../server/forms.mjs';

export const PROJECT_TYPES = {
  residential: ['New custom home', 'Home addition', 'Whole-home renovation', 'Kitchen or bathroom', 'Pool or outdoor living', 'Exterior, roof or windows', 'Structural, foundation or storm repair', 'A specific service', 'Something else'],
  commercial: ['New commercial building', 'Build-out or tenant improvement', 'Restaurant or commercial kitchen', 'Site development or paving', 'Exterior, roof or storefront', 'Structural, foundation or storm repair', 'A specific service', 'Something else'],
};

export function inquiryMini() {
  return `<form class="form form-shell" action="/start/" method="get">
  <fieldset><legend>Is this a residential or commercial project?</legend>
    <div class="choices c2">
      <label class="choice"><input type="radio" name="market" value="residential" checked> Residential</label>
      <label class="choice"><input type="radio" name="market" value="commercial"> Commercial</label>
    </div></fieldset>
  <fieldset><legend>Where are you starting from?</legend>
    <div class="choices">
      <label class="choice"><input type="radio" name="readiness" value="design" checked> I need design and construction</label>
      <label class="choice"><input type="radio" name="readiness" value="plans"> I already have plans</label>
      <label class="choice"><input type="radio" name="readiness" value="unsure"> Not sure yet</label>
    </div></fieldset>
  <div><button class="btn" type="submit">Continue ${icon('arrow')}</button></div>
</form>`;
}

function serviceOptions(selected) {
  const svc = services();
  const groups = {};
  for (const s of svc) (groups[s.categoryName] ||= []).push(s);
  return `<option value="">Not sure / not listed</option>` + Object.entries(groups).map(([g, items]) =>
    `<optgroup label="${attr(g)}">${list(items, (s) => `<option value="${s.slug}" data-markets="${s.markets.join(' ')}"${s.slug === selected ? ' selected' : ''}>${esc(s.name)}</option>`)}</optgroup>`).join('');
}

export function startPage(query = {}) {
  const pre = {
    market: ['residential', 'commercial'].includes(query.market) ? query.market : '',
    readiness: ['design', 'plans', 'unsure'].includes(query.readiness) ? query.readiness : '',
    service: listed(service(String(query.service || ''))) ? query.service : '',
    type: String(query.type || ''),
  };
  const sel = pre.service ? service(pre.service) : null;
  const mins = Object.fromEntries(services().filter((s) => s.minProject > 0).map((s) => [s.slug, s.minProject]));
  const c = crumbs([{ href: '/start/', label: 'Discuss Your Project' }]);
  const chk = (n, v) => (pre[n] === v ? ' checked' : '');
  const body = `
<section class="page-hero"><div class="wrap">
  ${c.html}
  <p class="eyebrow">Discuss your project</p>
  <h1>Tell us what you’re planning.</h1>
  <p class="lede">Three short steps. If you have drawings, engineering, a survey or photos, you can attach them at the end — they help us give you a more useful first response.</p>
</div></section>
<section class="section tight"><div class="wrap split top">
  <div class="form-shell">
    <ol class="progress" aria-label="Form progress" data-progress hidden>
      <li aria-current="step">Project</li><li>Readiness</li><li>Contact</li>
    </ol>
    <div class="alert err" role="alert" tabindex="-1" data-form-error hidden></div>
    <form class="form" id="inquiry" action="/api/inquiry" method="post" enctype="multipart/form-data" novalidate data-stepper data-mins='${attr(JSON.stringify(mins))}'>
      <input type="hidden" name="_t" value="${attr(formToken())}"><input type="hidden" name="_idem" value="${attr(newSubmissionKey())}">
      <input type="hidden" name="source" value="${attr(query.from || '/start/')}">
      <div class="hp" aria-hidden="true"><label>Leave this empty <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>

      <div class="step" data-step="1">
        <h2>The project</h2><p class="muted">What and where.</p>
        <div class="stack-lg">
          <fieldset data-required="market"><legend>Residential or commercial? <span class="req" aria-hidden="true">*</span></legend>
            <div class="choices c2">
              <label class="choice"><input type="radio" name="market" value="residential" required${chk('market', 'residential')}> Residential</label>
              <label class="choice"><input type="radio" name="market" value="commercial"${chk('market', 'commercial')}> Commercial</label>
            </div><p class="error-text" id="err-market"></p></fieldset>
          <div class="field">
            <label for="f-type">Type of project <span class="req" aria-hidden="true">*</span></label>
            <select id="f-type" name="project_type" required aria-describedby="err-project_type">
              <option value="">Choose one</option>
              <optgroup label="Residential" data-market="residential">${list(PROJECT_TYPES.residential, (t) => `<option${t === pre.type ? ' selected' : ''}>${esc(t)}</option>`)}</optgroup>
              <optgroup label="Commercial" data-market="commercial">${list(PROJECT_TYPES.commercial, (t) => `<option value="${attr(t)}"${t === pre.type ? ' selected' : ''}>${esc(t)}</option>`)}</optgroup>
            </select><p class="error-text" id="err-project_type"></p>
          </div>
          <div class="field">
            <label for="f-service">Specific service <span class="muted small">(optional)</span></label>
            ${sel ? `<div class="selected-service" data-selected-service><span>Selected: <strong>${esc(sel.name)}</strong></span><button class="textlink" type="button" data-change-service>Change</button></div>` : ''}
            <select id="f-service" name="service"${sel ? ' hidden' : ''}>${serviceOptions(pre.service)}</select>
          </div>
          <div class="field">
            <label for="f-location">Project location <span class="req" aria-hidden="true">*</span></label>
            <p class="hint" id="hint-location">City and ZIP code, or county. We’re launching in Florida and will confirm whether your project is in an area we serve.</p>
            <input id="f-location" name="location" type="text" required maxlength="120" autocomplete="address-level2" aria-describedby="hint-location err-location">
            <p class="error-text" id="err-location"></p>
          </div>
        </div>
      </div>

      <div class="step" data-step="2">
        <h2>Readiness</h2><p class="muted">Where things stand today. “Not sure yet” is a perfectly good answer.</p>
        <div class="stack-lg">
          <fieldset><legend>Design and plans <span class="req" aria-hidden="true">*</span></legend>
            <div class="choices">
              <label class="choice big"><input type="radio" name="readiness" value="design" required${chk('readiness', 'design')}><strong>I need design and construction</strong><span>No drawings yet, or only early ideas.</span></label>
              <label class="choice big"><input type="radio" name="readiness" value="plans"${chk('readiness', 'plans')}><strong>I already have plans</strong><span>Architectural drawings, engineering or a site plan.</span></label>
              <label class="choice big"><input type="radio" name="readiness" value="unsure"${chk('readiness', 'unsure')}><strong>Not sure yet</strong><span>We’ll help you work out what’s needed.</span></label>
            </div><p class="error-text" id="err-readiness"></p></fieldset>
          <fieldset data-when="readiness=plans"><legend>What do you have? <span class="muted small">(check any)</span></legend>
            <div class="choices">${list(PLAN_ITEMS, (p) => `<label class="choice"><input type="checkbox" name="plans" value="${attr(p)}"> ${esc(p)}</label>`)}</div></fieldset>
          <fieldset data-when="project_type=New custom home|New commercial building|Site development or paving"><legend>Do you have the property?</legend>
            <div class="choices c3">
              <label class="choice"><input type="radio" name="property" value="Own it"> I own it</label>
              <label class="choice"><input type="radio" name="property" value="Under contract"> Under contract</label>
              <label class="choice"><input type="radio" name="property" value="Still looking"> Still looking</label>
            </div></fieldset>
          <fieldset data-when="market=commercial"><legend>Will the space be operating or occupied during work?</legend>
            <div class="choices c3">
              <label class="choice"><input type="radio" name="occupied" value="Yes"> Yes</label>
              <label class="choice"><input type="radio" name="occupied" value="No"> No</label>
              <label class="choice"><input type="radio" name="occupied" value="Not sure"> Not sure</label>
            </div></fieldset>
          <div class="two-col">
            <div class="field"><label for="f-budget">Approximate budget <span class="req" aria-hidden="true">*</span></label>
              <select id="f-budget" name="budget" required aria-describedby="err-budget"><option value="">Choose one</option>${list(BUDGETS, (b) => `<option>${esc(b)}</option>`)}</select>
              <p class="error-text" id="err-budget"></p></div>
            <div class="field"><label for="f-timing">Desired timing <span class="req" aria-hidden="true">*</span></label>
              <select id="f-timing" name="timing" required aria-describedby="err-timing"><option value="">Choose one</option>${list(TIMINGS, (t) => `<option>${esc(t)}</option>`)}</select>
              <p class="error-text" id="err-timing"></p></div>
          </div>
          <p class="note" data-min-note hidden></p>
        </div>
      </div>

      <div class="step" data-step="3">
        <h2>Contact</h2><p class="muted">How we should reach you.</p>
        <div class="stack-lg">
          <div class="field"><label for="f-name">Name <span class="req" aria-hidden="true">*</span></label>
            <input id="f-name" name="name" type="text" required maxlength="100" autocomplete="name" aria-describedby="err-name"><p class="error-text" id="err-name"></p></div>
          <div class="two-col">
            <div class="field"><label for="f-email">Email <span class="req" aria-hidden="true">*</span></label>
              <input id="f-email" name="email" type="email" required maxlength="160" autocomplete="email" aria-describedby="err-email"><p class="error-text" id="err-email"></p></div>
            <div class="field"><label for="f-phone">Phone <span class="req" aria-hidden="true">*</span></label>
              <input id="f-phone" name="phone" type="tel" required maxlength="40" autocomplete="tel" aria-describedby="err-phone"><p class="error-text" id="err-phone"></p></div>
          </div>
          <div class="field"><label for="f-desc">A short description <span class="req" aria-hidden="true">*</span></label>
            <p class="hint" id="hint-desc">What you’d like to build or change, and anything we should know.</p>
            <textarea id="f-desc" name="description" required maxlength="3000" rows="5" aria-describedby="hint-desc err-description"></textarea><p class="error-text" id="err-description"></p></div>
          <div class="field"><label for="f-files">Plans or photos <span class="muted small">(optional)</span></label>
            <p class="hint" id="hint-files">Up to ${UPLOAD.maxFiles} files — PDF, JPG, PNG, WebP or HEIC, ${UPLOAD.maxFileBytes / 1e6} MB each, ${UPLOAD.maxTotalBytes / 1e6} MB total. Files are stored privately and only our team can open them.</p>
            <input id="f-files" name="files" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,application/pdf,image/*" aria-describedby="hint-files err-files">
            <ul class="file-list" data-file-list></ul><p class="error-text" id="err-files"></p></div>
          <div class="stack">
            <label class="check"><input type="checkbox" name="consent_contact" value="1" required aria-describedby="err-consent_contact"> <span>You may contact me by email or phone about this project. <span class="req" aria-hidden="true">*</span></span></label>
            <p class="error-text" id="err-consent_contact"></p>
            <label class="check"><input type="checkbox" name="consent_marketing" value="1"> <span>Optional: send me occasional news and updates. You can opt out at any time. This is separate from contacting you about your project.</span></label>
            <p class="small muted">See our <a href="/privacy/">privacy notice</a> for how we handle what you send.</p>
          </div>
          ${TURNSTILE.siteKey ? `<div class="cf-turnstile" data-sitekey="${attr(TURNSTILE.siteKey)}"></div>` : ''}
        </div>
      </div>

      <div class="form-nav">
        <button class="btn ghost" type="button" data-prev hidden>Back</button>
        <button class="btn" type="button" data-next hidden>Continue ${icon('arrow')}</button>
        <button class="btn" type="submit" data-submit>Send project details ${icon('arrow')}</button>
      </div>
    </form>
    <div class="confirm" data-confirm hidden tabindex="-1"></div>
  </div>
  <aside class="stack-lg">
    <div class="panel"><h2>What happens next</h2>
      <ol class="stages">
        <li><div><h3>We review what you send</h3><p>Including any plans or photos.</p></div></li>
        <li><div><h3>We contact you</h3><p>Using the email or phone number you provide, to talk through scope, budget and timing.</p></div></li>
        <li><div><h3>A site visit or plan review</h3><p>If the project is a good fit, we’ll arrange the next step together.</p></div></li>
      </ol></div>
    ${contactPanel()}
    <div class="panel"><h2>Prefer to read first?</h2><ul class="toc"><li><a href="/process/">Our process</a></li><li><a href="/pricing/">How pricing works</a></li><li><a href="/services/">All services</a></li></ul></div>
  </aside>
</div></section>`;
  return layout({
    title: 'Discuss Your Project', description: 'Tell Nation Design & Construction about your residential or commercial project in three short steps. Attach plans or photos if you have them.',
    path: '/start/', body, jsonld: [c.ld], scripts: ['/js/forms.js', ...(TURNSTILE.siteKey ? ['https://challenges.cloudflare.com/turnstile/v0/api.js'] : [])],
  });
}

export function receivedPage(ref) {
  const body = `<section class="page-hero"><div class="wrap narrow">
  <p class="eyebrow">Received</p><h1>Thank you — we have your project details.</h1>
  <p class="lede">Your reference is <strong>${esc(ref)}</strong>. We’ll review what you sent and contact you using the details you provided.</p>
  <div class="actions mt-4"><a class="btn" href="/process/">How we work ${icon('arrow')}</a><a class="btn ghost" href="/">Back to home</a></div>
</div></section>`;
  return layout({ title: 'Project details received', description: 'Your inquiry was received.', path: '/start/received/', body, noindex: true });
}
export { money };

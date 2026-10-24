// Forms: three-step inquiry stepper with inline validation and conditional questions, plus simple forms
// (trade application, document upload). Submits with fetch and shows success ONLY on a confirmed 200 response.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = (n) => '$' + Number(n).toLocaleString('en-US');
  const CEIL = { 'Under $25,000': 25000, '$25,000 – $75,000': 75000, '$75,000 – $150,000': 150000, '$150,000 – $500,000': 500000, '$500,000 – $1 million': 1000000, 'Over $1 million': Infinity };

  function setError(form, name, msg) {
    const el = form.querySelector(`#err-${name}`);
    if (el) el.textContent = msg || '';
    form.querySelectorAll(`[name="${name}"]`).forEach((i) => { if (msg) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid'); });
  }
  function validateField(form, input) {
    const name = input.name;
    if (input.closest('[data-when][hidden]')) { setError(form, name, ''); return true; } // conditional question not shown
    let msg = '';
    if (input.type === 'radio') {
      if (input.required && !form.querySelector(`[name="${name}"]:checked`)) msg = 'Please choose one.';
    } else if (input.type === 'checkbox') {
      if (input.required && !input.checked) msg = 'Please confirm to continue.';
    } else if (input.type === 'file') {
      msg = checkFiles(input);
    } else if (input.required && !input.value.trim()) {
      msg = input.tagName === 'SELECT' ? 'Please choose one.' : 'This field is required.';
    } else if (input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(input.value.trim())) {
      msg = 'Enter a valid email address, like name@example.com.';
    } else if (input.type === 'tel' && input.value && input.value.replace(/\D/g, '').length < 10) {
      msg = 'Enter a phone number including area code.';
    }
    setError(form, name, msg);
    return !msg;
  }
  function checkFiles(input) {
    const files = [...input.files];
    const list = input.parentElement.querySelector('[data-file-list]');
    if (list) list.innerHTML = files.map((f) => `<li>${f.name.replace(/[<&]/g, '')} — ${(f.size / 1e6).toFixed(1)} MB</li>`).join('');
    if (files.length > 6) return 'Please attach no more than 6 files.';
    const big = files.find((f) => f.size > 10e6); if (big) return `“${big.name}” is larger than 10 MB.`;
    if (files.reduce((a, f) => a + f.size, 0) > 30e6) return 'Attachments total more than 30 MB.';
    const bad = files.find((f) => !/\.(pdf|jpe?g|png|webp|heic)$/i.test(f.name)); if (bad) return `“${bad.name}” isn’t a supported file type.`;
    if (input.required && !files.length) return 'Choose at least one file.';
    return '';
  }
  function validateScope(form, scope) {
    const seen = new Set(); let firstBad = null;
    $$('input, select, textarea', scope).forEach((i) => {
      if (!i.name || i.name.startsWith('_') || i.type === 'hidden' || i.closest('.hp')) return;
      if (i.type === 'radio') { if (seen.has(i.name)) return; seen.add(i.name); }
      if (!validateField(form, i) && !firstBad) firstBad = i;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  // Aggregate measurement only: event names and field names — never values.
  const beacon = (e, l) => { try { navigator.sendBeacon('/api/event', JSON.stringify({ e, l })); } catch { /* optional */ } };

  async function submit(form, { onOk }) {
    if (form._busy) return; // ignore double clicks / repeated Enter while a request is in flight
    const errBox = form.parentElement.querySelector('[data-form-error]');
    const btn = form.querySelector('[type=submit]');
    errBox.hidden = true;
    form._busy = true; form.setAttribute('aria-busy', 'true');
    btn.disabled = true; const label = btn.innerHTML; btn.textContent = 'Sending…';
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 60000);
    try {
      // The form carries a one-time submission key, so retrying after a timeout can never create a duplicate.
      const r = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { accept: 'application/json' }, credentials: 'same-origin', signal: ctrl.signal });
      let data = null; try { data = await r.json(); } catch { /* non-JSON = failure */ }
      if (!r.ok || !data || data.ok !== true) {
        if (data?.fields) {
          Object.entries(data.fields).forEach(([k, v]) => setError(form, k, v));
          beacon('form_error', `${form.id}/${Object.keys(data.fields).join('-')}`);
          const step = form.querySelector(`#err-${Object.keys(data.fields)[0]}`)?.closest('[data-step]');
          if (step && form._goTo) form._goTo(Number(step.dataset.step));
        }
        throw Object.assign(new Error(data?.error || (r.status === 413 ? 'Your attachments are too large. Remove some and try again.' : 'Your submission could not be sent. Please try again.')), { server: true });
      }
      onOk(data);
    } catch (e) {
      errBox.textContent = e.server ? e.message
        : 'We couldn’t confirm that your details arrived — the connection dropped or timed out. Everything you entered is still here. Please press send again; if the first attempt did arrive, this won’t create a duplicate.';
      errBox.hidden = false; errBox.scrollIntoView({ block: 'center', behavior: 'smooth' }); errBox.focus?.();
    } finally { clearTimeout(timer); form._busy = false; form.removeAttribute('aria-busy'); btn.disabled = false; btn.innerHTML = label; }
  }
  const confirmHtml = (title, body) => `<p class="eyebrow">Received</p><h2>${title}</h2>${body}`;

  // ---- Inquiry stepper ----
  const form = $('form[data-stepper]');
  if (form) {
    const steps = $$('[data-step]', form);
    const progress = $('[data-progress]');
    const prev = $('[data-prev]', form), next = $('[data-next]', form), send = $('[data-submit]', form);
    const mins = JSON.parse(form.dataset.mins || '{}');
    let cur = 1;
    progress.hidden = false;
    const goTo = (n, focus = true) => {
      cur = n;
      steps.forEach((s) => { s.hidden = Number(s.dataset.step) !== n; });
      $$('li', progress).forEach((li, i) => { li.classList.toggle('done', i + 1 < n); if (i + 1 === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
      prev.hidden = n === 1; next.hidden = n === steps.length; send.hidden = n !== steps.length;
      if (focus) { const h = $('h2', steps[n - 1]); h.tabIndex = -1; h.focus(); }
    };
    form._goTo = goTo;
    next.addEventListener('click', () => {
      if (validateScope(form, steps[cur - 1])) { goTo(cur + 1); beacon('inquiry_step', `step-${cur}`); }
      else beacon('form_error', `inquiry/step-${cur}`);
    });
    prev.addEventListener('click', () => goTo(cur - 1));
    form.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && cur < steps.length) { e.preventDefault(); next.click(); } });

    // Conditional questions: data-when="field=value|value2"
    const conds = $$('[data-when]', form);
    const typeSel = $('#f-type', form);
    const svcSel = $('#f-service', form);
    const value = (name) => { const r = form.querySelector(`[name="${name}"]:checked`); if (r) return r.value; const s = form.querySelector(`select[name="${name}"]`); return s ? s.value : ''; };
    const refresh = () => {
      conds.forEach((c) => { const [k, v] = c.dataset.when.split('='); c.hidden = !v.split('|').includes(value(k)); });
      const market = value('market');
      $$('optgroup[data-market]', typeSel).forEach((g) => { g.hidden = market && g.dataset.market !== market; g.disabled = !!(market && g.dataset.market !== market); });
      if (typeSel.selectedOptions[0]?.parentElement?.disabled) typeSel.value = '';
      $$('option[data-markets]', svcSel).forEach((o) => { o.hidden = market && !o.dataset.markets.includes(market); });
      // Configured project minimum for the chosen service (no universal threshold).
      const note = $('[data-min-note]', form);
      const min = mins[svcSel.value]; const budget = value('budget');
      if (min && budget && CEIL[budget] < min) {
        note.textContent = `Projects of this type usually start around ${fmt(min)}. You’re welcome to send your details — we’ll tell you honestly whether we’re the right fit.`;
        note.hidden = false;
      } else note.hidden = true;
    };
    form.addEventListener('change', refresh);
    refresh();
    $('[data-change-service]', form)?.addEventListener('click', () => { $('[data-selected-service]', form).remove(); svcSel.hidden = false; svcSel.focus(); });

    $$('input, select, textarea', form).forEach((i) => i.addEventListener(i.type === 'file' || i.type === 'radio' || i.type === 'checkbox' || i.tagName === 'SELECT' ? 'change' : 'blur', () => { if (i.name && !i.name.startsWith('_')) validateField(form, i); }));
    goTo(1, false);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      for (let i = 0; i < steps.length; i++) { if (!validateScope(form, steps[i])) { goTo(i + 1); validateScope(form, steps[i]); return; } }
      submit(form, {
        onOk: (d) => {
          const c = form.parentElement.querySelector('[data-confirm]');
          form.hidden = true; progress.hidden = true;
          c.innerHTML = confirmHtml('Thank you — we have your project details.', `<p class="lede">Your reference is <strong class="ref">${d.ref}</strong>.</p><p>We’ll review what you sent and contact you using the details you provided.</p><p><a class="btn" href="/process/">How we work</a></p>`);
          c.hidden = false; c.focus();
        },
      });
    });
  }

  // ---- Simple forms (trade application, document upload) ----
  $$('form[data-simple-form]').forEach((f) => {
    $$('input, select, textarea', f).forEach((i) => i.addEventListener(i.type === 'checkbox' || i.type === 'file' || i.tagName === 'SELECT' ? 'change' : 'blur', () => { if (i.name && !i.name.startsWith('_')) validateField(f, i); }));
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateScope(f, f)) return;
      if (f.id === 'trade') {
        const t = $$('[name=trades]:checked', f).length || f.trades_other.value.trim();
        const c = $$('[name=counties]:checked', f).length;
        setError(f, 'trades', t ? '' : 'Choose at least one trade or describe your specialty.');
        setError(f, 'counties', c ? '' : 'Choose at least one county you serve.');
        if (!t || !c) { $('#err-' + (!t ? 'trades' : 'counties'), f).closest('fieldset').querySelector('summary').focus(); return; }
      }
      submit(f, {
        onOk: (d) => {
          const c = f.parentElement.querySelector('[data-confirm]');
          f.hidden = true;
          c.innerHTML = f.id === 'trade'
            ? confirmHtml('Application received.', `<p class="lede">Reference <strong class="ref">${d.ref}</strong>. We review every application individually and will contact you if it’s a fit.</p>`)
            : confirmHtml('Documents uploaded.', `<p class="lede">${d.count} file${d.count === 1 ? '' : 's'} received securely. You can upload more using the same link.</p><p><a class="btn ghost" href="">Upload another</a></p>`);
          c.hidden = false; c.focus();
        },
      });
    });
  });
})();

// Site behaviour: Services mega-menu, mobile drawer, directory search/filters, subtle reveal motion.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---- Mega menu (click / keyboard / touch) ----
  const megaBtn = $('.nav button.navlink[aria-controls="mega-services"]');
  const mega = $('#mega-services');
  if (megaBtn && mega) {
    const open = (focusFirst) => { mega.hidden = false; megaBtn.setAttribute('aria-expanded', 'true'); if (focusFirst) $('a', mega)?.focus(); };
    const close = (returnFocus) => { mega.hidden = true; megaBtn.setAttribute('aria-expanded', 'false'); if (returnFocus) megaBtn.focus(); };
    megaBtn.addEventListener('click', () => (mega.hidden ? open(false) : close(false)));
    megaBtn.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); open(true); } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mega.hidden) close(true); });
    document.addEventListener('click', (e) => { if (!mega.hidden && !mega.contains(e.target) && !megaBtn.contains(e.target)) close(false); });
    mega.addEventListener('focusout', (e) => { if (!mega.contains(e.relatedTarget) && e.relatedTarget !== megaBtn && e.relatedTarget) close(false); });
  }

  // ---- Mobile drawer with accordions ----
  const toggle = $('.site-header .menu-toggle');
  const drawer = $('#drawer');
  if (toggle && drawer) {
    const openD = () => { drawer.hidden = false; toggle.setAttribute('aria-expanded', 'true'); document.body.classList.add('locked'); $('[data-close-drawer]', drawer).focus(); };
    const closeD = () => { drawer.hidden = true; toggle.setAttribute('aria-expanded', 'false'); document.body.classList.remove('locked'); toggle.focus(); };
    toggle.addEventListener('click', openD);
    $('[data-close-drawer]', drawer).addEventListener('click', closeD);
    drawer.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeD();
      if (e.key === 'Tab') { // keep focus inside the dialog
        const f = $$('a, button', drawer).filter((x) => x.offsetParent !== null);
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    $$('button[aria-controls]', drawer).forEach((b) => b.addEventListener('click', () => {
      const t = document.getElementById(b.getAttribute('aria-controls'));
      const exp = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', String(!exp)); t.hidden = exp;
    }));
    matchMedia('(min-width: 1180px)').addEventListener('change', (m) => { if (m.matches && !drawer.hidden) closeD(); });
  }

  // ---- Services directory: search + category filters ----
  const q = $('[data-dir-search]');
  if (q) {
    const cats = $$('.dir-cat[data-cat]');
    const items = $$('.dir-list li[data-search]');
    const btns = $$('[data-filter]');
    const count = $('[data-dir-count]');
    const empty = $('[data-dir-empty]');
    let filter = '';
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    const apply = () => {
      const terms = norm(q.value).split(/\s+/).filter(Boolean);
      let shown = 0;
      cats.forEach((c) => {
        let n = 0;
        $$('li[data-search]', c).forEach((li) => {
          const ok = (!filter || c.dataset.cat === filter) && terms.every((t) => li.dataset.search.includes(t));
          li.hidden = !ok; if (ok) n++;
        });
        c.hidden = n === 0; shown += n;
      });
      // A service listed in two categories counts once in the total.
      const unique = new Set(items.filter((li) => !li.hidden).map((li) => $('a', li).getAttribute('href'))).size;
      count.textContent = terms.length || filter ? `${unique} service${unique === 1 ? '' : 's'} shown` : `${unique} services`;
      empty.hidden = shown > 0;
      const url = new URL(location.href);
      if (q.value) url.searchParams.set('q', q.value); else url.searchParams.delete('q');
      history.replaceState(null, '', url);
    };
    q.addEventListener('input', apply);
    btns.forEach((b) => b.addEventListener('click', () => {
      filter = b.dataset.filter;
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      apply();
    }));
    apply();
  }

  // ---- Subtle reveal on scroll (skipped for reduced motion) ----
  const els = $$('.reveal');
  if (els.length && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
  } else els.forEach((el) => el.classList.add('in'));
})();

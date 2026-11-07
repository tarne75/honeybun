// Honeybun — progressive enhancement + menu renderer.
// Menu content lives in data/menu.json (edit that, not this file).
// On http(s) we fetch the live JSON; when opened from the filesystem (file://)
// we fall back to the copy baked into index.html at build time.

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const gbp = (n) => `£${Number(n).toFixed(2)}`;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const scrollTimelines = CSS.supports('animation-timeline: view()');


async function loadMenu() {
  // file:// (local testing) can't fetch JSON, so load the build-generated data/menu.js instead.
  const fallback = () => new Promise((res, rej) => {
    const sc = document.createElement('script');
    sc.src = 'data/menu.js';
    sc.onload = () => res(window.HONEYBUN_MENU);
    sc.onerror = rej;
    document.head.append(sc);
  });
  if (location.protocol === 'file:') return fallback();
  try {
    const res = await fetch('data/menu.json');
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch {
    return fallback();
  }
}

/* ---------- image helper ---------- */
const pic = (name, { alt = '', sizes = '(min-width: 900px) 40vw, 90vw', eager = false } = {}) => `
  <picture>
    <source type="image/avif" srcset="assets/img/food/${name}-400.avif 400w, assets/img/food/${name}-800.avif 800w" sizes="${sizes}">
    <img src="assets/img/food/${name}-800.webp" srcset="assets/img/food/${name}-400.webp 400w, assets/img/food/${name}-800.webp 800w" sizes="${sizes}"
      width="800" height="600" alt="${esc(alt)}" ${eager ? '' : 'loading="lazy"'} decoding="async">
  </picture>`;

const flags = (it) =>
  [
    it.badge && `<span class="flag flag--badge">${esc(it.badge)}</span>`,
    it.spicy && `<span class="flag flag--spicy"><svg class="icon" aria-hidden="true"><use href="#i-flame"/></svg>Spicy</span>`,
    it.nuts && `<span class="flag flag--nuts">Contains nuts</span>`,
    it.veg && `<span class="flag flag--veg">Vegetarian</span>`,
  ].filter(Boolean).join('');

const crown = `<svg class="crown" aria-hidden="true"><use href="#i-crown"/></svg>`;

const head = (s, i) => `
  <header class="sec-head">
    <span class="sec-head__num" data-reveal>${String(i + 1).padStart(2, '0')} / ${esc(s.title)}</span>
    <p class="script sec-head__kicker" data-reveal>${esc(s.kicker)}</p>
    <h2 class="sec-head__title" id="${s.id}-title" data-reveal>${esc(s.title)}${crown}</h2>
    ${s.blurb ? `<p class="sec-head__blurb" data-reveal>${esc(s.blurb)}</p>` : ''}
  </header>`;

/* ---------- layouts ---------- */
const layouts = {
  showcase: (s) => `<div class="showcase">${s.items.map((it, i) => `
    <article class="feature io${it.round ? ' feature--round' : ''}${it.fade ? ' feature--fade' : ''}" data-item="${it.id}">
      <div class="feature__media">
        <span class="feature__index" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        ${pic(it.image, { alt: it.name, sizes: '(min-width: 900px) 55vw, 92vw' })}
      </div>
      <div class="feature__body">
        <div class="feature__meta">${flags(it)}</div>
        <h3 class="feature__name" data-reveal>${esc(it.name)}</h3>
        <span class="price">${gbp(it.price)}</span>
        <p class="feature__desc">${esc(it.desc)}</p>
        ${it.ingredients ? `<ul class="feature__ings" aria-label="Ingredients">${it.ingredients.map((x) => `<li class="chip">${esc(x)}</li>`).join('')}</ul>` : ''}
        <button class="feature__more" type="button">Details &amp; order<span class="sr-only">: ${esc(it.name)}</span> <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></button>
      </div>
    </article>`).join('')}</div>`,

  grid: (s) => `<div class="cards">${s.items.map((it) => `
    <button class="card io" type="button" data-item="${it.id}">
      <span class="card__img">${pic(it.image, { alt: it.name, sizes: '(min-width: 900px) 25vw, 90vw' })}</span>
      <span class="card__flags">${flags(it)}</span>
      <span class="card__top"><span class="card__name">${esc(it.name)}</span><span class="price price--sm">${gbp(it.price)}</span></span>
      <span class="card__desc">${esc(it.desc)}</span>
    </button>`).join('')}</div>`,

  peri: (s, data) => `
    <fieldset class="heat" id="heat">
      <legend>Choose your heat</legend>
      ${data.heat.map((h, i) => `<input type="radio" name="heat" id="heat-${h.id}" value="${h.id}" ${i === 2 ? 'checked' : ''}><label for="heat-${h.id}">${esc(h.label)}<span>${'●'.repeat(h.level)}</span></label>`).join('')}
    </fieldset>
    <p class="heat__meter" aria-live="polite"><span class="heat__flames">${'<svg aria-hidden="true"><use href="#i-flame"/></svg>'.repeat(3)}</span><span class="heat__txt"></span></p>
    <div class="boards">${s.groups.map((g) => `
      <div class="board io"><h3>${esc(g.title)}</h3>
        <ul class="leaders">${g.items.map((it) => `<li><span class="n">${esc(it.name)}</span><span class="p">${gbp(it.price)}</span><span class="d">${esc(it.desc)}</span></li>`).join('')}</ul>
      </div>`).join('')}
    </div>`,

  sides: (s, data) => {
    const mains = data.sections.filter((x) => ['smash', 'chicken'].includes(x.id)).flatMap((x) => x.items)
      .concat(data.sections.find((x) => x.id === 'peri')?.groups.flatMap((g) => g.items.map((it) => ({ ...it, name: `${g.title.replace('Peri Peri ', 'Peri ')} – ${it.name}` }))) ?? []);
    return `<div class="sides">
      <div class="sides__items">${s.items.map((it) => `
        <button class="side io" type="button" data-item="${it.id}">
          <span class="side__img">${pic(it.image, { alt: it.name, sizes: '(min-width: 900px) 25vw, 45vw' })}</span>
          <span class="side__name">${esc(it.name)}</span>
          <span class="price price--sm">${gbp(it.price)}</span>
          <span class="card__flags">${flags(it)}</span>
        </button>`).join('')}
      </div>
      <form class="deal io" id="deal" onsubmit="return false">
        <h3>Meal Deal<br>for ${gbp(s.mealDeal.price)}</h3>
        <p class="deal__lede">${esc(s.mealDeal.text)}</p>
        <label for="deal-main">Build yours – pick a main</label>
        <select id="deal-main">${mains.map((m) => `<option value="${m.price}">${esc(m.name)} · ${gbp(m.price)}</option>`).join('')}</select>
        <dl class="deal__sum">
          <div><dt>Your main</dt><dd id="deal-a"></dd></div>
          <div><dt>+ Fries &amp; drink</dt><dd>${gbp(s.mealDeal.price)}</dd></div>
          <div class="deal__total"><dt>Meal total</dt><dd><strong id="deal-total" aria-live="polite"></strong></dd></div>
        </dl>
      </form>
    </div>`;
  },

  feasts: (s, data) => `<div class="tickets">${s.items.map((it) => `
    <a class="ticket io" href="${esc(data.business.order.justeat)}" target="_blank" rel="noopener">
      <h3>${esc(it.name)}</h3><span class="p">${gbp(it.price)}</span>
      <p>${esc(it.desc)}</p>
      <span class="go">Order on Just Eat <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></span>
    </a>`).join('')}</div>`,

  shakes: (s) => `<ul class="rail">${s.items.map((it) => `
    <li><button class="shake io" type="button" data-item="${it.id}">
      <span class="shake__img">${pic(it.image, { alt: `${it.name} milkshake`, sizes: '(min-width: 1100px) 18vw, 60vw' })}</span>
      <span class="shake__name">${esc(it.name)}</span>
      <span class="price price--sm">${gbp(it.price)}</span>
    </button></li>`).join('')}</ul>`,

  scoops: (s) => `<div class="scoops">${s.groups.map((g) => `
    <div class="scoop-group">
      <h3>${esc(g.title)} <span class="price price--sm">${gbp(g.price)}</span></h3>
      <p class="sr-only">${gbp(g.price)} ${esc(g.unit)}</p>
      <ul class="scoop-list">${g.items.map((it) => `
        <li class="scoop io"><span class="scoop__img">${pic(it.image, { sizes: '160px' })}</span>${esc(it.name)}</li>`).join('')}
      </ul>
      <p class="sec-head__blurb" style="margin-top:14px">${gbp(g.price)} ${esc(g.unit)}</p>
    </div>`).join('')}</div>`,

  list: (s) => `<ul class="leaders">${s.items.map((it) => `<li><span class="n">${esc(it.name)}</span><span class="p">${gbp(it.price)}</span></li>`).join('')}</ul>`,
};

/* global __DRIP__ */
const DRIP = typeof __DRIP__ === 'string' ? __DRIP__ : '';

// Rendering strategy (performance):
// 1. Build light "shells" for every section immediately (headings only).
// 2. Fill a section's food content when it approaches the viewport, and after
//    the visitor's first interaction progressively fill everything else in small,
//    yielded chunks. Nothing heavy runs on load, so Total Blocking Time stays ~0.
const yieldToMain = () => (globalThis.scheduler?.yield ? scheduler.yield() : new Promise((r) => setTimeout(r, 0)));

async function renderShells(data) {
  const secs = data.sections;
  const root = $('#menu');
  root.innerHTML = `<nav class="menu-nav" aria-label="Menu sections"><ol>${secs.map((s) => `<li><a href="#${s.id}">${esc(s.title)}</a></li>`).join('')}</ol></nav>`;
  root.classList.add('ready');
  const add = (parent, html) => { parent.insertAdjacentHTML('beforeend', html); return parent.lastElementChild; };
  let target = root, zone = null, duo = null;
  for (const [i, s] of secs.entries()) {
    await yieldToMain();
    if (s.dessert && !zone) {
      const shake = secs.find((x) => x.id === 'shakes')?.items[0];
      add(root, `<section class="dessert-intro" aria-label="Dessert Express">
        ${DRIP}
        <div class="wrap">
          <p class="sec-head__num" style="color:var(--ink)" data-reveal>Honeybun presents</p>
          <h2 class="dessert-intro__title" data-reveal>Dessert<span>Express</span></h2>
          <p class="script" data-reveal>Life is sweeter with dessert</p>
        </div>
        ${shake ? `<div class="dessert-intro__shake" aria-hidden="true">${pic(shake.image, { sizes: '(min-width: 900px) 34vw, 50vw' })}</div>` : ''}
      </section>`);
      target = zone = add(root, '<div class="dessert-zone"></div>');
    }
    const list = s.layout === 'list';
    if (list && !duo) duo = add(target, '<div class="wrap duo"></div>');
    if (!list) duo = null;
    const peri = s.layout === 'peri';
    const body = `${head(s, i)}<div class="sec-body" data-fill="${i}"></div>`;
    add(list ? duo : target, `<section class="menu-section${peri ? ' peri' : ''}" id="${s.id}" aria-labelledby="${s.id}-title"${peri ? ' data-heat="hot"' : ''}>${list ? body : `<div class="wrap">${body}</div>`}</section>`);
  }
}

function setupFill(data, onFilled) {
  const pending = new Set($$('[data-fill]'));
  const fill = (el) => {
    if (!pending.delete(el)) return;
    const s = data.sections[el.dataset.fill];
    el.innerHTML = (layouts[s.layout] || layouts.list)(s, data);
    io.unobserve(el);
    onFilled(el, s);
  };
  const io = new IntersectionObserver((ens) => ens.forEach((en) => en.isIntersecting && fill(en.target)), { rootMargin: '0px' });
  pending.forEach((el) => io.observe(el));
  const fillAll = async () => { for (const el of [...pending]) { fill(el); await yieldToMain(); } };
  const kick = () => { ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach((ev) => removeEventListener(ev, kick)); fillAll(); };
  ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach((ev) => addEventListener(ev, kick, { passive: true }));
  return { fillAll, fillSync: () => [...pending].forEach(fill) };
}

/* ---------- item sheet ---------- */
function setupSheet(data) {
  const sheet = $('#sheet');
  const inner = $('#sheet-inner');
  const items = new Map(data.sections.flatMap((s) => (s.items || []).map((it) => [it.id, { ...it, section: s }])));
  const { deliveroo, justeat } = data.business.order;
  let lastTrigger;

  const open = (id, trigger) => {
    const it = items.get(id);
    if (!it) return;
    lastTrigger = trigger;
    inner.innerHTML = `
      <div class="sheet__media">${it.image ? pic(it.image, { alt: it.name, sizes: '(min-width: 760px) 480px, 92vw', eager: true }) : ''}</div>
      <div class="sheet__body">
        <div class="feature__meta">${flags(it)}</div>
        <h2 class="sheet__name" id="sheet-name">${esc(it.name)}</h2>
        <span class="price">${gbp(it.price)}</span>
        <p class="sheet__desc">${esc(it.desc || '')}</p>
        ${it.ingredients ? `<h3>What's inside</h3><ul class="feature__ings">${it.ingredients.map((x) => `<li class="chip">${esc(x)}</li>`).join('')}</ul>` : ''}
        ${it.sauce ? `<h3>Choose your sauce</h3><ul class="feature__ings">${data.sauces.map((x) => `<li class="chip">${esc(x)}</li>`).join('')}</ul>` : ''}
        ${it.section.id === 'waffles' ? `<p class="sheet__note">Available as a waffle or a crêpe.</p>` : ''}
        <div class="sheet__ctas">
          <a class="btn btn--deliveroo" href="${esc(deliveroo)}" target="_blank" rel="noopener">Deliveroo</a>
          <a class="btn btn--justeat" href="${esc(justeat)}" target="_blank" rel="noopener">Just Eat</a>
        </div>
        <p class="sheet__note">Allergies? Please speak to us before ordering.</p>
      </div>`;
    const show = () => sheet.showModal();
    document.startViewTransition && !reduced ? document.startViewTransition(show) : show();
  };

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-item]');
    if (t) open(t.dataset.item, e.target.closest('button') || t.querySelector('button') || t);
  });
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet || e.target.closest('[data-close]')) sheet.close();
  });
  sheet.addEventListener('close', () => lastTrigger?.focus({ preventScroll: true }));
}

/* ---------- peri heat selector ---------- */
function setupHeat(data) {
  const sec = $('#peri');
  if (!sec) return;
  const notes = { lemon: 'Zesty, fresh & gentle', mild: 'A warm kick of chilli', hot: 'Seriously fiery – you were warned' };
  const flames = $$('.heat__flames svg', sec);
  const txt = $('.heat__txt', sec);
  const set = (id) => {
    const h = data.heat.find((x) => x.id === id);
    sec.dataset.heat = id;
    flames.forEach((f, i) => f.classList.toggle('on', i < h.level));
    txt.textContent = `${h.label}: ${notes[id] || ''}`;
  };
  sec.addEventListener('change', (e) => e.target.name === 'heat' && set(e.target.value));
  set('hot');
}

/* ---------- meal deal builder ---------- */
function setupDeal(data) {
  const sel = $('#deal-main');
  if (!sel) return;
  const extra = data.sections.find((s) => s.mealDeal)?.mealDeal.price ?? 0;
  const a = $('#deal-a');
  const total = $('#deal-total');
  let current = 0;
  const animate = (to) => {
    if (reduced) { total.textContent = gbp(to); current = to; return; }
    const from = current, t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 450), v = from + (to - from) * (1 - (1 - k) ** 3);
      total.textContent = gbp(v);
      if (k < 1) requestAnimationFrame(step); else current = to;
    };
    requestAnimationFrame(step);
  };
  const update = () => { const p = Number(sel.value); a.textContent = gbp(p); animate(p + extra); };
  sel.addEventListener('change', update);
  update();
}

/* ---------- open / closed status ---------- */
function setupStatus(data) {
  const el = $('#status');
  const hours = data.business.hours;
  // UK local time without Intl (Intl time-zone data is slow to initialise on phones).
  // BST runs from 01:00 UTC on the last Sunday of March to 01:00 UTC on the last Sunday of October.
  const d = new Date(), y = d.getUTCFullYear();
  const lastSun = (m) => { const t = new Date(Date.UTC(y, m + 1, 0, 1)); t.setUTCDate(t.getUTCDate() - t.getUTCDay()); return t; };
  const uk = new Date(d.getTime() + (d >= lastSun(2) && d < lastSun(9) ? 3600e3 : 0));
  const di = (uk.getUTCDay() + 6) % 7; // Mon = 0
  const now = uk.getUTCHours() * 60 + uk.getUTCMinutes();
  const mins = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const isOpen = (d, t) => {
    const h = hours[d]; const o = mins(h.open); let c = mins(h.close); if (c <= o) c += 1440;
    return t >= o && t < c ? h : null;
  };
  // today, or yesterday's late-night shift spilling past midnight
  const today = isOpen(di, now);
  const late = isOpen((di + 6) % 7, now + 1440);
  const shift = today || late;
  el.classList.add(shift ? 'is-open' : 'is-closed');
  $('.status__txt', el).textContent = shift ? `Open now · until ${shift.close}` : `Closed · opens ${hours[di].open}`;
  $$('#hours dt').forEach((dt, i) => { if (i === di) { dt.classList.add('today'); dt.nextElementSibling.classList.add('today'); } });
}

/* ---------- section scroll-spy for the chips ---------- */
function setupSpy() {
  const links = new Map($$('.menu-nav a').map((a) => [a.hash.slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.removeAttribute('aria-current'));
      const a = links.get(en.target.id);
      if (a) {
        a.setAttribute('aria-current', 'true');
        const ol = a.closest('ol'); // keep the active chip centred without scrolling the page
        ol.scrollTo({ left: a.offsetLeft - (ol.clientWidth - a.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('.menu-section[id]').forEach((s) => io.observe(s));
}

/* ---------- reveal fallback (no scroll-driven animation support) ---------- */
function setupReveal() {
  if (scrollTimelines || reduced) return null;
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  return (root) => $$('.io', root).forEach((el) => io.observe(el));
}

/* ---------- header state ---------- */
function setupHeader() {
  const h = $('.site-header');
  const set = () => h.classList.toggle('is-stuck', scrollY > 24);
  addEventListener('scroll', set, { passive: true });
  set();
}

/* ---------- hero pointer parallax ---------- */
function setupParallax() {
  if (reduced || !matchMedia('(pointer: fine)').matches) return;
  const b = $('.hero__burger');
  let raf = 0;
  addEventListener('pointermove', (e) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      b.style.setProperty('--px', (e.clientX / innerWidth - 0.5).toFixed(3));
      b.style.setProperty('--py', (e.clientY / innerHeight - 0.5).toFixed(3));
    });
  }, { passive: true });
}

/* ---------- map facade: loads Google Maps only after real user interaction ---------- */
function setupMap() {
  const map = $('#map');
  let interacted = false, near = false, done = false;
  const load = () => {
    if (done) return; done = true;
    const f = document.createElement('iframe');
    f.src = map.dataset.src; f.title = 'Map showing Honeybun on Darkes Lane, Potters Bar';
    f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.allowFullscreen = true;
    map.append(f); map.classList.add('is-live');
  };
  $('.map__load', map).addEventListener('click', load);
  const maybe = () => interacted && near && load();
  ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach((ev) => addEventListener(ev, () => { interacted = true; maybe(); }, { once: true, passive: true }));
  new IntersectionObserver(([en]) => { near = en.isIntersecting; maybe(); }, { rootMargin: '300px' }).observe(map);
}

/* ---------- instagram (switches on when posts are added to menu.json) ---------- */
function setupInsta(data) {
  const posts = data.instagram?.posts || [];
  if (!posts.length) return;
  const g = $('#insta-grid');
  g.innerHTML = posts.slice(0, 8).map((p) => `<a href="${esc(p.url || data.business.instagram)}" target="_blank" rel="noopener"><img src="${esc(p.image)}" alt="${esc(p.alt || 'Honeybun on Instagram')}" loading="lazy" decoding="async" width="400" height="400"></a>`).join('');
  g.hidden = false;
}

/* ---------- keep contact details in sync with the JSON ---------- */
function bindBusiness(b) {
  $$('[data-bind="phoneDisplay"]').forEach((el) => (el.textContent = b.phoneDisplay));
  $$('[data-bind="tel"]').forEach((el) => (el.href = `tel:${b.phone}`));
}

/* ---------- boot ---------- */
setupHeader();
setupParallax();
setupMap();
$('#year').textContent = new Date().getFullYear();

const data = await loadMenu();
await renderShells(data);
for (const task of [() => bindBusiness(data.business), () => setupStatus(data), () => setupSheet(data), setupSpy, () => setupInsta(data)]) {
  await yieldToMain();
  task();
}
await yieldToMain();
const reveal = setupReveal();
const filler = setupFill(data, (el, s) => {
  if (s.layout === 'peri') setupHeat(data);
  if (s.layout === 'sides') setupDeal(data);
  reveal?.(el);
});
// Deep link (e.g. /#peri): render everything first so the jump lands precisely.
if (location.hash.length > 1) { filler.fillSync(); $(location.hash)?.scrollIntoView(); }
// Section chips: make sure everything is laid out before jumping.
$('.menu-nav').addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  e.preventDefault();
  filler.fillSync();
  $(a.hash)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  history.replaceState(null, '', a.hash);
});

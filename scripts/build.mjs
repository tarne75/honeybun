// Build: src/index.html + src/css + src/js + data/menu.json  →  /index.html (single, fully-inlined page)
// Run: npm run build   (needed after editing CSS/JS/HTML, or business details in menu.json)
// Menu items are also fetched live from data/menu.json at runtime, so menu-only edits work without a build.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { transform as cssTransform, browserslistToTargets } from 'lightningcss';
import { build as esbuild } from 'esbuild';

const root = path.resolve(import.meta.dirname, '..');
const r = (p) => readFile(path.join(root, p), 'utf8');
const SITE = 'https://tarne75.github.io/honeybun/';

const menu = JSON.parse(await r('data/menu.json'));
const b = menu.business;

/* ---- deterministic drip divider (Dessert Express) ---- */
function drips(seed = 11) {
  // A wavy base line with rounded, bulbous drips hanging off it.
  let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const base = 26; let x = 0; let d = `M0 0H1440V${base}`;
  const pts = [];
  while (x < 1440) { x += 38 + rnd() * 90; if (x < 1420) pts.push(x); }
  // walk right-to-left along the base, dropping drips at pts
  let cx = 1440;
  for (const px of pts.reverse()) {
    const w = 10 + rnd() * 16, len = 18 + rnd() * 80, r = w / 2 + 3;
    const l = px - w / 2, rgt = px + w / 2;
    d += `C${(cx - (cx - rgt) / 2).toFixed(0)} ${base + 4} ${(rgt + 10).toFixed(0)} ${base} ${rgt.toFixed(1)} ${base + 8}`;
    d += `L${(rgt + 1).toFixed(1)} ${(base + len).toFixed(0)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 1 ${(-w - 2).toFixed(1)} 0`;
    d += `L${l.toFixed(1)} ${base + 8}C${(l - 10).toFixed(0)} ${base} ${(l - 20).toFixed(0)} ${base + 3} ${(l - 30).toFixed(0)} ${base + 2}`;
    cx = l - 30;
  }
  d += `C${(cx / 2).toFixed(0)} ${base - 4} 20 ${base + 4} 0 ${base}Z`;
  return `<svg class="drips" viewBox="0 0 1440 130" preserveAspectRatio="none" aria-hidden="true"><path fill="currentColor" d="${d}"/></svg>`;
}

/* ---- logo symbol body (strip outer <svg> and its <defs>, which live in the page sprite) ---- */
const logoSvg = await r('assets/img/logo.svg');
const LOGO = logoSvg.replace(/^[\s\S]*?<\/defs>/, '').replace(/<\/svg>\s*$/, '').replace(/\s*\n\s*/g, '');

/* ---- marquee ---- */
const star = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2 2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.2 5.8 21l1.6-7L2 9.2l7.1-.6z"/></svg>';
const marquee = (words) => {
  const run = words.map((w) => `<span class="marquee__item">${w}${star}</span>`).join('');
  return `<div class="marquee__track">${run}${run}</div><div class="marquee__track">${run}${run}</div>`;
};

/* ---- hours ---- */
const HOURS = b.hours.map((h) => `<dt>${h.day}</dt><dd>${h.open} – ${h.close === '00:00' ? 'Midnight' : h.close}</dd>`).join('');

/* ---- structured data ---- */
const dayMap = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };
const jsonld = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: 'Honeybun',
  alternateName: 'Honeybun Burger and Dessert',
  description: b.tagline,
  url: SITE,
  image: `${SITE}assets/img/og.jpg`,
  logo: `${SITE}assets/img/icon-512.png`,
  telephone: b.phone,
  servesCuisine: ['Burgers', 'Fried chicken', 'Peri peri', 'Desserts'],
  priceRange: '£',
  address: { '@type': 'PostalAddress', streetAddress: b.address.street, addressLocality: b.address.town, postalCode: b.address.postcode, addressCountry: 'GB' },
  geo: { '@type': 'GeoCoordinates', latitude: b.geo.lat, longitude: b.geo.lng },
  hasMap: b.mapsUrl,
  sameAs: [b.instagram, b.order.deliveroo, b.order.justeat],
  openingHoursSpecification: b.hours.map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: dayMap[h.day], opens: h.open, closes: h.close })),
  hasMenu: `${SITE}#menu`,
};

/* ---- CSS ---- */
let css = await r('src/css/site.css');
css = css.replaceAll('../assets/', 'assets/');
const { code: cssOut } = cssTransform({
  filename: 'site.css', code: Buffer.from(css), minify: true,
  targets: browserslistToTargets(['chrome >= 111', 'safari >= 16.4', 'firefox >= 117', 'ios_saf >= 16.4']),
});

/* ---- JS ---- */
const js = await esbuild({
  entryPoints: [path.join(root, 'src/js/app.js')], bundle: true, minify: true, write: false, format: 'esm', target: 'es2022',
  define: { __DRIP__: JSON.stringify(drips()) },
});
const jsOut = js.outputFiles[0].text.trim();

/* ---- assemble ---- */
const vars = {
  siteUrl: SITE, phone: b.phone, phoneDisplay: b.phoneDisplay, street: b.address.street, town: b.address.town, postcode: b.address.postcode,
  mapsUrl: b.mapsUrl, mapEmbed: b.mapEmbed, instagram: b.instagram, instagramHandle: b.instagramHandle,
  deliveroo: b.order.deliveroo, justeat: b.order.justeat, hoursNote: b.hoursNote,
};
const safe = (s) => s.replace(/<\/(script)/gi, '<\\/$1');
let html = await r('src/index.html');
html = html
  .replace('{{CSS}}', () => cssOut.toString())
  .replace('{{JS}}', () => safe(jsOut))
  .replace('{{JSONLD}}', () => safe(JSON.stringify(jsonld)))
  .replace('{{LOGO}}', () => LOGO)
  .replace('{{HOURS}}', () => HOURS)
  .replace('{{MARQUEE_A}}', () => marquee(['Smash Burgers', 'Crispy Chicken', 'Peri Peri', 'Loaded Waffles', 'Thick Shakes', 'Open Late']))
  .replace('{{MARQUEE_B}}', () => marquee(['Home of Smash Burgers', 'Dessert Express', 'Potters Bar', 'Good Food', 'Good Vibes']))
  .replace('{{ADDRESS}}', () => [...b.address.street.split(/\s*,\s*/), b.address.town, b.address.postcode].map((x) => x.replace(/&(?!amp;)/g, '&amp;')).join(',<br>'))
  .replace(/{{(\w+)}}/g, (m, k) => {
    if (!(k in vars)) throw new Error(`Unknown placeholder ${m}`);
    return String(vars[k]).replace(/&(?!amp;)/g, '&amp;');
  });
// collapse inter-tag whitespace (keep it safe: only newlines + indentation)
html = html.replace(/>\s*\n\s*</g, '><');
await writeFile(path.join(root, 'index.html'), html);
// file:// fallback copy of the menu (fetch() is blocked on file://)
await writeFile(path.join(root, 'data/menu.js'), `/* Generated by npm run build from data/menu.json – do not edit */\nwindow.HONEYBUN_MENU = ${JSON.stringify(menu)};\n`);
console.log(`✓ index.html  ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB  (css ${(cssOut.length / 1024).toFixed(1)} KB, js ${(jsOut.length / 1024).toFixed(1)} KB)`);

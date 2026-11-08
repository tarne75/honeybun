# Honeybun — project notes (for Claude & humans)

Single-page, semi-interactive menu site for **Honeybun, 30 The Broadway, Darkes Lane, Potters Bar EN6 2HW** — smash burgers, chicken, peri peri and the "Dessert Express". No online ordering: every order CTA deep-links to Deliveroo or Just Eat.

- Live: https://tarne75.github.io/honeybun/ (GitHub Pages, `main` branch, repo root)
- Deploy: `git push origin main` (no CI build – the built `index.html` is committed)
- Commits: authored as Tarne Westcott — **no Co-Authored-By / Claude trailers**.
- Brand system: see `BRAND.md`.

## Structure

```
index.html            ← BUILT output (do not hand-edit) – fully inlined CSS + JS
data/menu.json        ← ★ ALL menu + business data. Edit this.
data/menu.js          ← BUILT copy of menu.json for file:// testing (fetch is blocked on file://)
src/index.html        ← page template ({{placeholders}} filled by the build)
src/css/site.css      ← styles (modern CSS: @layer, nesting, scroll-driven animations)
src/js/app.js         ← renderer + interactions (vanilla ES module, no framework)
src/images/food/      ← master cut-outs (transparent WebP)   → npm run images
src/images/photos/    ← neon atmosphere photos + original menu boards
src/brand/            ← maskable icon source
assets/img/           ← BUILT responsive AVIF + WebP, hero sizes, OG image, icons
assets/fonts/         ← self-hosted subset woff2 (Anton, Kaushan Script)
scripts/build.mjs     ← template → index.html (lightningcss + esbuild), JSON-LD, data/menu.js
scripts/images.mjs    ← sharp pipeline: AVIF/WebP widths, favicons, OG image
```

## Editing the menu

1. Edit `data/menu.json` (prices, names, descriptions, sections, hours, phone…).
2. Run `npm run build` (refreshes the baked-in contact details, hours, JSON-LD and `data/menu.js`).
3. Commit + push.

On the live site the menu is fetched from `data/menu.json` at runtime, so menu-item-only edits show up even without a build – but always build so the footer/JSON-LD/file:// copy stay in sync.

Item fields: `id, name, price, desc, ingredients[], image (file stem in assets/img/food), badge, spicy, nuts, veg, sauce (shows the 3 sauce choices), round, fade`. Section `layout` chooses the design: `showcase | grid | peri | sides | feasts | shakes | scoops | list`. Sections with `"dessert": true` sit inside the pink "Dessert Express" zone.

**Instagram**: add objects to `instagram.posts` (`{ "image", "alt", "url" }`) and the grid switches on automatically. Empty = a "Follow" panel.

## Adding / changing food images

Drop a transparent WebP/PNG into `src/images/food/<id>.webp` (background removed, tightly cropped), then `npm run images` (~2 min; AVIF encoding is slow) and reference `"image": "<id>"` in menu.json. Cut-outs were made with `rembg` (`isnet-general-use`).

## Commands

```
npm install          # sharp, esbuild, lightningcss (dev only) – needs Node 20.11+ (see .nvmrc)
npm run build        # → index.html + data/menu.js
npm run images       # → assets/img/** (only when source images change)
npm run serve        # local http server (gzip) at http://localhost:4173/honeybun/
```
Opening `index.html` directly from the filesystem works (menu loads from `data/menu.js`). The console shows a harmless CORS warning for the font *preload* on file:// only.

## Performance architecture (Lighthouse 100 / 100 / 100 / 100, mobile + desktop)

Measured locally with Lighthouse 12 (simulated Moto G / slow 4G): FCP 0.9 s, LCP 1.7 s, TBT 0–20 ms, CLS 0.
What keeps it there – don't undo these without re-testing:
- **One request for first paint**: CSS + JS inlined; only Anton font + hero AVIF (≈29 KB, `fetchpriority=high`, preloaded) are critical.
- **Body text uses the system font** (no download). The hero script "& Dessert" is an SVG outline, so Kaushan isn't needed above the fold.
- **Shell-first menu rendering** (`renderShells` → `setupFill`): section headings render in yielded chunks; food content fills when a section reaches the viewport, and after the first user interaction everything fills progressively. Nothing heavy runs during load.
- `content-visibility: auto` + `contain-intrinsic-height` on below-fold sections. ⚠️ Use `contain-intrinsic-height`, NOT `contain-intrinsic-size` – the latter also sets an intrinsic *width* and blew the mobile layout viewport out to 1400 px.
- Infinite animations are compositor-only (`transform`/`opacity` + `will-change`); never animate `box-shadow`/`filter` in loops.
- Avoided `Intl.DateTimeFormat({timeZone})` (≈20 ms on phones) – UK time / BST is computed manually for the "Open now" pill.
- **Google Map is a facade**: the iframe only loads after a real interaction (scroll/tap) near the footer, or the "Show interactive map" button – keeps third-party cookies and JS out of the audit. The embed is dark-styled with a CSS filter.
- Scroll-reveal animations use native `animation-timeline: view()`; Firefox falls back to IntersectionObserver (`.io` → `.in`).

## Interactive features

Sticky contact header (phone, address → Google Maps, Instagram) · sticky section chips with scroll-spy · item detail sheet (`<dialog>`, bottom sheet on mobile, View Transitions where supported) · peri-peri heat selector (re-themes the section) · meal-deal builder with animated total · live "Open now / Closed" pill + today highlighted in hours · Instagram grid driven by JSON.

## Data sources & things to verify with the owner

- Menu, prices, descriptions: Deliveroo + Just Eat listings and the two in-store menu boards (Nov 2026). Peri peri, cakes and bundles come from the boards / Just Eat only.
- Phone `07480 813335` and hours are from the Just Eat listing (delivery hours) – **confirm shop hours**.
- Address: Deliveroo/Just Eat say *30 The Broadway, Darkes Lane, EN6 2HW*; Google's place card shows *30 Wyllyotts Ln, EN6 2HN* – **confirm which to publish**.
- Logo is a vector recreation of the IG profile picture; swap in original artwork if available.
- Copy was drafted from the platform descriptions; allergen line is generic.

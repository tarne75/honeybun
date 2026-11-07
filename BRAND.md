# Honeybun — Brand & Style Guide

Derived from the Honeybun Instagram profile (@honeybun_pottersbar), the in-store menu boards and the delivery-platform photography. The look is **"neon after dark"**: a black, faintly-purple night, hot-pink neon tubes, brush-script accents and food that glows.

## Logo

| Asset | File | Use |
|---|---|---|
| Circular badge (vector rebuild of the IG profile photo) | `assets/img/logo.svg` (also inlined as `<symbol id="logo">` in the page) | Header, footer, OG image |
| Favicon "H" badge | `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `assets/img/icon-*.png` | Browser / home-screen |

- Wordmark: **"Honeybun"** in a heavy connected script (rebuilt from *Lobster*), pink gradient `#ff8fdc → #ff2fb3 → #e0007f`, dark-plum outline `#5a0035`, tilted −7°.
- Tagline under the wordmark: **HOME OF SMASH BURGERS & DESSERT** (Anton, white) with pink rules either side.
- Ring: neon pink `#ff2fb3` stroke with a soft glow on near-black `#0d000a`.
- ⚠️ The logo is a faithful vector *recreation* (Instagram only serves a 150 px image). If the owner has the original artwork file, swap it into `assets/img/logo.svg`.

## Colour palette

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#0b0009` | Page background (black with a plum tint) |
| `--ink-2` | `#150011` | Raised surfaces |
| `--ink-3` | `#22001b` | Cards / tickets |
| `--plum` | `#3a0230` | Glows, gradients |
| `--pink` | `#ff2fb3` | **Primary brand neon** – prices, CTAs, highlights |
| `--pink-hot` | `#ff1493` | Gradient partner |
| `--pink-soft` | `#ff8fdc` | Links, secondary highlights |
| `--pink-ice` | `#ffd6f1` | Light text on dark |
| `--cream` | `#fff4fb` | Main text |
| `--muted` | `#cfb3c6` | Body copy / descriptions |
| `--honey` | `#ffbf3c` | Accent (nut flags, peri gradient) |
| `--lemon` / `--mild` / `--hot` | `#2fb84a` / `#ff8a1f` / `#e5122b` | Peri-peri heat levels (from the menu board) |
| `--deliveroo` | `#00ccbc` | Deliveroo buttons only |
| `--justeat` | `#ff8000` | Just Eat buttons only |

Contrast: pink on ink ≈ 6.8:1, cream on ink > 17:1 (WCAG AA/AAA).

## Typography

| Role | Font | Notes |
|---|---|---|
| Display / headings / prices | **Anton** (self-hosted, subset, 12 KB) | Always uppercase, tight leading (0.85). Outline variant via `-webkit-text-stroke`. |
| Script accents ("Big Flavour · Fresh Ingredients") | **Kaushan Script** (self-hosted, subset) | Pink with neon text-shadow, rotated −2° to −5°. Hero "& Dessert" is an inline SVG outline of this font so it costs nothing at load. |
| Body | System UI stack (SF Pro / Roboto / Segoe) | Zero download – keeps PageSpeed at 100. |

## Graphic language

- **Neon glow**: `text-shadow`/`drop-shadow` in pink at 45–70% alpha.
- **Brush price stickers**: pink rough-edged `clip-path` labels, slightly rotated (like the menu boards).
- **Crowns**: hand-drawn crown icon after section titles (from the menu boards).
- **Drips**: the Dessert Express section opens with chocolate-style drips over hot pink.
- **Giant outline numbers / words** behind food ("01", "HONEYBUN").
- **Marquee bands**: crossing pink and outlined tapes with ★ separators.
- **Food photography**: background-removed cut-outs floating on a pink glow pool with a deep drop shadow – never boxed rectangles. Photos whose source crop left a hard edge get a soft radial fade (`"fade": true` in menu.json).
- **Motion**: food "cooks into view" as you scroll (rise + rotate + de-blur via native CSS scroll-driven animations), gentle bob on the hero burger, flickering neon. All motion is disabled under `prefers-reduced-motion`.

## Voice

Short, punchy, confident, a bit cheeky. British spelling. Taglines from the boards: *Bigger Burgers · Better Flavour*, *Good Food · Good Vibes*, *Life is Sweeter with Dessert*, *Dessert Makes Everything Better*.

## Imagery rules

- Food only – no people.
- Source: Deliveroo + Just Eat listing photos (cut out with `rembg` / IS-Net). Branded drink cans are deliberately not shown large.
- The neon-sign photos (Just Eat) are used as atmosphere behind the "We deliver" band.

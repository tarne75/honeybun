// Image pipeline: src/images → assets/img (AVIF + WebP, responsive widths) + favicon set + OG image.
// Run: npm run images   (only needed when source images change)
import sharp from 'sharp';
import { readdir, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const SRC = path.join(root, 'src/images');
const OUT = path.join(root, 'assets/img');

const sets = [
  // transparent cut-outs used on menu cards
  { dir: 'food', widths: [400, 800], avif: { quality: 55, effort: 4 }, webp: { quality: 78, alphaQuality: 90, effort: 6 } },
  // atmospheric photos (neon shopfront shots) used as masked backdrops
  { dir: 'photos', widths: [800, 1400], avif: { quality: 50, effort: 4 }, webp: { quality: 72, effort: 6 }, only: /\.webp$/ },
];

const manifest = {};
for (const set of sets) {
  const inDir = path.join(SRC, set.dir);
  const outDir = path.join(OUT, set.dir);
  await mkdir(outDir, { recursive: true });
  for (const file of (await readdir(inDir)).filter((f) => !set.only || set.only.test(f))) {
    const name = file.replace(/\.[a-z]+$/, '');
    const img = sharp(path.join(inDir, file));
    const meta = await img.metadata();
    manifest[name] = { w: meta.width, h: meta.height };
    for (const w of set.widths) {
      const width = Math.min(w, meta.width);
      const pipe = sharp(path.join(inDir, file)).resize({ width });
      await pipe.clone().avif(set.avif).toFile(path.join(outDir, `${name}-${w}.avif`));
      await pipe.clone().webp(set.webp).toFile(path.join(outDir, `${name}-${w}.webp`));
    }
    console.log('✓', set.dir, name);
  }
}

// Hero burger gets extra sizes (it is the LCP element)
const hero = path.join(SRC, 'food/king-gourmet.webp');
for (const w of [560, 720, 960, 1280]) {
  await sharp(hero).resize({ width: w }).avif({ quality: 40, effort: 7 }).toFile(path.join(OUT, `hero-${w}.avif`));
  await sharp(hero).resize({ width: w }).webp({ quality: 76, alphaQuality: 90, effort: 6 }).toFile(path.join(OUT, `hero-${w}.webp`));
}
await writeFile(path.join(OUT, 'sizes.json'), JSON.stringify(manifest, null, 1));

// Favicons
const fav = await readFile(path.join(root, 'favicon.svg'));
const mask = await readFile(path.join(root, 'src/brand/maskable.svg'));
const png = (buf, size, file) => sharp(buf, { density: 400 }).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(root, file));
await png(fav, 180, 'apple-touch-icon.png');
await png(fav, 192, 'assets/img/icon-192.png');
await png(fav, 512, 'assets/img/icon-512.png');
await png(mask, 512, 'assets/img/icon-maskable-512.png');
// favicon.ico (32px PNG-in-ICO)
const p32 = await sharp(fav, { density: 400 }).resize(32, 32).png().toBuffer();
const ico = Buffer.alloc(22);
ico.writeUInt16LE(0, 0); ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4);
ico.writeUInt8(32, 6); ico.writeUInt8(32, 7); ico.writeUInt8(0, 8); ico.writeUInt8(0, 9);
ico.writeUInt16LE(1, 10); ico.writeUInt16LE(32, 12); ico.writeUInt32LE(p32.length, 14); ico.writeUInt32LE(22, 18);
await writeFile(path.join(root, 'favicon.ico'), Buffer.concat([ico, p32]));

// Open Graph image 1200×630: neon photo + badge
const logo = await sharp(await readFile(path.join(root, 'assets/img/logo.svg')), { density: 300 }).resize(420, 420).png().toBuffer();
await sharp(path.join(SRC, 'photos/king-cheese-burger.webp'))
  .resize(1200, 630, { fit: 'cover', position: 'right' })
  .modulate({ brightness: 0.8 })
  .composite([{ input: logo, left: 70, top: 105 }])
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile(path.join(OUT, 'og.jpg'));
console.log('✓ favicons + og');

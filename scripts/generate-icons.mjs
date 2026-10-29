#!/usr/bin/env node
// Renders the app icons from the outlined SVGs in assets/brand (see scripts/outline-brand.py).
// Android: legacy + round mipmaps and adaptive foreground/monochrome layers (API 26+, themed icons on 33+).
// iOS: one 1024 px universal icon (Xcode 14+ generates the other sizes).
// Usage: node scripts/generate-icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const brand = 'assets/brand';
const res = 'android/app/src/main/res';
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const svg = name => fs.readFileSync(path.join(brand, name));

const circleMask = size =>
  Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`);

for (const [d, k] of Object.entries(DENSITIES)) {
  const dir = path.join(res, `mipmap-${d}`);
  fs.mkdirSync(dir, { recursive: true });
  const legacy = Math.round(48 * k);
  const layer = Math.round(108 * k);
  const icon = await sharp(svg('ios-1024.svg'), { density: 300 }).resize(legacy, legacy).png().toBuffer();
  await sharp(icon).toFile(path.join(dir, 'ic_launcher.png'));
  await sharp(icon).composite([{ input: circleMask(legacy), blend: 'dest-in' }]).png().toFile(path.join(dir, 'ic_launcher_round.png'));
  await sharp(svg('android-foreground.svg'), { density: 300 }).resize(layer, layer).png().toFile(path.join(dir, 'ic_launcher_foreground.png'));
  await sharp(svg('android-monochrome.svg'), { density: 300 }).resize(layer, layer).png().toFile(path.join(dir, 'ic_launcher_monochrome.png'));
}

const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome" />
</adaptive-icon>
`;
fs.mkdirSync(path.join(res, 'mipmap-anydpi-v26'), { recursive: true });
fs.writeFileSync(path.join(res, 'mipmap-anydpi-v26/ic_launcher.xml'), adaptive);
fs.writeFileSync(path.join(res, 'mipmap-anydpi-v26/ic_launcher_round.xml'), adaptive);
fs.writeFileSync(
  path.join(res, 'values/ic_launcher_background.xml'),
  '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#120F2E</color>\n</resources>\n',
);

const ios = 'ios/Kisti/Images.xcassets/AppIcon.appiconset';
await sharp(svg('ios-1024.svg'), { density: 300 }).resize(1024, 1024).flatten({ background: '#120F2E' }).png().toFile(path.join(ios, 'AppIcon-1024.png'));
fs.writeFileSync(
  path.join(ios, 'Contents.json'),
  JSON.stringify({ images: [{ filename: 'AppIcon-1024.png', idiom: 'universal', platform: 'ios', size: '1024x1024' }], info: { author: 'xcode', version: 1 } }, null, 2) + '\n',
);
console.log('icons written');

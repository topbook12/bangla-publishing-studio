/**
 * PWA আইকন রাস্টারাইজার — public/logo.svg → সব সাইজের PNG (sharp)
 * রান: bun run scripts/build-icons.ts
 */
import sharp from 'sharp';
import { readFile, stat } from 'node:fs/promises';

const svg = await readFile('public/logo.svg', 'utf8');

// সাধারণ আইকন — পুরো টাইল দৃশ্যমান
const plain = Buffer.from(svg);
await sharp(plain, { density: 300 }).resize(1024, 1024).png().toFile('public/icons/icon-1024.png');
await sharp(plain, { density: 300 }).resize(512, 512).png().toFile('public/icons/icon-512.png');
await sharp(plain, { density: 300 }).resize(192, 192).png().toFile('public/icons/icon-192.png');
await sharp(plain, { density: 300 }).resize(32, 32).png().toFile('public/favicon-32.png');
await sharp(plain, { density: 300 }).resize(180, 180).png().toFile('public/icons/apple-touch-icon.png');

// মাস্কেবল আইকন — সেফ-জোনে (80%) ছোট টাইল, পটভূমি এমারেল্ড
const M = 0.78; // সেফ-জোন স্কেল
const inner = await sharp(plain, { density: 300 }).resize(Math.round(1024 * M), Math.round(1024 * M)).png().toBuffer();
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="#1c6b4c"/></svg>`;
await sharp(Buffer.from(maskable))
  .composite([{ input: inner, gravity: 'center' }])
  .png()
  .toFile('public/icons/icon-512-maskable.png');

// যাচাই — প্রতিটি ফাইলের সাইজ প্রিন্ট
for (const f of ['public/icons/icon-1024.png', 'public/icons/icon-512.png', 'public/icons/icon-192.png', 'public/favicon-32.png', 'public/icons/apple-touch-icon.png', 'public/icons/icon-512-maskable.png']) {
  const s = await stat(f);
  console.log(`${f}: ${(s.size / 1024).toFixed(1)} KB`);
}
console.log('ICONS-OK');

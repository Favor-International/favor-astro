import sharp from 'sharp';
import { stat } from 'node:fs/promises';

const src = 'C:/Users/Willb/Downloads/WhatsApp Image 2026-05-22 at 4.26.09 PM.jpeg';

// First inspect — log dimensions and avg color so we know what's actually inside
const meta = await sharp(src).metadata();
console.log('Source:', meta.width + 'x' + meta.height, meta.format, meta.size + ' bytes');
const { dominant } = await sharp(src).stats();
console.log('Dominant color (R,G,B):', dominant.r, dominant.g, dominant.b);

// Now save the processed hero
await sharp(src)
  .resize({ width: 2400, withoutEnlargement: true })
  .modulate({ brightness: 1.05, saturation: 1.06 })
  .linear(1.03, -2)
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile('public/images/hero-pastor-preaching.jpg');

const info = await stat('public/images/hero-pastor-preaching.jpg');
console.log('Saved:', info.size + ' bytes');

import sharp from 'sharp';
import { unlink, stat } from 'node:fs/promises';

await sharp('public/images/_new-hero-original.jpeg')
  .resize({ width: 2400, withoutEnlargement: true })
  // Lift shadows slightly so the missionary in white reads cleanly
  .modulate({ brightness: 1.05, saturation: 1.06 })
  .linear(1.03, -2)
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile('public/images/hero-pastor-preaching.jpg');

// Also write a darker version cropped for mobile if needed
const info = await stat('public/images/hero-pastor-preaching.jpg');
console.log('Hero saved:', info.size + ' bytes');

await unlink('public/images/_new-hero-original.jpeg').catch(() => {});
console.log('Cleanup done.');

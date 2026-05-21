import sharp from 'sharp';

const src = '/c/Users/Willb/Downloads/ChatGPT Image May 20, 2026, 09_26_14 PM.png'
  .replace('/c/', 'C:/');

await sharp(src)
  .resize({ width: 2400, withoutEnlargement: true })
  // Lift shadows + add midtone brightness
  .modulate({ brightness: 1.08, saturation: 1.10 })
  // Slight contrast bump
  .linear(1.04, -4)
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile('public/images/hero-pastor-preaching.jpg');

const stat = (await import('node:fs/promises')).stat;
const info = await stat('public/images/hero-pastor-preaching.jpg');
console.log('Re-graded:', info.size + ' bytes');

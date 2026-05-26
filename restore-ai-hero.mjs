import sharp from 'sharp';
import { stat } from 'node:fs/promises';

// Restore the original AI-generated pastor-under-tree hero photo
await sharp('C:/Users/Willb/Downloads/ChatGPT Image May 20, 2026, 09_26_14 PM.png')
  .resize({ width: 2400, withoutEnlargement: true })
  .modulate({ brightness: 1.05, saturation: 1.06 })
  .linear(1.03, -2)
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile('public/images/hero-pastor-preaching.jpg');

const info = await stat('public/images/hero-pastor-preaching.jpg');
console.log('Hero restored:', info.size + ' bytes');

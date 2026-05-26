import sharp from 'sharp';
const files = ['highlight-saved', 'highlight-crowd', 'highlight-baptism', 'highlight-prayer'];
for (const name of files) {
  await sharp(`public/images/${name}.jpg`)
    .resize({ width: 800, withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(`public/images/_tmp_${name}.jpg`);
  const { stat, rename } = await import('node:fs/promises');
  const info = await stat(`public/images/_tmp_${name}.jpg`);
  await rename(`public/images/_tmp_${name}.jpg`, `public/images/${name}.jpg`);
  console.log(name, '→', info.size + ' bytes');
}

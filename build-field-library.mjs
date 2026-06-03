// Selects an even spread of field photos from ../Media/extracted/2026 by topic,
// optimizes them to web-ready webp, and writes them to public/images/field-2026/.
// Outputs a manifest so each new image's topic/source is known for wiring.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const MEDIA = path.resolve('../Media/extracted/2026');
const OUT = path.resolve('public/images/field-2026');
fs.mkdirSync(OUT, { recursive: true });

const isImg = (f) => /\.(jpe?g)$/i.test(f);
function pick(folder, n) {
  const dir = path.join(MEDIA, folder);
  if (!fs.existsSync(dir)) { console.warn('MISSING', folder); return []; }
  const files = fs.readdirSync(dir).filter(isImg).sort();
  if (!files.length) return [];
  // evenly spaced indices for variety (skip burst duplicates)
  const out = [];
  const step = Math.max(1, Math.floor(files.length / n));
  for (let i = 0; i < files.length && out.length < n; i += step) out.push(path.join(dir, files[i]));
  return out;
}

// topic-key -> [ [folder, count], ... ]  (mix countries for variety)
const PLAN = {
  'evangelism':       [['Uganda/Evangelism ', 3], ['South Sudan/Evangelism ', 3], ['Chad/Evangelism ', 2], ['Cameroon/Evangelism', 2]],
  'crusade':          [['Uganda/crusades', 3], ['Uganda/Evangelism /Crusades_', 2]],
  'street-outreach':  [['Uganda/Evangelism /Street Outreach', 2], ['South Sudan/Evangelism /Street Outreach', 2], ['Ethiopia/Street Evangelism', 2]],
  'baptism':          [['Uganda/Baptisms_', 3], ['South Sudan/Baptisms ', 2], ['Cameroon/Baptisms', 2]],
  'prayer':           [['Chad/House of Prayer', 3], ['Uganda/House of Prayer', 3], ['South Sudan/House of Prayer', 2]],
  'prayer-gathering': [['Chad/National Prayer Gathering', 3]],
  'pbs':              [['Uganda/Portable Bible School', 3], ['South Sudan/Portable Bible School', 3], ['Nigeria/PBS', 2], ['Kenya/PBS', 2]],
  'education':        [['Uganda/Education/Primary', 3], ['South Sudan/Education/Primary', 2], ['Uganda/Education/Secondary (Highschool)', 2]],
  'vlc':              [['Uganda/VLC', 2], ['Chad/VLC', 2]],
  'gift':             [['Uganda/GIFT/Boys', 2], ['South Sudan/GIFT/Girls', 1], ['South Sudan/GIFT/Boys', 1]],
  'medical':          [['South Sudan/Medical', 2], ['Uganda/Medical', 2]],
  'women':            [['Uganda/Women Empowerment', 3], ['Chad/Women Empowerment', 2], ['Cameroon/Women Empowerment', 1]],
  'agriculture':      [['Uganda/Wells', 2], ['Chad/Wells', 2], ['Chad/Agriculture', 2]],
  'church':           [['Uganda/Churches/Dedication', 3], ['Uganda/Churches/Construction ', 2], ['Chad/Churches/Construction', 2]],
  'radio':            [['South Sudan/Radio', 2], ['Uganda/Radio', 2]],
  'trauma':           [['South Sudan/Trauma Counseling', 2], ['Chad/Trauma Counceling', 2]],
  'bibles':           [['Uganda/Bibles', 2], ['Chad/Bibles', 1], ['South Sudan/Bibles', 1]],
  'jesus-film':       [['Chad/Jesus Film', 2], ['Uganda/Jesus Film', 2]],
  'missionaries':     [['Chad/Missionaries', 2], ['South Sudan/Missionaries', 2], ['Central Africa/Missionaries', 1]],
  'carole':           [['Chad/Carole', 2], ['South Sudan/Carole_', 1]],
  'terry':            [['South Sudan/Terry', 2], ['Uganda/Terry', 1]],
  'youth':            [['South Sudan/Destiny Youth', 2], ['Chad/destiny youth ', 2]],
  'villages':         [['Uganda/Villages', 3]],
  'us-staff':         [['U.S./Staff', 2], ['U.S./Events', 2], ['U.S./Headquarters', 1]],
  'vehicles':         [['Uganda/Vehicles/Motorcycles', 1], ['Chad/Vehicles/Van', 1]],
  'sports':           [['Uganda/Sports', 1], ['Chad/Sports', 1]],
  'prison':           [['Chad/prison ministry', 2]],
};

const manifest = [];
let idx = 0;
for (const [topic, sources] of Object.entries(PLAN)) {
  let n = 0;
  for (const [folder, count] of sources) {
    for (const src of pick(folder, count)) {
      const dest = path.join(OUT, `${topic}-${++n}.webp`);
      try {
        await sharp(src).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 }).toFile(dest);
        manifest.push({ topic, file: `/images/field-2026/${path.basename(dest)}`, src: path.relative(MEDIA, src) });
        idx++;
      } catch (e) { console.warn('FAIL', src, e.message); }
    }
  }
}
fs.writeFileSync(path.join(OUT, '_manifest.json'), JSON.stringify(manifest, null, 1));
console.log(`Processed ${idx} images into public/images/field-2026/`);
const byTopic = {};
manifest.forEach(m => (byTopic[m.topic] = (byTopic[m.topic] || 0) + 1));
console.log('By topic:', JSON.stringify(byTopic));

// Builds a HIGH-RESOLUTION field-photo library from ../Media/extracted/2026.
// Only sources whose longest side >= MIN_SRC are used (skips WhatsApp-compressed
// copies), gathered per topic across ALL countries. Output: public/images/field-2026.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const MEDIA = path.resolve('../Media/extracted/2026');
const OUT = path.resolve('public/images/field-2026');
const MIN_SRC = 1500;      // skip sources smaller than this on the long side
const OUT_MAX = 1700;      // output long-side cap
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const isImg = (f) => /\.(jpe?g)$/i.test(f);
async function candidates(folders) {
  const list = [];
  for (const fo of folders) {
    const dir = path.join(MEDIA, fo);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter(isImg)) {
      const p = path.join(dir, f);
      try { const m = await sharp(p).metadata(); const long = Math.max(m.width, m.height);
        if (long >= MIN_SRC) list.push({ p, long }); } catch {}
    }
  }
  // highest resolution first, then spread for variety
  list.sort((a, b) => b.long - a.long);
  return list;
}
function spread(arr, n) { // pick n items spread across the (res-sorted) array
  if (arr.length <= n) return arr;
  const out = []; const step = arr.length / n;
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * step)]);
  return out;
}

// topic -> { count, folders[] (across countries) }
const PLAN = {
  evangelism:       { n: 12, f: ['South Sudan/Evangelism ', 'Chad/Evangelism ', 'Cameroon/Evangelism', 'Nigeria/Evangelism', 'Central Africa/Evangelism', 'Niger/Evangelism'] },
  crusade:          { n: 5,  f: ['Uganda/crusades', 'Uganda/Evangelism /Crusades_', 'South Sudan/Evangelism /Crusades ', 'Chad/Evangelism /Crusades_'] },
  'street-outreach':{ n: 8,  f: ['South Sudan/Evangelism /Street Outreach', 'Uganda/Evangelism /Street Outreach', 'Chad/Evangelism /Street Outreach', 'Ethiopia/Street Evangelism'] },
  baptism:          { n: 9,  f: ['South Sudan/Baptisms ', 'Cameroon/Baptisms', 'Central Africa/Baptism', 'Democratic Republic of Congo/Baptism ', 'Congo/baptism', 'Nigeria/Baptism', 'Uganda/Baptisms_'] },
  prayer:           { n: 10, f: ['Chad/House of Prayer', 'Uganda/House of Prayer', 'South Sudan/House of Prayer', 'Nigeria/House of Prayer'] },
  'prayer-gathering':{ n: 3, f: ['Chad/National Prayer Gathering', 'Chad/Prayer Gathering'] },
  pbs:              { n: 12, f: ['Cameroon/PBS', 'Central Africa/PBS', 'Nigeria/PBS', 'Kenya/PBS', 'Ethiopia/PBS', 'Niger/PBS', 'South Sudan/Portable Bible School', 'Uganda/Portable Bible School', 'Democratic Republic of Congo/PBS'] },
  education:        { n: 9,  f: ['Uganda/Education/Primary', 'Uganda/Education/Secondary (Highschool)', 'South Sudan/Education/Primary', 'Chad/Education/Secondary'] },
  vlc:              { n: 5,  f: ['Uganda/VLC', 'Chad/VLC'] },
  gift:             { n: 5,  f: ['Uganda/GIFT/Boys', 'South Sudan/GIFT/Girls', 'South Sudan/GIFT/Boys', 'Chad/GIFT/Girls', 'Chad/GIFT/Boys'] },
  medical:          { n: 4,  f: ['South Sudan/Medical', 'Uganda/Medical'] },
  women:            { n: 4,  f: ['Uganda/Women Empowerment', 'Chad/Women Empowerment', 'Cameroon/Women Empowerment', 'South Sudan/Women Empowerment'] },
  agriculture:      { n: 4,  f: ['Chad/Agriculture', 'Uganda/Wells', 'Chad/Wells', 'Uganda/Agriculture_'] },
  church:           { n: 6,  f: ['Uganda/Churches/Dedication', 'Uganda/Churches/Construction ', 'Chad/Churches/Construction', 'Chad/Churches/Dedication', 'Cameroon/Church', 'South Sudan/Churches'] },
  radio:            { n: 4,  f: ['South Sudan/Radio', 'Uganda/Radio', 'Chad/Radio'] },
  bibles:           { n: 5,  f: ['Uganda/Bibles', 'Chad/Bibles', 'South Sudan/Bibles'] },
  'jesus-film':     { n: 3,  f: ['Chad/Jesus Film', 'Uganda/Jesus Film'] },
  missionaries:     { n: 5,  f: ['Chad/Missionaries', 'South Sudan/Missionaries', 'Central Africa/Missionaries', 'Ethiopia/Field Missionaries'] },
  carole:           { n: 4,  f: ['Chad/Carole', 'South Sudan/Carole_', 'Uganda/Carole_'] },
  terry:            { n: 3,  f: ['South Sudan/Terry', 'Uganda/Terry'] },
  villages:         { n: 4,  f: ['Uganda/Villages'] },
};

const manifest = [];
for (const [topic, { n, f }] of Object.entries(PLAN)) {
  const cands = await candidates(f);
  if (!cands.length) { console.warn('NO HI-RES for', topic); continue; }
  let chosen = spread(cands, n);
  const chosenSet = new Set(chosen.map(c => c.p));
  const backups = cands.filter(c => !chosenSet.has(c.p)); // for replacing corrupt files
  let i = 0, done = 0;
  for (const c0 of chosen) {
    let c = c0, ok = false;
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      const dest = path.join(OUT, `${topic}-${i + 1}.webp`);
      try {
        await sharp(c.p).rotate().resize({ width: OUT_MAX, height: OUT_MAX, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82 }).toFile(dest);
        ok = true; i++; done++;
        manifest.push({ topic, file: `/images/field-2026/${topic}-${i}.webp`, srcLong: c.long });
      } catch (e) {
        if (backups.length) c = backups.shift(); else break;
      }
    }
  }
  console.log(`${topic}: ${done} hi-res (of ${cands.length} candidates)`);
}
console.log(`Total: ${manifest.length} hi-res images.`);

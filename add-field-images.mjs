// ADDITIVE image build: adds hi-res images for topics needed by the new program
// sub-pages, continuing each topic's numbering. Never overwrites existing files.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const MEDIA = path.resolve('../Media/extracted/2026');
const OUT = path.resolve('public/images/field-2026');
const MIN_SRC = 1400, OUT_MAX = 1700;

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
  list.sort((a, b) => b.long - a.long);
  return list;
}
function nextIndex(topic) {
  let max = 0;
  for (const f of fs.readdirSync(OUT)) {
    const m = f.match(new RegExp(`^${topic}-(\\d+)\\.webp$`));
    if (m) max = Math.max(max, +m[1]);
  }
  return max + 1;
}

const ADD = {
  secondary:    { n: 3, f: ['Uganda/Education/Secondary (Highschool)', 'Chad/Education/Secondary'] },
  construction: { n: 3, f: ['Chad/Churches/Construction', 'Uganda/Churches/Construction '] },
  trauma:       { n: 3, f: ['Chad/Trauma Counceling', 'South Sudan/Trauma Counseling', 'Chad/Trauma Counseling '] },
  medical:      { n: 2, f: ['South Sudan/Medical', 'Uganda/Medical'] },
  vocation:     { n: 3, f: ['South Sudan/Destiny Youth', 'Chad/destiny youth ', 'Uganda/Sports'] },
  gift:         { n: 2, f: ['Chad/GIFT/Girls', 'Chad/GIFT/Boys', 'Uganda/GIFT/Boys'] },
};

for (const [topic, { n, f }] of Object.entries(ADD)) {
  const cands = await candidates(f);
  let i = nextIndex(topic), done = 0;
  for (const c of cands) {
    if (done >= n) break;
    const dest = path.join(OUT, `${topic}-${i}.webp`);
    try {
      await sharp(c.p).rotate().resize({ width: OUT_MAX, height: OUT_MAX, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 }).toFile(dest);
      i++; done++;
    } catch {}
  }
  console.log(`${topic}: +${done} (of ${cands.length} candidates)`);
}

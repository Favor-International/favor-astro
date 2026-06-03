// De-duplicates page photos: keeps the first use of each duplicated image and
// replaces every other use with a unique, topic-matched image from field-2026.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{const p=path.join(d,e.name);return e.isDirectory()?walk(p):p;});}
const files=walk('src/pages').concat(walk('src/components')).filter(f=>/\.astro$/.test(f));
const isPhoto=f=>/\.(jpg|jpeg|png|webp)$/i.test(f)&&!/\/patterns\/|\/trust\/|\/stories\/scraped\/|\/field-2026\/|favor-dove|favor-logo/.test(f);

// duplicated image (basename key) -> field-2026 topic
const TOPIC = {
  'hero-bibles-stacks.jpg':'bibles','hero-congo-grads.jpg':'education','hero-tot-bishoftu.jpg':'pbs',
  'ministry-gift-staff.jpg':'gift','hero-prayer-team.jpg':'prayer','hero-radio-broadcast.jpg':'radio',
  'hero-new-believers.jpg':'baptism','about-original-house.jpg':'carole','hero-about-overview.jpg':'villages',
  'about-leadership-training.jpg':'gift','hero-foundation-cohort.jpg':'pbs','evangelism-discipleship.jpg':'evangelism',
  'story-historic-prayer.jpg':'prayer','pbs-karamoja.jpg':'pbs','ministry-church-planting.jpg':'church',
  'highlight-crowd.jpg':'crusade','school-construction.jpg':'education','hero-pbs-students.jpg':'pbs',
  'hero-legacy-history.jpg':'carole','partner-with-us.jpg':'crusade','education-vlc-jondoru.jpg':'vlc',
  'goats-for-women.jpg':'women','gift-bishoftu-tot.jpg':'gift','hero-pbs-graduation.jpg':'education',
  'pillar-community.jpg':'medical','story-vision-trip-team.jpg':'missionaries','hero-jesusfilm-chad.webp':'jesus-film',
  'pillar-community-care.jpg':'medical','pillar-economic-empowerment.jpg':'agriculture','pillar-education.jpg':'education',
  'ministry-house-of-prayer.jpg':'prayer','story-anaka-crusade.jpg':'crusade','hero-pastor-preaching.jpg':'evangelism',
  'pillar-evangelism-discipleship.jpg':'evangelism','daniel-kidia.jpg':'missionaries','hero-newsletter-field.jpg':'street-outreach',
  'hero-prayer-ssudan.webp':'prayer',
};

// Build landscape pools per topic from field-2026 manifest
const manifest = JSON.parse(fs.readFileSync('public/images/field-2026/_manifest.json','utf8'));
const dims = {};
for (const m of manifest){ const md = await sharp('public'+m.file).metadata(); dims[m.file] = md.width/md.height; }
const used = new Set();
const pools = {};
for (const m of manifest){ (pools[m.topic]=pools[m.topic]||[]).push(m.file); }
// sort each pool: landscape first
for (const t in pools) pools[t].sort((a,b)=> (dims[b]>=1.3?1:0)-(dims[a]>=1.3?1:0));
const allLandscape = manifest.map(m=>m.file).filter(f=>dims[f]>=1.3);
function take(topic){
  const pool = pools[topic]||[];
  for (const f of pool){ if(!used.has(f)){ used.add(f); return f; } }
  for (const f of allLandscape){ if(!used.has(f)){ used.add(f); return f; } }
  for (const m of manifest){ if(!used.has(m.file)){ used.add(m.file); return m.file; } }
  throw new Error('out of images');
}

// occurrences in document order
const map={};
for(const f of files){const lines=fs.readFileSync(f,'utf8').split('\n');lines.forEach((ln,i)=>{(ln.match(/\/images\/[A-Za-z0-9\/_.-]+\.(jpg|jpeg|png|webp)/g)||[]).filter(isPhoto).forEach(m=>{(map[m]=map[m]||[]).push({file:f,line:i});});});}

const edits={}; // file -> [{line, old, new}]
let count=0;
for (const [img,locs] of Object.entries(map)){
  if (locs.length<2) continue;
  const base = img.split('/').slice(-1)[0];
  const topic = TOPIC[base] || TOPIC[img.replace('/images/','')] || 'evangelism';
  // keep locs[0], replace the rest
  for (let k=1;k<locs.length;k++){
    const nf = take(topic);
    (edits[locs[k].file]=edits[locs[k].file]||[]).push({line:locs[k].line, old:img, new:nf});
    count++;
  }
}

for (const [f,list] of Object.entries(edits)){
  const lines=fs.readFileSync(f,'utf8').split('\n');
  for (const e of list){
    if (!lines[e.line].includes(e.old)){ console.warn('SKIP (old not on line)',f,e.line,e.old); continue; }
    lines[e.line]=lines[e.line].replace(e.old, e.new);
  }
  fs.writeFileSync(f, lines.join('\n'));
}
console.log(`Replaced ${count} duplicate slots across ${Object.keys(edits).length} files. Used ${used.size} new images.`);

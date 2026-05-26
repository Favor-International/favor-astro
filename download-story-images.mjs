import { writeFile, mkdir } from 'node:fs/promises';

// Story slug -> Webflow CDN URL (from the existing favorintl.org homepage)
const stories = {
  'the-power-of-love':                    'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/66d214155ef36791c14a09ed_Bishoftu%20TOT.jpeg',
  'strongholds-collapse':                 'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/66c378cfea0ea1ce7f56d4a3_David%20%28cropped%29.jpeg',
  'healing-from-addictions':              'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/66bf7492023c221def73b8a6_Bismark.jpeg',
  'simons-and-angelos-stories':           'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/66aceeabdcedde26eb308630_Gift%20boy%20-%20June%202024.jpeg',
  'listening-in-prison':                  'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/669e68e7154378890c683570_IMG-20240703-WA0013.jpg',
  'rising-through-the-ranks':             'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/669e617b6ca05cbb5439bcec_IMG-20240625-WA0034.jpg',
  'student-on-a-mission':                 'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/669e5d41440a1c40a43b6db3_2c181f71-4129-4862-b98c-dc9419ebd3fa.jpg',
  'healing-and-harvest':                  'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/66903a4ca0064075bef43002_IMG-20240612-WA0016.jpg',
  'training-leaders-in-chad':             'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/6690370b0266cf35ff0184cc_IMG-20240617-WA0027.jpg',
  'restoring-the-home':                   'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/667d87bf7826b62bc8969ff4_restoring%20the%20home.jpg',
  'a-timely-word':                        'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/667d856d6b9fa4fc33fba351_IMG-20240515-WA0015.jpg',
  'what-next':                            'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/667d7fd80e223eab292d636a_IMG-20240521-WA0042.jpg',
  'deep-into-africa':                     'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/667d7c5f06b0ad83394d60f1_IMG-20240521-WA0048.jpg',
  'those-who-have-ears-to-hear':          'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/66709e754bc64375a7c55603_IMG-20240508-WA0024.jpg',
  'curing-the-snakebite':                 'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/6667b6014bc103afd91e05a4_Samtino.jpg',
  'the-fear-of-the-lord':                 'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/665927ae51d0202ca3ec52b5_IMG-20240429-WA0059.jpg',
  'praying-without-ceasing':              'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/665506897704cf517b8a2db8_Aweil%20woman.jpg',
  'wars-that-win-souls':                  'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/664b6a2c1265c282ad4c034b_IMG-20240420-WA0053.jpg',
  'members-of-parliament-find-forgiveness':'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/6643da5619b353e611b00bc1_IMG-20240415-WA0014.jpg',
  'restored-by-the-spirit':               'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/663d24c4f876f065a6b0c688_IMG-20240415-WA0005.jpg',
  'healing-streams':                      'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/66311c6dc3881f52130c4bf3_JUBA%20Radio%202020%20LR.jpg',
  'irreversible-transformation':          'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/66311943cb225b9b12b39f78_IMG-20240420-WA0061.jpg',
  'the-god-who-rescues-captives':         'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/6627cac7e72eb71401a9e08a_IMG-20240325-WA0030.jpg',
  'hope-through-the-night':               'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/661feee132701e8ab6e0c353_IMG-20240415-WA0019.jpg',
  'the-gospel-in-their-native-tongue':    'https://cdn.prod.website-files.com/62cda51656823c14ac1caf02/6616a1c2a808d3c92d0fbc2f_IMG-20240318-WA0013.jpg',
};

await mkdir('public/images/stories', { recursive: true });
let count = 0;
for (const [slug, url] of Object.entries(stories)) {
  try {
    const res = await fetch(url);
    if (!res.ok) { console.log('FAIL', slug, res.status); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(`public/images/stories/${slug}.jpg`, buf);
    count++;
    if (count % 5 === 0) console.log(count, 'downloaded...');
  } catch (e) { console.log('ERR', slug, e.message); }
}
console.log('Done:', count, 'of', Object.keys(stories).length);

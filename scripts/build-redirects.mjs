// Build public/_redirects for the favorintl.org cutover.
//
// Inputs: ~/old-urls.txt (the old Webflow sitemap, 638 URLs), the new route
// list from dist/, and src/data/stories.json for story-slug matching.
// Output: an explicit 301 for every old URL, structural wildcards for the
// tag/story trees, and a report of anything that had to fall back to a
// section page. The true catch-all for URLs we never knew about lives in
// functions/_middleware.ts (404 -> 301 /), because a `/*` rule in _redirects
// is evaluated BEFORE static assets and would take down the whole site.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const HOME = process.env.HOME || process.env.USERPROFILE;
const oldPaths = readFileSync(`${HOME}/old-urls.txt`, 'utf8')
  .trim().split('\n').filter(Boolean)
  .map((u) => u.replace('https://www.favorintl.org', '') || '/');

// Every real route on the new site.
function routes(dir = 'dist', acc = new Set()) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) routes(p, acc);
    else if (name === 'index.html') {
      const r = '/' + relative('dist', dir).split(sep).filter(Boolean).join('/');
      acc.add(r === '/' ? '/' : r + '/');
    }
  }
  return acc;
}
const NEW = routes();
const storySlugs = new Set(JSON.parse(readFileSync('src/data/stories.json', 'utf8')).map((s) => s.slug));

// Exact, hand-checked mappings for structural renames. Keys are old paths.
const MAP = {
  '/': '/',
  '/about': '/about/',
  '/about/ecfa-accountability': '/about/accountability/',
  '/about/documents': '/about/accountability/',
  '/about/directors': '/about/board/',
  '/about/mission-vision': '/about/mission-vision/',
  '/about/statement-of-faith': '/about/statement-of-faith/',
  '/about/our-story': '/about/our-story/',
  '/about/our-story/founder': '/about/our-story/founder/',
  '/about/our-story/where-we-work': '/about/where-we-work/',
  '/what-we-do': '/impact/',
  '/what-we-do/evangelism-discipleship': '/impact/evangelism-discipleship/',
  '/what-we-do/evangelism-discipleship/pbs': '/impact/evangelism-discipleship/portable-bible-schools/',
  '/what-we-do/evangelism-discipleship/gift': '/impact/evangelism-discipleship/gift-institute/',
  '/what-we-do/evangelism-discipleship/prayer': '/pray/',
  '/what-we-do/evangelism-discipleship/radio': '/impact/evangelism-discipleship/radio/',
  '/what-we-do/education': '/impact/education/',
  '/what-we-do/education/centers': '/impact/education/centers/',
  '/what-we-do/education/primary': '/impact/education/primary/',
  '/what-we-do/education/secondary': '/impact/education/secondary/',
  '/what-we-do/education/leadership': '/impact/education/leadership/',
  '/what-we-do/community-development': '/impact/community-development/',
  '/what-we-do/community-development/counseling': '/impact/community-development/counseling/',
  '/what-we-do/community-development/medical': '/impact/community-development/medical/',
  '/what-we-do/community-development/planting': '/impact/community-development/church-planting/',
  '/what-we-do/community-development/construction': '/impact/community-development/construction/',
  '/what-we-do/economic-empowerment': '/impact/economic-empowerment/',
  '/what-we-do/economic-empowerment/sustainability': '/impact/economic-empowerment/sustainability/',
  '/what-we-do/economic-empowerment/vocation': '/impact/economic-empowerment/vocation/',
  '/what-we-do/economic-empowerment/women': '/impact/economic-empowerment/women/',
  '/connect-support': '/give/',
  '/connect-support/donate-now': '/give/donate/',
  '/connect-support/volunteer-or-intern': '/go/volunteer/',
  '/connect-support/positions': '/go/careers/',
  '/connect-support/refer-connections': '/go/ambassadors/',
  '/current-projects': '/give/specific-project/',
  '/newsletter-sign-up': '/newsletter/',
  '/testimonies-updates': '/stories/',
  '/testimonies-updates/stories-of-transformation': '/stories/',
  '/testimonies-updates/impact-reports': '/about/accountability/',
  '/testimonies-updates/past-newsletters': '/newsletter/archive/',
  '/testimonies-updates/media': '/learn/',
  '/testimonies-updates/tag-search': '/stories/',
  '/books': '/books/',
  '/privacy': '/legal/privacy/',
  // Ranked page (carole ward missionary #1): her record page maps to the
  // founder story, her only page on the new site.
  '/directors/carole-ward': '/about/our-story/founder/',
};

const lines = [];
const fallbacks = [];
const seen = new Set();
const add = (from, to) => {
  if (seen.has(from) || from === to) return;
  seen.add(from);
  lines.push(`${from} ${to} 301`);
};

for (const p of oldPaths) {
  if (MAP[p]) { add(p, MAP[p]); continue; }
  // Already exists on the new site (same path, trailing slash added)?
  if (NEW.has(p.endsWith('/') ? p : p + '/')) { add(p, (p.endsWith('/') ? p : p + '/')); continue; }

  const seg = p.split('/').filter(Boolean);
  // Story pages: /testimonies-updates/transformation-stories/<slug> and any
  // /testimonies-updates/<collection>/<slug>.
  if (seg[0] === 'testimonies-updates' && seg.length >= 3) {
    // Impact-report pages live with the report PDFs on the accountability page.
    if (seg[1] === 'impact-reports') { add(p, '/about/accountability/'); continue; }
    const slug = seg[seg.length - 1];
    if (storySlugs.has(slug)) { add(p, `/stories/${slug}/`); continue; }
    fallbacks.push(p + '  ->  /stories/');
    add(p, '/stories/');
    continue;
  }
  // Board/staff profile pages.
  if (seg[0] === 'directors' && seg.length === 2) {
    const candidate = `/about/people/${seg[1]}/`;
    if (NEW.has(candidate)) { add(p, candidate); continue; }
    fallbacks.push(p + '  ->  /about/board/');
    add(p, '/about/board/');
    continue;
  }
  if (seg[0] === "positions") { add(p, "/go/careers/"); continue; }
  // 306 old newsletter posts; the new site keeps them as the archive.
  if (seg[0] === "newsletters") { add(p, "/newsletter/archive/"); continue; }
  if (seg[0] === "newsletter-theme-tags") { add(p, "/newsletter/archive/"); continue; }
  // Story-taxonomy listings of every flavor.
  if (/^(all-regular-tags|v2-ministry-tags|demographic-tags|topic-tags|sub-ministry-tags|location-tags|format-tags|tags)$/.test(seg[0])) { add(p, "/stories/"); continue; }
  // Webflow ecommerce leftovers; the books page is where buying happens now.
  if (seg[0] === "carts") { add(p, "/books/"); continue; }
  if (seg[0] === "current-projects") { add(p, "/give/specific-project/"); continue; }
  // Tag listing pages: nothing equivalent; the stories index is the honest home.
  if (seg[0] === 'all-regular-tags') { add(p, '/stories/'); continue; }
  // Everything else known-but-unmapped: homepage, recorded for review.
  fallbacks.push(p + '  ->  /');
  add(p, '/');
}

// Webflow's own 301 list (Daniel, 2026-08-07): vanity/campaign shortlinks
// (printed in newsletters and mailers) pointing mostly at Blackbaud donor
// forms and other external destinations. These never appeared in the sitemap,
// so the crawl could not find them.
//
// HARD LESSON (2026-08-08): rules with EXTERNAL targets count against
// Cloudflare Pages' 100-dynamic-rule cap, and once the parser hits the cap it
// silently drops every remaining line of the file, wildcards included. That
// is what took down the tag/newsletter wildcards and Daniel's test links. So
// external-target shortlinks do NOT go into _redirects at all: they are
// written to functions/_lib/vanity-map.json and served by the middleware,
// which also gets them case-insensitive and trailing-slash tolerant.
// Internal-target rows stay here as ordinary static rules.
const vanityCsv = readFileSync('docs/06-reference/webflow-vanity-redirects-2026-05-14.csv', 'utf8')
  .replace(/\r\n/g, '\n').trim().split('\n').slice(1);
const vanityMap = {};
let vanityStatic = 0;
let vanitySkipped = 0;
for (const line of vanityCsv) {
  const i = line.indexOf(',');
  if (i < 1) continue;
  const source = line.slice(0, i).trim();
  let target = line.slice(i + 1).trim();
  if (!source.startsWith('/')) continue;
  // One export row lost its punctuation; rebuild the donor-form URL.
  if (target.startsWith('httpshost.nxt.blackbaud.comdonor-form')) {
    target = target.replace('httpshost.nxt.blackbaud.comdonor-form', 'https://host.nxt.blackbaud.com/donor-form?');
  }
  const normalized = source.endsWith('/') ? source : source + '/';
  if (NEW.has(normalized)) { vanitySkipped++; continue; }
  if (target.startsWith('/')) {
    // Internal target: send it where that old path lives on the new site,
    // and keep it in _redirects (static rules are effectively unlimited).
    if (MAP[target]) target = MAP[target];
    else if (NEW.has(target.endsWith('/') ? target : target + '/')) target = target.endsWith('/') ? target : target + '/';
    add(source, target);
    vanityStatic++;
  } else {
    // External target: middleware map, keyed lowercase without trailing slash.
    vanityMap[source.toLowerCase().replace(/\/+$/, '')] = target;
  }
}
writeFileSync('functions/_lib/vanity-map.json', JSON.stringify(vanityMap, null, 1) + '\n');
console.log(`vanity shortlinks: ${Object.keys(vanityMap).length} external -> middleware map, ${vanityStatic} internal -> _redirects, ${vanitySkipped} skipped (route collisions)`);

// Wildcards LAST (Pages evaluates top-to-bottom; explicit rules above win)
// to catch old URLs that were not in the sitemap but follow its structure.
lines.push("/newsletters/* /newsletter/archive/ 301");
lines.push("/newsletter-theme-tags/* /newsletter/archive/ 301");
lines.push("/v2-ministry-tags/* /stories/ 301");
lines.push("/demographic-tags/* /stories/ 301");
lines.push("/topic-tags/* /stories/ 301");
lines.push("/sub-ministry-tags/* /stories/ 301");
lines.push("/location-tags/* /stories/ 301");
lines.push("/format-tags/* /stories/ 301");
lines.push("/carts/* /books/ 301");
lines.push("/current-projects/* /give/specific-project/ 301");
lines.push("/all-regular-tags/* /stories/ 301");
lines.push('/testimonies-updates/* /stories/ 301');
lines.push('/what-we-do/* /impact/ 301');
lines.push('/connect-support/* /give/ 301');
lines.push('/directors/* /about/board/ 301');
lines.push('/positions/* /go/careers/ 301');

// NOTE: www -> apex cannot live here. Pages rejects absolute-URL sources
// ("Only relative URLs are allowed", seen in the build log). It is a
// Cloudflare zone Redirect Rule instead; see the cutover steps in
// docs/migration-cutover-2026-08-06.md.
lines.unshift("/watch/ /learn/ 301");
lines.unshift("/watch /learn/ 301");
lines.unshift("/sitemap.xml /sitemap-index.xml 301");

const header = `# 301 map for the favorintl.org cutover (generated 2026-08-06 by
# scripts/build-redirects.mjs from the old Webflow sitemap, 638 URLs).
# Explicit rules first, structural wildcards last. The catch-all for URLs
# not listed here is functions/_middleware.ts (404 -> 301 to /), because a
# /* rule here runs before static assets and would break the live site.
`;
writeFileSync('public/_redirects', header + lines.join('\n') + '\n');
console.log(`rules written: ${lines.length}`);
console.log(`fallback-to-section (review these): ${fallbacks.length}`);
fallbacks.slice(0, 30).forEach((f) => console.log('  ' + f));
if (fallbacks.length > 30) console.log(`  ...and ${fallbacks.length - 30} more`);

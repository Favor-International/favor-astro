// Mobile audit across every built page.
//
// Loads each route at a phone viewport and reports the things that actually
// make a site feel broken on a phone:
//   overflow      the page scrolls sideways, and what is sticking out
//   tap-target    interactive elements under 44x44 (Apple's minimum)
//   tiny-text     body copy under 12px
//   overlap       a fixed header covering the first heading
//   img-overflow  an image wider than the screen
//   hscroll-el    an element with its own unintended horizontal scrollbar
//
// Usage: node scripts/mobile-audit.mjs [baseUrl] [--width=390]
import { chromium, devices } from 'playwright';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const BASE = process.argv[2] || 'http://localhost:4342';
const WIDTH = Number((process.argv.find((a) => a.startsWith('--width=')) || '').split('=')[1]) || 390;

// Every built route, from dist.
function routes(dir = 'dist', acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) routes(p, acc);
    else if (name === 'index.html') {
      const r = '/' + relative('dist', dir).split(sep).filter(Boolean).join('/');
      acc.push(r === '/' ? '/' : r + '/');
    }
  }
  return acc;
}

const audit = async (page) =>
  page.evaluate(() => {
    const de = document.documentElement;
    const vw = de.clientWidth;
    const issues = [];
    const desc = (el) => {
      const c = String(el.className || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
      return el.tagName.toLowerCase() + (c ? '.' + c : '') + (el.id ? '#' + el.id : '');
    };
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      // Skip links sit at left:-9999px until focused; they are not on screen.
      if (r.right < 0 || r.left > vw + 2000) return false;
      const cs = getComputedStyle(el);
      return cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
    };

    // 1. sideways scroll + culprits
    if (de.scrollWidth > vw + 1) {
      const out = [...document.querySelectorAll('body *')]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return visible(el) && (r.right > vw + 1 || r.left < -1);
        })
        // only report the outermost offenders
        .filter((el) => {
          const p = el.parentElement;
          if (!p || p === document.body) return true;
          const pr = p.getBoundingClientRect();
          return !(pr.right > vw + 1 || pr.left < -1);
        })
        .slice(0, 4)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return `${desc(el)} (right=${Math.round(r.right)}, w=${Math.round(r.width)})`;
        });
      issues.push({ type: 'overflow', detail: `page ${de.scrollWidth}px vs ${vw}px viewport`, els: out });
    }

    // 2. tap targets
    const small = [...document.querySelectorAll('a, button, input:not([type=hidden]), select, textarea, summary, [role=button]')]
      .filter(visible)
      .filter((el) => {
        const r = el.getBoundingClientRect();
        // Ignore links inside a run of prose; those are not tap targets on their own.
        const inProse = el.tagName === 'A' && el.closest('p, li');
        return !inProse && (r.height < 44 || r.width < 24);
      })
      .slice(0, 6)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return `${desc(el)} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || '').trim().slice(0, 22)}"`;
      });
    if (small.length) issues.push({ type: 'tap-target', detail: `${small.length} under 44px tall`, els: small });

    // 3. tiny text
    const tiny = [...document.querySelectorAll('p, li, span, small, td, label, a')]
      .filter(visible)
      .filter((el) => el.textContent && el.textContent.trim().length > 12)
      .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 12)
      .slice(0, 4)
      .map((el) => `${desc(el)} ${getComputedStyle(el).fontSize} "${el.textContent.trim().slice(0, 26)}"`);
    if (tiny.length) issues.push({ type: 'tiny-text', detail: `${tiny.length} under 12px`, els: tiny });

    // 4. images wider than the screen
    const imgs = [...document.querySelectorAll('img')]
      .filter(visible)
      .filter((el) => el.getBoundingClientRect().width > vw + 1)
      .slice(0, 3)
      .map((el) => `${desc(el)} ${Math.round(el.getBoundingClientRect().width)}px`);
    if (imgs.length) issues.push({ type: 'img-overflow', detail: `${imgs.length} images`, els: imgs });

    // 5. elements with their own stray horizontal scrollbar
    const hs = [...document.querySelectorAll('body *')]
      .filter(visible)
      // SVG text has no CSS box, so scrollWidth/clientWidth is meaningless.
      .filter((el) => !(el.ownerSVGElement || el.tagName === 'svg'))
      .filter((el) => {
        const cs = getComputedStyle(el);
        const scrolls = cs.overflowX === 'auto' || cs.overflowX === 'scroll';
        return el.scrollWidth > el.clientWidth + 2 && !scrolls && cs.overflowX !== 'hidden' && cs.overflowX !== 'clip';
      })
      .slice(0, 3)
      .map((el) => `${desc(el)} content ${el.scrollWidth} > box ${el.clientWidth}`);
    if (hs.length) issues.push({ type: 'hscroll-el', detail: `${hs.length} clipped`, els: hs });

    // 6. header covering the first heading
    const header = document.querySelector('header, .site-header');
    const h1 = document.querySelector('main h1, h1');
    if (header && h1 && getComputedStyle(header).position === 'fixed') {
      const hr = header.getBoundingClientRect(), tr = h1.getBoundingClientRect();
      if (tr.top < hr.bottom && tr.bottom > hr.top) {
        issues.push({ type: 'overlap', detail: `header covers h1 (h1 top ${Math.round(tr.top)} < header bottom ${Math.round(hr.bottom)})`, els: [] });
      }
    }
    return issues;
  });

const all = routes().sort();
console.log(`Auditing ${all.length} routes at ${WIDTH}px\n`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 12 Pro'], viewport: { width: WIDTH, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.on('pageerror', () => {});

const report = [];
let n = 0;
for (const r of all) {
  n++;
  try {
    await page.goto(BASE + r, { waitUntil: 'networkidle', timeout: 25000 });
  } catch {
    try { await page.goto(BASE + r, { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch { report.push({ route: r, issues: [{ type: 'load-failed', detail: 'timeout', els: [] }] }); continue; }
  }
  await page.waitForTimeout(220);
  const issues = await audit(page);
  if (issues.length) report.push({ route: r, issues });
  if (n % 25 === 0) console.log(`  ...${n}/${all.length}`);
}
await browser.close();

// ---- output ----
const byType = {};
for (const { route, issues } of report)
  for (const i of issues) (byType[i.type] ||= []).push({ route, ...i });

console.log(`\n${'='.repeat(62)}\nSUMMARY  (${report.length} of ${all.length} routes have findings)\n${'='.repeat(62)}`);
for (const [t, list] of Object.entries(byType).sort((a, b) => b[1].length - a[1].length))
  console.log(`  ${t.padEnd(14)} ${String(list.length).padStart(3)} routes`);

for (const [t, list] of Object.entries(byType).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n${'-'.repeat(62)}\n${t.toUpperCase()}  (${list.length})\n${'-'.repeat(62)}`);
  for (const i of list.slice(0, 14)) {
    console.log(`  ${i.route}\n     ${i.detail}`);
    for (const e of i.els) console.log(`       - ${e}`);
  }
  if (list.length > 14) console.log(`  ...and ${list.length - 14} more routes`);
}
writeFileSync('mobile-audit.json', JSON.stringify(report, null, 1));
console.log('\nfull report -> mobile-audit.json');

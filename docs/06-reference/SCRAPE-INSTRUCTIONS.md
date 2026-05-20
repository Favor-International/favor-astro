# Scrape Playbook (For Claude Code)

This is your script. Run it. Do not ask Will what to scrape, where to
put files, or how to classify. Everything you need is here.

## Stack

- **Playwright** for browser automation. Headless Chromium.
- **wget** as a fallback for raw HTML capture and bulk PDF download.
- **Sharp** for image inspection.

If Playwright is missing:

```bash
npm install -D playwright
npx playwright install chromium
```

## Output structure (create this first)

```
favorintl-rebuild/06-reference/existing-site-scrape/
├── pages/               # one .md per scraped page
├── images/
│   ├── field-photo/
│   ├── team-photo/
│   ├── headshot/
│   ├── logo/
│   ├── stock/
│   └── irrelevant/
├── pdfs/                # PDFs downloaded
├── reviews/             # GBP reviews as JSON + photos
├── raw-html/            # original HTML for fallback parsing
├── urls.csv             # url, classification, new_target, priority
└── scrape-summary.md
```

```bash
mkdir -p favorintl-rebuild/06-reference/existing-site-scrape/{pages,images/{field-photo,team-photo,headshot,logo,stock,irrelevant,_unsorted},pdfs,reviews/photos,raw-html}
```

## Step 1 — Crawl favorintl.org

Targets:

- Start: `https://favorintl.org/`
- Same-domain only.
- Depth limit: 5.
- Respect robots.txt.
- User-Agent: `Mozilla/5.0 (compatible; FavorIntlRebuildBot/1.0)`

Write a Playwright script `scripts/scrape.mjs` in your build sandbox
(not in the prep folder). For each page:

1. `page.goto(url, { waitUntil: 'networkidle' })`
2. `const html = await page.content()` then save raw to
   `raw-html/<slugified-url>.html`
3. Extract:
   - `<title>` to `title`
   - First `<h1>` to `h1`
   - Visible main content (skip `<nav>`, `<header>`, `<footer>` and
     common class names like `.site-header`, `.menu`)
   - All `<a href>` values, classified internal or external
   - All `<img src>` values with their `alt`
   - All `<a href>` ending in `.pdf` or `.doc`
4. Convert content to markdown with `turndown`.
5. Save to `pages/<slug>.md` with the frontmatter shown in
   START-HERE.md Phase 1.

## Step 2 — Download images

For every `<img src>` collected:

```js
const response = await fetch(imageUrl);
const buffer = await response.arrayBuffer();
fs.writeFileSync(localPath, Buffer.from(buffer));
```

Land them in `images/_unsorted/` first. Classify in Step 3.

## Step 3 — Classify images

For each image in `_unsorted/`:

1. Use Sharp to read dimensions. Anything under 64px on either side
   goes straight to `irrelevant/`.
2. For the rest, view each image and classify into:
   - `field-photo` — African people, churches, villages, pastors
     teaching, baptisms, real ministry contexts
   - `team-photo` — multiple staff or board members
   - `headshot` — single-person professional portrait
   - `logo` — Favor logo or partner logos
   - `stock` — generic stock library look (Western adults posing,
     generic globe shots, business handshakes)
   - `irrelevant` — UI chrome, icons, decorative, trackers
3. Move and rename:
   `<source-page-slug>-<index>-<3-word-description>.<ext>`

When ambiguous between `field-photo` and `stock`, flag it in
`urls.csv` for Will to review rather than guess.

## Step 4 — Download PDFs

For every `.pdf` link found:

```bash
wget -P favorintl-rebuild/06-reference/existing-site-scrape/pdfs/ <url>
```

Note in `urls.csv` whether each PDF is `keep`, `archive`, or `drop`.

## Step 5 — Google Business Profile

Search Google for `"Favor International" Valrico Florida` and capture
the knowledge panel.

If Google's UI fights you, fall back to the `places_search` tool. The
environment has Google Places wired up. Pull:

- Star rating, review count
- Business name, address, phone, website, hours
- Top 20 reviews (name, stars, date, text)
- Up to 30 featured photos

Save:

```
reviews/gbp-summary.json
reviews/reviews.json
reviews/photos/
```

## Step 6 — Build urls.csv

```csv
original_url,title,classification,new_target,redirect_priority,notes
https://favorintl.org/,Home,rewrite,/,high,
https://favorintl.org/about/,About Us,rewrite,/about/,high,
https://favorintl.org/old-event/,Spring Gala,drop,/about/,low,outdated
```

Classification:
- `keep` — minor cleanup only
- `rewrite` — voice needs revision
- `drop` — dead weight

`redirect_priority`:
- `high` — referenced from nav, > 3 inbound links, or > 2 years old
- `medium` — 1-3 inbound links
- `low` — orphaned

## Step 7 — Destiny Rescue reference scrape

```js
for (const viewport of [375, 768, 1440]) {
  for (const url of [
    'https://destinyrescue.org/',
    'https://destinyrescue.org/donate/',
  ]) {
    await page.setViewportSize({ width: viewport, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.screenshot({
      path: `destiny-rescue-screenshots/${slug(url)}-${viewport}.png`,
      fullPage: true,
    });
  }
}
```

Write `destiny-rescue-screenshots/destiny-rescue-analysis.md` with:

- Band-by-band breakdown of the homepage.
- Hero treatment: photo vs video, overlay opacity, scrim direction.
- Monthly giving moment: placement, copy framing, suggested amounts.
- Footer: density, trust marks, social link placement.
- Typography: fonts loaded, weights, heading sizes (from devtools).
- Color tokens: hex values from devtools.

Save under `favorintl-rebuild/06-reference/destiny-rescue-screenshots/`.

## Step 8 — Scrape summary

Write `scrape-summary.md`:

```markdown
# Favor International Scrape Summary

**Scraped:** 2026-MM-DD
**Tool:** Playwright + Chromium
**Total pages:** N
**Total images:** N (field: N, team: N, headshot: N, logo: N,
stock: N, irrelevant: N)
**Total PDFs:** N
**GBP reviews:** N (avg X.X stars)

## High-priority migration content
1. ...

## Top 10 field photos for hero / band use
1. ...

## Gaps
- 404s in nav: ...
- Broken images: ...

## Redirect plan
- High-priority: N
- Medium: N
- Low: N

## Flags for Will's review
- Ambiguous images: ...
- People needing permission to republish: ...
- Sensitive content: ...
```

## Rate limits

- 1 request per second to favorintl.org.
- 1 concurrent request.
- 429 or 503: back off 30s, retry once.
- Same rules for Destiny Rescue.

## When done

Report Will the summary doc inline (don't make him open the file).
Wait for his go-ahead before Phase 2.

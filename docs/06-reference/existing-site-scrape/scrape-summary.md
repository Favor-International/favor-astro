# Favor International Scrape Summary

**Scraped:** 2026-05-19T17:45:21.551Z
**Tool:** Playwright + Chromium (Chromium 1223), Turndown
**Source:** https://www.favorintl.org sitemap.xml (636 URLs) reduced to **68 core content URLs** by filtering out tag-archive pages, individual newsletters (299 are in the Webflow CSV export), and individual transformation-story pages (134 are in the Webflow CSV export).

## Totals

| Asset | Count |
|-------|-------|
| Pages scraped | 68 |
| Pages with HTTP 200 | 68 |
| Pages with errors / non-200 | 0 |
| Unique images discovered | 461 |
| Images downloaded | 461 |
| Images classified | 461 |
| - field-photo | 421 |
| - team-photo | 21 |
| - headshot | 8 |
| - logo | 1 |
| - stock | 2 |
| - irrelevant | 8 |
| Images still _unsorted | 0 |
| PDFs downloaded | 34 |
| Unique external links referenced | 169 |
| URLs in urls.csv | 292 |

## Coverage approach

This scrape **does not** re-pull individual story or newsletter pages, because the
Webflow exports under `Webflow files/` already contain:

- `CMS Collections/Stories.csv` (265 transformation stories, full body HTML)
- `CMS Collections/Newsletters (name, image, & link).csv` (newsletters with hosted PDFs)
- `CMS Collections/Directors.csv` (12 director/board profiles with bios)
- `CMS Collections/Current Projects.csv` (5 active projects with budgets and updates)
- `CMS Collections/Impact Reports (name, image, & link).csv` (annual + quarterly reports)
- `CMS Collections/Positions.csv`
- `CMS Collections/Cart items.csv`
- `Favorintl.org 301 redirects (as of 2026-05-14).csv` (224 redirects already on file)

The Phase 3 content migration should source those CMS items from the CSVs, not from
re-scraping each page.

## Top 10 pages by importance heuristic (depth + inbound links)

1. **Transformed Hearts
Transform Nations** — https://www.favorintl.org (inbound: 66, depth: 0, images: 42)
2. **About Favor** — https://www.favorintl.org/about (inbound: 66, depth: 1, images: 38)
3. **Contact Us** — https://www.favorintl.org/connect-support (inbound: 65, depth: 1, images: 31)
4. **Current Projects** — https://www.favorintl.org/current-projects (inbound: 65, depth: 1, images: 41)
5. **Testimonies & Updates** — https://www.favorintl.org/testimonies-updates (inbound: 65, depth: 1, images: 12)
6. **What We Do** — https://www.favorintl.org/what-we-do (inbound: 65, depth: 1, images: 31)
7. **Privacy** — https://www.favorintl.org/privacy (inbound: 62, depth: 1, images: 33)
8. **books** — https://www.favorintl.org/books (inbound: 0, depth: 1, images: 7)
9. **Carts** — https://www.favorintl.org/carts (inbound: 0, depth: 1, images: 3)
10. **Intro Flyer** — https://www.favorintl.org/intro-flyer (inbound: 0, depth: 1, images: 23)

## Top 10 field photos by file size (likely hero candidates)

1. `intro-flyer-0131-648c87144434b314d4509e80_Carole_20page_20cover_20photo.jpg` (3729KB)
2. `about__our-story-0078-65a72d92e15deb1fb91328e6_Carole_20Carrying_20little_20girl.jpg` (3210KB)
3. `testimonies-updates__past-newsletters-0156-69a1a22b66d4e60f649ef4c1_IMG_1117.JPG.jpg` (3191KB)
4. `what-we-do__education-0391-64fa0e534b5d9b8cc4507058_Jondoru_20VLC_20in_20South_20Sudan_201.jpg` (3019KB)
5. `testimonies-updates__past-newsletters-0165-695c0c2f9f5423e4876ad814_Screenshot_202026-01-05_20at_202.08.22_E2_80_AFPM.png` (2892KB)
6. `testimonies-updates__past-newsletters-0177-695c05944ee10a7152ef6e98_Screenshot_202026-01-05_20at_201.40.13_E2_80_AFPM.png` (2738KB)
7. `what-we-do__evangelism-discipleship__radio-0455-62f3edbc6d43f236d81b0df9_radio_206.png` (2708KB)
8. `testimonies-updates__past-newsletters-0164-695c0caeebe8ea7037dc5af7_Screenshot_202026-01-05_20at_202.10.29_E2_80_AFPM.png` (2680KB)
9. `testimonies-updates__media-0146-62f537c0764027aa1c08492b_fm_202.png` (2545KB)
10. `testimonies-updates__media-0147-62f537d5f4cfc43851ecbc5b_fm_203.png` (2520KB)

## Failures and gaps

- None. Every scraped URL returned HTTP 200.

**Other notes:**

- The homepage carries inline cookie-consent banner copy that the scraped markdown includes. Phase 3 must strip this before migration.
- DAF Direct and TrustBridge donation links live on the homepage. These are third-party donation routes (TrustBridge for international, DAF Direct for donor-advised funds) and should map to `/give/non-cash/` and `/give/international/` on the rebuild.
- 18 transformation-story pages are linked from the homepage. The Webflow Stories.csv export covers these; no story-level scrape was needed.
- The "tag-search" page is the only place tag-archive pages are referenced; the rebuild drops the entire tag system in favor of Pagefind search.
- Several legacy `/connect-support/positions/*` pages are job listings; the rebuild can drop these or fold into `/about/contact/` until a positions feature is re-added.

## Google Business Profile

- **Status:** No GBP listing found.
- **Verified address:** 3433 Lithia Pinecrest Rd #356, Valrico, FL 33596
- **Phone:** 941-444-9940
- **Hours:** 9am-5pm EST, Monday-Friday
- **Note:** Google Maps does not return a Google Business Profile for Favor International. The Valrico FL address (3433 Lithia Pinecrest Rd #356, Valrico, FL 33596) is a mail-suite (the '#356' indicates a private mailbox / UPS Store style address), not a physical retail or visit-by-the-public location. Nonprofits operating from PMB addresses commonly do not have a Google Business Profile. The closest-named result was 'Favor Church' in Wesley Chapel, FL (33383 CR 54), which is an unrelated church.
- **Recommendation:** Do not list a physical address in nav or hero. Use the Bradenton secondary office or a PO-box footer treatment. If GBP is desired for SEO, claim or create one at the Bradenton office. Flag for Will.

## Redirect plan

URLs in `urls.csv` are classified by Phase-3 disposition (`keep`, `rewrite`, `drop`)
and by SEO redirect priority (`high`, `medium`, `low`).

| Priority | Count |
|----------|-------|
| high     | 27 |
| medium   | 260 |
| low      | 5 |

| Classification | Count |
|----------------|-------|
| keep    | 22 |
| rewrite | 42 |
| drop    | 228 |

The Webflow 301 redirects file (`Webflow files/Favorintl.org 301 redirects (as of 2026-05-14).csv`)
contributes an additional **224** legacy paths already redirected externally to
Blackbaud and TrustBridge. The new `_redirects` file in `build/` must absorb
both lists: the existing 224 plus the new mappings we generate from this scrape.

## Five most useful pages of content to migrate

1. **Homepage** (`/`) — Existing tagline "Transformed Hearts Transform Nations" is already on-brand. 2025 highlights (195,773 saved / 119,182 discipled) are usable as Band 5 stat tiles after we re-source them in the Phase-3 voice rewrite.
2. **About / Mission & Vision** (`/about/mission-vision`) — Direct, theologically grounded copy that maps cleanly to the new `/about/` page. Needs DEI vocabulary check.
3. **About / Our Story / Founder** (`/about/our-story/founder`) — Carole's bio. Will become `/about/history/` content. Per the sitemap she stays off the homepage.
4. **About / Where We Work** (`/about/our-story/where-we-work`) — Country-by-country breakdown of the 14 nations. This is the spine of the new `/impact/` hub.
5. **What We Do / Evangelism & Discipleship / PBS** (`/what-we-do/evangelism-discipleship/pbs`) — Portable Bible Schools is the flagship program and the obvious lead pillar candidate for Q4.

## Five most useful images to feature

These five were spot-checked against the brand book photography rules
(indigenous African leaders, real ministry, no white-savior framing, no
manipulative pity portraits). All five are real field photography in
appropriate context.

1. **`images/field-photo/what-we-do__evangelism-discipleship__pbs-0439-65b42d9c3fe547ce3ef46da7_Congo_20Graduating_20PBS_20Class.jpg`** — Wide shot of dozens of South Sudanese / Congolese women holding PBS graduation certificates in front of a half-built church. Strong group composition, outdoor light, real outcome. **Lead hero candidate for Band 1 on `/` and for `/impact/[pillar-1]/portable-bible-schools/`.**
2. **`images/field-photo/what-we-do__evangelism-discipleship__pbs-0438-64f9e66cfbeec47959808c78_PBS_20graduation_20in_20Karamoja.jpg`** — Karamoja PBS graduation under a tree, certificates held overhead. Wide environmental framing showing the place, not just the people. Use as the PBS pillar page hero or as Band 4 story card.
3. **`images/field-photo/what-we-do__education-0391-64fa0e534b5d9b8cc4507058_Jondoru_20VLC_20in_20South_20Sudan_201.jpg`** — South Sudanese children in blue plastic chairs in a village learning center. Honest, present-tense, classroom scene. Use for `/impact/[pillar-2]/` (Education) and the homepage Band 3 pillar tile.
4. **`images/field-photo/home-0016-66d214155ef36791c14a09ed_Bishoftu_20TOT.jpeg`** — Training of Trainers session in Bishoftu, Ethiopia. Indigenous teacher leading a room of African pastors at flip chart. Shows the equipping-leaders-to-equip-leaders model. Use for `/impact/[pillar-1]/gift-institute/` and as a Band 5 supporting image.
5. **`images/field-photo/home-0011-6578d58132c3d7ccc379d1ad_Evangelism_20_26_20Discipleship.jpg`** — Indigenous pastor laying hands on a child surrounded by other village children. Real worship / blessing scene, not a Western-savior framing. Already the Webflow site's Evangelism & Discipleship banner. Carries over cleanly.

**Honorable mentions to evaluate** (the heuristic classifier put large Carole-and-child photos at the top by file size; per brand book those are *not* hero candidates because they read as white-savior framing):

- `intro-flyer-0131-...Carole_20page_20cover_20photo.jpg` — keep for `/about/history/` only, not homepage.
- `about__our-story-0078-...Carole_20Carrying_20little_20girl.jpg` — **do not use.** White-savior composition.
- All `testimonies-updates__past-newsletters-*` PNG screenshots are scans of past newsletter pages; treat as `irrelevant` for hero use and migrate the underlying newsletter PDFs separately.

> Will should still spot-check `images/field-photo/` before Phase 3 migration.
> The classifier ran on source-page heuristics, not on pixels, so a few of the
> 421 field-photo files are likely better placed in `team-photo/` or `stock/`.

## Flags for Will's review

- **No GBP listing.** Decide whether to claim/create one at the Bradenton office, or omit GBP from SEO strategy.
- **Pillar names (Q4) still open.** The urls.csv writes `[pillar-1]`..`[pillar-4]` placeholders for the IMPACT routes. Once the four pillars are confirmed, regenerate urls.csv.
- **Webflow Ecommerce (`/carts`, `/books`) is being decommissioned.** Rebuild plans Stripe Shop instead. Decision: do we 301 `/carts` to `/shop/` or drop?
- **`prayer@favorintl.org` exists as a published address.** The new Pray section should surface it.
- **TrustBridge and DAF Direct integrations** carry production donation routes that the new Give hub must preserve through redirects, even before the Blackbaud direct integration in Phase 6.
- **Privacy policy is a hosted PDF, not a page.** The rebuild should publish HTML at `/legal/privacy/` and 301 the PDF too.

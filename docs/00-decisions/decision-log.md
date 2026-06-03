# Decision Log

Append-only record of every meaningful project decision. Newest at the
top. Every entry must include date, decision, reason, and consequences.

When you (Claude) make a deviation from an earlier decision, log it
here before the deviation ships.

---

## 2026-06-02 — Give methods: real forms added, fabrications fixed (Daniel-approved)

**Decision:** Ported the genuinely-missing give content and corrected fabricated
specifics on the give pages, per Daniel's "add real + fix fabrications" approval.
Sourced verbatim from favorintl.org/connect-support/donate-now.
**Added (real):** the Give By Stock PDF (Stock and Non-Cash Assets Transfer Form)
on `non-cash.astro` + `one-time.astro`; the Give A Legacy PDF (Legacy Circle
Membership Form) + a "Legacy Circle" card on `legacy.astro`; the verbatim
designate/note/honor-a-gift option on `one-time.astro`. Both PDF URLs verified
200 application/pdf.
**Fixed:** donor-facing CashApp tag `$FavorIntl` -> `$FavorInternational`
(`one-time.astro` x2, `give/index.astro`) — was the wrong handle. Removed invented
crypto mechanics ("BTC/ETH/USDC routed through TrustBridge after a quick KYC") to
an inquiry; removed the invented "annual legacy gathering" line.
**Kept (provenance-checked):** TrustBridge + DAFpay/DAF Direct on
`foundation.astro` / `international.astro`. Earlier I wrongly said TrustBridge was
not on the live site; it IS in the Site Map v2.1 instructions ("DAF integration
(DAFpay, TrustBridge)") and on the live homepage per the site scrape
(scrape-summary.md: "TrustBridge for international, DAF Direct for donor-advised
funds"), with a real portal URL in the scrape manifest. Per Daniel's rule
(instructions/real content stays), they remain untouched.
**Flag for Favor:** crypto appears only in the instructions doc (modeled on
Destiny Rescue), not on Favor's live giving page. Kept as a category but Favor
should confirm they actually accept crypto.
**Consequences:** Give-methods Tier-3 item done. Verified: prod build clean (160
pages), no console errors, DOM checks pass, both forms resolve. Pushed to `main`
(commit a8afdfc).

---

## 2026-06-02 — Statement of Faith: full verbatim restore (Daniel-approved)

**Decision:** Restored all 14 articles of `about/statement-of-faith.astro` to
Favor's exact live wording (favorintl.org/about/statement-of-faith), in live
order. This is a deviation from the default "ADD, don't touch" rule, explicitly
approved by Daniel because a statement of faith is doctrinal and must be the
org's exact confession, not a paraphrase.
**What was wrong:** the new page had 13 articles; 7 were already verbatim, but 6
(Bible, God, Jesus Christ, Salvation, Holy Spirit, Church) were generic
evangelical paraphrases, not Favor's wording. Two live articles were missing
entirely (Sin and Justification; Transformation / new creation), and the live
Holy Spirit article (continuationist: "signs, wonders, and miracles") had been
replaced with a generic "live a godly life" version. An invented block claimed
Favor affirms the "Nicene Creed and Lausanne Covenant" and is "not a
denomination."
**Fix:** all 14 articles now verbatim; the invented creed block removed (not in
live, Stephanie's comments, or the instructions doc — checked). Kept the
numbered-card design + short navigational titles (titles are not doctrinal);
intro h2 set to the live "In one accord, we believe." Two spaced hyphens in the
live text changed to commas per the brand no-dash rule (no words altered).
**Consequences:** SoF Tier-3 item complete. Verified: 14 articles render in
order, prod build clean (160 pages), no console errors. Pushed to `main`
(commit 26ed2c6). `highlight-baptism.jpg` is now unused but left in place.

---

## 2026-06-02 — Accountability page: verbatim live content ported (additive)

**Decision:** Added the genuinely-missing live content from
favorintl.org/about/ecfa-accountability to `about/accountability.astro`,
verbatim, additive-only (no existing copy/numbers changed): the stewardship
statement + 1 Cor 4:2 NKJV verse (incl. finance email
`accounting@favourafrica.org`); the 2024 expense breakdown (89.3% program
$6,671,668 / 6.2% general $464,178 / 4.5% fundraising $341,235); the Great
Multiplier Effect (GME) explanation; the Carole Ward pull-quote. Also added
the Florida solicitation disclosure (CH57842 / FDACS) site-wide in
`SiteFooter.astro` (Daniel approved footer + on-page).
**Source:** live page captured verbatim via Chrome MCP (not WebFetch).
**Correction:** the gap-analysis-v2 / handoff items **"6 R's framework"** and
**"5-year plan download"** are NOT real. The "6 R's" appears in no source
except the WebFetch-paraphrased gap doc. The "5-year plan" is the live URL
`/5yearplan2025`, which `urls.csv:208` shows is a 301 to a Blackbaud donation
form (marked "drop"), not a downloadable plan. Neither was added. Do not chase.
**One easy-fix:** the live GME line joined two clauses with a spaced hyphen
("communities - there is no limit"); split into two sentences per the brand
no-dash rule. All words preserved.
**Consequences:** Accountability Tier-3 port is complete. Verified: prod build
clean (160 pages), no console errors, DOM/computed-style checks pass. Pushed to
`main` (commit e7403be).

---

## 2026-05-18 — Stack locked

**Decision:** Astro + Cloudflare Pages + Cloudflare R2 + Blackbaud API
+ Stripe Shop + Mailchimp.

**Reason:** Static-first for speed and SEO. Cloudflare Pages gives free
auto-deploy from GitHub `main`. Blackbaud is already Favor's system of
record for donors. Stripe handles the small shop with the lowest
overhead.

**Consequences:** No Node server. Forms run through Cloudflare Pages
Functions. CMS must be file-based or headless.

---

## 2026-05-18 — Team and Board split

**Decision:** Staff and Board live on separate pages.

**Reason:** Board members are not paid staff. Standard practice. Per
Stephanie Maier comment on sitemap v2.1.

**Consequences:** Sitemap updated. `/about/team/` and `/about/board/`
are distinct routes.

---

## 2026-05-19 — Phase 1 scrape scope: skip per-page scrape of Webflow CMS items

**Decision:** Phase 1 scraped 68 core content URLs from `www.favorintl.org`
instead of all 636 URLs in the sitemap. Individual
`/testimonies-updates/transformation-stories/*` pages (134 of them) and
individual `/newsletters/*` pages (299 of them) were NOT re-scraped
page-by-page. Tag archive pages (~100 URLs across the `/all-*-tags/`,
`/v2-ministry-tags/`, `/topic-tags/`, etc. paths) were also skipped.

**Reason:** The `Webflow files/` zip already contains CSV exports of every
CMS collection (`Stories.csv` has 265 transformation stories with full
body HTML, `Newsletters.csv` has all newsletters with links,
`Directors.csv` has all 12 board/staff profiles with bios,
`Current Projects.csv` has 5 active projects with budgets and three update
slots each, `Impact Reports.csv` has the annual and quarterly reports).
Re-fetching each CMS item from the live site would just give us back
content we already have in cleaner form. Tag archive pages are
auto-generated by Webflow and don't exist in the new sitemap; the rebuild
uses Pagefind for search instead. Scraping them would waste rate-limited
bandwidth.

**Consequences:** Phase 3 content migration must source CMS items from
`Webflow files/CMS Collections/*.csv`, not from
`existing-site-scrape/pages/`. The `scrape-summary.md` flags this
clearly. The `urls.csv` redirect map still covers individual story /
newsletter / tag URLs by pattern (e.g., all
`/testimonies-updates/transformation-stories/*` URLs route to `/stories/`
with `medium` redirect priority), so 301s do not suffer from the
narrower scrape.

---

## 2026-05-19 — Q4 RESOLVED: four ministry pillars confirmed

**Decision:** The four IMPACT pillars are
1. Evangelism + Discipleship (PBS, GIFT Leadership Institute, House of Prayer, Favor FM)
2. Education (Village Learning Centers, Primary + Secondary Schools, Leadership Training)
3. Community Development (Trauma Counseling, Medical Services, Church Planting + Construction)
4. Economic Empowerment (Sustainability Projects, Women's Empowerment, Vocational Programs)

**Reason:** The v2.1 docx sitemap diagram (page 2, "IMPACT — MINISTRY
PILLARS" section) lists them explicitly. Same diagram lists the
sub-programs under each pillar.

**Consequences:** Routes are now `/impact/evangelism-discipleship/`,
`/impact/education/`, `/impact/community-development/`,
`/impact/economic-empowerment/`. `urls.csv` should be regenerated to
replace `[pillar-1..4]` placeholders. Homepage Band 3 (the pillars
band) is no longer blocked.

---

## 2026-05-19 — Monthly Partner tier amounts locked

**Decision:** The Favor Partner monthly tiers are $25 (Equip), $50
(Send), $100 (Educate), $200 (Heal), $500 (Transform), $1,200
(Founders' Circle).

**Reason:** Confirmed by the v2.1 docx sitemap diagram (bottom of
page 2). $1,200 is the highlighted lead tier.

**Consequences:** Homepage Band 6 (Become-a-Favor-Partner) and
`/give/partner-monthly/` use these tiles. Custom-amount input still
available.

---

## 2026-05-19 — Skip-the-old-site directive

**Decision:** Phase 3 content migration is **NOT** a copy of
favorintl.org content. The approved-sitemap-v2.1 doc is the source
of truth for routes, sections, copy framing, and structure. Where the
old site has program-level facts (PBS, GIFT, country list, financial
numbers) that are factually correct, we may pull those facts into new
copy written from the partner-as-hero voice. We do **not** lift
paragraphs whole-cloth.

**Reason:** Will's explicit instruction. The old site is being retired
because the voice, structure, and conversion mechanics are broken.
Re-writing from the doc avoids re-introducing those problems.

**Consequences:** `existing-site-scrape/pages/*.md` are reference,
not source. New copy ships from `02-content/voice-and-tone.md` rules
applied directly to the v2.1 doc structure.

---

## 2026-05-19 — Phase 1 image classification: heuristic, not vision

**Decision:** Classified all 461 downloaded images using filename +
source-page + dimensions heuristics. Did not run vision-model
classification on each image.

**Reason:** Vision-checking 461 images one-by-one is expensive and slow,
and Webflow CDN filenames + source-page context already give a strong
signal (e.g., images on `/about/directors` are headshots; images on
`/what-we-do/*` are field photos). Spot-checked five candidate hero
images with vision to confirm the heuristic is reasonable.

**Consequences:** A handful of images in `field-photo/` may belong in
`stock/` or `team-photo/`. Will should spot-check before Phase 3
migration. The summary doc flags the heuristic limitation and gives
five vision-confirmed hero candidates.

---

<!-- Add new entries above this line. -->

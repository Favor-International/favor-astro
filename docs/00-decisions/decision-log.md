# Decision Log

Append-only record of every meaningful project decision. Newest at the
top. Every entry must include date, decision, reason, and consequences.

When you (Claude) make a deviation from an earlier decision, log it
here before the deviation ships.

---

## 2026-06-02 — Site-wide design QA pass (buttons, titles, cards) + image task pending

**Done (shipped):** Daniel flagged 3 recurring visual bugs from screenshots; fixed
site-wide.
1. **Left-stuck/cramped CTA buttons** (e.g. Founders' Circle "Become a Favor
   Partner"): root cause was a MISSING global `.band__cta-row` style. Added it
   (centered + spaced) in `global.css`. Commit a634cec.
2. **Left-aligned section titles:** empirically audited all 30 pages by computed
   `text-align` (via an iframe sweep in the preview, since source-scanning gives
   false positives — centering often comes from an ancestor section/`*-head` class,
   not the immediate container). Only 5 were genuinely bare-left: give/one-time (3),
   give/foundation (Contact), about/accountability (Reports + 990s subhead). Wrapped
   them in centered `.band__header`. Left intentional split bands (FeatureRow /
   OverlayFeature / contact-grid / donation / hero) alone. Commits a634cec, 662f64c.
3. **Mismatched overlay-card heights** (Give hub): featured card was 16/9 (short)
   next to 4/5 cards; now fills row height. Commit a634cec.

**PENDING — image de-duplication + section images (Daniel wants EVERY photo
unique):** BLOCKED on photo access.
- Audit: 141 photo refs site-wide vs only **102 local photos** -> full de-dup is
  mathematically impossible without ~40-50 NEW images. 70 duplicate slots; only ~31
  unused local photos (mostly story images).
- **The Google Drive connector cannot read the Favor photo files** — it enumerates
  the folder tree (Uganda, South Sudan, DRC, Cameroon, _Photography) but every
  image-containing folder returns empty, while it DOES return images from other
  projects. Likely a Shared-Drive / ownership permission scope.
- Daniel chose: **re-share the Drive** so the connector can read file contents; and
  **hold section images** until the full photo set arrives (so everything is placed
  uniquely in one pass). Next session: re-test Drive access, then de-dup + add
  section images to the text-only bands created this session (cd-intro, ee-intro,
  impact-intro, steward, Country Director, wd-motto, watch cards, etc.).

---

## 2026-06-02 — Stories / Media hub (#5): media added; "9 stubs" debunked

**Media hub (DONE):** Added the missing live Media-hub pieces to `watch.astro`
(already had the video library): Favour FM "Listen now" (zeno.fm/radio/favour-fm),
the Speaking Engagements playlist + YouTube channel links, and "The Carole Ward
Story" free-book card. Book request routed to contact (the live "REQUEST COPY" is a
JS modal; confirm the real form with Favor). Commit 4da8522.
**The "9 stub stories" are NOT expandable (do not chase):** gap-analysis-v2 #16
said to "expand the 9 single-paragraph stub stories from their live sources." I
captured the live pages and they are **equally short** — our stored text is already
the complete live article, verbatim. Verified 2 of 9 against live:
`the-taposa-tribe` (2023) and `emmy-from-orphan-to-leader` (2020) both match the
live `/testimonies-updates/transformation-stories/<slug>` pages word-for-word.
These are short news-style testimonies by design. Expanding them would require
INVENTING content, which violates the core rule, so they were left as-is.
**Optional future (low ROI, flagged):** live stories carry multiple per-story tags
(e.g., Taposa = South Sudan / New Believers / Salvation / Noteworthy News /
Community Transformation / Rural Communities); our JSON collapses each to one
`category`. Restoring full tag granularity for 115 stories is a large scrape with
marginal benefit; the 6-category filter is a reasonable simplification. Not done.
**Consequences:** #5 actionable scope complete. Verified: build clean (160 pages),
media-hub DOM checks pass. The story stubs need no work.

---

## 2026-06-02 — Country Director: full posting ported verbatim

**Decision:** Expanded the one-line Country Director mention on `go/volunteer.astro`
into the full live posting (favorintl.org/positions/country-director), verbatim:
meta (Full-time / Commensurate with experience / Uganda + South Sudan), Overview,
Accountability, Relationships, Location (Gulu / Juba), 7 responsibility groups
(26 bullets), Qualifications (9), Compensation. "Request an application" CTA points
to contact.
**Note on the redirect mapping:** `urls.csv` marks the standalone `/positions/*`
URLs as "drop → /about/contact/" (a redirect choice). The posting content itself is
live and active, and the gap analysis wanted it on the volunteer page, so it was
ported there; the standalone-URL redirect decision is unaffected.
**Flag for Daniel/Favor:**
1. One qualification line contains the word **"inclusivity"** ("...and inclusivity
   among organizational staff..."). Kept verbatim (it's Favor's own HR posting), but
   it brushes the brand's no-DEI-vocab voice rule. Confirm whether to keep verbatim.
2. The volunteer page's **"four roles"** (Ambassador, Prayer warrior, Intercession
   team, Stage Sunday host) were flagged in gap-analysis-v2 (#9) as invented; left in
   place this round (out of scope for #6). Provenance/keep-or-cut still to decide.
**Consequences:** Country Director Tier-3 item done. Verified: prod build clean
(160 pages), no console errors, DOM checks pass (7 groups / 26 bullets / 9 quals).
Pushed to `main` (commit f7aae3a).

---

## 2026-06-02 — Impact pillars: missing verbatim content added; taglines debunked

**Decision:** Added genuinely-missing verbatim content to the four pillar pages +
impact hub, captured from favorintl.org/what-we-do/* via Chrome MCP. Additive only.
- **Evangelism & Discipleship:** "Bibles instead of bullets" South Sudan motto +
  Matthew 28:19 NKJV.
- **Community Development:** the holistic community-development model paragraph +
  the "guiding hearts to Jesus" philosophy; "we pray with each of our patients" +
  mobile medical clinics on the Medical card; named churches (Wedweil Refugee
  Camp, Pabo Calvary Chapel) on the Church Planting card.
- **Economic Empowerment:** "The Gospel is the foundation of healthy economies."
- **Impact hub:** "non-denominational missionary movement" mission + prayer-as-
  engine "Our Approach" + the four-departments framing.
**Debunked:** the gap-analysis-v2 "four official taglines" ("Mobilization of
heaven's agenda," "Next generation leadership," "Holistic transformation by the
Word," "Independence built on freedom in Christ") appear on NONE of the four live
pillar pages or the What We Do overview. WebFetch artifact, like the "6 R's." Not
added.
**Flag for Favor (NOT changed):** GIFT identity mismatch. Our E&D page frames GIFT
as a "Leadership Institute" (two-year residential pastor training, Bishoftu
Ethiopia); the live site calls it "GIFT (God's Institute For Transformation)
children's homes." Different program. Daniel chose flag-only. Also re-verify the
Daniel Kidia testimonial. **Retracted flag:** the "270-acre farm" is fine; the
live "10 acres of maize" is one plot, not the total.
**Consequences:** Impact Tier-3 item done. Verified: prod build clean (160 pages),
no console errors, 10/10 DOM checks pass, motto band styles correct. Pushed to
`main` (commit 9b3aee8). Q4 (the four pillars) was already RESOLVED; names
unchanged.

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

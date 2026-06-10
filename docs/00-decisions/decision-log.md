# Decision Log

Append-only record of every meaningful project decision. Newest at the
top. Every entry must include date, decision, reason, and consequences.

When you (Claude) make a deviation from an earlier decision, log it
here before the deviation ships.

---

## 2026-06-10 (night) — Wave dividers, smooth blurs, intl/foundation rebuilds

**Hero wave dividers replace the blur fade** (Daniel rejected the blur look and
described a Canva-style wave): every PageHero photo now finishes in a soft SVG
wave; 3 path variants chosen deterministically from the page title so angles
vary; `waveColor` matches the first band below (cream-first pages audited and
wired); pattern-divider pages (stories/watch) skip the wave.
**Blur smoothing:** field-tile and OverlayCard caption frosting moved to
multi-stop progressive masks (no hard edge); the first version's blocky bar was
the complaint.
**More scaffold inventions removed (same 80356b4 pattern):** foundation page's
"Due diligence on day one" cards promised an FY2025 audit in Q3, grant-officer
site visits with two-week lead times, and quarterly restricted-gift reporting —
all invented. Rebuilt with six verifiable facts (audits, 990s, ECFA since
9/30/2019, CN 4-star + Candid Platinum, IRS letter PDF, DAF routes) and the new
title "Everything your board needs to say yes."
**International Giving rebuilt:** flags, centered cards, intro band, and the
REAL TrustBridge portal donate URL captured from the live site
(portal.trustbridgeglobal.com/public/donate?id=aa3417c3...). No globe/world hero
image exists in the Media library; kept a field photo (flagged to Daniel).
**Nations Prayer Guide continuation teaser:** Day 13/14 fade, ghost Day 15/16
skeleton rows (deliberately NO fabricated prayer text), "The guide continues,
day by day", print CTA. Conveys continuation without inventing content.

---

## 2026-06-10 (evening) — Harmony overhaul P1-P5 (Daniel-approved A-D, applied site-wide)

**P1 Harmony system:** hero photos now melt into the page (progressive blur+wash
.page-hero__fade, no hard cut); OverlayCard/field-tile captions frosted
(progressive blur); CtaBand uses standard cream (one-off gold wash removed).
**P2 Structure:** program template flow = Hero > centered text intro > image+text
band > body > quote > sibling nav (no image band stacked on hero). Economic page
rebuilt (tagline intro, image-led cards, story strip); CommDev cards image-led;
Education's redundant trio removed. New StoryStrip component (real tag-matched
stories) on all four ministry pages + give hub.
**P3 More scaffold inventions REMOVED:** church-partnership "three tiers"
($250/$1,000/$3,000 Ambassador/Sending/Catalyst with benefit lists) and the
volunteer "4 roles" were invented in commit 80356b4 (no docs, not on live).
Church page rebuilt image-led on verbatim live content (Invitation to Share)
with three REAL ways in (present / give / send). Pattern now firmly established:
the original scaffold invented donor-facing specifics (crypto mechanics, legacy
gathering, GIFT identity, PBS duration, church tiers, volunteer roles, mega-menu
flagship). Treat any unverified scaffold specific as suspect.
**P4 Copy:** "real human" x5 removed (Will's flag); "The receipts" -> "The
numbers behind the work"; the "30-Day Prayer Guide" (invented branding; the page
has one day per nation) reframed as "Nations Prayer Guide", dead PDF links
replaced with print button. NOTE: mission-vision "not just give temporary
relief" left as possibly-live copy (unverified) despite the brand's no-"not
just" rule; verify the live our-story page before changing.
**P5 (A-D):** stories index redesigned (featured editorial card, 17 real
ministry-tag underline filters); mega menu v2 with the live site's NESTED
program links + pillar-tagline descriptions; muted video-loop heroes on /pray/
and /watch/ from Favor's own field mp4s (ffmpeg-compressed, poster fallback,
reduced-motion respected); pray photo gallery.
**Deferred (next session):** where-we-work country profile cards; impact-hub
country mosaic; go-hub gallery+FAQ; newsletter signup embed (bbox form
2446db74); per-card image content review.

---

## 2026-06-10 (day) — FUNCTIONAL DONATIONS unblocked + archive + founder + UI fixes

**Donations are LIVE.** Discovered the live site embeds its donation form
client-side: `BBDonorFormLoader.newBlackbaudDonationFormZoned('renxt',
'p-5_k5FlbubEyEQnUJw7C9Rw', '80ce9859-0be9-48ad-a3cb-cce9c5d4e00b', 'usa')`
(loader: sky.blackbaudcdn.net/static/donor-form-loader/2/main.js). Built
`/give/donate/` with the SAME embed; verified the production donor-form iframe
renders. This resolves the "BLOCKED, needs Blackbaud URLs" launch blocker.
All give CTAs point there; DonationBlock presets are interactive (pressed
states, fill the amount). Their PayPal variant form: c2cfae15-d047-481b-a548-
95e3c3fc60fb. Their bbox EMAIL-SIGNUP form (for the dead newsletter form fix):
2446db74-94fe-4197-8a40-03b10341c4e2 (bbox-2.0-min.js loader). NOTE: first
attempt embedded the signup form thinking it was the donation form; caught it
when the rendered widget said "Sign up". Verify what renders, not what a
script name implies.
**Newsletter archive** at /newsletter/archive/: 98 issues (2024-2026) with real
titles/dates/links scraped from the live past-newsletters page.
**Founder page:** new hero (Carole preaching, carole-5), the 3 live YouTube
talks embedded (5oUghxzqGXU, Y5pWE0AX97M, g2fB1RwyHNM) with live titles, book card.
**UI fixes:** SoF texture removed + padding; volunteer trips/CD spacing; give-hub
chips centered. Alignment audit re-run: only card-internal H3s left-align (correct).

---

## 2026-06-10 — Parts A+B: 13 program sub-pages + content expansion (overnight, Daniel-approved)

**Part A — all 13 live program sub-pages built** at /impact/<pillar>/<program>/,
content VERBATIM from live (raw-HTML capture; src/data/programs.ts is the single
source). E&D: portable-bible-schools, gift-institute, radio. Education: centers,
leadership, primary, secondary. CommDev: counseling, medical, church-planting,
construction. Economic: sustainability, vocation, women. One shared template
([pillar]/[program].astro): hero, verbatim body, scripture/pull-quote band,
sibling-program nav (the "nav within the page" Will wanted), CTA. Pillar pages
link to them via clickable cards.

**CORRECTION — the four pillar taglines are REAL.** I previously "debunked" them
(2026-06-02 entry) because they're absent from pillar page BODIES. They are in
the live site's nav dropdown: "Mobilization of heaven's agenda" (E&D), "Next
generation leadership" (Education), "Holistic transformation by the Word"
(CommDev), "Independence built on freedom in Christ" (Economic). Now used as
section eyebrows on pillar pages + program pages. Lesson: a "not found" verdict
is only as good as the surfaces searched; the nav menu is content too.

**GIFT fixed (provenance-sanctioned):** "GIFT Leadership Institute / two-year
pastor training, Bishoftu" was invented in scaffold commits 80356b4/361f595. Live
GIFT = God's Institute for Transformation, a children's-home ministry. E&D card
+ new sub-page now verbatim. Also fixed PBS card ("three- to six-month" invented;
live = two-month).

**Verbatim deviations (logged, deliberate):** live GIFT text "is not just a
program, but a 24/7 family" rendered as "is a 24/7 family" per the non-negotiable
brand rule (no "not just X" constructions). Spaced-hyphen joins converted to
commas/periods site-wide per the no-dash rule. No other word changes.

**Part B — sections added from real live content:** volunteer page (self-starter
line + the live Short-Term Mission Trips ministries list), church-partnership
("Invitation to Share / Be a voice to the vision", verbatim), pray (3rd Houses of
Prayer paragraph), founder ("Get to know Carole's story more" with the real
YouTube playlist/channel + book request).

**Stories tags restored:** scraped the live tags for ALL 115 stories
(/testimonies-updates/transformation-stories/<slug>; 115/115 matched; 40-tag
universe) into stories.json `tags`. Story pages now show their real tag chips;
the /stories/ filter now offers 16 real ministry filters (replacing the 6
invented categories as filters; `category` field retained on cards).

**Also:** created missing og-default.jpg (social shares were 404ing); image audit
extended to site.ts/JSON (mega-menu images de-duplicated; 303 photos unique).

**NOT done (needs Daniel/Favor):** where-we-work expansion (live page is
map-based, needs design discussion); founder-page "8 northeast African nations"
(live) vs our "14 nations" elsewhere — ANOTHER nations-count variant to add to
the Will list; Blackbaud URLs, newsletter backend, prayer-guide PDF still blocked.

---

## 2026-06-09 — Will/Daniel feedback round 2 (late-night batch)

**Shipped:**
1. **Joy Daniels removed from the site** (team page, directors.json, generated
   profile page). Per Daniel: she is no longer with Favor. Team grid now 3-up.
2. **Mega-menu "flagship" fixed.** The Impact tab claimed "The flagship program —
   GIFT Leadership Institute" (invented framing; live GIFT = God's Institute For
   Transformation children's homes). Replaced with a live-grounded Portable Bible
   Schools card. NOTE: the E&D page's "GIFT Leadership Institute" program card is
   STILL flagged for Favor to confirm; not changed.
3. **H1 typography unified.** Internal-page H1s now match the homepage hero
   (Playfair Display 700, tight leading) instead of Montserrat 800.
4. **African pattern divider** now opt-in on PageHero (default OFF) per Will:
   kept only on /stories, story posts, /watch; homepage untouched.
5. **Statement of Faith redesigned**: single quiet column, neutral 1px hairlines,
   muted serif numerals; no more gold-bordered card grid.
6. **"Pillar N of 4" hero labels** replaced with "What we do" (Daniel: pillar
   jargon "doesn't make sense" to visitors).

**Accountability numbers VERIFIED for Will (all sourced, nothing invented):**
- $8.36M FY2024 revenue = ECFA member profile exactly $8,360,676 ✓
- ECFA total expenses $7,477,081 = EXACT sum of the live site's three expense
  lines ($6,671,668 + $464,178 + $341,235) ✓ → 89% program ratio ✓
- ECFA-accredited September 30, 2019 ✓ (ECFA profile)
- Charity Navigator 4/4 stars, 94 score, FY2024 ✓ (charitynavigator.org/ein/475225697)
- The 2024 expense band on /about/accountability/ is verbatim from
  favorintl.org/about/ecfa-accountability (captured 2026-06-02).

**Also:** Daniel supplied a UI-principles doc (3 video transcripts); distilled to
memory (feedback_ui-design-principles): hierarchy via size/weight/lightness,
neutral layered color, no loud borders, whitespace, interaction states. Apply to
all future design work on this site.

---

## 2026-06-02 — Image de-dup + section images DONE (local Media library, no Drive)

**Resolved the image blocker.** The Drive connector couldn't read the Favor photos,
but the photos exist LOCALLY: `Media/extracted/2026/` (a sibling of the repo) holds
**2,601 real field photos** organized by country + ministry. Used those.
- `build-field-library.mjs`: sharp-optimized 120 images -> `public/images/field-2026/`
  across 25 topics (evangelism, baptism, PBS, prayer, medical, women, church, radio,
  GIFT, agriculture, etc.), 1600px max, webp q80, EXIF-rotated.
- `apply-dedup.mjs`: kept the first use of each duplicated image, replaced the other
  70 with unique topic-matched field photos (landscape preferred). Verdict: **every
  site photo now used exactly once** (was 37 images reused across 70 slots).
- **Section images:** the text-only bands added earlier this session were converted to
  `FeatureRow` (image+text split) with unique field photos: community-development
  (holistic model + philosophy), economic-empowerment (Gospel-economy), impact hub
  (mission), accountability (stewardship). Country Director posting got a lead image
  (terry-1, a real Country Director).
- Pruned 45 unused field images + the build manifest. Final: 75 field-2026 images
  (9.5MB), 144 total site photos all unique. Build clean (160 pages).
- Commits a7247c9 (de-dup), 51604a3 (section images + prune).
**Note:** image `alt` text was not individually rewritten for every swapped photo;
most are generic or topic-matched. A future polish pass could tighten alts.

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

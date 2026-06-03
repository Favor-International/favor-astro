# Favor International — Session Handoff (2026-06-02)

Read this first, then `docs/CLAUDE.md`, `docs/00-decisions/content-gap-analysis-v2.md`, and the
memory files. This captures exactly where we are and how to continue **in Daniel's style**.

---

## 0. The one rule that overrides everything right now

**ADD, don't touch.** Daniel's explicit instruction (2026-06-02):
- **Do NOT change any numbers, dollar figures, stats, rosters, or existing copy already on the new
  site** — they may be **Will's newer data** that the live site doesn't have. Leave them.
- **Only ADD content that is genuinely missing** (real live-site content not present on the new site).
- If something looks wrong but is _existing_ (e.g., a CashApp tag, a project description), **flag it
  for Daniel/Favor to confirm — do not unilaterally rewrite it.**

So the v2 gap analysis's "Tier 1 fix these" framing is now **softened to: add the missing items, leave
the existing ones for Will/Favor to confirm.**

---

## 1. Project basics

- **Repo:** `Favor-International/favor-astro`, local at
  `/Users/danielgomez/Documents/Claude/Projects/Favor International/favor-astro`. Astro static site.
- **Live:** https://favor-astro.pages.dev/ — **deploys automatically from `main`.** So: commit + push
  to `main` after each change round (Cloudflare rebuilds; Daniel reviews live). End commits with the
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` line.
- **Live content source of truth:** https://www.favorintl.org (the old WordPress/Webflow site).
- **Dev server:** Claude Preview `favor-dev` config exists (port 4321); or `npm run dev` in the repo.
- **DO NOT TOUCH `src/pages/index.astro`** (the homepage) — someone else owns it. Work the internal pages.

## 2. Source hierarchy (when sources conflict)

1. **Stephanie Maier** → 2. **Will** → 3. **Instructions doc (Site Map v2.1)** → 4. **Daniel.**
If anything of Daniel's conflicts with 1–3, flag it; don't override. Stephanie's comments:
`docs/00-decisions/stephanies-comments-raw.txt`. Will's 2026-06 review: `Instructions & Comments/
favor_website_review.pdf` (NOTE: that review is **stale** — it scored the site "55–60%, Go empty,
About stubbed," all of which are **already built and live now**; don't chase its "build X" items).

## 3. Working rules (non-negotiable)

- **Verbatim from the live site. No invented copy. No AI paraphrasing. No em-dashes.** Voice in
  `docs/02-content/voice-and-tone.md` ("you" before "we", partner-as-hero, no "journey"/DEI/filler).
- **Approval before building:** lead with a plan/table; Daniel reviews before changes ship.
- **Verify subagents** — they paraphrase and "get creative." Always check their output against the
  live site / docs before trusting.
- **Never report "done" without verifying** it's actually done (Daniel checks).
- **Content depth ("100x") goes on the right pages** (Stories as full posts, Impact detail, country/SEO
  pages, Pray guides) — **keep the homepage and Give pages lean** (conversion-critical). Daniel approved this.

## 4. What's been done (recent)

- Centered the previously left-aligned section titles on go/volunteer, pray (index + 30-day),
  about/our-story, about/mission-vision (commit `00aea99`).
- Removed the off-topic "To Reach a Village, Reach a Woman" video from the Economic Empowerment page.
- Wrote `docs/00-decisions/content-gap-analysis-v2.md` (commit `bc1eb94`) — the fresh page-by-page
  gap analysis (live site vs current build), from 5 parallel section audits.
- Confirmed: persistent **GIVE NOW + PARTNER** nav buttons already exist; the **live site is current**
  (the review was stale).

## 5. What to do next — ADDITIVE ports only (Tier 3 of the gap doc)

These are real live-site items genuinely MISSING from the new site. Add them verbatim. **Capture the
exact wording from favorintl.org first — `WebFetch` returns PARAPHRASE, so use the Chrome MCP
(`mcp__claude-in-chrome__*`) or have Daniel paste the real copy. Never present paraphrase as verbatim.**

**Live Webflow slugs (differ from new-site routes):** Accountability =
`/about/ecfa-accountability`; Statement of Faith = `/about/statement-of-faith`; donate methods =
`/connect-support/donate-now`; pillars = `/what-we-do`, `/what-we-do/{evangelism-discipleship,education,
community-development,economic-empowerment}`.

- **[DONE 2026-06-02]** **Statement of Faith** (`about/statement-of-faith.astro`): full verbatim restore
  of all 14 articles; removed the invented Nicene/Lausanne creed block. Commit 26ed2c6.
- **[DONE 2026-06-02]** **Accountability** (`about/accountability.astro`): added stewardship statement +
  1 Cor 4:2 NKJV, 2024 expense breakdown, GME, Carole Ward quote, finance email; FL disclosure added to
  the global footer. Commit e7403be. NOTE: the **"5-year plan"** and **"6 R's"** were NOT real (the
  former is a Blackbaud donate-form redirect marked "drop"; the latter is a WebFetch artifact) — do not chase.
- **[DONE 2026-06-02]** **Give methods**: added the real Give By Stock + Give A Legacy (Legacy Circle)
  PDFs, the designate/honor/dedicate option; fixed CashApp `$FavorIntl`→`$FavorInternational`; stripped
  invented crypto mechanics + "legacy gathering." TrustBridge/DAFpay KEPT (in instructions + live homepage).
  Commit a8afdfc.
- **[DONE 2026-06-02]** **Impact pillars:** added "Bibles instead of bullets," the community-development
  model + philosophy, "we pray with each patient," mobile clinics, named churches (Pabo Calvary Chapel,
  Wedweil), the Gospel-economy line, and the impact-hub mission intro. The four **"official taglines"
  were a WebFetch fabrication** (on no live page) — NOT added. Commit 9b3aee8. **Still flag for Favor:**
  GIFT identity (our "Leadership Institute" vs live "God's Institute For Transformation children's homes").
- **[TODO] Stories:** build the missing **Media/Video hub** (YouTube Videos + Speaking Engagements
  playlists, Favour FM listen-now, "The Carole Ward Story" book); consider restoring finer tag filters;
  expand the 9 single-paragraph stub stories (list in the audit) from their live sources.
- **[TODO] Country Director** posting (`go/volunteer.astro`): add the full live job posting detail.

## 6. Broken / functional (fixes OK — these aren't "Will's data")

- **Donation forms** (`give/partner-monthly.astro` etc.): CTAs point to non-existent `/give/.../form/`
  routes; no Blackbaud. **BLOCKED — needs the real Blackbaud donation URLs from Favor.**
- **Newsletter** (`NewsletterForm.astro`): posts to non-existent `/newsletter/subscribe` — decorative.
  Needs a real backend/embed (provider TBD).
- **30-Day Prayer Guide PDF:** links to `/resources/30-day-prayer-guide.pdf` which doesn't exist —
  dead download on both Pray pages. Either create/upload the PDF or hide the buttons.

## 7. VERIFY with Will/Favor — do NOT change (possibly Will's newer data)

Board/team roster (4 names not on live: Joy Daniels, Lisa Coggin, Rev. Louis Kayatin, Dr. Vilma Vega);
the "14 nations" count + where-we-work country roster; homepage `AfricaMap` stats (524,673 / 3,635 / 14);
all Give dollar figures; Vision-Trip dates/costs; the net-new Pray section's operational claims;
testimonials (Daniel Kidia, Jennifer M, Field Leader). **Leave these in place; ask Daniel to confirm.**

## 8. What Daniel still owes us (he's gathering)

Real per-project goal/raised figures, the AfricaMap stat source, confirmed nation + board rosters,
Vision-Trip reality, newsletter provider, and the **Blackbaud donation URLs**.

## 9. The full detail

Everything above is expanded in `docs/00-decisions/content-gap-analysis-v2.md` (per-page gaps, verbatim
live snippets captured, real project figures). Read it before porting.

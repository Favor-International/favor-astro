# START HERE — Claude Code Bootstrap

You are Claude Code, picking up the Favor International website
rebuild. The human (Will Hamilton) has handed you two folders:

- `favorintl-rebuild/` (this folder) — the brief, brand, specs, and
  decisions.
- `build/` — empty or near-empty. The new Astro site goes here.

Will is not going to scrape, gather, or stage anything for you. You
do it all. He reviews and approves.

Read this entire file before you do anything else. Then follow the
phases in order. Do not skip ahead.

---

## Phase 0 — Orientation (do this every fresh session)

In order, read:

1. `favorintl-rebuild/CLAUDE.md`
2. `favorintl-rebuild/00-decisions/approved-sitemap-v2.1.md`
3. `favorintl-rebuild/00-decisions/open-questions.md`
4. `favorintl-rebuild/00-decisions/decision-log.md`
5. `favorintl-rebuild/01-brand/brand-book.md`
6. `favorintl-rebuild/02-content/voice-and-tone.md`
7. `favorintl-rebuild/03-design/page-templates.md`
8. `favorintl-rebuild/03-design/homepage-bands.md`
9. `favorintl-rebuild/03-design/component-library.md`
10. `favorintl-rebuild/04-tech/stack.md`

If any open question in step 3 blocks the task you are about to do,
STOP and ask Will. Do not invent an answer.

---

## Phase 1 — Scrape the existing favorintl.org

Goal: capture everything from the live site before we touch it.

Read `favorintl-rebuild/06-reference/SCRAPE-INSTRUCTIONS.md`.
Read the `website-factory-scraping` skill at
`/mnt/skills/user/website-factory-scraping/SKILL.md` (or wherever the
skill is mounted in your environment).

Use Playwright. If Playwright is not installed in your environment:

```bash
npm install -D playwright
npx playwright install chromium
```

### What to scrape

- Every page reachable from `favorintl.org/` through normal nav
  crawling. Depth limit 5.
- Every blog post and story.
- Every PDF and downloadable resource. Save the binaries to
  `favorintl-rebuild/06-reference/existing-site-scrape/pdfs/`.
- Every image referenced on a page. Save the originals.
- The Google Business Profile for "Favor International" at the
  Valrico FL address: pull rating, review count, recent reviews
  (top 20), business hours, photos.

### What to record per page

For each scraped page, write a markdown file to
`favorintl-rebuild/06-reference/existing-site-scrape/pages/<slug>.md`
with this frontmatter:

```yaml
---
original_url: "https://favorintl.org/about/"
title: "Page title from <title>"
h1: "First H1 on page"
scraped_at: "2026-MM-DDTHH:MM:SSZ"
status: 200
images: ["<filename>", "<filename>"]
internal_links: ["url1", "url2"]
external_links: ["url1"]
classification: "keep | rewrite | drop"
new_target: "/about/" or "[NEW PAGE NEEDED]" or "DROP"
---
```

Body is the page's text content in clean markdown (no nav, no
footer, no scripts).

### Image classification

For every downloaded image, run it through vision (you can describe
images you've fetched) and classify into:

- `field-photo/` — real African field photography
- `team-photo/` — staff or board portraits
- `headshot/` — individual portraits
- `logo/` — Favor logos or partner logos
- `stock/` — stock photography
- `irrelevant/` — UI elements, icons, decorative

Save the classified images under
`favorintl-rebuild/06-reference/existing-site-scrape/images/<category>/`.

Rename to `<original-page-slug>-<index>-<short-description>.<ext>`
so we can trace each image back to its source page.

### URL map

Build `favorintl-rebuild/06-reference/existing-site-scrape/urls.csv`
with columns:

```
original_url, title, classification, new_target, redirect_priority
```

`redirect_priority`: `high` for legacy pages with inbound links or
that appear in old emails or print collateral. `low` for one-off
content. `drop` for pages that should 404.

### Scrape summary

When done, write
`favorintl-rebuild/06-reference/existing-site-scrape/scrape-summary.md`:

- Total pages scraped
- Total images by category
- Total PDFs
- Top 10 highest-traffic-looking pages (use heuristics: link count
  in nav, depth from homepage)
- Gaps you found (pages referenced in nav that 404'd, broken links,
  missing images)
- Suggested redirect list count

### Then scrape Destiny Rescue for visual reference

Goal: capture how their homepage and give page are laid out, since
the rebuild is modeled on their structure.

- Screenshot `destinyrescue.org/` and `destinyrescue.org/donate/` at
  three viewport widths: 375px, 768px, 1440px.
- Save screenshots to
  `favorintl-rebuild/06-reference/destiny-rescue-screenshots/`.
- Write a short `destiny-rescue-analysis.md` next to them noting:
  band order, hero treatment, scrim and gradient choices, monthly
  giving moment placement, footer density, typography stack
  (inspect with devtools or fonts loaded).

### Stop and report

When Phase 1 is complete, report back to Will:

- Counts (pages, images, PDFs, reviews).
- Gaps you found.
- The 5 most useful pages of content to migrate.
- The 5 most useful images to feature.

Wait for Will's go-ahead before Phase 2.

---

## Phase 2 — Initialize the Astro repo

Goal: working scaffold in the `build/` folder.

Follow `favorintl-rebuild/04-tech/repo-setup.md` exactly, with these
adjustments:

- The Astro project root is `build/`, not the parent.
- After Astro is initialized, copy `favorintl-rebuild/` to
  `build/docs/` so the brief lives in the repo too.
- Do not create a separate GitHub repo yet. Will handles GitHub. You
  build locally and commit to whatever git remote he configures.

Deliverables for Phase 2:

- `build/package.json`, `build/astro.config.mjs`, `build/tsconfig.json`
- `build/src/styles/tokens.css` with the brand palette
- `build/src/styles/fonts.css` referencing self-hosted Montserrat
- `build/public/fonts/montserrat-{300,400,600,700,800}.woff2`
  (download from google-webfonts-helper or equivalent)
- `build/src/layouts/BaseLayout.astro` with head meta, font preload
- `build/src/layouts/PageLayout.astro` extending BaseLayout
- `build/src/components/global/SiteHeader.astro`
- `build/src/components/global/SiteFooter.astro`
- `build/src/pages/index.astro` with placeholder hero
- `build/.gitignore` with node_modules, .env, .dev.vars, dist
- `build/_headers` and `build/_redirects` stub files
- `build/.github/workflows/check.yml` with lint, typecheck, build

Verify with `npm run build` locally. Report success and the rendered
file tree to Will before Phase 3.

---

## Phase 3 — Migrate scraped content to Astro

Goal: every "keep" or "rewrite" page from the scrape lives in
`build/src/content/` or `build/src/pages/`.

For each scraped page classified `keep`:

- Drop into `build/src/content/pages/` or directly into
  `build/src/pages/` depending on whether it's a one-off or part of
  a collection.
- Apply voice-and-tone rules. Where the original copy violates the
  rules (em-dashes, "journey", DEI vocabulary, hedging, etc.),
  rewrite. Note the rewrite in `decision-log.md`.

For each `rewrite`:

- Use `08-prompts/03-content-writing-pass.md` as the rewrite prompt
  on yourself.

For each `drop`:

- Note the redirect target in `_redirects`.

Build the redirects file from the scraped `urls.csv`. Every
`high` priority URL must have an explicit 301.

Migrate the kept images to `build/public/images/` organized by
category, then optimize:

```bash
npx @squoosh/cli --webp '{quality:80}' --resize '{width:2400}' \
  build/public/images/**/*.jpg
```

Keep the optimized webp and a jpg fallback. Use Astro's `<Image>`
component for everything.

---

## Phase 4 — Build the homepage

Use the prompt at `favorintl-rebuild/08-prompts/01-build-homepage.md`.

The homepage build is the canonical template. Every band becomes a
component in `build/src/components/band/`. Every component you build
gets reused on internal pages in Phase 5.

Block on open questions Q1 and Q4 if they're still open.

---

## Phase 5 — Build internal pages

For each route in `favorintl-rebuild/00-decisions/approved-sitemap-v2.1.md`:

- Create the Astro page.
- Apply `03-design/page-templates.md` (the 5-section template).
- Pull content from the migrated content collection.
- Wire the primary CTA.

Build in this order so the most-trafficked paths ship first:

1. `/about/`, `/about/team/`, `/about/board/`, `/about/accountability/`
2. `/impact/` and the four pillar pages (blocked by Q4)
3. `/pray/` and `/pray/30-day-guide/`
4. `/go/`, `/go/vision-trips/`, `/go/volunteer/`
5. `/give/` and all give sub-pages (full donation forms come in
   Phase 6)
6. `/stories/` and the individual story pages
7. `/resources/`, `/newsletter/`, `/search/`, `/legal/`, contact

---

## Phase 6 — Donations (Blackbaud)

Use the prompt at `favorintl-rebuild/08-prompts/02-build-donation-form.md`.

Blocked until Will provides Blackbaud credentials. Ask him for:

- Client ID
- Client secret
- Subscription key
- Sandbox environment access
- Designation codes for project-restricted giving

Build against the sandbox first. Production cutover requires Will's
explicit sign-off.

---

## Phase 7 — Portal, Shop, Search

Build in this order:

1. Magic-link auth flow (Cloudflare Workers + KV)
2. Partner dashboard (Blackbaud-backed)
3. Pastors portal (and Churches portal if Q5 keeps them separate)
4. Stripe Shop with first product catalog
5. Pagefind search index and `/search/` UI

---

## Phase 8 — Polish, audit, launch

Run the entire `07-build-plan/pre-launch-checklist.md` end to end.
Every box ticked. Then hand off for Will's launch approval.

---

## Operating rules for every phase

1. **Read before you write.** Every session re-reads CLAUDE.md and
   open-questions.md.
2. **Log every decision.** Append to `decision-log.md` whenever you
   choose between options or deviate from the spec.
3. **Commit often.** Single-band-scoped or single-task-scoped commits
   so the history is readable.
4. **Ask, do not invent.** If a piece of information is missing
   (Carole's preference, a credential, a designation code), stop and
   ask Will. Do not make up answers.
5. **Voice is non-negotiable.** Re-read `02-content/voice-and-tone.md`
   before writing any user-facing string.
6. **No em-dashes.** Run a final grep for `—` before each commit.
7. **No carousels. No popups. No cookie banner unless legally
   required. No AI-generated faces. No white-savior photography.**

---

## What to report back to Will

After each phase, report:

- What you completed
- What you decided (and why) that wasn't already in the spec
- What you couldn't do because of a missing input
- Time / token cost if available
- The next phase you're ready to start

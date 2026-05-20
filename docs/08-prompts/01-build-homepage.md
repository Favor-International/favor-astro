# Prompt: Build the Homepage

Use this prompt when starting the homepage build in a fresh Claude
Code session.

---

You are building the favorintl.org homepage. Before you write any
code, do all of the following in order:

1. Read `/docs/CLAUDE.md` end to end.
2. Read `/docs/00-decisions/approved-sitemap-v2.1.md`.
3. Read `/docs/00-decisions/open-questions.md`. If Q1 or Q4 are still
   OPEN, stop and ask Will to resolve them before you start the hero
   or pillars bands.
4. Read `/docs/01-brand/brand-book.md`.
5. Read `/docs/02-content/voice-and-tone.md`.
6. Read `/docs/03-design/homepage-bands.md`.
7. Read `/docs/03-design/page-templates.md`.
8. Read `/docs/03-design/component-library.md` and confirm which
   components already exist in `src/components/`.
9. Skim the existing homepage scrape at
   `/docs/06-reference/existing-site-scrape/pages/homepage.md` if
   present.

Then web-fetch destinyrescue.org's homepage and give page. Note their
band heights, scrim treatment, and monthly-giving moment.

Now build the homepage at `src/pages/index.astro` band by band. Each
band is its own Astro component in `src/components/band/`. Use the
brand tokens. Self-host fonts. Add JSON-LD `Organization` schema in
the head.

After each band is implemented, commit with a single-band-scoped
message ("feat(home): add Band 1 hero" etc.) so the history is
readable.

Log any decision you make that deviates from the spec in
`/docs/00-decisions/decision-log.md`.

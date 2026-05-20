# CLAUDE.md — Favor International Website Rebuild

You are building **favorintl.org** for Favor International, a Christian
nonprofit supporting indigenous African missionaries across 14 nations.
The site is a complete rebuild. The previous site is being retired.

Read this file first, every session. It is the source of truth for the
project. If anything in this file conflicts with what you find elsewhere
in the repo, this file wins until I update it.

**Operational instructions (the "do these things in this order" guide)
live in `START-HERE.md`.** This file is the *what and why*.
`START-HERE.md` is the *how and when*. Read both, in that order.

## What I am building

A static, fast, search-friendly, donation-converting nonprofit site that
treats the partner as the hero of the story. Modeled in spirit on
Destiny Rescue, not on a corporate brochure.

## Stack (decided, do not change without asking)

- **Framework:** Astro (static, islands where needed)
- **Hosting:** Cloudflare Pages, deployed automatically from `main`
- **Repo:** GitHub, single repo, monorepo-style structure
- **Media:** Cloudflare R2 (images, videos, PDFs)
- **Donations:** Blackbaud Raiser's Edge NXT (API integration)
- **Shop:** Stripe (books, merchandise) — Stripe Checkout, not a full cart
- **Email:** Mailchimp (newsletter, partner segments)
- **CMS:** Lightweight, file-based or headless. Decap CMS or Sanity if a
  GUI is required, otherwise Markdown + frontmatter in the repo
- **Forms:** Cloudflare Pages Functions or a serverless endpoint
- **Analytics:** Plausible primary, GA4 secondary if requested

If a feature wants a different stack, push back. Do not silently add
dependencies.

## Voice and tone (non-negotiable)

- Partner-as-hero. The donor or pray-er is the protagonist, Favor is
  the trusted guide.
- "You" before "we" on every page.
- Bold, direct, theologically grounded. No corporate fluff. No DEI talk.
  No hedging.
- Christ is King now. Speak from inside the faith, not about it.
- Signature phrase: **"Where others will not go."**
- Tagline: **"Transformed Hearts Transform Nations."**
- Never use em-dashes. Use a period, a comma, parentheses, or a
  semicolon instead.
- Never write "X isn't just Y" or "X is more than Y" structures.
- Never use "merely" or "just" in a minimizing sense.
- Every page ends with one clear next step. **Pray, Give, or Go.**

## Architecture rules

- Maximum two menu levels deep.
- Primary nav: **PRAY | GIVE | GO | IMPACT | ABOUT**
- Always-visible **GIVE NOW** button in nav.
- **PARTNER** button in nav for login-based portals (see Portal Spec).
- Internal links open same tab. External links open in a new tab with
  `rel="noopener"`.
- Every internal page follows the standard 5-section template (see
  `03-design/page-templates.md`).
- One primary CTA per page.

## Repo layout (target)

```
/                       # Astro project root
  astro.config.mjs
  package.json
  /src
    /pages              # Astro pages, file-based routing
    /content            # Markdown collections (stories, team, etc.)
    /components         # Astro components, organized by domain
    /layouts            # Base, Page, PortalPage layouts
    /styles             # Global CSS, design tokens
    /lib                # Utilities, API clients (Blackbaud, Stripe)
  /public
    /fonts              # Montserrat self-hosted
    /images             # Static images, OG cards
  /functions            # Cloudflare Pages Functions (form handlers)
/docs                   # This prep folder, lives in the repo for reference
```

## Working order

1. Read `00-decisions/approved-sitemap-v2.1.md` for the locked
   information architecture.
2. Read `00-decisions/open-questions.md` for the items still being
   resolved. Do not invent answers to these. If a build task hits one,
   stop and ask.
3. Read `01-brand/brand-book.md` before writing any CSS or copy.
4. Read `02-content/voice-and-tone.md` before writing any user-facing
   copy.
5. Read the matching `03-design/*.md` spec before building a component
   or page.
6. Reference `04-tech/integrations/*.md` before wiring any third party.
7. Log every decision and deviation in
   `00-decisions/decision-log.md` with date and reason.

## Skills available

When working on this site, the following ServiceLine Pro skills apply:

- `website-factory-design` (anti-vibe-code design, conversion patterns)
- `website-factory-industry-profiles` — **Favor is nonprofit, not a
  home service business.** Use these only for general structure
  guidance. Visual direction comes from `01-brand/brand-book.md`, not
  these profiles.
- `website-factory-scraping` for pulling content from the existing
  favorintl.org and from reference sites like destinyrescue.org.

## What success looks like

- Loads under 1.5 seconds on 4G.
- Lighthouse 95+ across all four scores.
- WCAG 2.1 AA.
- Renews trust signals (ECFA, 501c3, financials) above the fold of any
  giving page.
- Monthly Favor Partner conversion is the primary KPI. Track it.

## What I want you to never do

- Never add a cookie banner unless required by a real GDPR audience
  (we are US-based, indigenous-missionary focused; the EU traffic is
  trivial).
- Never use stock photography of African children with sad eyes and
  Western saviors. Use Favor's own field photography.
- Never use AI-generated faces.
- Never use the word "journey" as a noun for a user flow. Call it a
  path.
- Never auto-play audio or video.
- Never put a chat widget on the site.
- Never use a carousel as a hero. Use a single still image or one
  short looping background video.
- Never make a donation form longer than three steps.

# favorintl.org — Astro rebuild

Static Astro site for **Favor International**. Deploys to Cloudflare Pages from `main`.

> Transformed Hearts Transform Nations.
> Where others will not go.

## Stack

- **Astro 6** (static output, file-based routing)
- **Cloudflare Pages** (production hosting + Functions for forms)
- **Cloudflare R2** for media (Phase 4+)
- **Blackbaud Raiser's Edge NXT** API for donations (Phase 6)
- **Stripe** Checkout for shop (Phase 7)
- **Mailchimp** for newsletter
- **Pagefind** for search (Phase 7)
- Self-hosted **Montserrat** woff2 fonts

## Local dev

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs to ./dist
npm run preview
```

Node 22.12 or higher required (per `package.json` engines).

## Repo layout

```
/build              <- this Astro project (deploys to Cloudflare Pages)
  /public           static assets, self-hosted fonts, hero images
    /fonts          Montserrat 300/400/600/700/800 (.woff2)
    /images         field photography, OG cards
  /src
    /pages          file-based routes (32 pages as of Phase 2)
    /layouts        BaseLayout, PageLayout
    /components
      /global       SiteHeader, SiteFooter, TrustStrip, NewsletterForm
      /band         PageHero, PillarCard, StatTile, ProofBlock, CtaBand
      /story        StoryCard
    /styles         tokens.css, fonts.css, global.css
    /lib            site.ts (nav, pillars, partner tiers), cta.ts
  /functions        Cloudflare Pages Functions (form handlers, Phase 6+)
  astro.config.mjs
```

## Pages shipped (32)

- `/` — Homepage, 11 bands per `homepage-bands.md`
- `/pray/` + `/pray/30-day-guide/`
- `/give/` + 8 sub-pages (partner-monthly, one-time, specific-project, church-partnership, foundation, legacy, non-cash, international)
- `/go/` + vision-trips + volunteer
- `/impact/` + the four ministry pillars (evangelism-discipleship, education, community-development, economic-empowerment)
- `/about/` + 8 sub-pages (mission-vision, our-story, where-we-work, team, board, statement-of-faith, accountability, contact)
- `/stories/`, `/newsletter/`, `/404`

## Source of truth

The brief, brand book, voice rules, sitemap, and decisions live in
`/docs` (the `favorintl-rebuild/` folder copied into the repo).

Voice and tone are non-negotiable. Read `docs/02-content/voice-and-tone.md` before
writing any user-facing string. No em-dashes. No carousels. No cookie banner.
No white-savior photography. Pray, Give, or Go.

## Deploy

Cloudflare Pages:

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Node version:** 22 (pin in Pages settings)
- **Compatibility flags:** `nodejs_compat`
- **Branch:** `main` is production. All other branches deploy to preview URLs.

Secrets (Cloudflare Pages env vars, never committed):

```
BLACKBAUD_CLIENT_ID
BLACKBAUD_CLIENT_SECRET
BLACKBAUD_SUBSCRIPTION_KEY
BLACKBAUD_REFRESH_TOKEN
STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
MAILCHIMP_API_KEY
MAILCHIMP_LIST_ID
TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
```

## Build status

- ✅ Phase 1 — Scrape and reference
- ✅ Phase 2 — Astro scaffold, brand tokens, layouts, header, footer
- ✅ Main pages built (32 routes)
- ⬜ Phase 3 — Content migration from Webflow CSVs (Stories, Newsletters, Directors)
- ⬜ Phase 6 — Blackbaud donation forms
- ⬜ Phase 7 — Partner portal, Stripe shop, Pagefind search

## Decisions and open questions

See `docs/00-decisions/decision-log.md` and `docs/00-decisions/open-questions.md`.

Currently OPEN: Q1 (homepage hook copy — placeholder shipping with the $50/mo
"send a pastor" framing), Q2 / Q3 (team subset and design treatment), Q5
(pastors vs churches portal split), Q7 (nav real-estate).

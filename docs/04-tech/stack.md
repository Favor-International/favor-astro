# Stack

The locked technology choices for favorintl.org.

## Framework: Astro

- **Why:** Static-first, ships near-zero JS by default, supports
  islands when interactivity is needed, has first-class Markdown and
  MDX collections for the Stories CMS.
- **Version:** Latest stable Astro 5.x at project start.
- **Adapter:** `@astrojs/cloudflare` for Cloudflare Pages.
- **Renderers:** Add `@astrojs/react` only when we need a complex
  client island (donation form, dashboard, search). Otherwise plain
  Astro components.

Install:
```bash
npm create astro@latest favorintl -- --template minimal --typescript strict --no-install --no-git
cd favorintl
npm install
npm install @astrojs/cloudflare @astrojs/sitemap @astrojs/mdx
```

## Hosting: Cloudflare Pages

- **Why:** Free for our traffic level, auto-deploys from GitHub `main`,
  edge caching baked in, Functions for forms and dynamic endpoints,
  no Node server to maintain.
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Node version:** 20 (pin in `.nvmrc` and in Pages settings)
- **Branch deploys:** `main` is production, all other branches deploy
  to a preview URL.

## Media: Cloudflare R2

- **Why:** S3-compatible, no egress fees, lives next to Pages, supports
  signed URLs for partner-only resources.
- **Buckets:**
  - `favor-public-media` (photos, videos, public PDFs)
  - `favor-partner-resources` (gated, signed URLs only)
- **Images:** Resize at build time via `astro:assets` for static images
  and on-the-fly via Cloudflare Images for editor-uploaded content.

## Donations: Blackbaud (Raiser's Edge NXT)

- **Why:** Already Favor's CRM and donor system of record.
- **API:** Blackbaud SKY API.
- **Auth:** OAuth 2 with refresh token, stored as Cloudflare Pages
  secret. Token refresh runs in a Pages Function on schedule.
- **Webhooks:** Inbound webhook to flag a new gift, used to trigger
  auto-login email and dashboard provisioning.
- **Recurring:** Native Blackbaud recurring gift creation.
- See `04-tech/integrations/blackbaud.md` for the full integration
  spec.

## Shop: Stripe

- **Why:** Smallest possible overhead for the modest book and merch
  shop. No headless cart, just Stripe Checkout per product.
- **Mode:** Stripe Checkout Sessions, redirect flow. No SCA pain, no
  custom cart UI.
- **Products:** Managed in Stripe Dashboard, mirrored into MDX
  collection in the repo for SEO landing pages.

## Email: Mailchimp

- **Why:** Already in use. Strong segmentation. Decent automations.
- **API:** Standard Mailchimp Marketing API.
- **Sync:** New newsletter signups created via Pages Function on form
  submit. Blackbaud → Mailchimp segmentation handled by Blackbaud sync
  rules.

## CMS: file-based first, headless if needed

- **Default:** Markdown / MDX in `src/content/` collections, edited by
  developers via PRs.
- **If a non-dev needs to publish:** Add Decap CMS as a static admin
  panel against the same Markdown files. Auth via GitHub OAuth.
- **Backup option:** Sanity if Decap proves limiting. Avoid moving to
  WordPress or Contentful.

## Search: Pagefind

- **Why:** Static-built search index, runs entirely on the client,
  zero server cost.
- **Build:** Run `pagefind` after `astro build` in the Pages build
  command.

## Analytics: Plausible (primary), GA4 (secondary)

- **Plausible:** Cookieless, lightweight, GDPR-clean.
- **GA4:** Only if Favor leadership specifically needs the
  Google-native dashboards. Anonymize IP, no cross-site tracking, no
  ad personalization.

## Error tracking: Sentry (optional)

- Sentry on Pages Functions only. Frontend errors logged via the same
  endpoint. Free tier is sufficient.

## Form spam protection

- Cloudflare Turnstile on every form. Free, replaces reCAPTCHA, no
  Google dependency.

## Domains and DNS

- Apex: `favorintl.org` → Cloudflare Pages.
- `www.favorintl.org` → 301 redirect to apex.
- Email DNS untouched. The rebuild does not move email hosting.

## Environment matrix

| Env       | Branch        | URL                              |
|-----------|---------------|----------------------------------|
| Local     | any           | `localhost:4321`                 |
| Preview   | feature/*     | `<branch>.favorintl-rebuild.pages.dev` |
| Staging   | `staging`     | `staging.favorintl.org`          |
| Production| `main`        | `favorintl.org`                  |

## Secrets

Stored as Cloudflare Pages environment variables. Never committed.

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
CLOUDFLARE_R2_ACCESS_KEY_ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY
TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
```

Local dev uses `.dev.vars` (Wrangler convention), never committed.

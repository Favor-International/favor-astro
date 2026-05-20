# Build Plan — Phases

The rebuild ships in phases. Each phase is a public, deployable
milestone. No phase blocks on a later phase. Earlier phases inform
later ones.

## Phase 0 — Preparation (current)

**Goal:** Folder complete, decisions resolved, assets in hand.

Deliverables:
- All open questions resolved or scoped (`00-decisions/`).
- Brand assets dropped into `01-brand/assets/`.
- Existing site scraped (`06-reference/existing-site-scrape/`).
- Photography pipeline confirmed (which photos exist, gaps identified).
- Vendor credentials gathered (Blackbaud, Stripe, Mailchimp).

**Exit:** Folder is shippable to a developer or another Claude
instance and that instance can start coding without asking what to
build.

## Phase 1 — Scaffold and brand

**Goal:** Empty Astro site with tokens, fonts, and the global shell.

Deliverables:
- Repo created, Cloudflare Pages connected, auto-deploy working.
- `SiteHeader`, `SiteFooter`, `BaseLayout`, `PageLayout` built.
- Design tokens in CSS, Montserrat self-hosted.
- `/`, `/about/`, `/give/`, `/pray/`, `/go/`, `/impact/` all return a
  valid page using the standard template, even if content is
  placeholder.
- 404 page styled.

**Exit:** A new visitor can navigate the full nav structure without
hitting a broken route. Lighthouse 95+ on the placeholder pages.

## Phase 2 — Homepage

**Goal:** Production-quality homepage with all bands.

Deliverables:
- Hero (variant decided based on Q1 resolution).
- Signature phrase band.
- Pillars band (requires Q4 resolution).
- Stories band (pulling from at least 3 real stories).
- Stats band with real numbers from FY2025 report.
- Become a Favor Partner band (with placeholder form, full integration
  comes in Phase 4).
- Pray, Go, Newsletter, Footer bands.

**Exit:** Homepage is the canonical example of every component pattern
the rest of the site will use.

## Phase 3 — Content pages

**Goal:** Every page in the sitemap is real, no `lorem ipsum`.

Deliverables:
- About hub: team page, board page, accountability page, history,
  contact.
- Impact hub: four pillar pages, stories index, field updates index,
  proof page.
- Pray hub: prayer overview, 30-day guide download page.
- Go hub: vision trips, volunteer.
- Initial set of stories (target: 8 real stories live).
- Resources library populated.

**Exit:** A visitor can complete every primary path in the sitemap and
finds real content at the end.

## Phase 4 — Donations

**Goal:** Real giving, end to end, Blackbaud-backed.

Deliverables:
- Donation form component, three steps, Blackbaud-integrated.
- One-time, monthly, and project-restricted flows.
- Webhook handler, magic-link partner provisioning.
- Thank-you page with shareable copy.
- Tax-receipt verification (Blackbaud sends).
- Cover-the-fee toggle wired.
- International giving routing page.

**Exit:** A live test gift moves real money, generates a real receipt,
provisions a real partner account.

## Phase 5 — Partner portal

**Goal:** Logged-in dashboard for monthly partners.

Deliverables:
- Magic-link login flow.
- Giving dashboard pulling from Blackbaud.
- Resource library gated to logged-in partners.
- Favorites feature.
- Update payment method flow (Blackbaud).
- Pastors and Churches portals built (pending Q5 resolution).
- Ambassador portal stub if Q7 resolves to add it.

**Exit:** A monthly partner can log in, see their giving history,
update their card, and access partner-only resources.

## Phase 6 — Shop

**Goal:** Stripe-powered book and merch shop.

Deliverables:
- Product pages for the books Will is publishing.
- Stripe Checkout integration.
- Thank-you page, webhook fulfillment notification.
- Inventory display, shipping rates configured.

**Exit:** A test purchase processes, fulfillment alias gets the
notification, customer gets a Stripe receipt.

## Phase 7 — Search and performance polish

**Goal:** Site search and final perf tuning.

Deliverables:
- Pagefind index built and search UI on `/search/`.
- Lighthouse 100/100/100/100 on the homepage and one inner page.
- Image audit (all photos have alt text, all are properly sized).
- Accessibility audit passes WCAG 2.1 AA.
- All redirects from the old site in place.

**Exit:** Site is launch-ready.

## Phase 8 — Launch

**Goal:** Cutover from old site to new.

Deliverables:
- DNS cutover plan documented.
- Final content review and approval from Carole.
- Backup of old site (already in `06-reference/`).
- Launch checklist completed.
- Search Console submitted.
- Social and email announcement scheduled.

**Exit:** favorintl.org serves the new site. Old site archived.

## Phase 9 — Post-launch iteration

**Goal:** Optimize based on real traffic.

- Monthly Plausible review.
- A/B test the homepage hero hook variants once enough traffic
  accumulates.
- Add countries and stories as the field reports come in.
- Bring on Decap CMS if the publishing rhythm justifies it.

# SEO Plan

The site is static, fast, and content-rich, which is the SEO floor.
The strategy layered on top targets nonprofit due-diligence queries,
missionary support queries, and the specific theological and
geographic terms Favor's audience actually searches for.

## Keyword targets

### Tier 1 — brand and direct intent

- "Favor International"
- "Favor International missions"
- "support African missionaries"
- "indigenous African missionaries"
- "donate to African missionaries"

### Tier 2 — high intent, mid-volume

- "monthly missionary support"
- "support a pastor in Africa"
- "Christian nonprofit ECFA Africa"
- "fund African pastor training"
- "Portable Bible Schools"
- "GIFT Institute Africa"

### Tier 3 — long tail, story-driven

- "[country] missionary stories" (per nation served)
- "[country] pastor training" (per nation served)
- "vision trip [country]"

Each Tier 3 keyword is covered by a story or program page, not a
landing page.

## On-page rules

- One H1 per page.
- Title tag: 50-60 characters, page-specific.
- Meta description: 140-160 characters, partner-as-hero phrasing.
- Open Graph image: 1200x630, page-specific photo with logo overlay.
- Canonical link on every page.
- `lang="en"` on the html element.

## URL structure

- Lowercase, hyphenated, no trailing slash inconsistency (pick one and
  stick to it; Astro default is trailing slash, keep it).
- No dates in URLs for evergreen content.
- Stories: `/impact/stories/<slug>/`
- Field updates: `/impact/field-updates/<slug>/`
- Resources: `/resources/<slug>/`

## Schema markup

Add JSON-LD for:

- `Organization` on the homepage (with logo, address, sameAs to
  social).
- `NonprofitOrganization` schema extension where supported.
- `Article` on every story and field update.
- `Person` on team and board profile pages.
- `BreadcrumbList` on internal pages.
- `FAQPage` on the FAQ section if we build one.

## XML sitemap

`@astrojs/sitemap` integration generates it at build time. Submitted
to Google Search Console post-launch.

## Robots

```
# public/robots.txt
User-agent: *
Allow: /

Sitemap: https://favorintl.org/sitemap-index.xml
```

## Old URL preservation

After scraping the existing favorintl.org (see `06-reference/`), map
every legacy URL to its new home. Add 301s in `_redirects`. Especially
preserve:

- High-traffic story permalinks.
- Donation page URLs that might be in print collateral.
- PDF resource URLs that pastors and churches have bookmarked.

## Content velocity targets

- 2 stories per month (alternating country focus).
- 1 field update per month.
- 1 resource added per quarter.

The CMS structure supports this without dev intervention.

## Local SEO

Not a primary channel for an international nonprofit, but:

- Set up Google Business Profile for Favor International at the
  Valrico FL address.
- Add `LocalBusiness` schema as a secondary type to the homepage.

## Performance as SEO

- Core Web Vitals all green.
- Image lazy loading by default (Astro `Image` component).
- No render-blocking third-party scripts in the head.
- Plausible loaded async or via Cloudflare proxy.

---
source: "https://www.compassion.com/"
also: "https://www.compassion.com/sponsor-a-child/sponsor-children.htm"
captured_at: "2026-05-19"
viewports_captured: [375, 768, 1440]
purpose: "Secondary visual reference for the Favor International rebuild. Use alongside Destiny Rescue. Copy the structure, not the visual identity."
---

# Compassion International — band-by-band breakdown

Compassion is the closest large-scale nonprofit to Favor's mission: indigenous
church-based ministry in the developing world, with a clear partner-action
hook ("Sponsor a child for $X / month"). Compassion is more institutional
than Destiny Rescue but the conversion mechanics are the same.

## Typography stack (from devtools)

- **Family:** `neighbourSans` (proprietary, similar to Montserrat / Inter)
- **Body:** 16px / 400 / line-height 18.4px / pure black on white
- **H1:** 48px / 600 / white on dark photo overlay
- **H2:** 40px / 600 / pure black
- **Primary button:** blue `#2a5eec`, 16px / 600 white text, generous padding

**Takeaway:** Favor uses Montserrat 800 for the display H1 (per brand book),
which is heavier than Compassion's 600. Hold the brand book — the heavy weight
is intentional and on-brand. The lesson from Compassion is the **size scale**
(48 / 40 / 16 with tight line-heights) and the **3-card grid bias**.

## Homepage band order (1440px)

1. **Hero (Band 1).** Full-bleed photo of kids playing soccer in a village.
   Left-aligned white H1 over a left-side dark gradient scrim. H1 reads
   *"Release a Child From Poverty in Jesus' Name"* — partner-as-hero verb,
   theological qualifier. One white outlined CTA, one tertiary text link below.
2. **3-card give grid (Band 2 — primary conversion).** Headline: *"Fight
   Child Poverty. Give Right. Now Care & Eternal Hope."* Three large image
   cards stacked horizontally on desktop, each a give path. White background.
   This is the *conversion moment*, mid-page, exactly like Destiny Rescue's
   monthly band but with three options instead of one.
3. **Mission band.** *"Jesus Changes Everything for Children in Poverty."*
   Two-column layout — heading + paragraph left, supporting image right.
   Their version of Favor's brand-anchor "Where others will not go" band.
4. **Stats band (Band 4 — proof).** White background. Three large
   percentages in deep blue (`97% / 92% / 90%`). Tiny black captions under
   each number. No CTA on this band, purely evidentiary.
5. **Quote band.** Full-bleed photo (father and daughter walking) with deep
   navy gradient overlay. Large white quote text centered. *"Child Sponsorship
   Empowers Children to Leave Poverty Behind"* style. Used as a pause beat,
   like Destiny Rescue's pause-beat photo band.
6. **Programs grid (Band 5).** *"Compassion International's Love in Action."*
   Three image cards with video play-icon overlays — Bible, Family, Friends.
   Each routes to a program page. Three-card horizontal grid, same as Band 2.
7. **Newsletter signup (Band 6).** Solid dark navy band. Heading + single
   email input + CTA. Microcopy below.
8. **Footer.** Five-column dense footer on dark navy. Logo + tagline
   top-left, columns of nav links, social row, trust marks pinned.

## What Compassion teaches that Destiny Rescue doesn't

- **Three-card grids are the dominant conversion unit.** Whenever the page
  needs to offer multiple paths (give methods, programs, stories), it's three
  cards in a horizontal grid on desktop, stacked on mobile. Avoid the
  "tile wall" of 8+ options that Webflow's old `/give/` page used.
- **Large statistic numbers as the proof beat.** Three percentages in a row,
  big-typography, no chart-junk. Favor's Band 5 spec already calls for this;
  Compassion confirms the pattern works.
- **Video thumbnails with a play icon** are how they introduce program pages.
  Favor's `/impact/[pillar]/` pages should follow this when video assets
  exist.
- **Dark navy as a quote-band background.** Compassion's quote bands use a
  dark navy gradient over field photography. Favor's brand book reserves dark
  green (`#2b4d24`) for this purpose; same pattern, different hue.
- **Currency hook above the fold on the sponsor page.** Compassion's sponsor
  page leads with a country-of-need photo plus the price-per-month framing.
  Favor's `/give/` page should do the same with the Favor Partner tier
  amounts ($25 / $50 / $100 / $200 / $500 / $1,200).

## What we are *not* copying

- The neighbourSans typeface — Favor stays on Montserrat per the brand book.
- The blue primary button — Favor uses gold (`#e1a730`).
- The "Release a child" pity-imagery framing of Compassion's hero — Favor's
  brand book explicitly bans sad-eyed child portraits and white-savior
  composition. Use real ministry-in-progress photos instead.
- The video play overlays unless we actually have field-shot video. Don't
  fake them with stock.

## Decisions reinforced by Compassion

- **3-card pattern over 4-pillar pattern.** The doc's IMPACT section calls for
  four ministry pillars. On the homepage, render them as a 4-card grid since
  there are exactly four. On the give page, render three primary tiles
  (Partner Monthly, One-Time, DAF) above a secondary row, matching the
  diagram in the v2.1 doc.
- **Headline pattern: short imperative + theological qualifier.** Their
  *"Release a Child From Poverty in Jesus' Name"* is the template. Favor's
  equivalent is something like *"Send a pastor where others will not go"* —
  short, verb-led, partner-as-hero, with the signature phrase as the
  theological qualifier.

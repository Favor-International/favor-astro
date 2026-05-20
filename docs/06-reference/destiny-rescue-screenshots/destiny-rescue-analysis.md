---
source: "https://destinyrescue.org/"
also: "https://destinyrescue.org/donate/"
captured_at: "2026-05-19"
viewports_captured: [375, 768, 1440]
purpose: "Visual reference for the Favor International rebuild. Copy the structure, not the visual identity."
---

# Destiny Rescue — band-by-band breakdown

The Destiny Rescue homepage is the canonical model for the Favor homepage band
order. This file records what we observed at 375px, 768px, and 1440px, plus
the computed style tokens pulled from devtools. Screenshots live next to this
file.

## Typography stack (from devtools)

- **Family:** Montserrat (loaded from Google Fonts at runtime). The Favor
  rebuild self-hosts the same family, so the type stack lines up.
- **Body:** 16px / 400 / line-height 22.86px / color `#212222` (near-black).
- **H1:** 58px / 800 / dark on light.
- **H2:** 36px / 400 / `#e26826` (the brand orange) — they use the H2 as a
  decorative subheading in the brand accent color, not as a structural header.
  Favor's brand book uses 700/800 for H2 in dark green, so we deviate here.
- **Buttons:** Montserrat 13px / 700 / white text on `#f37121` (orange).
  Favor's primary button is gold (`#e1a730`) with near-black text.

> **Takeaway:** Same font family, similar weight scale, different color
> philosophy. We copy the type rhythm (display-weight H1, light-weight decorative
> H2, sans-serif throughout), not the orange.

## Homepage band order (1440px)

The page is a vertical stack of full-width bands. No carousel as hero.
Each band has one purpose and one CTA. Bands butt up against each other with
0 gap; the visual rhythm is created by alternating background colors.

1. **Sticky nav.** Logo left, top-level nav center, language picker and a
   gold/orange GIVE NOW button right. Background is transparent over the hero
   image and goes opaque on scroll. Same pattern we want.
2. **Hero (Band 1).** Full-bleed photo of a smiling girl. Left-side text
   block over a left-leaning warm-orange gradient scrim. H1 reads
   *"You can rescue a child from sexual exploitation."* Subhead carries the cost
   framing implicitly (their model uses a Rescue Partner monthly amount). Primary
   CTA is a single orange button. There is no carousel, no autoplay video, just
   one still image with a strong gradient.
3. **Trust strip.** A thin row sitting just below the hero: years operating,
   countries, kids rescued, and ECFA accreditation logo. Favor's brand book
   already calls for this.
4. **"Real impact. Real lives." (Band 2 — proof).** Cinematic full-bleed
   photo of a child walking down a dirt road at golden hour. Heavy bottom
   gradient. Decorative italic-feel H2 in the orange accent color. One short
   paragraph below. No CTA on this band; it is intentionally a pause beat.
5. **Become a Rescue Partner (Band 3 — primary conversion).** Solid orange
   panel that fills most of the viewport. Heading is white on orange.
   Body copy frames the partner as the hero ("Your monthly gift...").
   Single white outlined button "BECOME A RESCUE PARTNER". This is the band we
   model the Favor Partner band on directly. **It is positioned as the third
   band, two scrolls into the page, which fits the "visible without scrolling
   past more than two full sections" rule in homepage-bands.md.**
6. **Visual breath (Band 4).** A near-white band with one photo and a single
   line of body text. Establishes a quiet beat before the next push.
7. **Dark stat / story band (Band 5).** Solid near-black background. Big white
   stat number or short headline. Used for emphasis. We use the same pattern
   for the Impact Numbers band (Favor's Band 5) but in dark green
   (`#2b4d24`), not black.
8. **Recent Stories (Band 6).** Two horizontal dark cards, each with a
   thumbnail, a short heading, and a "READ MORE" link. Slider arrows hint at
   pagination but the actual interaction is a simple horizontal swipe on mobile.
   Favor's brand-book explicitly disallows carousels for hero, so we render
   this as a static three-card grid instead.
9. **Newsletter signup (Band 7).** Dark red-to-orange gradient band with
   subtle background imagery. Single-field email input + submit. Microcopy
   above: *"Receive updates from the frontlines."* Tight, fast, no name
   capture, no consent boxes. Direct lift target for Favor's Band 10
   newsletter band.
10. **Footer.** Dense five-column footer on desktop, dark grey. Logo and
    address top-left, columns of nav links across, social icons row at the
    bottom. ECFA / Charity Navigator / Guidestar logos pinned in the footer.

## Donate page band order (1440px)

The give page is built around tiles, not a single donation form on the page.
Each tile is a clear path to a specific donor type.

1. **Hero band.** Same nav, but with a donate-specific hero photo and a
   single inline "Give once / Give monthly" mini form. Big amount input,
   frequency toggle, single CTA. Above-the-fold conversion.
2. **Become a Rescue Partner panel.** Same primary conversion moment as on
   the homepage, repeated near the top of the give page.
3. **Rescue a Child band.** Mid-tier child-sponsor framing with a single
   accent photo.
4. **Way-to-give tiles.** A vertical stack of one-line orange-bordered tiles:
   GIVE ONLINE, GIVE MONTHLY, GIVE BY CHECK, HONOR, CRYPTO, HUMAN ASSISTED FUND,
   GIFTS OF STOCK, PLANNED GIVING, DONATE CRYPTO, FOUNDATIONS AND FAMILY
   TRUSTS, CORPORATE MATCHING, ADVISORS AND BROKERS. Each is a single button-
   row that expands or routes. This is the spine of the Favor `/give/` hub
   plan in approved-sitemap-v2.1.md — same tile system, fewer rows for us
   because Favor's gift catalog is shorter.
5. **Donor login band.** "Already a donor?" with a sign-in button. Routes to
   the partner portal. Matches the PARTNER button in the Favor nav.
6. **Footer (shared).**

## Hero treatment specifics

- **Photo only**, no autoplay video. Single still asset, full-bleed.
- **Gradient scrim** runs from the left, warm orange to transparent. The
  gradient covers roughly the left third on desktop, full width on mobile.
- **Text sits left.** Heading first, subhead under, CTA below. No reverse
  contrast text against the uncovered side.
- **Headline is 5-7 words.** Verb-led, partner-as-hero, lowercase except for
  the proper noun "Destiny Rescue" usage elsewhere.

For Favor: same approach, swap the orange gradient for `rgba(43, 77, 36, 0.55)`
(brand dark green) per the brand book.

## Monthly giving moment placement

- **Homepage:** Band 3 of 8. Roughly one viewport scroll down from the top
  on a 1440x900 desktop. Solid orange panel. Single CTA.
- **Donate page:** Repeated near the top as a panel, then the tile grid
  expands the options below it.

This matches the conversion rule in Favor's `homepage-bands.md`: the
**Become a Favor Partner** band is the highest-priority band after the hero
and must be visible without scrolling past more than two full sections.

## Footer density

- 5 columns wide, full-width dark background.
- Order left-to-right: brand block (logo, address, social) → ABOUT links →
  HOW WE HELP links → DONATE links → RESOURCES links → CONTACT block.
- ECFA, Charity Navigator, Guidestar Platinum trust logos pinned at the
  bottom of the brand-block column.
- Copyright line is single line, centered, lighter weight.

For Favor: dark green background instead of dark grey, otherwise the same
column structure.

## Mobile behavior (375px)

- The hero photo is cropped to a near-square. Headline stays large but wraps
  to 3-4 lines.
- The Rescue Partner panel goes full-width single-column. Button stays full
  width. Nothing collapses to "tap to expand".
- The recent stories cards stack one above the other; the slider arrows on
  desktop disappear on mobile in favor of vertical scroll.
- Footer columns collapse to a single column accordion.

## What we are *not* copying

- The orange color identity. Favor's palette is gold (`#e1a730`) and dark
  green (`#2b4d24`).
- The italic-feel decorative H2. Favor uses Montserrat 700/800 for H2 in
  dark green.
- The "rescue a child" urgency-and-rescue tone. Favor's tone is missionary-
  equipping with a longer arc.
- The five-tier donate-tile grid with crypto and corporate-matching front and
  center. Favor's `/give/` tiles per approved-sitemap-v2.1 are: Partner
  Monthly (lead), One-Time, Specific Project, Church Partnership, Foundation,
  Legacy, Non-Cash, International.

## Open follow-ups

- The exact pixel values for the Destiny Rescue hero gradient stops were not
  captured (the screenshot is enough). If we want a perfect token, re-grab
  via devtools when building the hero component.
- The trust strip below the hero on Destiny Rescue is a static set of stats.
  Favor's Band 1 trust strip needs the FY2025 numbers from `Impact Reports`
  before we wire it.

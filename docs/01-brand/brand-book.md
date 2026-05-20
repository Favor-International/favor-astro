# Favor International Brand Book

This document is the source of truth for visual and verbal identity on
the rebuild. If a CSS file or a layout disagrees with this document,
this document is correct and the code is wrong.

## Tagline and signature phrase

- **Tagline:** Transformed Hearts Transform Nations.
- **Signature phrase:** Where others will not go.

Use the tagline in the footer, on the about page, and once on the
homepage. Use the signature phrase as a section divider, on hero
overlays, and as a hashtag.

## Color palette

| Role           | Name        | Hex     | Use                                          |
|----------------|-------------|---------|----------------------------------------------|
| Primary brand  | Gold        | #e1a730 | Primary CTAs, accent rules, brand highlights |
| Light gold     | Light Gold  | #e0c081 | Subtle backgrounds, hover states             |
| Earth accent   | Terracotta  | #a36d4c | Secondary accents, illustrations             |
| Neutral warm   | Tan         | #ba9a86 | Backgrounds, dividers                        |
| Primary dark   | Green       | #2b4d24 | Body text on light, dark headers, footers    |
| Mid neutral    | Sage        | #8b957b | Muted text, secondary type                   |
| Light neutral  | Light Sage  | #c5ccc2 | Subtle section backgrounds                   |
| Page base      | White       | #ffffff | Dominant page background                     |
| Type primary   | Near-black  | #1a1a1a | Long-form body copy                          |

**Ratio rule (80 / 15 / 5):**

- 80% white space and light neutrals.
- 15% greens, tans, and sages.
- 5% gold and terracotta accents.

White-dominant always. The gold is a spice, not a base. Do not flood
hero sections with gold.

## Typography

- **Family:** Montserrat (self-host the WOFF2 files in `/public/fonts`,
  do not pull from Google Fonts at runtime).
- **Weights:** 300, 400, 600, 700, 800.
- **Body:** Montserrat 400, 16px base, 1.6 line-height.
- **Headings:** Montserrat 700 or 800. Tight tracking, generous leading.
- **Display (hero):** Montserrat 800, 56-80px depending on viewport.
- **Smallcaps for labels:** Montserrat 600, 12px, letter-spacing 0.12em,
  uppercase.

Do not pair Montserrat with a serif unless the page is a long-form
story essay. In that case, use Source Serif Pro or Lora for body, and
keep Montserrat for headings.

## Logo

The Favor International logo lives in `assets/logos/`. Three required
formats:

- `favor-logo-full-color.svg` (primary)
- `favor-logo-white.svg` (for dark backgrounds)
- `favor-logo-green.svg` (single-color)

Clear space: minimum 1x logo height on all sides. Minimum size: 32px
height on screen.

Never:
- Stretch or skew the logo.
- Add drop shadows.
- Place on a busy photo without a scrim.
- Re-color outside the approved palette.

## Photography direction

Favor's strength is real field photography. Use it. Avoid stock.

**What we want:**
- Indigenous African pastors and missionaries doing the work.
- Real worship, real teaching, real baptisms, real homes.
- Children laughing or learning, never staged as objects of pity.
- US partners on vision trips, in context with field leaders.
- Wide environmental shots showing the place, not just close-ups.

**What we never use:**
- White-savior framing (Western adult center-frame with African
  children clinging).
- Sad-eyed portraits with manipulative lighting.
- AI-generated faces.
- Generic stock library shots of Africa.

**Treatment:**
- Natural color grading. No heavy filters. No vignettes.
- Slight warm push (toward 6500K) is acceptable for cohesion.
- Captions are required on every featured photo: name, role, country.

## Iconography

- Line icons, 1.5-2px stroke, rounded caps.
- Use Lucide as the base set. If a custom icon is needed, match the
  Lucide stroke weight and corner radius.
- Icon color follows text color, not brand gold, unless the icon is a
  decorative section accent.

## Components shorthand

- **Corner radius:** 8px on cards and buttons, 4px on inputs, 0 on
  full-bleed bands.
- **Shadows:** Soft, low-spread, low-opacity. `0 1px 3px rgba(43, 77,
  36, 0.08)`. No double shadows.
- **Buttons:** Primary is gold background (#e1a730) with near-black
  text (#1a1a1a). Secondary is outlined green (#2b4d24) on white.
  Tertiary is text link, green, underline on hover.

## Voice (full version in `02-content/voice-and-tone.md`)

- Partner-as-hero.
- "You" before "we" on every page.
- Bold, theologically grounded, Christ-is-King-now confidence.
- No corporate buzzwords. No nonprofit-industrial-complex phrases like
  "lift up", "amplify voices", "marginalized communities", "lived
  experience", or "equity work".
- No em-dashes.

# Page Template Spec

Every internal page (not the homepage, not the give page, not the
portal pages) follows this template. Consistency makes the site faster
to build and easier for users to navigate.

## The five sections

```
┌────────────────────────────────────────────────────────┐
│  Header (sticky, transparent on hero, opaque on scroll)│
├────────────────────────────────────────────────────────┤
│                                                        │
│   1. HERO                                              │
│      - H1 page title                                   │
│      - One-sentence promise (the partner-as-hero hook) │
│      - One photograph (full-bleed or 60/40 split)      │
│      - Optional: breadcrumbs above the H1              │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│   2. MAIN CONTENT                                      │
│      - Story, data, programs, people                   │
│      - Two-column where it helps, single column when   │
│        it doesn't                                      │
│      - Pull quotes and stats are welcome               │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│   3. PROOF                                             │
│      - One real name, one real place, one real outcome │
│      - Photo with caption                              │
│      - Pull quote in Montserrat 700, 32px              │
│      - Country tag                                     │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│   4. PRIMARY CTA                                       │
│      - One verb, one button                            │
│      - Pray, Give, or Go                               │
│      - Full-width gold band, 80px vertical padding     │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│   5. FOOTER                                            │
│      - Newsletter signup                               │
│      - Related links (max 3)                           │
│      - Global footer below (separate component)        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Hard rules

- **One H1 per page.** Always.
- **One primary CTA per page.** Other CTAs may exist but are visually
  secondary.
- **Proof section is required.** No anonymous outcomes.
- **Hero photo is mandatory.** No text-only heroes.
- **No carousels.** Ever.

## Vertical rhythm

- Section vertical padding: 96px desktop, 64px tablet, 48px mobile.
- Content max-width: 1200px. Prose max-width: 720px.
- Section gap (between bands): 0. Bands butt up against each other.

## Breakpoints

| Name | Min width |
|------|-----------|
| sm   | 480px     |
| md   | 768px     |
| lg   | 1024px    |
| xl   | 1280px    |
| 2xl  | 1536px    |

Mobile-first CSS. Tailwind-style breakpoint prefixes if Tailwind is
adopted. Otherwise vanilla media queries against these values.

## Accessibility floor

- All interactive elements keyboard-reachable.
- Focus states visible (2px gold ring with offset).
- Color contrast 4.5:1 minimum on body text, 3:1 on large text.
- Alt text on every photo. "Decorative" is allowed only for genuine
  ornament.
- Skip-to-content link in the header.
- Form labels visible (no placeholder-only labels).

## Hero section variants

- **Variant A — Full-bleed photo, text overlay.** Use when there is a
  strong single image. Add a left-side gradient scrim (rgba(43, 77,
  36, 0.55) → transparent) for legibility.
- **Variant B — 60/40 split.** Text left, photo right. Use when the
  page is content-heavy and the photo is supporting.
- **Variant C — Stat hero.** Big number + caption + small supporting
  photo. Use for Impact pages.

Pick one per page. Do not mix.

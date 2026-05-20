# Component Library

Components are organized by where they live. Build each one as an
Astro component (`.astro`), use React/Vue islands only where
interactivity demands it (donation form, search, dashboard).

## Naming convention

- Astro components: `PascalCase.astro` in `src/components/`.
- Layouts: `PascalCase.astro` in `src/layouts/`.
- Domain folders: `components/give/`, `components/portal/`,
  `components/story/`, etc.

## Layout components

| Name              | Purpose                                                  |
|-------------------|----------------------------------------------------------|
| `BaseLayout`      | HTML shell, head, meta, fonts                            |
| `PageLayout`      | Standard internal page (5-section template)              |
| `PortalLayout`    | Authenticated portal page (left sidebar, top bar)        |
| `LandingLayout`   | Campaign landing pages (no global nav, minimal footer)   |

## Global components

| Name              | Purpose                                                  |
|-------------------|----------------------------------------------------------|
| `SiteHeader`      | Sticky nav, transparent over hero, opaque on scroll      |
| `SiteFooter`      | Dark green footer with full site map and ECFA            |
| `NavDropdown`     | Two-level menu, used for PARTNER and GIVE                |
| `GiveNowButton`   | The persistent gold CTA in the nav                       |
| `PartnerButton`   | Portal access in the nav                                 |
| `SkipToContent`   | Accessibility link, first focusable element              |
| `CookieNotice`    | **Only build if legally required.** See CLAUDE.md.       |

## Content components

| Name                | Purpose                                              |
|---------------------|------------------------------------------------------|
| `HeroFullBleed`     | Hero variant A                                       |
| `HeroSplit`         | Hero variant B (60/40)                               |
| `HeroStat`          | Hero variant C (big number)                          |
| `BandSignature`     | The "Where others will not go" band                  |
| `BandPillars`       | The 4-pillar cards row                               |
| `BandStories`       | Featured stories row                                 |
| `BandStats`         | Dark green impact numbers row                        |
| `BandPartner`       | Become a Favor Partner conversion band               |
| `BandPray`          | Pray prompt band                                     |
| `BandGo`            | Vision trips band                                    |
| `BandNewsletter`    | Email capture band                                   |
| `StoryCard`         | Photo + name + country + outcome + link              |
| `ProofBlock`        | The required proof section on internal pages         |
| `PullQuote`         | Large Montserrat 700 quote with attribution          |
| `StatTile`          | Single big-number tile                               |
| `PillarCard`        | Icon + title + description + link                    |
| `TeamCard`          | Staff/board card with optional click-through         |
| `CountryTag`        | Pill-shaped country label, sage background           |
| `TrustStrip`        | ECFA, 501c3, nations served, years operating         |
| `BreadcrumbNav`     | Above-H1 breadcrumbs                                 |

## Form components

| Name                | Purpose                                              |
|---------------------|------------------------------------------------------|
| `NewsletterForm`    | Email-only, Mailchimp endpoint                       |
| `ContactForm`       | Name, email, message, topic select                   |
| `FoundationInquiry` | Foundation due-diligence inquiry                     |
| `ChurchInquiry`     | Church partnership form                              |
| `PrayerRequest`     | Optional prayer request submission                   |

## Donation components (Blackbaud-backed)

| Name                | Purpose                                              |
|---------------------|------------------------------------------------------|
| `DonationForm`      | The canonical Blackbaud-integrated form              |
| `AmountSelector`    | Tile picker for amounts + custom                     |
| `FrequencyToggle`   | One-time / Monthly                                   |
| `DesignationSelect` | Project or pillar restriction                        |
| `DonationConfirm`   | Confirmation page component                          |
| `RecurringNotice`   | Clear notice for monthly recurring                   |

## Portal components

| Name                | Purpose                                              |
|---------------------|------------------------------------------------------|
| `PortalSidebar`     | Authenticated portal navigation                      |
| `GivingDashboard`   | Logged-in partner's giving summary                   |
| `ResourceCard`      | Downloadable resource card                           |
| `FavoriteToggle`    | Star icon to favorite a resource                     |
| `LoginForm`         | Email + password (or magic link, preferred)          |

## Shop components (Stripe-backed)

| Name                | Purpose                                              |
|---------------------|------------------------------------------------------|
| `ProductCard`       | Cover image, title, price                            |
| `ProductDetail`     | Full PDP                                             |
| `BuyButton`         | Stripe Checkout redirect                             |

## CTA tokens

A single source of truth for the language on every CTA. Imported, not
hardcoded.

```js
// src/lib/cta.js
export const CTA = {
  partnerMonthly: 'Become a Favor Partner',
  giveOnce: 'Give Once',
  giveProject: 'Fund This Project',
  pray: 'Pray With Us',
  prayerGuide: 'Get the 30-Day Guide',
  visionTrip: 'Travel With Favor',
  volunteer: 'Serve From Home',
  contact: 'Contact Us',
  newsletter: 'Send Me the Field Report',
  shop: 'See the Shop',
};
```

If a designer or developer wants a new CTA verb, it lands here first,
not in a component.

## Component status tracker

Track in a separate `component-status.md` later. Stub format:

```
| Component       | Spec'd | Built | Reviewed | Notes |
|-----------------|--------|-------|----------|-------|
| SiteHeader      |   ✅   |   ⬜  |    ⬜    |       |
| HeroFullBleed   |   ✅   |   ⬜  |    ⬜    |       |
```

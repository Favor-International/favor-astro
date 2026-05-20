# Approved Sitemap v2.1 — Favor International

**Status:** Locked unless overridden in `decision-log.md`.
**Source:** `Favor_International_-_Site_Map_v2_1.docx`, approved May 2026.
**Open items:** see `open-questions.md`.

## Primary navigation

```
PRAY | GIVE | GO | IMPACT | ABOUT
```

Always-visible utility buttons: **PARTNER** (portal login) and
**GIVE NOW**.

Maximum two menu levels deep. Internal links same tab. External links
new tab.

## Full sitemap

```
favorintl.org/
├── /                                  Homepage
├── /pray/                             Prayer overview
│   └── /pray/30-day-guide/            30-day prayer guide
├── /give/                             Give hub (segmented tiles)
│   ├── /give/partner-monthly/         Become a Favor Partner (LEAD TILE)
│   ├── /give/one-time/                One-time gift
│   ├── /give/specific-project/        Project-restricted giving
│   ├── /give/church-partnership/      Church giving workflow
│   ├── /give/foundation/              Foundation / DAF inquiry
│   ├── /give/legacy/                  Legacy giving
│   ├── /give/non-cash/                Stocks, crypto, non-cash
│   └── /give/international/           UK / Canada / EU routes
├── /go/                               Go hub
│   ├── /go/vision-trips/              Travel with Favor
│   ├── /go/volunteer/                 Local volunteering
│   ├── /go/internships/               Internships
│   ├── /go/careers/                   Career opportunities
│   └── /go/church-partnerships/       Church partnership info
├── /impact/                           Impact hub
│   ├── /impact/evangelism-discipleship/    Pillar #1 — PBS, GIFT, House of Prayer, Favor FM
│   ├── /impact/education/                  Pillar #2 — VLCs, Primary/Secondary, Leadership
│   ├── /impact/community-development/      Pillar #3 — Counseling, Medical, Church planting
│   ├── /impact/economic-empowerment/       Pillar #4 — Sustainability, Women, Vocation
│   ├── /impact/stories/               Stories from the field
│   ├── /impact/field-updates/         Recent reports
│   ├── /impact/impact-reports/        Annual + quarterly impact reports
│   ├── /impact/media/                 Media gallery
│   └── /impact/proof/                 Numbers, ECFA, financials
├── /about/                            About hub
│   ├── /about/mission-vision/         Mission and Vision
│   ├── /about/our-story/              History and founding
│   ├── /about/where-we-work/          Country and region map
│   ├── /about/team/                   Staff page (alphabetical, subset per Carole)
│   ├── /about/board/                  Board page (split per S. Maier)
│   ├── /about/statement-of-faith/     Doctrinal statement
│   ├── /about/accountability/         ECFA, 990s, financials
│   ├── /about/history/                Founding, milestones
│   └── /about/contact/                Contact form, address
├── /partner/                          Portal landing (logged-out)
│   ├── /partner/pastors/              For Pastors (portal)
│   ├── /partner/churches/             For Churches (portal — see Q5)
│   └── /partner/dashboard/            For Current Partners (logged-in)
├── /shop/                             Stripe-powered shop
├── /stories/                          Blog / Stories from the field
├── /resources/                        Downloadable PDFs, promo material
├── /newsletter/                       Signup + archive
├── /search/                           Site search
├── /legal/                            Privacy, terms, cookies
└── /sitemap.xml                       SEO sitemap (auto-generated)
```

## Page-level decisions (locked)

### Homepage

- Carole and Terry are **not** featured on the homepage.
- Homepage is a 3,000-foot view of who Favor is. (NOTE: Stephanie
  flagged this — see open-questions Q1. The intent is partner-as-hero
  with the org as guide, not org bio.)
- Real transformation stories and impact numbers on the homepage.
- Full-width visual bands, modeled on Destiny Rescue.
- Dedicated **"Become a Favor Partner"** band mid-page. Monthly giving
  is its own moment, not buried under Give.
- ECFA trust badges visible on the homepage, not only in the footer.
- Partner path: attract → inform → engage → give.

### Team and Leadership

- **Decision update (Stephanie):** Split into two pages. Staff is its
  own page, alphabetized. Board is its own page with distinct
  treatment. Not the whole staff per Carole's direction (see Q2 for
  what subset shows).
- US team is featured, not only the founder.

### IMPACT — the four ministry pillars (resolved per v2.1 doc, Q4 closed)

| # | Pillar | Sub-programs |
|---|--------|--------------|
| 1 | Evangelism + Discipleship | Portable Bible Schools (PBS), GIFT Leadership Institute, House of Prayer, Favor FM (Christian Radio) |
| 2 | Education | Village Learning Centers, Primary + Secondary Schools, Leadership Training |
| 3 | Community Development | Trauma Counseling, Medical Services, Church Planting + Construction |
| 4 | Economic Empowerment | Sustainability Projects, Women's Empowerment, Vocational Programs |

### Monthly Partner Tiers (locked per v2.1 doc)

| Tier | Amount / mo | Theme |
|------|-------------|-------|
| Equip   | $25  | Tools and Bibles |
| Send    | $50  | Field worker support |
| Educate | $100 | School and VLC student |
| Heal    | $200 | Trauma counseling + medical |
| Transform | $500 | Pastor training cohort |
| Founders' Circle | $1,200 | Full village impact (lead tier) |

These are the suggested tiles on the Become-a-Favor-Partner band and on
`/give/partner-monthly/`. Custom amounts allowed.

### Give page

- Modeled on the Destiny Rescue donation page.
- **"Become a Favor Partner"** is the lead tile (primary action).
- Remaining tiles segment by audience and gift type.
- Alternative giving methods (stocks, crypto, legacy, non-cash) are
  secondary tiles on this page, not standalone nav items.

### Partner Portals

Login-based resource hubs accessible from the PARTNER button in nav.
Gated so content can be personalized.

| Portal              | Voice                                                                                            | Content lead       |
|---------------------|--------------------------------------------------------------------------------------------------|--------------------|
| For Pastors         | "How we help pastors equip leaders" (not "how pastors partner with us")                          | Josh               |
| For Churches        | "How your church can be part of what God is doing in East Africa" (consolidation pending, Q5)    | Josh               |
| For Current Partners| "See what your generosity is making possible"                                                    | Jennifer (partner care) |

Pastors portal content: Portable Bible Schools, GIFT Institute, pastor
testimonies, inquiry form.

Churches portal content: Church partnership tiers, vision trips, promo
resources, ambassador info.

Current Partners content: Impact updates, giving history link
(Blackbaud), exclusive partner resources.

## Backend architecture (locked)

**Platform**
- Astro static site
- Cloudflare Pages
- Cloudflare R2 media
- Blackbaud API for donations
- Stripe for Shop
- Mailchimp (or equivalent) for email
- Lightweight CMS for Stories and Field Updates

**Partner Portal features**
- Auto-login after first gift
- Personalized giving dashboard
- Exclusive partner resources and content library
- Favorited resources
- Two-way Blackbaud / CRM sync

**Donation system**
- Multiple pathways (monthly, one-time, project-specific)
- DAF integration (DAFpay, TrustBridge)
- Foundation giving inquiry form
- Church partnership workflow
- International giving routes (UK, Canada, EU)
- Stripe for Shop
- Campaign-specific landing pages

**Content management**
- Blog / Stories from the Field (SEO-optimized)
- Media gallery with country and program filters
- Resources library (downloads, promo materials)
- Newsletter archive

## User types and journeys (paths)

| User Type | Primary Goal | Key Path |
|-----------|--------------|----------|
| First-time visitor | Understand Favor | Home → About → Impact |
| Prayer-first visitor | Pray with Favor | Home → Pray → 30-Day Guide |
| Potential partner | Evaluate credibility | About → Accountability → Impact → Give |
| One-time giver | Make a gift | Home → Give → Give Once |
| Monthly partner | Become a Favor Partner | Home → Give → Partner Monthly |
| Church leader | Partner a church | Partner → For Churches → Give → Church Partnership |
| Foundation officer | Due diligence | About → Accountability → Give → Foundation |
| Vision trip prospect | Travel with Favor | Home → Go → Vision Trips |
| Volunteer | Serve locally | Home → Go → Volunteer |
| Pastor | Equip leaders in the field | Partner → For Pastors → PBS → GIFT Institute |
| Current partner | See impact, manage account | Partner → For Current Partners → Dashboard |

## Page template (every internal page)

1. Hero section: page title, one-sentence promise, one photo.
2. Main content area: story, data, programs, people.
3. Proof: one real name, one real place, one real outcome.
4. Call-to-action: a single clear next step (Pray, Give, or Go).
5. Footer: newsletter signup and related links.

One primary CTA per page. Every page ends with action.

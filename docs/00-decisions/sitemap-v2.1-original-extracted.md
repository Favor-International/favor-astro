# **Favor International Website Redesign**

## **Site Map, Wireframe, and Architecture Document**

** ****Version 2.1 | May 2026**

## **KEY DECISIONS FROM PLANNING AND LANGUAGE REVIEW**

**Homepage Guidelines**

·      Carole and Terry are NOT featured on the homepage

·      Homepage is a 3,000-foot view of who Favor is

·      Real transformation stories and impact numbers live on the homepage

·      Partner journey focus: attract → inform → engage → give

·      Homepage uses full-width visual bands (modeled on Destiny Rescue)

·      Dedicated “Become a Favor Partner” band mid-page (monthly giving is its own moment, not buried under Give)

·      ECFA trust badges visible on the homepage, not just in the footer

**Staff and Leadership Display**

·      Our Team page combines staff and board (alphabetical, egalitarian)

·      Board of Directors included on same page with distinct section

·      US team is featured, not just the founder

**Navigation**

·      Primary navigation: PRAY | GIVE | GO | IMPACT | ABOUT

·      Always-visible GIVE NOW button in nav

·      IMPACT section shows four ministry pillars plus stories, field updates, and proof of impact

·      Maximum two menu levels deep

·      Internal links same tab; external links new tab

·      PARTNER button in nav for login-based portals (For Pastors, For Churches, For Current Partners)

·      Always-visible GIVE NOW button in nav alongside PARTNER button

**Language**

·      Partner-as-hero voice throughout (from Language Strategy v2)

·      “You” before “we” on every page

·      Monthly giving community branded as Favor Partners

·      Signature phrase: “Where others will not go”

·      Every page ends with one clear action (Pray, Give, or Go)

## **PROPOSED SITEMAP STRUCTURE**

*favorintl.org/ [see diagram above]*

## **GIVE PAGE — SEGMENTATION MODEL**

Modeled on the Destiny Rescue donation page. “Become a Favor Partner” is the lead tile (monthly giving is the primary action). The remaining tiles serve different giving audiences. Alternative giving methods (stocks, crypto, legacy, non-cash) are secondary options on this page, not standalone navigation items.

## **PARTNER PORTALS**

These are login-based resource hubs accessible from the PARTNER button in the nav. Each portal serves a specific partner type with tailored content, resources, and next steps. They are gated behind a login so content can be personalized.

**For Pastors**

·      Voice: “How we help pastors equip leaders” (not “how pastors partner with us”)

·      Content: Portable Bible Schools, GIFT Institute, pastor testimonies, inquiry form

·      Content lead: Josh

**For Churches**

·      Voice: “How your church can be part of what God is doing in East Africa”

·      Content: Church partnership tiers, vision trips, promo resources, ambassador info

·      Content lead: Josh

**For Current Partners**

·      Voice: “See what your generosity is making possible”

·      Content: Impact updates, giving history link (Blackbaud), exclusive partner resources

·      Content lead: Jennifer (partner care)

## **BACKEND ARCHITECTURE AND FEATURES**

**Platform and Infrastructure**

·      Astro static site framework

·      Cloudflare Pages hosting

·      Cloudflare R2 media storage

·      Blackbaud API integration for donations

·      Stripe for Shop checkout

·      Newsletter integration (Mailchimp or equivalent)

·      Lightweight CMS for Stories and Field Updates

**Partner Portal and Logged-In Features**

·      Auto-login after first gift

·      Personalized giving dashboard

·      Exclusive partner resources and content library

·      Favorited resources feature

·      Two-way Blackbaud / CRM sync

**Donation System Requirements**

·      Multiple giving pathways (monthly, one-time, specific projects)

·      DAF integration (DAFpay, TrustBridge)

·      Foundation giving inquiry form

·      Church partnership workflow

·      International giving routes (UK, Canada, EU)

·      Stripe for Shop (books, merchandise)

·      Campaign-specific landing pages

**Content Management**

·      Blog / Stories from the Field (SEO-optimized)

·      Media gallery with country and program filters

·      Resources library (downloads, promo materials)

·      Newsletter archive

## **USER TYPES AND JOURNEYS**

| User Type | Primary Goal | Key Path |
| --- | --- | --- |
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

## **PAGE TEMPLATE STRUCTURE**

Every internal page follows the same structure for consistency and easier development.

**Standard Internal Page Template**

1.        Hero section — page title, one-sentence promise, one photo

2.        Main content area — story, data, programs, people

3.        Proof — one real name, one real place, one real outcome

4.        Call-to-action — a single clear next step (Pray, Give, or Go)

5.        Footer — newsletter signup and related links

One primary CTA per page. Every page ends with action.

*Favor International | Where others will not go. Prayer-birthed. Indigenous-led. Partner-powered.*
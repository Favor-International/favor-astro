# Homepage Competitive Audit, Below the Fold

Status: working brief, v10 build (May 2026)
Goal: identify what to fix on the rest of the homepage by comparing the live site at favor-astro.pages.dev against the five most relevant Christian international ministry sites.

---

## 1. What's on Favor's homepage right now (below hero)

| # | Band | Purpose | Visual treatment |
|---|---|---|---|
| 2 | Signature phrase | "Where others will not go." plus John 9:4 | White bg, centered, text-only |
| 3 | Four pillars | Evangelism, Education, Community, Economic | Light-sage bg, 4 photo cards 3:4 |
| 4 | Stories | Ethiopia Bibles, Daniel Kidia, Goats for Women | White bg, 1 lead plus 2 stacked |
| 5 | Impact numbers | 89%, 14, $8.36M | Deep-green bg, photo backdrop, big gold numbers |
| 6 | Partner card | 6-tier monthly grid | White outer, green inset card |
| 7 | Pray and Go | 30-day guide, vision trips | Two-panel split, photo each side |
| 8 | Newsletter | Field report signup | Sage-light, single pill input |
| 9 | Trust strip | ECFA, Charity Nav, Candid | Cream, three hand-drawn SVG badges |

Plus footer. Nine bands of roughly equal height with strict alternating backgrounds (white, sage, white, green, white, green-card, split-band, sage, cream).

---

## 2. The five comparables

Picked for closest audience and mission overlap, weighted toward sites Favor's donor sees regularly.

| Org | Why it's in the set | FY budget order of magnitude |
|---|---|---|
| Compassion International | Gold standard for Christian donor UX, child-sponsorship leader | $1B+ |
| World Vision | Largest Christian humanitarian, sets industry norms | $1.4B+ |
| Samaritan's Purse | Franklin Graham, disaster plus evangelism overlap | $900M+ |
| Voice of the Martyrs | "Where others will not go" parallel, persecution-focused | $80M+ |
| Wycliffe Bible Translators | Closest mission parallel (sends indigenous workers, scripture-focused) | $230M+ |

---

## 3. Section-by-section pattern map

What sections each site has below the hero, in rough order. Numbers indicate order down the page; "no" means absent.

| Pattern | Compassion | World Vision | Samaritan's Purse | VOM | Wycliffe | Favor today |
|---|---|---|---|---|---|---|
| Mission/why anchor (text-only) | no | 2 (faith) + 5 (eyes of Jesus) | 3 (about) | no | 1 + 2 (why translation, global church) | B2 (signature) ✓ |
| Multiple program/pillar cards | 2 (3-card give actions) | 3 (4 program cards w/ CTAs) | no | 6 (3 prayer cards) | 3 (5-icon "next step") | B3 (4 pillars) ✓ |
| Story carousel/grid | 5 (6-slide video carousel) | 6 (3 articles) | 4 (15+ horizontal scroll) | 2 (magazine feature) | 1 link | B4 (1+2 stories) ✓ |
| Impact stats panel | 3 (3 stats) | 7 (pie chart) | no | 8 (4 stats) | 1 inline | B5 (3 stats) ✓ |
| Donation block w/ amount presets | no | no | 1 (modal $20/50/100/200) | 7 ($25/50/100/other) | no | B6 (monthly tiers only) ⚠ |
| Prayer surface | no | no | no | 6 (3-card "Ways to Pray") | 3 (icon) | B7-left ✓ |
| Field/go/volunteer surface | no | no | no | no | 3 (icon) | B7-right ✓ |
| Newsletter signup | 6 (form) | no | footer | 11 (form) | 4 (form embedded) | B8 ✓ |
| Trust badge strip | footer | footer | footer | no | no | B9 ✓ (only site with dedicated band) |
| Sticky urgency banner | no | no | 1 (modal) | no | 5 (dismissible footer) | missing ⚠ |
| Magazine/publication promo | no | no | no | 3 (free magazine) | no | n/a |
| Video on the page | yes (carousel) | no | no | no | no | missing ⚠ |
| Founder/personality | implicit | no | yes (Franklin Graham) | no | no | missing (Carole Ward not on home) ⚠ |
| Map / geo visual | no | no | no | no | no | missing (but nobody has it) |
| Scripture as design moment | no | no | no | no | 4 (pull-out) | inline only |

---

## 4. Things Favor is doing better than the comparables

Worth keeping and protecting in the next iteration:

1. **Cleanest editorial rhythm.** VOM and Samaritan's Purse look cluttered, with competing CTAs, mixed badge sizes, and no breathing room. Favor's 9-band cadence is calmer.
2. **Dedicated trust strip (Band 9).** Every comparable buries ECFA and Charity-Nav logos in the footer. Favor's full-band treatment is a real differentiator for donor trust.
3. **6-tier monthly grid.** No comparable exposes a structured monthly partnership ladder on home. Compassion makes you click into Sponsor; VOM gives you presets but only one-time. Favor's tier grid is more sophisticated donor onboarding.
4. **"Where others will not go."** Sharper positioning than any comparable. Wycliffe's "Because all people should be able to understand…" is the closest, but Favor's phrase has more friction.
5. **Pray plus Go split-band.** A more elegant dual-CTA than the typical card grid (compare VOM's 3-card "Ways to Pray", same idea, less design discipline).

---

## 5. What's likely making "below the fold" feel weak, and the fix

Five concrete problems, ordered by impact.

### 5.1 The band rhythm is too even, so nothing reads as a "moment"

**What the comparables do.** Compassion's page has one big bright "Sponsor a Child" hero-card moment, then everything else is supporting. Wycliffe has one strong "Be Part of God's Global Mission" 5-icon grid, then everything supports. Samaritan's Purse has the carousel as the dominant feature.

**What Favor does.** Nine bands of similar visual weight. The pillars (B3), stories (B4), impact (B5), partner card (B6), and pray+go (B7) are all "feature-sized." There's no peak.

**Fix.** Pick one band to dominate. Suggest **B6 (Partner card)** since that's the conversion goal. Make it 30% taller, give it more breathing room above and below, lean into the green and gold to make it the visual climax of the scroll. Reduce B5 impact stats and B9 trust into smaller supporting roles.

### 5.2 No video, no motion, no life

**What the comparables do.** Compassion has a 6-slide video carousel on home (chef story, confident child, Alice's story, medical, WaSH, leaders). Field video converts harder than any other asset in this category.

**What Favor does.** Zero motion. Every photo is a static background. The pillars use a hover-zoom trick, but you have to find it.

**Fix.** Add one inline 30 to 60 second field video as a B4-bis between Stories and Impact. Per the project rule against auto-play, present it as a click-to-play poster frame with a play affordance over a field photo. Even a single PBS-class clip would change the energy of the page.

### 5.3 The "give" surface is monthly-only on home

**What the comparables do.**
- VOM: $25, $50, $100, Other one-time buttons, plus a "more giving opportunities" link.
- Samaritan's Purse: pop-up modal with $20, $50, $100, $200 to "Where Most Needed."
- Compassion: three explicit action cards (Sponsor a Child, Donate to a Cause, Give a Gift).

**What Favor does.** Band 6 is six monthly tiers. The one-time, project, and non-cash options are pushed to a small text line under the CTA ("Prefer to give once?…").

**Fix.** Either (a) move alt-give to its own row of three buttons inside the partner card, or (b) add a small B6.5 "one-time gift" strip with preset amounts and a single button. The monthly-tier story is good, but roughly 30% of first-time donors give one-time. We're hiding that path.

### 5.4 The signature band (B2) is a heavy lift right after the hero

**What the comparables do.** Wycliffe leads below-fold with the *why* but pairs it immediately with concrete numbers and faces. World Vision does its faith block at #2 but supports it with a scripture quote and a faith-and-impact framing, never plain text on white.

**What Favor does.** Hero photo, then a centered text-only band with a 5.5rem display phrase, a 56-character lede, and a scripture box. No image. After a deep-green photo hero, white-text-only is a hard drop in visual energy.

**Fix.** Three options:
- **(A) cut it.** Move "Where others will not go" into the hero (it's already the hero eyebrow in spirit) and let B3 pillars open the page.
- **(B) compress it.** Drop signature to roughly 50% height, single line, gold rule, no body paragraph. Make it a transition, not a destination.
- **(C) co-design it.** Pair the phrase left, with a tight photo right (a pastor on a trail). Asymmetric 60/40.

Recommend **B** for v11, **C** for v12.

### 5.5 The trust badges (B9) look hand-drawn

**What the comparables do.** WV, Compassion, and SP all use the actual ECFA logo, Charity Navigator's four-star mark, and Candid's seal: the real assets, sized small, in a row. Recognizability is the whole point.

**What Favor does.** Inline-SVG approximations (shield-with-checkmark for ECFA, star for Charity Navigator, circle-C for Candid) with text labels. Looks bespoke, not credentialed.

**Fix.** Swap to the official badge assets from each org's brand page (all three publish download packages for accredited orgs). Keep the cream band, keep the layout, change the art.

### 5.6 Smaller calls (do these, but they're not urgent)

- **Founder presence.** Samaritan's Purse uses Franklin Graham as trust. Favor has Carole Ward (on the field since 2002). One small founder-quote moment near the partner card would land. Pull-quote treatment, one sentence, headshot.
- **"14 nations" deserves a map.** No comparable has one, which is exactly why Favor having one would stand out. Could be a small B5-bis between Impact and Partner: a stylized East and Central Africa silhouette with 14 pins.
- **Urgency hook.** Wycliffe has a dismissible footer banner for the current campaign. Favor has nothing dated. Consider a small banner above the footer for the current month's specific need.

---

## 6. Recommended v11 plan

In order of effort vs. impact:

1. **Compress B2 signature** (option B above), 30 min, immediate rhythm improvement.
2. **Replace trust SVGs with official badge assets in B9**, 1 hr, big credibility lift.
3. **Add alt-give row to B6 partner card** (one-time, project, non-cash as three real buttons), 1 hr, recovers the one-time donor.
4. **Make B6 the visual peak** (taller card, more contrast above and below), 2 hr, gives the scroll a destination.
5. **Add one founder pull-quote** between B5 and B6, 1 hr, founder trust.
6. **Add one click-to-play field video** between B4 and B5, 2 hr (depends on asset availability), biggest energy change.

Items 1 through 4 are pure CSS and markup. Items 5 and 6 need real assets (founder quote and headshot, field video file). Ask Will to confirm what's available before scoping.

---

## 7. Open questions for Will

- Do we have a field video asset (even 30s of b-roll) that could live on home?
- Is there a Carole Ward quote and headshot we can use as a small pull-quote?
- Should we keep the B2 signature band, or move "Where others will not go" entirely into the hero?
- Is there a current campaign or monthly urgency we should be promoting in a sticky banner?

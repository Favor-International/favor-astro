# Homepage Competitive Audit, Below the Fold

Status: working brief, v10 build (May 2026). Revised v2 after reading the locked specs.
Goal: identify what to fix on the rest of the homepage. Bound by the locked sitemap and homepage-bands spec.

**Read first**
- `docs/00-decisions/approved-sitemap-v2.1.md` (locked IA, tier ladder, pillars)
- `docs/03-design/homepage-bands.md` (locked 11-band order and visual rules)
- `docs/03-design/give-page-segments.md` (segmentation belongs on /give/, not home)

---

## 1. What I actually looked at

Six full-page screenshots at 1440 wide, captured from a headless Chromium against the live sites:

- favor-astro.pages.dev (v10 build)
- compassion.com
- worldvision.org
- samaritanspurse.org
- persecution.com (Voice of the Martyrs)
- wycliffe.org

The five comparables are the closest mission-recognition matches in the Christian international ministry space. Compassion, World Vision, and Samaritan's Purse are the three most recognized donor brands. Voice of the Martyrs is included for the "where others will not go" parallel. Wycliffe is included because it sends indigenous workers, which is the closest model match for Favor.

---

## 2. v10 vs. locked spec (deviation audit)

The spec is the source of truth. v10 has drifted in several places. Listing each:

| Band | Spec | v10 build | Disposition |
|---|---|---|---|
| B2 signature | "Sparse. White background. Dark green type. **No photo.**" | text-only on white | matches spec |
| B3 pillars | **Icon cards**, icon + name + one-line + Learn more | **Photo cards**, 3:4 aspect, dark scrim | DEVIATION, revert to icons |
| B4 stories | 3 featured cards, photo + name + country + outcome | 1 lead + 2 stacked layout | minor variation, acceptable |
| B5 impact | Green band #2b4d24, gold accent on numbers | Matches | matches spec |
| B6 partner | **"Gold band (#e1a730) with dark text. Photo of a field leader."** | Dark green inset card, no field-leader photo | DEVIATION, revert to gold band |
| B7 Pray | Light tan bg, photo, "You can pray where they cannot reach" | Dark scrim panel inside split-band | partial, see B8 |
| B8 Go | **Separate band**, white bg, 2-3 vision-trip cards | Merged into B7 split-band, no trip cards | DEVIATION, keep merge (approved exception, see §5), but add trip cards back |
| B9 field updates | Latest 3 stories from CMS | Replaced with trust strip | DEVIATION, see §5 trust decision |
| B10 newsletter | Single-field email, light sage | Matches | matches spec |
| Trust marks | Hero strip + footer only | Dedicated trust band added | DEVIATION, keep (approved exception, see §5) |
| Tier ladder | Equip $25, Send $50, Educate $100, **Heal $200**, Transform $500, **Founders' Circle $1,200** | `src/lib/site.ts` matches markdown exactly; diagram is out of date | code matches markdown spec |

The tier-amount conflict (markdown says $200 / $1,200 / Founders' Circle; the diagram says $250 / $1,000 / Movement) needs a decision-log entry. Defaulting to markdown until resolved.

---

## 3. What the comparable screenshots tell us (visual gestalt)

Walking the five sites top to bottom, what each does that Favor either matches, misses, or beats.

### 3.1 Compassion International

The gold standard for Christian donor UX. The page maintains **photo presence in every band**. Hero is a girl in a red wrap. Immediately below: a 3-card photo grid for the three giving actions (Sponsor / Donate to a Cause / Give a Gift). Then a calm 3-stat band (97% / 92% / 90%). Then a **full-bleed lifestyle photo with overlay text** ("Child Sponsorship Empowers Children to Leave Poverty Behind"). Then a video carousel with visible play arrows on each thumbnail. Then a dense blue newsletter band. Footer.

What it does that Favor doesn't: photo continuity across every band. The page never drops into "text on color" territory.

### 3.2 World Vision

Photo hero of children at a desk. Faith framing right below ("Your partner in faith…and impact"). Then a **4-card program grid** with each card having photo + headline + one stat + CTA, this is closely analogous to Favor's B3 pillars, but the WV photos are color-varied (kids reading, water, food) so the row doesn't read as a wall. Then "3 ways we earn your trust" in a cream icon block. Then "Eyes of Jesus" 3-icon faith band. Then a News & Stories text article list. Then a small donut chart of expenses. Then a logo-row footer with Charity Navigator, BBB, ECFA, Candid, CharityWatch as real brand assets.

What it does that Favor doesn't: real badge assets in the footer (not hand-drawn SVGs). Color variety across pillar/program cards.

### 3.3 Samaritan's Purse

Looks the weakest of the five. A header strip with "Operation Heal Our Patriots." Then a **dense editorial story grid**, 6+ stories with category color tags (color-coded by program). Then a "Where Most Needed" donation widget with **preset amount buttons** ($20 / $50 / $100 / $200) and a green Give button. Then a circle-framed About Us block. Footer.

What it does that Favor doesn't: surface a one-time gift widget with preset amounts on the homepage. (For Favor this belongs on /give/, but the principle of "one-click give" is missing from home.)

### 3.4 Voice of the Martyrs

The "where others will not go" parallel. Hero is **Help Christians Driven From Their Homes**. Then two card cluster (magazine + feature). Then a **full-width persecution world map** with color-coded countries (Restricted / Hostile / Monitored). Then a 3-card "Ways to Pray." Then a family-photo giving block with preset amounts. Then a 4-stat impact grid (each stat paired with a small field photo). Then a 4-cover book/resources grid. Then About + 12-photo gallery. Then a brown-band "Stay Connected" newsletter.

What it does that Favor doesn't: a **geographic visual** that anchors the mission's scope. The persecution map is the page's single biggest visual moment. Favor mentions "14 nations" but doesn't show them.

### 3.5 Wycliffe Bible Translators

Hero is women in white. Then a teal mission band: "Should Be Able To Understand God Loves Them" with **three asymmetric photo circles** to the right of the text, a clever way to keep photo presence without a full grid. Then "The Global Church" text. Then "Be Part of God's Global Mission" 5-icon next-step grid.

What it does that Favor doesn't: pair the philosophy text with photo circles instead of leaving it as pure text on white.

---

## 4. What's wrong with Favor's below-the-fold (visual problems)

Seven specific problems from the screenshot evidence, ordered by impact.

### 4.1 Photo continuity dies after the hero

Compassion has photo content in every band. Favor's photos cluster in B3 pillars and B7 pray+go. B2 signature, B5 (faint backdrop only), B6 partner card, B8 newsletter, and B9 trust are all "text on background color." When you scroll past the hero the visual energy drops fast. This is the single biggest difference between Favor and Compassion at a glance.

### 4.2 B2 is the biggest individual visual cliff

The 5.5rem display phrase on plain white right after the photo hero is a hard drop. The spec calls for this exact treatment ("sparse, white, no photo"), so the cliff is intentional. But none of the comparables do this. The decision to keep is: spec says yes, comparable evidence says no.

### 4.3 B3 pillar row reads as a brown wall

Per the spec these should be icon cards, not photo cards. v10 made them photo cards and the four photos are all earth-tone field shots with similar composition, so the row looks like one undifferentiated brown band. Reverting to icon cards per spec would fix this in one step.

### 4.4 B6 dark green card is hiding under surrounding white

The spec calls for a **gold band** (#e1a730) with dark text and a field-leader photo. v10 built a dark green inset card on white. The gold band would put real conversion weight on the most important moment on the page (monthly giving), tying it visually to the gold hero CTA. The current dark green card just sits there.

### 4.5 B4 lead-story card has awkward white space

The lead photo is small relative to the white rectangle below it. The sidebar cards are squished. Compassion's story carousel has tighter photo-to-text ratios.

### 4.6 B7 panels are both dark, so they merge

Both panels use heavy dark scrims and read as a single dark band rather than two distinct CTAs. Differentiating them (one dark, one light) would restore the dual-invitation reading.

### 4.7 B9 trust badges look hand-drawn

Three large outlined circles with hand-drawn SVG shields, stars, and a circled "C." Compare to World Vision's footer logo strip, which uses the real brand assets sized small. WV's badges are instantly recognizable; Favor's read as placeholders.

---

## 5. What v10 is doing better than the comparables (and should keep)

Three things genuinely beat the comparables:

1. **The B5 impact moment (89% / 14 / $8.36M).** Bigger, more confident, more emotionally weighted than WV's polite gray pie chart or VOM's persecution-tag legend. The single strongest visual moment on the entire Favor page. Don't change.
2. **The B7 split-band concept (pray + go in one band).** More elegant than VOM's 3-card prayer grid or any of the other comparables' approaches. This is a spec deviation but a deliberate one, recommend logging it as an approved exception. The problem isn't the concept, it's that both panels are dark (see §4.6).
3. **The dedicated B9 trust band.** All comparables bury trust marks in the footer. A dedicated band is a real differentiator for donor confidence. Spec deviation but worth keeping, recommend logging it as an approved exception. The problem isn't the band, it's the badge art (see §4.7).

---

## 6. v11 plan

Ordered by risk + impact. Spec-compliance items first (low risk, high impact), visual polish second, decisions to flag third.

### 6.1 Spec-compliance fixes (do these first)

1. **B3 pillars: revert to icon cards** per spec. Icon + pillar name + one-line description + "Explore this pillar" link. Light sage background. Fixes the brown-wall problem in one step. Effort: 2 hr (icons can come from Lucide).
2. **B6 partner band: revert to gold band** per spec. #e1a730 background, dark green text, photo of a field leader to the right or as background with strong scrim. Keep the 6-tier ladder. Replace the alt-give text line with a single "See all ways to give →" link to /give/ (the segmentation belongs on /give/, not home). Effort: 3 hr.
3. **Tier amounts**: verified, `src/lib/site.ts` already matches the locked markdown spec exactly. The diagram you sent ($250 Heal, $1,000 Movement) is out of date. Recommend updating the diagram, not the code. Effort: zero (code is already correct), plus a decision-log entry to flag the diagram drift.

### 6.2 Visual polish within spec

4. **B9 trust band: swap hand-drawn SVGs for real badge assets** from ECFA, Charity Navigator, and Candid. Keep the cream band, keep the layout, change the art. Effort: 1 hr (assets are downloadable from each org's brand page).
5. **B7 split-band: differentiate the two panels.** Keep one with the dark green scrim (Pray), lighten the other to a cream or warm-white treatment (Go) so they read as two distinct invitations. Restore 2-3 vision-trip cards inside the Go panel per spec B8 content. Effort: 2 hr.
6. **B4 stories: tighten the lead-story card** so the photo-to-text ratio matches the comparables. Reduce the white gap between photo and excerpt. Effort: 1 hr.

### 6.3 Approved-exception decisions to log

Three v10 deviations from spec that I recommend keeping. Each needs a one-line entry in `docs/00-decisions/decision-log.md`:

- **Keep B7+B8 merged as a split-band.** Reason: more elegant than two separate bands; the dual-CTA reading is stronger when paired. (Adds trip cards to the Go side per fix #5.)
- **Keep the dedicated B9 trust band.** Reason: a genuine differentiator against comparables; no Christian-international comparable surfaces trust this prominently. (Fixes the badge art per fix #4.)
- **Keep B4 stories as 1 lead + 2 stacked** (not 3 equal cards per spec). Reason: gives the editorial layout one feature story per cycle, which suits the long-form nature of Favor's stories.

### 6.4 Larger calls (need Will's input)

- **Geographic visual.** VOM's persecution map is their strongest visual moment. Favor's "14 nations" framing is begging for a small East/Central Africa map with country pins. Possible add as a small B5-bis between Impact and Partner. Decision needed because the spec doesn't reserve a slot for it.
- **Field video.** Compassion has a video carousel; nobody else does, and it's a real differentiator. Per the rule against auto-play, render as a click-to-play poster with a play affordance. Needs an actual video asset. Possible add as a small B4-bis between Stories and Impact.
- **B9 field updates band per spec** (latest 3 stories). v10 replaced this slot with trust. Should we add it back as a new B9.5 between Newsletter and Trust? Or drop it entirely?
- **B2 signature.** Spec is "no photo." Comparable evidence suggests pairing with imagery would help. Recommend keeping per spec for now (brand anchoring intent is clear) and revisiting after the higher-impact fixes ship.

---

## 7. What I am NOT recommending (corrections to v1 of this audit)

- ~~Pair B2 phrase with a photo~~, spec mandates no photo.
- ~~Cut B6 to 4 visible tiers~~, 6 tiers are locked per the sitemap.
- ~~Add an alt-give row to B6~~, segmentation belongs on /give/, not on home.
- ~~Vary pillar photos to fix the brown wall~~, the right fix is icon cards per spec, not better photos.

---

## 8. Open questions

- Sign-off on the v11 plan in §6, proceed, or revisit?
- Tier amounts: confirm the markdown spec is canonical (Heal $200, Founders' Circle $1,200) and the diagram you sent needs an update.
- Is there a field video asset (even 30s of b-roll) usable for the optional B4-bis?
- Is there a Carole Ward quote and headshot for a founder pull-quote?
- Add geographic map and field-updates band, or hold for v12?

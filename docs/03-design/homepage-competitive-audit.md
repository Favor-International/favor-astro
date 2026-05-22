# Homepage Competitive Audit, Below the Fold

Status: working brief, v10 build (May 2026). Revised v3 after clarification.
Goal: identify what to fix on the rest of the homepage.

**What's locked, what's open**
- **Structure is locked.** Band order, tier ladder, pillar names, the eight Give tiles, primary nav, footer trust marks. From `docs/00-decisions/approved-sitemap-v2.1.md`, `docs/03-design/homepage-bands.md`, `docs/03-design/give-page-segments.md`. Do not change.
- **Visual design is open.** "Sparse white background," "gold band," "icon cards" inside the spec docs are sketches of intent, not pixel-accurate rules. The design has to look as good as Compassion or World Vision. Where the spec sketch and the comparable evidence disagree, follow the comparable evidence.

The bar: when a donor lands on favor-astro.pages.dev they should feel they are looking at a national-scale ministry, not a small-town church site built in a Squarespace template.

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

## 2. Structural state (what bands exist, what data is locked)

v10 has the right structure: hero, signature, pillars, stories, impact, partner band, pray+go (merged), newsletter, trust strip, footer. The tier ladder in `src/lib/site.ts` matches the locked markdown exactly ($25 Equip / $50 Send / $100 Educate / $200 Heal / $500 Transform / $1,200 Founders' Circle, last tier featured).

The diagram sent in chat shows $250 / $1,000 / Movement, which conflicts with the markdown source. The code matches the markdown. Recommend updating the diagram, not the code.

Everything below this point is about visual execution, not structure.

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

## 5. What v10 is doing better than the comparables (keep)

Two things genuinely beat the comparables. Don't touch:

1. **B5 impact moment (89% / 14 / $8.36M).** Bigger and more confident than WV's polite gray pie chart or VOM's persecution-tag legend. The single strongest visual moment on the page. Keep as-is.
2. **B7 split-band concept (pray + go side by side).** Cleaner than VOM's 3-card prayer grid or any other comparable's approach. The concept is right; the execution (both panels dark) is the only problem.

The dedicated trust band (B9) is also a real differentiator since no comparable surfaces trust this prominently. The concept is good; the hand-drawn badges undercut it (see §4.7).

---

## 6. v11 plan

Ordered by visual impact. Each fix is what the comparable evidence says to do, not what the homepage-bands spec sketch says.

1. **B2 signature: kill the white wall.** Pair the phrase with imagery. Either (a) asymmetric 60/40 with a pastor-on-the-trail photo right, or (b) three small asymmetric photo circles like Wycliffe does. Drop the standalone scripture box, fold the line into the body copy. The current pure-text-on-white treatment is the single worst visual moment on the page. Effort: 2 hr.
2. **B3 pillars: fix the brown wall.** Two options that both work. (a) Keep photo cards but recolor: swap two photos to non-earth-tone contexts (water-blue, classroom interior, market color). Or (b) flip to color-blocked cards with a single color-coded illustration per pillar, no photo. WV's program grid is the model for (a); Wycliffe's icon-card row is the model for (b). Recommend (a), Favor's field photography is its real asset. Effort: 2 hr if photos exist, plus photo selection.
3. **B6 partner band: build a real conversion moment.** The current dark green card hides under the white surround. Options: (a) full-bleed gold band per spec sketch, photo of a field leader right, tier grid left, or (b) keep the green card concept but make it bigger, photo-forward, with the tier grid as a clean 2x3 horizontal row instead of the current dense layout. Either way, the partner band has to read as a destination, not a section. Effort: 4 hr.
4. **B7 split-band: differentiate the two panels.** Keep one dark (Pray), lighten the other to cream or warm-white (Go). Add visible vision-trip cards inside the Go panel so it doesn't read as the same panel as Pray. Effort: 2 hr.
5. **B9 trust band: real badge assets.** Swap the hand-drawn SVGs for the actual ECFA, Charity Navigator, and Candid brand assets sized small in a row. Keep the cream band. Effort: 1 hr.
6. **B4 stories: tighten the lead card.** Lead photo needs to be bigger relative to the white text box below. The current proportions look awkward. Effort: 1 hr.
7. **Add a founder pull-quote** between B5 and B6. One Carole Ward sentence, headshot, gold rule. Restores photo presence in the deadest stretch of the page. Effort: 1 hr, needs asset.

### Decisions to log

Three v10 deviations from the homepage-bands sketch that I recommend keeping as design decisions. Each needs one line in `docs/00-decisions/decision-log.md`:

- Pillar treatment (photo cards over icon cards), pending v11 photo refresh.
- Pray+Go as a single split-band, not two stacked bands.
- Dedicated trust band before footer.

### Larger calls (need Will's input)

- **Geographic visual.** VOM's persecution map is their strongest moment. Favor's "14 nations" framing is begging for a small East/Central Africa map with country pins. Possible add as a small B5-bis between Impact and Partner.
- **Field video.** Compassion has it, nobody else does. Real differentiator. Click-to-play poster, no auto-play. Needs a real asset.
- **Field updates band.** v10 replaced the spec B9 slot with trust. Adding a "latest 3 stories" band before Newsletter would help the page feel alive. Drop trust band concept entirely, or layer field updates above newsletter?

---

## 7. What v10 looks like vs. comparables, plainly

Compassion looks like a magazine. World Vision looks like a corporate brand. Favor v10 looks like a thoughtful Squarespace template. The hero is fine. Everything below has the same visual energy as a small-town church website, not a national-scale ministry. The 7 fixes in §6 close that gap.

---

## 8. Open questions

- Sign-off on the v11 plan in §6, proceed, or revisit?
- Tier amounts: confirm the markdown spec is canonical (Heal $200, Founders' Circle $1,200) and the diagram you sent needs an update.
- Is there a field video asset (even 30s of b-roll) usable for the optional B4-bis?
- Is there a Carole Ward quote and headshot for a founder pull-quote?
- Add geographic map and field-updates band, or hold for v12?

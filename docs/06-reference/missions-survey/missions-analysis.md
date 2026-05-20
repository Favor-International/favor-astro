---
captured_at: 2026-05-20
sites_surveyed: 9
viewports: 1440
---

# Christian Missions Homepages — Gap Analysis vs Favor

Reviewed nine homepages on 2026-05-20. Pulled what each does well, where the
patterns converge, and where the Favor v2 build is missing.

## Sites reviewed

1. **World Vision** — worldvision.org
2. **Samaritan's Purse** — samaritanspurse.org
3. **International Justice Mission (IJM)** — ijm.org
4. **Voice of the Martyrs (VOM)** — persecution.com
5. **Open Doors USA** — opendoorsus.org
6. **World Help** — worldhelp.net
7. **Compassion International** — compassion.com *(already in `compassion-screenshots/`)*
8. **Destiny Rescue** — destinyrescue.org *(already in `destiny-rescue-screenshots/`)*
9. **Wycliffe Bible Translators** — wycliffe.org

## Converging patterns

### Hero treatment

- **Photo grid heroes are the most common premium pattern.** Samaritan's Purse
  shows one large featured card on the left ("Discipling the Next Generation in
  Cambodia") plus 2-3 smaller stacked cards on the right. World Help does the
  same with a single hero image plus inline action panel. World Vision does a
  big single hero photo plus inline category cards directly below.
- **Text always sits on a darkened portion of the photo, never on a busy
  middle**. The gradient is one-directional (left dark, right clear) or
  bottom-up (bottom dark, top clear). Never an even all-over scrim.
- **Headline = imperative + audience.** *"Together, we can build a brighter
  future"* (World Vision), *"Until All Are Free"* (IJM), *"Stand with
  Persecuted Christians"* (VOM), *"Strengthen What Remains"* (Open Doors).
  Short, verb-led, partner-named.
- **One primary CTA, one color.** Orange dominates: World Vision (orange GIVE),
  Samaritan's Purse (orange), World Help (red), VOM (teal). Favor's gold (`#e1a730`)
  fits the same role.

### Trust signals

- **Real badges, not typed text.** Every site uses the actual ECFA accredited
  badge image, the Candid Platinum seal, and where applicable the Charity
  Navigator Four-Star image. None use a typed label "ECFA" pretending to be a
  trust mark.
- **Badges live in the footer, not the hero.** World Vision puts them in the
  footer plus a "3 ways we earn your trust" mid-page band. Samaritan's Purse,
  IJM, and Open Doors all keep them footer-only. The hero stays focused on the
  partner action.
- **"Earn your trust" mid-page band** (World Vision specifically) is a
  three-icon row that explains *how* the organization is accountable. Strong
  pattern that converts foundation traffic.

### Donation conversion patterns

- **Featured inline mini-donation widget** on the homepage near the bottom.
  Samaritan's Purse has *"Where Most Needed"* with $25/$50/$100/$200/$500
  amount buttons + custom + a green GIVE button. Direct, no scroll-to-form
  required. This is the strongest mid-page conversion lever I saw.
- **Specific impact framing** is hit-or-miss. World Vision uses footnoted
  claims (*"In 2024, we reached over 37.5 million people with lasting access to
  clean water"*). Compassion uses percentage ratios (97% / 92% / 90%). Destiny
  Rescue uses a "$X / day rescues a child" hook. None invent numbers; all cite
  their source.

### Recent stories / field updates

- **Three-card grids with image on top + 1-line excerpt + date.** Every site
  has this pattern. World Vision and Samaritan's Purse have it twice — once
  early in the page for impact stories, once near the bottom for field updates.
- **Dates are visible.** Stories are timestamped on the card. Adds freshness
  signal.

### Navigation

- **Top text nav, big colored CTA button right.** Universal.
- **Mega menus where they exist** open with a panel that matches the header
  state — either both transparent over hero or both white. **None** show a
  white panel under a transparent header (the bug Will flagged on v2).

### Color usage

| Site | Primary | Accent |
|------|---------|--------|
| World Vision | Orange `#F36F21` | Black |
| Samaritan's Purse | Green `#0F5D3A` | Orange `#F47B20` |
| IJM | Blue `#1A64A6` | White / orange CTAs |
| VOM | Teal `#0E8E8E` | Red |
| Open Doors | Purple `#7B2C87` | Magenta |
| World Help | Black header | Teal `#1FB6A8` + red CTAs |
| Compassion | Royal blue `#2A5EEC` | Dark navy |
| Destiny Rescue | Warm orange `#E26826` | Dark grey |
| Wycliffe | White | Teal `#067783` + orange CTAs |

Universal: one bold saturated primary + one warm secondary. Favor's dark
forest green (`#2b4d24`) plus gold (`#e1a730`) plus kelly green (`#2ea84a`) is
on-trend — but only if all three are used boldly, not muted.

## Specific patterns to copy into Favor v3

1. **Samaritan's Purse hero grid:** 1 large featured story + 2-3 smaller cards
   on the right. Each card has its own headline, country, and CTA. The whole
   thing sits above the fold on desktop, stacks on mobile.
2. **World Vision "3 ways we earn your trust" mid-page band:** an icon row
   explaining program-expense ratio, ECFA accreditation, and field-level
   reporting. Pulls foundation traffic directly into Give.
3. **Samaritan's Purse "Where Most Needed" inline give widget:** quick-amount
   buttons + custom + GIVE button, right above the footer.
4. **Real trust badges in footer:** ECFA, Candid Platinum, Charity Navigator
   Four-Star as actual image files (`/public/images/trust/`), not typed text.
5. **Story cards with dates:** every story card on the homepage carries the
   country + the month it shipped. Adds freshness.
6. **Mega menu state-matches header state:** when the header is transparent
   over the hero, the dropdown panel is *also* dark-glass styled; once scrolled
   the panel is white. Or — simpler — force the header to opaque-white
   whenever a panel is open.

## What Favor v2 is doing right (keep)

- Logo in header + footer ✓
- Mega menu with sub-route lists + featured action card ✓
- Brand color palette + kelly-green accent ✓
- Voice and dollar-claim discipline (no made-up impact-per-tier) ✓
- Per-pillar pages with PBS / GIFT / etc. spelled out ✓

## What Favor v2 is missing (build into v3)

- Photo-grid hero with directional gradient ✗
- Real ECFA, Candid, Charity Navigator badge images ✗ (have files, need to wire)
- Mid-page trust band ("3 ways we earn your trust") ✗
- Inline mini give widget near the footer ✗
- Story cards with dates ✗
- Header / mega-menu state coherence ✗ (white panel under transparent header)
- Honest trust strip (drop "14 nations", "Since 2012", "FY2025 field reports") ✗

## Verified facts to use (from ECFA + favorintl.org founder page)

- **Carole arrived in Africa: 2002** (per favorintl.org/about/our-story/founder)
- **Favor International legally founded: 2015** (per ECFA member profile)
- **ECFA accredited: September 30, 2019** (per ECFA member profile)
- **FY2024 total revenue: $8,360,676** (per ECFA member profile)
- **FY2024 program expense ratio: ~89%** (per ECFA member profile)
- **501(c)(3) public charity, EIN 47-5225697**
- **Charity Navigator: Four-Star rating** (per charitynavigator.org/ein/475225697)
- **Candid (Guidestar): Platinum transparency seal**

Anything not on this list is unverified and should not be claimed on the
homepage. Specifically: number of nations served, total pastors trained,
total people saved/discipled — these need to come from the FY2025 annual
report when Carole publishes it.

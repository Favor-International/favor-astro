# Redesign — About pages, Round 2 (Will's feedback + Ministry Structure & 6 R's)

> Handoff/working doc. Branch `redesign`. Deploy: https://redesign.favor-astro.pages.dev
> (favorintl.org is still the OLD site; favor-astro.pages.dev is the new build.)
> This session owns the **About pages only**. Sibling sessions own `redesign-give`
> and `redesign-impact` (read-only for us). Push to `redesign` after each round;
> Cloudflare auto-deploys for Daniel's review.

## Where we are
The first trio (Mission & Vision, Our Story, Where We Work) is built and Will gave
**positive feedback** — these pages are essentially the locked standard now. This
round is the **last polish** on them, then we move to the next three pages (which
should go faster using these as the reference).

All content is **verbatim from Favor's own material — no AI-written/paraphrased copy,
no em-dashes.** Stat labels may be tightened to "what it is" only with Daniel's OK.
Homepage and global menu must NOT be touched. Only use licensed/Favor-provided images.

## Will's feedback (verbatim, this round)
**Mission & Vision**
- "mission and vision has too much white space between sections maybe 15% less."
- "would like to see more videos used if possible but the images are fire!!"
- "What we instill in the leaders we train — in this section it's unequal and I'm not a big fan of that."
- "I think she would like to see these integrated into the mission and vision page."
  ("these" = the **Ministry Structure** house graphic + the **6 R's** graphic. The
  copies we have are the OLD versions; new graphics are coming, but we can build the
  content/structure now. Carole really likes these.)

**Where We Work**
- "the total salvations, PBS locations and nations served — we can't really determine
  the total salvations number; it's incorrect, and the PBS location is probably not
  correct either ... I would scrap both of those. We can say **14+ nations**."
- "have Claude put a note that this map is a **work in progress** so that anyone
  checking it now doesn't think it's a finished map, because it's obviously not accurate."
- "we can only talk about **South Sudan, Uganda, and Chad** as our three main locations.
  ... how you have it listed out that we work in Rwanda, Tanzania, Somalia, Eritrea,
  all of that. **That cannot be listed like this.**"
- "I don't really like these sections of the website. Very limited here. There are no
  videos. I only saw one video on all three pages (Carole's story on Our Story, which
  is fine). I would like the other two to have **significantly more videos** ... there's
  2 billion awesome videos on the YouTube channel."

**General**
- "I would try to **animate the visuals** that I am giving you and make them part of the
  website (html/css or whatever)."

## Daniel's decisions (approved — GO)
1. **A2 / "What we instill" unevenness:** make the **last card span 2 columns** (full
   width) so the row is filled — no orphan, and avoids a super-long single-column list.
2. **6 R's placement:** put it on **BOTH** Mission & Vision **and** Accountability.
3. **Where We Work countries:** "whatever Will said" → feature **only Uganda, South
   Sudan, Chad**. Remove everything else (incl. Ethiopia / DRC / Kenya tiles and the
   whole "Also serving" list). Frame scale only as **"14+ nations."** No salvation
   totals, no PBS-location counts.
4. **Spacing −15%:** apply to the **3 pages we're working on**; do NOT hard-force it
   site-wide — only where it actually helps. (In practice: gentle reduction of the
   shared `.rd .band` padding token; only About pages are redesigned on this branch,
   so it stays scoped to us. ~15% off `clamp(96px,11vw,164px)`.)
5. **Map:** keep the existing interactive AfricaMap, just add the **WIP note**. Do not
   reduce its highlighted countries.

## Plan / task checklist
### Mission & Vision (`src/pages/about/mission-vision.astro`)
- [ ] Tighten section padding ~15% (via `.rd .band` token in `redesign.css`).
- [ ] "What we instill" 7 traits: last card spans both columns (`grid-column: 1 / -1`),
      centered text, so no orphan. (Currently a 2-col grid leaving a lone left card.)
- [ ] Add a **video section** ("See the movement") — see video list below.
- [ ] Build + insert **Ministry Structure** (animated HTML/CSS component).
- [ ] Build + insert **6 R's** (animated HTML/CSS component).

### Where We Work (`src/pages/about/where-we-work.astro`)
- [ ] Cut `countries` to ONLY Uganda, South Sudan, Chad (remove Ethiopia/DRC/Kenya +
      the 8 "also serving" entries). Remove the "Also serving across the region" band.
- [ ] Reframe scale as "14+ nations" (no salvation/PBS numbers — page has none; keep it that way).
- [ ] Add a **"work in progress" note** under `<AfricaMap />`.
- [ ] Add a **video section** organized by the 3 countries — see list below.
- [ ] Keep "Where others will not go." ScriptBand (Daniel never said remove it).

### Accountability (`src/pages/about/accountability.astro`)
- [ ] Add the **6 R's** component here too (thematically it's stewardship content).

### Shared
- [ ] New components in `src/components/redesign/`: `MinistryStructure.astro`, `SixRs.astro`,
      and a simple `VideoGallery.astro` (or reuse `VideoEmbed` in a grid). VideoEmbed is at
      `src/components/global/VideoEmbed.astro`, props `{ id, title, caption? }`.
- [ ] Verify every video id resolves before shipping; verify visually at 1440x900; push to `redesign`.

## Curated videos (REAL ids from @favorinternational, verified via yt-dlp)
**Mission & Vision — "See the movement" (short mission films):**
- `LHarkRULU7Q` (2:05) Favor International - An Indigenous Missionary Movement  ← lead/feature
- `cvBVH4UQxIg` (2:16) Favor's Unique Missionary Model
- `C5VBPhA50Mg` (2:30) Evangelism in Africa - Building Lasting Disciples Through God's Word
- `xwSVEViFikA` (4:04) God's Institute For Transformation (GIFT)
- `JCjHdG0NnLQ` (3:42) To Reach a Village - Reach a Woman!  (optional)
- `32QTIfjF7Mg` (3:53) First - Apostles  (optional)

**Where We Work — by country (field films tied to the 3 locations):**
- South Sudan: `jKrmDKOGJ08` (3:10) The City of Iron Sheets - Malakal · `Wf_OQ1hAMoI` (2:53) From the Streets to Safety | South Sudan's Forgotten Girls
- Uganda: `GqXzE7pd79M` (3:27) Gospel Crusade in Yumbe Africa Wins Souls (Yumbe = Uganda) · `OpM5UYTWIso` (2:48) Favor Radio Stations Carry the Gospel (Favor FM, Uganda)
- Chad: `q7J30TlLkWg` (7:55) Pastors Buried Alive - Chad Martyrs · `uQSjKwxCqYk` (2:16) Indigenous Missionary Training in Chad · `tzOPaz9MFVM` (2:12) Miracles in Chad Africa - Field Update
- Reaching/"where others won't go" extras: `LacCMeogdGo` (7:27) Motorcycle Ride to Remote African Village · `av9kwMOgnSE` (2:26) By Canoe Plane Bicycle Donkey Truck or on the Heads of Villagers! · `nx0RZ6Mlbbg` (4:29) Flood Crossing With Land Rover in Africa

Carole's film already on Our Story: `g2fB1RwyHNM` (The Carole Ward Story). Full channel
dump saved transiently at `/tmp/favor_videos.txt` (re-fetch with
`yt-dlp --flat-playlist --print "%(id)s | %(title)s" "https://www.youtube.com/@favorinternational/videos"`).

## Graphic content — verbatim (for the animated HTML/CSS builds)
### Ministry Structure (a "house")
- Roof apex: a **cross**.
- Roof verse: *"...unless the Lord builds the house, they labor in vain who build it..."* — **Psalm 127:1**
- **Four pillars** (label + sublabel): **SPIRITUAL** (Strategic Plan) · **LEGAL** (NGO) ·
  **ADMINISTRATION** · **FINANCIAL** (Development Plan)
- **Ministries** sitting in the bays between the pillars (9 total, 3 groups):
  - Evangelism & Discipleship · Prayer Ministries · Children's Ministries
  - Medical Work · School of Ministry · Primary & Secondary Schools
  - Women's Empowerment · Rehabilitating Street Youth · Crusades
- **Foundation** band: **PRAYER**, carrying two verses:
  - *"Do not be anxious about anything, but in every situation, by prayer and petition,
    with thanksgiving, present your requests to God."* — **Philippians 4:6 NIV**
  - *"I also say to you that you are Peter, and upon this rock I will build My church;
    and the gates of Hades will not overpower it."* — **Matthew 16:18 NASB 1995**
- Caption below: *"By wisdom a house is built, and through understanding it is established..."* — **Proverbs 24:3**

### The 6 R's (Favor's stewardship framework — Carole loves it)
1. **RELATIONSHIP** — All partnering and ministry is built on this foundation.
2. **RESEARCH** — It's important to us to sow where the need is greatest. Before
   determining where to expand the ministry, we make sure to pray and research the possibilities.
3. **RECEIPTS** — Every receipt is kept for each purchase made or service paid for. They
   are filed with accurate book keeping in the ministry office and then scanned and emailed back to the partner.
4. **REPORTS** — Reports are given to ministries and supporters on a regular basis. They
   include acknowledgment of gifts and thank you notes from the office and recipients of
   the money. We do this to encourage ongoing relationship with the gift recipients.
5. **RECORDS** — Each purchase or service relating to designations is recorded accurately
   with names of recipients, partners, use of money, date, location, and project or person
   the money was intended for. These records are available to any partner and ministry
   affiliated with the area of support.
6. **RESULTS** — Results of seeds sown and planted are reviewed and re-evaluated. We want
   to see seed sown on fertile ground. If results are not evaluated regularly, waste can
   occur. Our reports will continue to be presented months after gifts are given.

Source PDFs Daniel provided (old versions; new ones coming): `~/Downloads/Ministry Structure.pdf`,
`~/Downloads/6 R's.pdf`, `~/Downloads/6 Rs.pdf` (also added to the shared Drive folder).

## Design rules that constrain these builds (full set in memory: feedback_favor-redesign-rules)
- Max **3 backgrounds** (white, cream, light green `#eef4ec`). Max **4 font sizes**
  (`--rd-fs-*`). Cards: slight shadow no border (functional/edged boxes: thin border +
  small shadow). No big-shadow-no-border on functional boxes.
- Leaves on titles only on white sections w/ green titles; sparse. No clip-art savanna.
- **Savanna silhouette = ONE SOLID tone** `--rd-savanna-ground #cdc3ae` via CSS
  `mask-image` over `background-color` (NOT opacity). Cream sky held light until ~64%,
  eases to `#cdc3ae` at the very bottom; the closing-statement band right below must be
  the exact same `#cdc3ae` (`.savanna-ground`). Silhouette only leads into such a
  statement — never behind a list of cards.
- No hero wave. No orphan title+text bands (pair with image/video). Never duplicate the
  hero title. One path: everything points to trust → give/help.
- Components: `ScriptBand` (full-bleed photo + green scrim + one verbatim phrase, font
  prop script/serif/sans), `RdCta` (deep-green card, optional full-photo image, Daniel
  loves it — use on every CTA), `RdFeature` (`decor="leaf"`), `SavannaBand` (`image` prop
  = silhouette PNG), `LeafHeading`.

## Workflow gotchas
- Editing an Astro `<style>` block can leave the dev server serving a STALE stylesheet:
  stop server, `rm -rf node_modules/.vite .astro`, restart.
- Fresh preview server starts at viewport width 0 → `preview_resize` to 1440x900 first.
- Screenshots render reliably only at scroll 0. To capture a lower section:
  `document.body.style.transform = 'translateY(-Npx)'` then screenshot, then reset.
  The transform trick renders BLANK past ~8000px; for very deep sections, temporarily
  pin the element: `el.style.cssText += ';position:fixed;top:0;left:0;right:0;z-index:99999;margin:0'`,
  screenshot, then revert.
- Avoid backticks in `git commit -m` (zsh command substitution).
- Co-author trailer on commits: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

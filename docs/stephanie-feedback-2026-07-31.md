# Stephanie's website feedback: what's done, what needs a decision

Date: 2026-07-31. Source: "NEW WEBSITE FEEDBACK.docx" (46 comments) plus a full-site
sweep for meta commentary and AI-sounding copy (185 findings across 49 pages).

## Fixed today

**Meta commentary is gone.** Every instance of "public country fields," "Favor publicly
highlights its work," "These are the three country fields Favor identifies publicly today,"
"Public fields" labels on story pages, "In Favor's own words" on the Go pages, "This page
describes Favor's published model" (rendered on all 14 program subpages), and the
"published model / Favor publishes" analyst voice on the Impact pages. The site now speaks
as "we" to "you."

**Stephanie's copy notes implemented:**
- Homepage hero and map now say the work centers in Uganda, South Sudan, and Chad and
  reaches beyond. Proof band and map stat: "14+ Nations served" (see decision 3).
- Map lede rewritten around partners and the reach of the Gospel. The full-map restore
  replaced the earlier do-not-name caption; the band heading now reads "Every point is a
  place the Gospel has reached."
- Four Pillars: "One movement. Four pillars." with Christ named in the heading and lede.
- Indigenous leadership section: "Indigenous missionaries" instead of "National leaders,"
  Jesus' discipleship model stated, 2 Timothy 2:2 added.
- "See the financials" is now "See our financials."
- Pray page: "You can pray where they cannot reach" replaced with "Your prayers reach where
  no one else can," plus everything-begins-in-prayer framing.
- 30-Day Guide: Scripture added for each nation (Jeremiah 33:3, 2 Chronicles 7:14, Psalm 2:8).
- Specific Project page: Luke 10:2 harvest framing, journey-of-your-gift promise, FAQ
  rewritten in first person with "designated" (not "restricted") language.
- Give landing: added the walk-with-the-field / you-will-see-what-your-giving-builds intro.
- Team page: leads with "A small U.S. team serving a massive field," "we would not have it
  any other way." "Why the team looks like this" and "Partner as hero" labels replaced.
  "A salary" is now "money to live."
- Board page: "Faith-filled servants of Christ who steward Favor," "Meet our Board,"
  "Stewardship, accountability, and transparency," elected-and-unpaid stated.
- Annual audit copy (board + accountability pages) now says: independent third-party audit
  of the U.S. operation every year, plus annual independent audits in each of the three
  main country fields.
- Charity Navigator stat now shows four literal stars instead of "4" next to one star.
- "Program expense ratio" is now "Program-to-overhead ratio."
- "What we promise" is now "Our promise to you," and "Restricted gifts honor the
  restriction" is now "Designated gifts go where you designate them."

**AI slop sweep:** em dashes, binary contrasts ("not X, it's Y"), colon reveals, "one-size-
fits-all," banned words (foster, empowering as a generic verb), fake-profound kickers, and
duplicated template sentences fixed across Impact, Go, Give, About, and utility pages.

## Fixed in the second pass (2026-07-31, pre-meeting)

- Story spotlight box: slow ambient drift on the photo (the movement Stephanie asked
  about), disabled for reduced-motion users.
- Team page field line now reads "across Uganda, South Sudan, Chad, and nations beyond."
- Homepage founder teaser says "indigenous leaders she trained." Mission & Vision keeps
  the official "national leaders" mission wording Stephanie praised ("Nice. Like that.");
  sweep it only if the Terry terminology decision changes it.
- Deleted the dead TrustStrip component (it still carried "4-star" and "Program expense
  ratio") and the stale June exec-preview page at /real.
- Em dashes removed from every code comment. None rendered to visitors.

## Needs a decision (raise in the meeting)

1. **Terry's term for the three countries.** Stephanie doesn't recognize "public country
   fields" and thinks Terry says something like "main mission stations," with "outposts"
   (PBS) elsewhere. Current copy says "main fields" as a safe placeholder. CONFIRM the
   real term and I'll sweep it in.
2. **The map is back.** An earlier automated "privacy audit" commit had stripped the
   2,725 PBS dots, the mission-station markers, the country labels, and the "14+ Nations
   served" stat, and wrote the "public country fields" language in their place. The full
   map is restored exactly as it ran before that commit: red PBS dots, green mission
   stations, blue future stations, all reached countries in gold with labels. One thing to
   settle in the meeting: the restored map labels countries beyond the main three, which
   sits in tension with the "only name the three main fields publicly" rule. It ran this
   way through the Danny/Jennifer review rounds, so presumably that's fine, but say the
   word and I'll unlabel the others while keeping the dots.
3. **Country count restored to "14+ Nations served,"** the number the site used at
   launch-readiness. CONFIRM against the quarterly report wording.
4. **Stats: who owns them, and which period.** Homepage shows 2025 totals; all-time
   salvations (524,673) shows in the map band. They're hand-edited in the code today. I can
   move them to one data file so an update is a single edit, and we should name an owner.
   The "salvation clock" idea needs a data feed that doesn't exist yet.
5. **Stewardship booklets.** Stephanie wants the Financial Stewardship and Program
   Stewardship booklets linked from the accountability/impact pages. Neither PDF is in the
   site's documents folder. Send me the files and I'll place them.
6. **360 tour links under each pillar.** Need the tour URL(s).
7. **Founder photo** (Carole not visible in the current crop) and **person-page banner
   images** (African banner above U.S. staff bios). Need image direction.
8. **"One woman. Ninety leaders. A movement." section.** Left as is per Stephanie's own
   note; she wants a voice/writing session with Katherine after launch.
9. **The comma in "Transformed hearts, transform nations."** The code has no comma
   anywhere; the tagline renders as "Transformed Hearts Transform Nations." If she saw a
   comma it's in a graphic or an older build. Verify on screen together.
10. **Cattle warrior story.** Left in place per her note; see what Carole and Terry say.
11. **Legacy copy sources.** The stories feed (stories.json), program descriptions
    (programs.ts), and the careers posting carry old AI-polished or verbatim-live-site
    text with the same patterns (empower/facilitate, puffery). Left alone because they're
    quoted source material. Decide whether Katherine rewrites them post-launch.

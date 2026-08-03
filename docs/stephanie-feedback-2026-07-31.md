# Stephanie's website feedback: what's done, what needs a decision

Date: 2026-07-31, third pass 2026-08-03. Source: "NEW WEBSITE FEEDBACK (1).docx"
(46 comments, the 8/3 re-save; only comment 14 changed, and it grew) plus a full-site
sweep for meta commentary and AI-sounding copy.

Comments are extracted with `scripts/extract-comments.mjs`, which reads `word/comments.xml`
and pairs each comment with the text it is anchored to. Run it against an unzipped .docx.

## Fixed in the first pass

**Meta commentary is gone.** Every instance of "public country fields," "Favor publicly
highlights its work," "These are the three country fields Favor identifies publicly today,"
"Public fields" labels on story pages, "In Favor's own words" on the Go pages, "This page
describes Favor's published model" (rendered on all 14 program subpages), and the
"published model / Favor publishes" analyst voice on the Impact pages. The site now speaks
as "we" to "you."

**Stephanie's copy notes implemented:**
- Homepage hero and map now say the work centers in Uganda, South Sudan, and Chad and
  reaches beyond. Proof band and map stat: "14+ Nations served" (see open item 2).
- Map lede rewritten around partners and the reach of the Gospel.
- Four Pillars: "One movement. Four pillars." with Christ named in the heading and lede.
- Indigenous leadership section: "Indigenous missionaries" instead of "National leaders,"
  Jesus' discipleship model stated, 2 Timothy 2:2 added.
- Pray page: "Your prayers reach where no one else can," plus everything-begins-in-prayer framing.
- 30-Day Guide: Scripture added for each nation (Jeremiah 33:3, 2 Chronicles 7:14, Psalm 2:8).
- Specific Project page: Luke 10:2 harvest framing, journey-of-your-gift promise, FAQ
  rewritten in first person with "designated" (not "restricted") language.
- Team page: leads with "A small U.S. team serving a massive field." "A salary" is now
  "money to live."
- Board page: "Faith-filled servants of Christ who steward Favor," "Meet our Board,"
  "Stewardship, accountability, and transparency," elected-and-unpaid stated.
- Annual audit copy now says: independent third-party audit of the U.S. operation every
  year, plus annual independent audits in each of the three main country fields.
- Charity Navigator stat shows four literal stars instead of "4" next to one star.
- "Program expense ratio" is now "Program-to-overhead ratio."
- "What we promise" is now "Our promise to you."

## Fixed in the second pass

- Story spotlight box: slow ambient drift on the photo, disabled for reduced-motion users.
- Homepage founder teaser says "indigenous leaders she trained."
- Deleted the dead TrustStrip component and the stale June exec-preview page at /real.
- Em dashes removed from every code comment.

## Fixed in the third pass (2026-08-03)

The theme of this pass is Stephanie's headline note: the writing is "corporate heavy and
Holy Spirit light." Eight pages had no mention of Jesus, Christ, or the Gospel at all,
including the two highest-value pages on the site.

**Scripture now runs on every money page.** Added a reusable `VerseBand` component
(`src/components/redesign/VerseBand.astro`) so pages carry Scripture without re-declaring
the same CSS:
- `/give/donate` (the primary conversion page, previously no Christ content at all): Luke 10:2.
- `/give/thank-you` (previously no Christ content): Hebrews 6:10, plus a "this is the start
  of a walk, not the end of a transaction" section answering comment 25 directly.
- `/give/one-time`: 2 Corinthians 9:7.
- `/give/` landing: Philippians 4:17, chosen because Paul wanted givers to see the harvest.
- `/give/partner-monthly`: Luke 10:2.
- `/pray/`: Matthew 21:13, under a new "Why we pray first" section.
- `/pray/30-day-guide`: Ephesians 6:18.

**Comment 12, 18, 20 (corporate, no Christ):**
- `/give/partner-monthly` was the worst page on the site. The three reasons to give monthly
  were "The field can plan / Leaders can respond / The relationship continues," written from
  the finance office. Rewritten around a missionary who keeps walking, a team that can say
  yes to an open door, and a partner who walks with the field. Section heading now leads with
  Carole's line to the Juba team about the harvest.
- Pray page gained a "Why we pray first" section: houses of prayer went up before the offices,
  and Carole's "prayer is not optional but necessary if you want to live."

**Comment 16 (the founder section "squanders many opportunities").** Stephanie wanted the
idea of one woman's obedience leading to something massive. "One woman. Ninety leaders. A
movement." is gone (the number also undersold the work badly; the books say close to 1,000
indigenous missionaries). Now: she prayed a dangerous prayer, people said she would come
home in a body bag, she went anyway. Closes on Carole's own line, "It only takes one
obedient person to start a movement."

**Comment 14 (cattle warrior).** Stephanie said the story could stay pending Carole and
Terry, but she did not understand what was wrong with being a cattle warrior. That is a fair
reading of the old headline. The band now carries the actual turn from Daniel's story record:
a fighter who lost all purpose at nineteen, reached in his cattle camp. His own testimony
("I was blind but now I can see my future in Jesus!") replaced the Carole quote that sat
there, which also stops three Carole quotes stacking on one page.

**Comment 17 (founder photo).** Confirmed: in `carole-3.webp` Carole's face is completely
hidden, so the "Carole Ward · Founder" caption read as if the Ugandan woman were Carole.
Switched to `carole-4.webp`, where she is identifiable and still in the middle of ministry
rather than posed.

**Comment 28 (person-page banner).** Every profile used the same banner of GIFT students in
Uganda, so opening a US staff member's page led with a photo of an African student. Field
leaders now keep a photo of the work they lead; everyone else gets a banner with no
identifiable face (`hero-bibles-stacks.jpg`).

**Comment 3 (all-time salvations).** Total salvations to date now shows on the homepage proof
band above the fold, not only in the map band.

**Comment 4 (who owns the stats).** The numbers were hand-edited across two component files.
They now live in one place, `FIELD_STATS` in `src/lib/site.ts`, with the period and an
`asOf` label recorded next to them. Updating a number is one edit in one file. An owner still
needs naming (see open item 3).

**Comment 7 (the tagline comma): already resolved, no action needed.** Stephanie was
flagging that a comma had appeared and should not be there, since "Transformed Hearts
Transform Nations" is one statement rather than a list of two things. Verified across the
built site: all 325 renderings of the tagline carry no comma. The only comma'd "transformed
hearts," left in the codebase is an unrelated prayer line on the 30-day guide ("transformed
hearts, healthy churches, and faithful disciples"), which is a correct list.

**Comment 6.** Two instances of "See the financials" were missed in the first pass
(`/give/donate` and `/give/foundation`). Both now read "See our financials."

**ASD-STE100 applied to procedural copy.** The giving instructions and the four designation
steps are the places where ambiguity costs a donor money, so they now follow simplified
technical English: one instruction per sentence, active voice, the reader as the actor, and
one consistent term for a gift. "Wire transfer. Available on request." became "Email
info@favorintl.org to request the wire instructions." Step 3 became "Give to that project"
instead of "Receive the giving route."

**Slop sweep, verified against rendered HTML rather than source.** Zero em dashes across all
161 built pages. Zero binary contrasts, colon reveals, or empty phrases in visible text.
Removed "marginalized" (banned by the project's own voice-and-tone doc) from the Economic
Empowerment page. Three remaining flagged words are legitimate and were left alone:
"Holistic transformation by the Word" is Favor's own pillar tagline, and two uses of "foster"
are verbatim biography (a board member's twenty years as a therapeutic foster parent, and
Carole's official bio line).

## Still needs a decision or an asset

1. **Terry's term for the three countries** (comments 5 and 8). Stephanie doesn't recognize
   "public country fields" and thinks Terry says something like "main mission stations," with
   "outposts" for the PBS elsewhere. Current copy says "main fields" as a safe placeholder.
   CONFIRM the real term and I'll sweep it in.
2. **Country count "14+ Nations served."** Confirm against the quarterly report wording.
   Stephanie asked about "12+ or 14+ or whatever it is" in comments 2 and 30.
3. **Name an owner for the field stats.** The plumbing is done, the person is not named.
   The "salvation clock" idea still needs a data feed that does not exist.
4. **Stewardship booklets** (comment 41). Confirmed absent: `public/documents/` has 39 PDFs
   including audits, 990s, impact reports, and a women-empowerment booklet, but neither the
   Financial Stewardship nor the Program Stewardship booklet. Send the files and I'll place them.
5. **360 tour links under each pillar** (comment 13). Need the tour URL(s). Nothing in the repo.
6. **Cattle warrior story** (comment 14). The framing is fixed; whether Daniel stays the
   featured missionary is Carole and Terry's call. Stephanie also asked how often these
   stories rotate, which nobody has answered.
7. **The voice and writing session with Katherine** (comment 16). Stephanie wants this after
   launch. The legacy copy sources are the place to start: `stories.json`, `programs.ts`, and
   the careers posting still carry old verbatim or AI-polished text, left alone because they
   are quoted source material.

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

## Fixed in the fourth pass (2026-08-03, after Will's review)

**The giving form lost a step.** Stephanie test-gave $5 from her phone and reported that the
last button read "Give $5.00 securely," which made it look as though the gift was already
done, when it actually only opened Blackbaud's card window. She had to reread the screen to
work out that she had not paid yet. Will's steer was to cut friction rather than only relabel.

The old step 3 was a review screen holding a summary, two checkboxes, the total, and the pay
button. It is merged into step 2, so there are now two form steps instead of three, one less
click to give. The progress bar reads Amount, Your details, Card, where Card is Blackbaud's
window rather than a hidden fourth step; that dot lights up only when checkout actually
opens. The button says "Continue to card - $50.00/mo" and the line under it says "One step
left. Your card opens in Blackbaud's secure window, and your gift is complete when you pay
there." A recap of the chosen amount sits at the top of step 2 with a Change link back.

Retry behaviour is unchanged and deliberately so: the failure path calls `goTo(2)`, which
preserves `checkoutToken` and `idempotencyKey` (they are cleared only below step 2), so
pressing the button again resubmits the same authorization and never charges twice.

**The tagline now carries the comma:** "Transformed Hearts, Transform Nations" (comment 7).
Corrected in `SITE.tagline`, `SITE.vision`, `TAGLINE` in `lib/cta.ts`, the Mission & Vision
H1, and the Impact page promise line.

**Dropped the "three main fields" framing entirely** (comments 5, 8, 2, 30). Per Will it was
never official and it undersells the work. Favor serves 14+ nations; Uganda, South Sudan, and
Chad are simply where the work centers. Rewritten on Where We Work (page description, intro,
and the code comment that created the rule), Accountability, and the Board page, which now
say our field operations in those three countries each undergo an annual independent audit
rather than "each of our three main country fields."

**Daniel's surname is gone** from everything a visitor reads (homepage, Give landing,
Evangelism & Discipleship). He is "Daniel" now. The story record and URL slug keep the old
name, so no links break.

**The booklets are placed** (comment 41). Will supplied three Heyzine flipbooks on branded
subdomains, registered in one place as `FLIPBOOKS` in `lib/site.ts`:
- stewardship.favorintl.org, the Stewardship Statement
- 26vision.favorintl.org, the 2026 Vision for Support
- 5year.favorintl.org, the Five-Year Plan

All three appear as clickable cards on the Accountability page directly under "Our promise to
you," which is the section Stephanie pointed at. The two vision booklets also appear on
Mission & Vision under "Where this is going." All open in a new tab. Verified all three
return HTTP 200.

## Answered, no work needed

**Comment 4, who updates the stats.** Stephanie asked whether the numbers under the main
banner update automatically, whether they are quarterly or year to date, and who is
responsible. The answers: they do not update automatically, they are hand-maintained, the
homepage pair is full-year 2025 and the cumulative figure is since the ministry began, and
they now live in one file (`FIELD_STATS` in `lib/site.ts`) with an `asOf` label so anyone
editing them can see the period. Will does not want a named owner recorded on the site.

**Comment 13, the 360 tour.** This was Stephanie's own suggestion for a new feature ("might
be a good place to have the clickable, Take a 360 tour"), not a reference to something that
already exists. There is no 360 tour in the repo and Will is not aware of one. If Favor wants
one, it needs to be produced first. Nothing to link today.

## Still needs a decision or an asset

1. **Confirm the country count.** The site says "14+ nations." Check it against the current
   quarterly report before launch.
2. **Cattle warrior story** (comment 14). The framing is fixed and the surname is dropped;
   whether Daniel stays the featured missionary is Carole and Terry's call. Stephanie also
   asked how often these stories rotate, which nobody has answered.
3. **The voice and writing session with Katherine** (comment 16). Stephanie wants this after
   launch. The legacy copy sources are the place to start: `stories.json`, `programs.ts`, and
   the careers posting still carry old verbatim or AI-polished text, left alone because they
   are quoted source material.

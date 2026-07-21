# Site quote and testimonial provenance audit — 2026-07-21

## Outcome

- One displayed testimonial was unsupported and has been removed: **“The prayers from outside Sudan reached our village before the team did. We felt the protection in our bones.”** No match was found in the supplied books, PDFs, content documents, imported current-site stories, or current Favor website.
- It was replaced with the clearly labeled KJV text of James 5:16.
- The remaining prominent attributed quotations trace to a Favor-published page, a supplied Favor book, a supplied client content document, the imported current-site story archive, or a cited Bible passage.
- Editorial headings and brand phrases are not represented as third-party testimony.

## Prominent displayed quotations

| Quotation / phrase | Display locations | Source and status |
|---|---|---|
| “Where others will not go.” | Where We Work and brand bands | Client sitemap, brand book, voice-and-tone brief; approved Favor signature phrase |
| “Lord, send me where no one wants to go, to do what no one wants to do.” | Our Story | Current Favor story/founder language and the two supplied Favor books |
| “When I asked God to send me where no one wants to go, He took me at my word.” | Founder | *Send Me Where No One Wants to Go*, p. 177; recorded in `book-dossier-send-me.md` |
| “Even as others are moving out, we are moving in!” | Home and Real landing page | *Lord Send Us Where No One Wants to Go*, p. 17 |
| “Unlike the world, He doesn’t call the qualified, but qualifies the called.” | Careers | *Lord Send Us Where No One Wants to Go*, p. 163 |
| “Prayer is not optional but necessary if you want to live…” | Internships | *Lord Send Us Where No One Wants to Go*, p. 30 |
| “We are here to sow for a lifetime.” | Mission & Vision | Current Favor Mission & Vision page; independently recorded in the About fact audit |
| “National leaders are solving problems others haven’t been able to.” | Team | Current Favor About copy; independently recorded in the About fact audit |
| “Every tribe and language reaching their own people…” | Our Story | Current Favor Director/About language; independently recorded in the About fact audit |
| “They praised and worshiped God as they waited to receive two goats…” | Monthly Partner and Economic Empowerment | Imported Favor story `goats-for-women`; current-site story archive source |
| Daniel Kidia: “The teachings of the Word of God…opened my eyes…” | Daniel story/card | Imported Favor story `daniel-kidia`; current-site story archive source |
| “Please bring your trauma counseling. We’re all traumatized…” | Trauma Counseling program | Existing Favor program content in `src/data/programs.ts`; should retain as Favor-supplied program testimony, but the speaker is not named |
| Carole’s grandmother, Embassy, pastor, commander, and Carole story quotations | Founder narrative | Supplied Favor books; page references and transcript notes in `book-dossier-send-me.md` and `book-dossier-lord-send-us.md` |

## Bible quotations

The site displays Bible text with references in the program data and About/Impact pages, including Acts 8:30–31, Proverbs 1:5, Proverbs 22:6, Ephesians 4:5, James 5:16, Acts 26:19, and other references embedded in imported Favor field stories. These are Scripture, not Favor testimonials. Translation labels should remain visible wherever the wording is translation-specific.

## Imported field-story quotation inventory

`src/data/stories.json` is an imported archive of Favor’s existing published field stories. The audit found quoted spans in the following story records; their provenance is the corresponding original Favor story record, not newly authored redesign copy:

`a-timely-word`, `all-who-are-called`, `breaking-through-to-chad`, `curing-the-snakebite`, `daniel-kidia`, `forgetting-the-past`, `from-bitter-to-sweet`, `goats-for-women`, `good-news-from-a-gateway-nation`, `healing-and-harvest`, `healing-streams`, `hope-through-the-night`, `irreversible-transformation`, `laying-burdens-down`, `laying-down-the-spear`, `letters-of-thanks`, `listening-in-prison`, `members-of-parliament-find-forgiveness`, `new-spirit-new-name`, `no-longer-slaves`, `now-i-see`, `peace-abounds`, `praying-without-ceasing`, `restored-by-the-spirit`, `restoring-the-home`, `rising-through-the-ranks`, `salvation-marriage`, `simons-and-angelos-stories`, `steady-strong-confidence`, `streets-to-school`, `strongholds-collapse`, `the-fear-of-the-lord`, `the-lord-added-to-their-number`, `the-love-of-the-father`, `the-refugee-church`, `the-women-of-paibony`, `those-who-have-ears-to-hear`, `training-leaders-in-chad`, `trauma-counseling-heals-a-former-warrior`, `village-after-village`, `wars-that-win-souls`, `what-happens-in-juba`, `what-next`, and `wol-abun`.

Some quoted spans in those records are Bible passages, program names, nicknames, or short editorial terms rather than human testimony. They are retained as part of the source story, not promoted as new attributed quotes.

## Existing detailed About audit

`docs/06-reference/about-fact-audit-2026-07-08.md` contains claim-by-claim and quote-by-quote source notes for the About pages, including live URLs, supplied document references, book-page references, and previously identified composed language.

## Editorial rule going forward

1. A named or field-attributed quotation must have a retrievable source.
2. Bible text must show its reference and, where relevant, translation.
3. Favor slogans may be used as slogans, not disguised as a person’s testimony.
4. Paraphrases must not be placed in quotation marks.
5. If a source cannot be recovered, remove the quotation or convert the underlying verified idea into unattributed prose.

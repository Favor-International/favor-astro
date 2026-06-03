# Favor International — Fresh Gap Analysis (v2)

_New site (current `main`, live at favor-astro.pages.dev) vs. live favorintl.org._
_Compiled 2026-06-02 from 5 parallel section audits. Supersedes the v1 thinness scorecard._

## The reframe

Will's review framed the problem as **thin / incomplete content**. The audits show the
opposite is the bigger risk: the new site is largely **built out** (115 stories, all 4
pillar pages, all 8 give pages, full About) — but a meaningful amount of its content is
**fabricated, unverified, or paraphrased** rather than ported verbatim from the live site.
That directly violates the core working rule (_verbatim from live, no invented copy, don't
change Will-owned data_). **Accuracy must be fixed before any expansion.**

> **Caveat:** the audits used WebFetch, which returns a *paraphrased* summary of live pages,
> not exact HTML. So some "discrepancies" may be fetch artifacts. Items marked **[code-verified]**
> are certain (read from our own files); items marked **[live-verify]** need a real browser
> capture of the live page to confirm exact wording before we port.

---

## TIER 1 — CRITICAL: fabricated / wrong / donor-facing (fix first)

1. **Fabricated dollar figures across Give pages** [code-verified placeholders; live figures live-verify].
   `specific-project.astro`, `partner-monthly.astro`, `one-time.astro` carry invented goal/raised
   numbers. Real live figures captured: **GIFT Dormitory $3,000,000 goal / $2,114,929 raised**;
   **Solar Power for Two Radio Stations $110,000 / $3,964**; **Arabic Bible Curriculum $800,000**;
   **Gulu Primary School ~$1.5M total**. New page shows e.g. GIFT at $65k — off by ~46×.
2. **GIFT Dormitory project is mis-described.** New site = "beds for pastor-trainees." Live = an
   **anti-trafficking rescue appeal** ("Help Us Rescue Precious Girls & Boys…", Carole Ward narrative
   about teenage girls trafficked to Saudi). Wrong subject entirely. Rebuild from live.
3. **Homepage `AfricaMap` cumulative stats appear invented** [code-verified present; live-verify].
   `524,673` total salvations, `3,635` PBS locations, `14` nations — **none appear on the live site.**
   The two corroborated stats are `195,773` saved + `119,182` discipled (2025). Highest-risk numbers.
4. **Wrong CashApp tag** [live-verify]. New: `$FavorIntl`. Live: **`$FavorInternational`.** Donors pay the wrong handle.
5. **Statement of Faith paraphrased, not verbatim** [code-verified count]. Live = **14 numbered articles**;
   new = **13 reworded** ones, dropping the sin/justification article and "signs, wonders, and miracles,"
   and adding an unsourced "Nicene Creed / Lausanne Covenant / not a denomination" framing. Restore the 14 verbatim.

## TIER 2 — VERIFY WITH FAVOR before touching (may be real newer data, not errors)

> Per working rule: **director names/titles/bios and ministry numbers are Will-owned and may be newer
> than the live site.** Do NOT remove these as "invented" — confirm with Will/Favor.

6. **Board/Team roster** differs from live `/about/directors`. New site includes **Joy Daniels, Lisa Coggin,
   Rev. Louis Kayatin, Dr. Vilma Vega** — not on the live directors page (which lists 6 board + 3 country
   directors). Confirm with Will whether these are current. (Also a title dup: two "Vice Chair & Secretary.")
7. **"14 nations"** everywhere vs live **"10+"**; `where-we-work` lists 14 countries incl. Burundi, Rwanda,
   Tanzania, Eritrea, Somalia (border), CAR, Mozambique — several not confirmable on live. Confirm the real roster.
8. **Vision Trips** (`go/vision-trips.astro`) — fully net-new: 3 trips w/ 2026–27 dates, lengths, leaders, and
   **costs (~$3,400 / $4,200 / $3,100 + airfare)**, plus a "Jennifer M., Tampa FL" testimonial. Confirm or remove.
9. **Volunteer "4 roles"** (Ambassador, Prayer warrior, Intercession team, Stage Sunday host) — invented; the
   live volunteer page describes admin help + 2-week trips/internships, no role taxonomy.
10. **Pray section is entirely net-new** (live has no Pray). Operational claims (Houses of Prayer history,
    Amharic Bible printing, country prayer briefs, "churches planted in 2025," field-leader testimonial) need
    accuracy confirmation.
11. **Anchor testimonials/bios** — Daniel Kidia (homepage), Jennifer M (vision trips), "Field Leader, Lakes
    State" (pray). Confirm each is a real person/quote.
12. **Impact stats / names** [live-verify]: "18 VLCs," "1,400+ students," "270-acre farm" (live mentioned 10
    acres maize), and **GIFT identity** — new "GIFT Leadership Institute / pastor training" vs live "God's
    Institute for Transformation." Reconcile to live + Stephanie's pillar question.

## TIER 3 — MISSING real live content to PORT (verbatim, once browser-captured)

13. **Accountability:** verbatim 2024 expenses (**$6,671,668 program / $464,178 general / $341,235 fundraising**),
    the **"Great Multiplier Effect (GME)"** explanation, stewardship verse (**1 Cor 4:2 NKJV**), **FL Reg. CH57842**,
    finance email **accounting@favourafrica.org**, the **5-year plan** download, the **"6 R's"** framework.
14. **Give methods:** the two real PDFs — **"Give By Stock"** (Stock & Non-Cash Assets Transfer Form) and
    **"Give A Legacy"** (Legacy Circle Membership Form); the **"designate / honor / dedicate a gift"** option;
    the **Florida solicitation disclosure** (CH57842 / FDACS 1-800-435-7352). Brand term **"Legacy Circle."**
15. **Impact pillars:** the four official **taglines** ("Mobilization of heaven's agenda," "Next generation
    leadership," "Holistic transformation by the Word," "Independence built on freedom in Christ"); **"Bibles
    instead of bullets"** (South Sudan); mobile medical clinics + "we pray with each patient"; named churches
    (**Pabo Calvary Chapel ribbon-cutting**, **Wedweil refugee camp**); per-pillar philosophy lines.
16. **Stories:** rebuild the live **Media/Video hub** (YouTube Videos + Speaking Engagements playlists, Favour FM
    listen-now, "The Carole Ward Story" book) — entirely absent. Restore tag granularity (live ~16 ministry
    filters + per-story country/topic tags → new 6 categories). Expand **9 single-paragraph stub stories**.
17. **Full Country Director job posting** (responsibilities, qualifications, application process) — reduced to one line.

## TIER 4 — BROKEN / non-functional (launch blockers)

18. **Donation forms not live** — `/give/.../form/` routes don't exist; no Blackbaud widget/URL anywhere. **Needs real Blackbaud donation URLs from Favor.**
19. **Newsletter signup is decorative** — posts to non-existent `/newsletter/subscribe`. Needs a real backend/embed.
20. **30-Day Prayer Guide PDF is a dead link** — `/resources/30-day-prayer-guide.pdf` doesn't exist (pages promise "No email required").

---

## What I can fix vs. what needs Favor's data

- **I can fix now (no new data):** restore Statement of Faith verbatim (14 articles); fix the CashApp tag;
  remove/neutralize the clearly-placeholder dollar figures; add the Florida disclosure; wire the real giving
  PDFs once provided; fix the dead PDF/newsletter links (or hide until ready). [several need the live exact text]
- **Needs a verbatim browser capture of the live pages** (WebFetch paraphrases): exact SoF wording, accountability
  figures, project descriptions, pillar copy.
- **Needs Favor/Will to confirm or provide** (do NOT invent): real project goal/raised figures, the AfricaMap
  cumulative stats, the nation roster, board roster currency, Vision-Trip details, Pray-section accuracy,
  testimonials, and the Blackbaud donation URLs.

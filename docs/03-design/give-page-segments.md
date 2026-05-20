# Give Page — Segmented Tile Model

Modeled on the Destiny Rescue donation page. The Give page is a hub,
not a checkout. Each tile routes to a focused sub-page with the actual
form.

## Tile order (locked)

The lead tile is always **Become a Favor Partner** (monthly giving).
This is the primary action on the page. Visual weight, color, and size
reflect that.

| # | Tile                        | Route                              | Form backend |
|---|-----------------------------|------------------------------------|--------------|
| 1 | Become a Favor Partner ★    | `/give/partner-monthly/`           | Blackbaud (recurring) |
| 2 | Give Once                   | `/give/one-time/`                  | Blackbaud (one-time)  |
| 3 | Fund a Specific Project     | `/give/specific-project/`          | Blackbaud (restricted)|
| 4 | Church Partnership          | `/give/church-partnership/`        | Inquiry form          |
| 5 | Foundation / DAF            | `/give/foundation/`                | Inquiry + DAFpay      |
| 6 | Legacy Giving               | `/give/legacy/`                    | Inquiry form          |
| 7 | Non-Cash Gifts              | `/give/non-cash/` (stocks, crypto) | Inquiry / FreeWill    |
| 8 | International Giving        | `/give/international/`             | Routing page (UK/CA/EU)|

★ Lead tile, twice the visual weight of the others.

## Tile content (each)

- Icon (single, line, Lucide-matched)
- H3 title
- One sentence of clarification (16 words max)
- "Continue" link, not a button (button reserved for the actual gift
  on the form page)

## Visual layout

```
┌─────────────────────────────────────────────────┐
│              HERO: Why Give                     │
│       (short, partner-as-hero framing)          │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│                                                 │
│       BECOME A FAVOR PARTNER (large tile)       │
│       ───────────────────────────────────       │
│       Monthly partnership funds the field.      │
│       [ Continue ]                              │
│                                                 │
└─────────────────────────────────────────────────┘
┌─────────────┬─────────────┬─────────────┐
│ Give Once   │ Fund a      │ Church      │
│             │ Project     │ Partnership │
└─────────────┴─────────────┴─────────────┘
┌─────────────┬─────────────┬─────────────┐
│ Foundation  │ Legacy      │ Non-Cash    │
│ / DAF       │ Giving      │ Gifts       │
└─────────────┴─────────────┴─────────────┘
┌─────────────────────────────────────────────────┐
│ International Giving (full-width thin tile)     │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  Trust strip: ECFA, 501(c)(3), Annual Report    │
└─────────────────────────────────────────────────┘
```

## Form rules (every sub-page)

- Maximum three steps. Step 1: amount + frequency. Step 2: donor info.
  Step 3: payment.
- Total fields below the fold on step 1: zero.
- Required fields only. Optional fields are optional, not "optional
  but please".
- Apple Pay and Google Pay where Blackbaud supports them.
- Cover-the-fee toggle on every form. Default off.
- Recurring is clearly disclosed: "I authorize Favor International to
  charge this card monthly until I cancel. I can cancel anytime in my
  partner dashboard."

## DAF and stocks

DAFpay or TrustBridge widget on `/give/non-cash/` and
`/give/foundation/`. The widget handles the heavy lifting. Our job is
the framing and the inquiry follow-up.

## International giving routing

`/give/international/` is a routing page, not a form:

- UK: link to a partner organization (TBD) with Gift Aid.
- Canada: link to a Canadian partner with CRA-compliant receipts.
- EU: TBD. Default to direct USD gift if no local partner.

## Sub-page heros

Each sub-page gets its own hero. Reuse `HeroSplit` (variant B) for all
give sub-pages so the form has clear vertical space.

## Conversion guardrails

- No exit-intent popups.
- No "Wait! Don't go!" dialogs.
- No deceptive defaults. The frequency toggle is honest. The amount is
  the amount the donor selected.

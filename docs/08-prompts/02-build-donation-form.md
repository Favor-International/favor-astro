# Prompt: Build the Donation Form

Use this when starting the donation flow (Phase 4).

---

You are building the canonical donation form for favorintl.org. This
is the most important conversion path on the site.

Read in order:

1. `/docs/CLAUDE.md`
2. `/docs/03-design/give-page-segments.md`
3. `/docs/03-design/component-library.md` (DonationForm,
   AmountSelector, FrequencyToggle, DesignationSelect)
4. `/docs/04-tech/integrations/blackbaud.md` end to end. This is the
   most important file for this task.
5. `/docs/04-tech/stack.md` (secrets list, KV namespace conventions)

Requirements:

- Three steps max. Step 1: amount and frequency. Step 2: donor info.
  Step 3: payment.
- Apple Pay and Google Pay where Blackbaud supports them.
- Idempotency key on every submit.
- Cover-the-fee toggle, default off.
- Turnstile verification before the function calls Blackbaud.
- Magic-link partner provisioning on first recurring gift.
- Failed-payment path with clear error and a fallback contact email.
- Thank-you page with shareable framing.

Build the React island for the form (the only acceptable place for
React in the site). Wire it to `/functions/api/donate.ts` and
`/functions/api/donate-recurring.ts`.

Test against the Blackbaud sandbox environment first. Do not point at
production until Will explicitly says so.

# Portal on D1: the plan (2026-08-05)

Source of truth for rebuilding the Partner Portal on Daniel's D1 sync instead of
live SKY API calls, plus every item from Daniel's 8/5 review of the giving form.

## The landscape

| Piece | Account | What it is |
|---|---|---|
| favor-astro (site + giving) | Marketing | Pages project; the single Blackbaud token holder |
| favor-portal | Marketing | Portal worker + its own small D1 (auth, courses, prefs) |
| favor-marketing | Marketing | DRAFT app, paused 2026-08-05 (cron removed; queues self-fed; behind Access). Must not call the SKY API again until finished. |
| re-nxt-cloud-sync | Tech | Daniel's sync worker, cron 9am/9pm UTC (5am/5pm ET) |
| `re_nxt_data` | Tech | 187MB D1, 16 tables, 261K rows: constituents, gifts, addresses, emails, phones, actions, appeals, funds, campaigns. `gifts.id` PK = the Blackbaud gift id. |

Blackbaud daily API budget is shared by everything using the one app. The July
blowout was the marketing cron at */15; it is off. Daniel's sync went
incremental and now moves 0–64 records per run.

## Done today in favor-astro (Daniel's giving-form notes)

1. **Organization donors.** The name step now carries a closed disclosure,
   "Giving on behalf of a church, business, or foundation?", revealing an
   organization-name field. When set, `findOrCreateConstituent` creates a
   `type: "Organization"` constituent (name = org, email attached) instead of
   an Individual, and the gift reference records the person as the contact:
   `Organization gift; contact: First Last`. Applies to one-time and monthly.
   Existing-record path is unchanged: email search first, so a repeat org
   donor reuses its record.
2. **Website appeal on every online gift.** Both endpoints stamp
   `gift_splits[].appeal_id` from `GIVE_APPEAL_RECORD_ID`, set to `2` on
   production and preview. Record 2 = appeal code "Website" ("Website
   Donation"), confirmed against the appeals table in `re_nxt_data`. Note the
   API wants the record id, not the code string.
3. **Fee bug fixed.** When the fee choice moved from a checkbox to the
   pre-checkout dialog, the POST body kept reading the now-nonexistent
   checkbox, so the server computed the fee-free total while Blackbaud charged
   the fee-inclusive authorization. The body now sends the dialog's answer.
4. **PCI**: Daniel confirmed no DSS update needed; card capture never left
   Blackbaud Checkout. Unchanged.

Still open from Daniel's list: a real $1 live test of the form (charge +
refund), which nobody has run against production Blackbaud yet.

## The architecture: gifts flow one way, reads come from D1

```
gift POST (favor-astro) ──> Blackbaud (system of record)
        │ gift id comes back
        └──> realtime push ──> re_nxt_data.gifts (Tech D1)
                                    ▲
Daniel's sync (12-hourly) ──────────┘  upsert by the same gift id
Portal ──> small read API (Tech) ──> re_nxt_data   (no SKY calls)
```

### Dedup is by construction, not reconciliation

The realtime write happens AFTER Blackbaud accepts the gift, so we hold the
canonical RE NXT gift id. `re_nxt_data.gifts.id` is the primary key. The
realtime push INSERTs with that id; when Daniel's sync later pulls the same
gift, its upsert hits the same primary key and overwrites in place. The sync's
version wins (it carries receipt status etc. that the realtime row lacks).
Same gift, same row, twice written, never duplicated. No cleanup pass needed.

Daniel confirmed 2026-08-05: "It upserts. Blind insert is no way to properly
manage a data sync." Dedup is settled.

### The small read API (Will approved 2026-08-05)

A new worker in the Tech account, `favor-data-api`, bound to `re_nxt_data`.
Deliberately boring: bearer-key auth (same pattern as PORTAL_API_KEY), no
public exposure, JSON in/out.

- `GET  /constituent?email=` → constituent + addresses/emails/phones
- `GET  /gifts?constituent_id=` → giving history, newest first
- `GET  /recurring?constituent_id=` → active recurring gifts
- `POST /gifts/realtime` → the dual-write above (id, constituent id, amount,
  fund, appeal, date, payment method, raw json)

Decision (Will, 2026-08-05): standalone worker, our call, not Daniel's. It
does not touch his sync code and deploys independently.

### favor-astro changes (after the API exists)

In `notifyPortalGiftCompleted`'s slot (already the post-gift hook point), add
the realtime push: fire-and-forget, never blocks or fails a gift. Env adds
`DATA_API_URL` + `DATA_API_KEY`.

### Portal changes

Point giving-history reads at `favor-data-api` instead of
favor-astro's `/api/portal/giving-history` (which calls SKY live today).
Result: zero SKY API calls for portal traffic. The only SKY calls left in the
whole system are gift creation and Daniel's two syncs a day.

## Sequencing

1. Build favor-data-api + deploy to Tech account. (~an afternoon; both open
   questions are settled, nothing blocks on Friday)
2. Wire realtime push into favor-astro's two donate endpoints.
3. Repoint the portal's giving reads. Retire the SKY-backed
   /api/portal/giving-history.
4. Watch one real gift flow through: site -> portal in seconds -> evening sync
   overwrites the same row.

## Standing rules

- favor-marketing stays paused until the app is finished. Nothing re-enables
  its cron without Will.
- Global API keys, no scoped tokens. Keys live in
  `C:\Users\Willb\.claude\secrets\` (favor-will-cf.txt reaches all three
  accounts).

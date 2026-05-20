# Blackbaud Integration

Blackbaud Raiser's Edge NXT is Favor's system of record for donors and
gifts. The website is a thin client over Blackbaud's SKY API.

## Scope

- Process one-time gifts (web origin).
- Process monthly recurring gifts.
- Allow project-restricted gifts (designations).
- Sync constituent records back to Blackbaud immediately.
- Provide a logged-in partner dashboard showing giving history.

## What lives in Blackbaud, not in our DB

- The donor (constituent) record.
- Every gift, designation, payment method.
- Recurring gift schedules.
- Receipts and acknowledgement emails (Blackbaud handles).

The website does **not** store gift records. We pass through.

## What lives in our app

- Session tokens for logged-in partners.
- Mailchimp opt-in state for newsletter.
- "Favorited resources" for the partner portal.
- Cached constituent lookup data (with TTL, never durably stored).

## Auth model

OAuth 2 authorization code flow, one-time setup. Refresh token stored
as a Cloudflare Pages secret (`BLACKBAUD_REFRESH_TOKEN`). A scheduled
Pages Function refreshes the access token every 50 minutes and stores
it in a Cloudflare KV namespace.

```
[Setup once]
Admin clicks consent → Blackbaud auth code → exchange for refresh
token → store as Pages secret.

[Every request]
Function: read access token from KV → if near expiry, refresh →
proceed.
```

KV namespace: `BLACKBAUD_TOKENS`.

## Endpoints we hit

| Action                       | Endpoint                                     |
|------------------------------|----------------------------------------------|
| Create constituent           | `POST /constituent/v1/constituents`          |
| Find constituent by email    | `GET /constituent/v1/constituents/search`    |
| Create one-time gift         | `POST /gift/v1/gifts`                        |
| Create recurring gift        | `POST /gift/v1/recurringgifts`               |
| List constituent gifts       | `GET /gift/v1/gifts?constituent_id=...`      |
| Webhook: gift added          | inbound to `/api/webhooks/blackbaud/gift`    |

## Pages Functions (server side)

```
/functions
├── api/
│   ├── donate.ts                  # POST: create gift
│   ├── donate-recurring.ts        # POST: create recurring
│   ├── donor-lookup.ts            # POST: find or create constituent
│   ├── webhooks/
│   │   └── blackbaud/
│   │       └── gift.ts            # inbound webhook
│   ├── portal/
│   │   ├── giving-history.ts      # GET: list of gifts
│   │   └── update-method.ts       # POST: update payment method
└── _middleware.ts                 # CSRF, Turnstile, auth
```

## Donation flow (one-time, happy path)

```
1. User on /give/one-time/ submits the form.
2. Frontend POSTs to /api/donate with amount, designation,
   donor info, payment token.
3. Function calls Turnstile verify.
4. Function searches Blackbaud for a constituent by email.
   - If found, use that ID.
   - If not, create constituent.
5. Function creates the gift with payment.
6. Function returns gift ID and receipt summary.
7. Frontend redirects to /give/thank-you?ref=<gift_id>.
8. Blackbaud sends the official receipt email.
```

## Recurring flow

Same as above, but uses the recurring gifts endpoint. After successful
creation, the function also:

1. Generates a partner account (magic-link token).
2. Sends an email with the magic link to log in to the portal.
3. Tags the constituent in Blackbaud with `Web Partner` for
   segmentation.

## Webhook: gift added

Blackbaud posts to `/api/webhooks/blackbaud/gift` when any gift is
added (including offline). We use this to:

- Provision a portal account if it's the donor's first gift.
- Refresh the cached portal dashboard for that constituent.
- Trigger any campaign-specific thank-you flow.

Verify the webhook signature. Reject any request without a valid HMAC.

## DAF and stock gifts

DAFpay and TrustBridge widgets handle the gift initiation. Blackbaud
records the gift when the DAF check arrives, via Favor's existing
back-office process. The website only needs to embed the widget and
follow up with an inquiry record.

## Error handling

- Network or auth failures: surface a generic "We could not process
  this gift" message and email the team at `donations@favorintl.org`
  with the request payload for manual recovery.
- Idempotency: include an idempotency key on every gift create call
  (UUID generated client-side, persisted through the function).

## Compliance

- PCI: We never touch raw card data. Blackbaud's hosted form or
  tokenization handles it.
- Receipts: Blackbaud generates and sends. Do not duplicate.
- Data retention: We do not log card tokens or any PII in our app
  logs. Sentry is configured to scrub.

## Action items before build

- [ ] Get Blackbaud SKY API credentials from Carole or the IT contact.
- [ ] Identify the Blackbaud subscription key and developer account.
- [ ] List the active designations (project codes) for the
      project-restricted giving page.
- [ ] Decide on the magic-link email template wording.
- [ ] Confirm the `Web Partner` constituent tag exists or create it.

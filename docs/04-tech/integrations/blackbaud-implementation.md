# Blackbaud Giving: Implementation Runbook

Status: built 2026-07-21 on branch `feature/blackbaud-giving`.
This is the as-built companion to `blackbaud.md` (the original spec).
The site now runs its own three-step giving form against the SKY API.
The hosted BBDonorFormLoader embed on /give/donate/ is gone.

## What was built

Frontend (static Astro):

- `src/components/give/DonationForm.astro`: the canonical form.
  Three steps (amount + frequency, donor info, review + payment).
  Card entry happens inside Blackbaud Checkout (bbCheckout.2.0.js),
  so no card data ever touches our pages or functions.
- `/give/donate/` hosts the form. Deep links work:
  `/give/donate/?frequency=monthly&amount=100&designation=<fund_id>`
- `/give/thank-you/` confirmation page (noindex).
- `DonationBlock` on /give/one-time/ and /give/partner-monthly/ now
  passes the chosen amount and frequency into the form link.

Server (Cloudflare Pages Functions, `functions/api/`):

| Route | Purpose |
|---|---|
| `GET /api/give/config` | Public bootstrap: checkout public key, payment configuration, designations, fee estimate, Turnstile site key |
| `POST /api/give/donate` | One-time gift: find/create constituent, then one Gift API call that charges the Checkout authorization and records the gift (`payments[].checkout_transaction_id` + `charge_transaction: true`) |
| `POST /api/give/donate-recurring` | Monthly gift: RecurringGift with MONTHLY schedule (starts next month) + first installment charged/recorded as RecurringGiftPayment + `converttoautomatic` against the vaulted card token |
| `GET /api/blackbaud/auth?key=` | Admin: one-time OAuth connect (redirects to Blackbaud consent) |
| `GET /api/blackbaud/callback` | OAuth redirect target; stores tokens in KV |
| `GET /api/blackbaud/status?key=` | Admin: connection, environment, payment config, designation health |
| `GET /api/blackbaud/funds?key=` | Admin: lists active RE NXT funds to pick designation ids |

Token model: SKY API access tokens live 60 minutes; refresh tokens live
365 days and rotate on every refresh. Both live in the `BLACKBAUD_TOKENS`
KV namespace; refresh happens on demand with a 2-minute headroom and one
automatic 401 retry.

Recurring model: Blackbaud Checkout is opened with a fresh `card_token`
GUID, which makes Checkout charge the first month AND vault the card
under that token. The recurring gift is then converted to automatic
(`POST /gift/v1/recurringgifts/{id}/converttoautomatic`) so Blackbaud
charges the vaulted card on schedule from month two on. Digital wallets
do not vault, so the form disables Apple Pay (`use_apple_pay: false`).
If conversion ever fails the response and function logs carry a warning
and the gift can be automated manually in RE NXT (the donor's money and
records are already correct).

Safety rails:

- Idempotency key per submission; retries return the stored result
  instead of charging twice (KV, 24h).
- Server-side designation allowlist; unknown fund ids are rejected.
- Turnstile verification when `TURNSTILE_SECRET_KEY` is set.
- `/api/give/config` returns `connected: false` while setup is
  incomplete and the form falls back to check/Zelle/CashApp routes, so
  previews never break.
- Amounts: $1 minimum, $250,000 cap, validated on both sides.
- Admin endpoints require `BLACKBAUD_SETUP_KEY` (constant-time compare).

## Go-live checklist (in order)

1. **Blackbaud application** (developer.blackbaud.com/apps, app
   `f540317d-af68-4018-a5e5-6ecb74ddeac0`):
   - Redirect URIs, exact strings:
     - `https://favorintl.org/api/blackbaud/callback`
     - `https://favor-astro.pages.dev/api/blackbaud/callback`
     - `http://localhost:8788/api/blackbaud/callback`
   - Scopes (Limited access): the integration needs
     read + write on Constituent, Gift, Fundraising (read), and
     Payments (read + execute). If a needed scope is not offered under
     Limited, use Full and constrain via the connected user's RE NXT
     security role instead.
   - Note the **Application ID** (OAuth client_id) and **Application
     secret** (client_secret).
2. **Subscription key**: developer.blackbaud.com/subscriptions, primary
   access key of the developer account that owns the app.
3. **Environment admin**: Daniel (Blackbaud admin) approves/connects the
   application for Favor's environment (Marketplace > Manage > Connect
   application, app ID above) if it is not already connected.
4. **Cloudflare Pages** (favor-astro project):
   - Create KV namespace `favor-blackbaud-tokens`; bind it to the Pages
     project as `BLACKBAUD_TOKENS` (Production and Preview).
   - Set env vars (Production and Preview): `BLACKBAUD_CLIENT_ID`,
     `BLACKBAUD_CLIENT_SECRET` (secret), `BLACKBAUD_SUBSCRIPTION_KEY`
     (secret), `BLACKBAUD_SETUP_KEY` (secret, any long random string),
     `BLACKBAUD_DEFAULT_FUND_ID` (after step 6), optionally
     `GIVING_DESIGNATIONS`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.
5. **Connect OAuth once**: as a Blackbaud user in Favor's environment
   with RE NXT rights, open
   `https://<deployment>/api/blackbaud/auth?key=<BLACKBAUD_SETUP_KEY>`
   and approve. The callback page confirms environment + scopes.
6. **Pick funds**: `GET /api/blackbaud/funds?key=...`, choose the fund
   id(s); set `BLACKBAUD_DEFAULT_FUND_ID` (and `GIVING_DESIGNATIONS`
   for a real designation dropdown, e.g. Where Most Needed + current
   projects). Redeploy.
7. **Verify**: `GET /api/blackbaud/status?key=...` shows
   `payment_configuration.process_mode`. Use `GIVE_TEST_MODE=true` on
   Preview to prefer a Test-mode BBMS configuration if one exists.
8. **Test gifts**: one-time and monthly, small amounts, on the branch
   preview URL. Confirm in RE NXT: constituent, gift, first installment,
   recurring gift shows automatic processing. Refund via BBMS portal.
9. **Apple Pay (later, optional)**: host Blackbaud's
   `apple-developer-merchantid-domain-association` file under
   `public/.well-known/`, then set `use_apple_pay: true` in
   `DonationForm.astro`. Blackbaud auto-registers the domain within
   48 hours.

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars   # fill in credentials
npm run build
npx wrangler pages dev dist --kv BLACKBAUD_TOKENS --port 8788
# visit http://localhost:8788/give/donate/
```

`wrangler pages dev` simulates the KV namespace locally; the OAuth
connect flow works against localhost because
`http://localhost:8788/api/blackbaud/callback` is a registered redirect
URI. Blackbaud Checkout requires HTTPS pages in production; if the
modal refuses to open on plain-http localhost, test the checkout step
on the branch preview URL instead (deploys automatically on push).

## Testing against the local mock (no Blackbaud account needed)

`mock-sky.mjs` (repo root) fakes the exact SKY API surface the functions
use and logs every request body to `mock-sky.log` for inspection. The
whole pipeline (OAuth connect, config, one-time gift, idempotent
replay, recurring gift + converttoautomatic) was verified against it
2026-07-21; the logged payloads match the published SKY API schemas.

```bash
node mock-sky.mjs &                # port 9799
cat >> .dev.vars <<'EOF'
BLACKBAUD_API_BASE=http://127.0.0.1:9799
BLACKBAUD_TOKEN_URL=http://127.0.0.1:9799/token
BLACKBAUD_AUTHORIZE_URL=http://127.0.0.1:9799/authorize
EOF
npm run build && npx wrangler pages dev dist --kv BLACKBAUD_TOKENS --port 8788
# connect: GET /api/blackbaud/auth?key=<setup key>, follow state into
#          /api/blackbaud/callback?code=anything&state=<state>
# then exercise /api/give/donate and /api/give/donate-recurring
```

The three `BLACKBAUD_*_URL/BASE` overrides exist for this harness only.
Never set them on the Cloudflare Pages project.

## Operational notes

- **Receipts**: Blackbaud sends them; the site never duplicates.
- **Refunds**: BBMS Web Portal (or `POST /payments/v1/refunds` later).
- **Reconnect**: only needed if the refresh token dies (unused 365
  days, credential rotation, or revoked). `/api/blackbaud/status`
  reports it; `/api/blackbaud/auth` fixes it.
- **Secret rotation**: rotate the app secret in the dev portal, update
  `BLACKBAUD_CLIENT_SECRET`, reconnect OAuth. Log it in
  `00-decisions/decision-log.md` per the deployment doc.
- **Failure alerting**: recurring conversion warnings are logged with
  `[give/recurring]` in Pages Function logs (Cloudflare dashboard >
  favor-astro > Functions > Real-time logs).
- **What we never store**: card numbers (never touch us), checkout
  tokens after completion, donor PII in KV (idempotency records hold
  gift id + amount only).

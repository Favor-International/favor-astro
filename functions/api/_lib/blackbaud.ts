// Blackbaud SKY API client for Cloudflare Pages Functions.
//
// Auth model (docs/04-tech/integrations/blackbaud.md): OAuth 2 authorization
// code flow, one-time admin consent. Tokens live in the BLACKBAUD_TOKENS KV
// namespace and rotate on refresh (SKY API refresh tokens are single-use,
// valid 365 days; access tokens valid 60 minutes).
//
// Endpoint + schema references (verified 2026-07-21 against the SKY API
// definitions served by developer.sky.blackbaud.com):
//   POST https://oauth2.sky.blackbaud.com/token            (Basic client auth)
//   GET  https://app.blackbaud.com/oauth/authorize          (consent)
//   GET  /payments/v1/checkout/publickey                    -> { public_key }
//   GET  /payments/v1/paymentconfigurations                 -> { value: [...] }
//   GET  /payments/v1/cards/{card_token}                    -> stored card
//   POST /gift/v1/gifts                                     -> { id } (PostResponse)
//   GET  /gift/v1/recurringgifts/{id}/canbeconverted
//   POST /gift/v1/recurringgifts/{id}/converttoautomatic
//   GET  /constituent/v1/constituents/search
//   POST /constituent/v1/constituents
//   GET  /fundraising/v1/funds

export interface Env {
  BLACKBAUD_TOKENS: KVNamespace;
  BLACKBAUD_CLIENT_ID: string;
  BLACKBAUD_CLIENT_SECRET: string;
  /** Subscription key for the Standard APIs product (constituent/gift/fundraising). */
  BLACKBAUD_SUBSCRIPTION_KEY: string;
  /** Subscription key for the Payments API product. Falls back to the standard key if unset. */
  BLACKBAUD_PAYMENTS_SUBSCRIPTION_KEY?: string;
  /** Shared secret that guards the admin endpoints (/api/blackbaud/*). */
  BLACKBAUD_SETUP_KEY?: string;
  /** Pin a specific BBMS payment configuration id. Otherwise auto-select. */
  BLACKBAUD_PAYMENT_CONFIG_ID?: string;
  /** Fund id used when GIVING_DESIGNATIONS is not configured. */
  BLACKBAUD_DEFAULT_FUND_ID?: string;
  /** JSON array: [{ "fund_id": "123", "label": "Where Most Needed" }, ...] */
  GIVING_DESIGNATIONS?: string;
  /** "true" prefers a Test-mode payment configuration (staging/previews). */
  GIVE_TEST_MODE?: string;
  /** Donor fee-cover estimate, defaults 0.029 + 0.30. */
  GIVE_FEE_RATE?: string;
  /** RE NXT appeal RECORD id (not the lookup code) stamped on every online gift split. "Website" = record 2. */
  GIVE_APPEAL_RECORD_ID?: string;
  GIVE_FEE_FIXED?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  /** Shared secret for the portal trust pair (giving-history, recurring, hook). */
  PORTAL_API_KEY?: string;
  /** Base URL of the Favor Partner Portal (gift-completed hook target). */
  PORTAL_HOOK_URL?: string;
  /** Integration-test overrides ONLY (.dev.vars against a local mock). Never set in production. */
  BLACKBAUD_API_BASE?: string;
  BLACKBAUD_TOKEN_URL?: string;
  BLACKBAUD_AUTHORIZE_URL?: string;
}

export const apiBase = (env: Env) => env.BLACKBAUD_API_BASE ?? 'https://api.sky.blackbaud.com';
export const tokenUrl = (env: Env) => env.BLACKBAUD_TOKEN_URL ?? 'https://oauth2.sky.blackbaud.com/token';
export const authorizeUrl = (env: Env) => env.BLACKBAUD_AUTHORIZE_URL ?? 'https://app.blackbaud.com/oauth/authorize';

const TOKENS_KEY = 'bb:oauth';
const STATE_KEY = 'bb:oauth:state:';
const PUBKEY_CACHE = 'bb:cache:publickey';
const PAYCONFIG_CACHE = 'bb:cache:payconfig';

export class BlackbaudError extends Error {
  status: number;
  code: string;
  detail?: unknown;
  constructor(code: string, message: string, status = 500, detail?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

interface StoredTokens {
  access_token: string;
  refresh_token: string;
  /** Epoch ms when the access token expires. */
  expires_at: number;
  environment_id?: string;
  environment_name?: string;
  legal_entity_name?: string;
  user_email?: string;
  mode?: string;
  scope?: string;
  obtained_at: number;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_token_expires_in?: number;
  environment_id?: string;
  environment_name?: string;
  legal_entity_name?: string;
  email?: string;
  mode?: string;
  scope?: string;
  token_type?: string;
}

function basicAuth(env: Env): string {
  return 'Basic ' + btoa(`${env.BLACKBAUD_CLIENT_ID}:${env.BLACKBAUD_CLIENT_SECRET}`);
}

export function requireCredentials(env: Env): void {
  const missing = ['BLACKBAUD_CLIENT_ID', 'BLACKBAUD_CLIENT_SECRET', 'BLACKBAUD_SUBSCRIPTION_KEY']
    .filter((k) => !(env as unknown as Record<string, string | undefined>)[k]);
  if (missing.length > 0) {
    throw new BlackbaudError(
      'not_configured',
      `Missing environment variables: ${missing.join(', ')}`,
      503
    );
  }
}

async function saveTokenResponse(
  env: Env,
  tok: TokenResponse,
  previous?: StoredTokens | null
): Promise<StoredTokens> {
  // Two ways this used to brick giving permanently, both of which look
  // identical from outside (token_refresh_failed forever, only fixable by a
  // human reconnecting):
  //
  // 1. A refresh response that omits refresh_token. JSON.stringify drops
  //    undefined, so the stored record lost its refresh token entirely and
  //    every later refresh sent nothing. Carrying the previous one forward is
  //    the standard OAuth behaviour: only replace it when a new one is issued.
  // 2. A 200 response that is not actually a token grant. Persisting that
  //    overwrote a working record with garbage.
  const refresh = tok.refresh_token || previous?.refresh_token;
  if (!tok.access_token || !refresh) {
    throw new BlackbaudError(
      'oauth_bad_token_response',
      'Blackbaud returned a token response without an access token or a usable refresh token. The stored tokens were left untouched.',
      502
    );
  }
  const stored: StoredTokens = {
    access_token: tok.access_token,
    refresh_token: refresh,
    expires_at: Date.now() + Math.max(60, tok.expires_in - 120) * 1000,
    environment_id: tok.environment_id,
    environment_name: tok.environment_name,
    legal_entity_name: tok.legal_entity_name,
    user_email: tok.email,
    mode: tok.mode,
    scope: tok.scope,
    obtained_at: Date.now(),
  };
  await env.BLACKBAUD_TOKENS.put(TOKENS_KEY, JSON.stringify(stored));
  return stored;
}

export async function readStoredTokens(env: Env): Promise<StoredTokens | null> {
  const raw = await env.BLACKBAUD_TOKENS.get(TOKENS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

export async function exchangeCodeForTokens(
  env: Env,
  code: string,
  redirectUri: string
): Promise<StoredTokens> {
  const res = await fetch(tokenUrl(env), {
    method: 'POST',
    headers: {
      Authorization: basicAuth(env),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new BlackbaudError('oauth_exchange_failed', `Token exchange failed (${res.status})`, 502, text);
  }
  return saveTokenResponse(env, (await res.json()) as TokenResponse);
}

async function refreshTokens(env: Env, current: StoredTokens): Promise<StoredTokens> {
  const res = await fetch(tokenUrl(env), {
    method: 'POST',
    headers: {
      Authorization: basicAuth(env),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    // preserve_refresh_token opts out of Blackbaud's sliding window. By
    // default every refresh mints a NEW refresh token and kills the old one,
    // which is unsafe here: favor-astro is the single token holder for the
    // whole estate (the marketing platform reaches Blackbaud through this
    // site's endpoints, per the single-token doctrine), so a nightly bulk sync
    // can have several refreshes in flight at once. The first one to land
    // invalidates the token the others are still holding, and every one of
    // them then fails with invalid_grant, permanently.
    //
    // With this flag Blackbaud keeps the same refresh token and its original
    // expiry, so concurrent refreshes stop knocking each other over. If the
    // response comes back without a refresh_token (which is the whole point of
    // the flag), saveTokenResponse carries the existing one forward rather
    // than storing undefined over it.
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: current.refresh_token,
      preserve_refresh_token: 'true',
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    // A dead refresh token means the admin must reconnect. Keep the stored
    // record so /api/blackbaud/status can explain what happened.
    //
    // Pull out the OAuth error code, because the two common ones need
    // completely different fixes and are otherwise indistinguishable:
    //   invalid_grant  the refresh token is spent, revoked, or expired
    //                  -> reconnecting works
    //   invalid_client the client id/secret no longer match the app that
    //                  issued this token -> reconnecting fails the same way
    //                  until the credentials are fixed first
    let oauthError: string | undefined;
    try {
      oauthError = (JSON.parse(text) as { error?: string }).error;
    } catch {
      /* non-JSON error body */
    }
    throw new BlackbaudError(
      'not_connected',
      'Blackbaud refresh token was rejected. An administrator must reconnect at /api/blackbaud/auth.',
      503,
      { status: res.status, oauth_error: oauthError ?? null, body: text.slice(0, 300) }
    );
  }
  return saveTokenResponse(env, (await res.json()) as TokenResponse, current);
}

export async function getAccessToken(env: Env, forceRefresh = false): Promise<string> {
  requireCredentials(env);
  const stored = await readStoredTokens(env);
  if (!stored) {
    throw new BlackbaudError(
      'not_connected',
      'Blackbaud is not connected yet. An administrator must complete /api/blackbaud/auth once.',
      503
    );
  }
  if (!forceRefresh && stored.expires_at > Date.now()) return stored.access_token;
  const fresh = await refreshTokens(env, stored);
  return fresh.access_token;
}

/** Blackbaud issues one subscription key per product; route by API path. */
function subscriptionKeyFor(env: Env, path: string): string {
  if (path.startsWith('/payments/')) {
    return env.BLACKBAUD_PAYMENTS_SUBSCRIPTION_KEY ?? env.BLACKBAUD_SUBSCRIPTION_KEY;
  }
  return env.BLACKBAUD_SUBSCRIPTION_KEY;
}

/** Authenticated SKY API fetch with one automatic retry on 401/429. */
export async function bbFetch(env: Env, path: string, init: RequestInit = {}): Promise<Response> {
  let token = await getAccessToken(env);
  const doFetch = (bearer: string) =>
    fetch(apiBase(env) + path, {
      ...init,
      headers: {
        Authorization: `Bearer ${bearer}`,
        'Bb-Api-Subscription-Key': subscriptionKeyFor(env, path),
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });

  let res = await doFetch(token);
  if (res.status === 401) {
    token = await getAccessToken(env, true);
    res = await doFetch(token);
  } else if (res.status === 429) {
    const wait = Math.min(5, Number(res.headers.get('Retry-After') ?? '1') || 1);
    await new Promise((r) => setTimeout(r, wait * 1000));
    res = await doFetch(token);
  }
  return res;
}

export async function bbJson<T>(env: Env, path: string, init: RequestInit = {}): Promise<T> {
  const res = await bbFetch(env, path, init);
  const text = await res.text();
  if (!res.ok) {
    throw new BlackbaudError(
      'sky_api_error',
      `SKY API ${init.method ?? 'GET'} ${path} failed (${res.status})`,
      res.status >= 500 ? 502 : res.status,
      safeParse(text)
    );
  }
  // SKY PATCH/PUT often returns 200 with an empty body. res.json() throws on
  // that, which made the portal amount-change look like a 500 after SKY had
  // already accepted the write.
  if (res.status === 204 || !text.trim()) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new BlackbaudError(
      'sky_bad_json',
      `SKY API ${init.method ?? 'GET'} ${path} returned non-JSON (${res.status})`,
      502,
      text.slice(0, 300)
    );
  }
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text.slice(0, 1000);
  }
}

// ---------------------------------------------------------------------------
// OAuth state helpers (CSRF protection on the connect flow)

export async function createOauthState(env: Env): Promise<string> {
  const state = crypto.randomUUID();
  await env.BLACKBAUD_TOKENS.put(STATE_KEY + state, '1', { expirationTtl: 600 });
  return state;
}

export async function consumeOauthState(env: Env, state: string): Promise<boolean> {
  if (!state) return false;
  const hit = await env.BLACKBAUD_TOKENS.get(STATE_KEY + state);
  if (!hit) return false;
  await env.BLACKBAUD_TOKENS.delete(STATE_KEY + state);
  return true;
}

// ---------------------------------------------------------------------------
// Payments helpers

export interface PaymentConfig {
  id: string;
  name?: string;
  process_mode?: string;
  currency?: string;
  active?: boolean;
}

export async function getPublicKey(env: Env): Promise<string> {
  const cached = await env.BLACKBAUD_TOKENS.get(PUBKEY_CACHE);
  if (cached) return cached;
  const data = await bbJson<{ public_key: string }>(env, '/payments/v1/checkout/publickey');
  if (!data.public_key) throw new BlackbaudError('no_public_key', 'Blackbaud returned no checkout public key', 502);
  await env.BLACKBAUD_TOKENS.put(PUBKEY_CACHE, data.public_key, { expirationTtl: 86400 });
  return data.public_key;
}

export async function getPaymentConfig(env: Env): Promise<PaymentConfig> {
  const cached = await env.BLACKBAUD_TOKENS.get(PAYCONFIG_CACHE);
  if (cached) {
    try {
      return JSON.parse(cached) as PaymentConfig;
    } catch {
      /* refetch */
    }
  }
  const data = await bbJson<{ value?: PaymentConfig[] }>(env, '/payments/v1/paymentconfigurations');
  const configs = (data.value ?? []).filter((c) => c.active !== false);
  if (configs.length === 0) {
    throw new BlackbaudError('no_payment_config', 'No active Blackbaud payment configurations found', 503);
  }

  let chosen: PaymentConfig | undefined;
  if (env.BLACKBAUD_PAYMENT_CONFIG_ID) {
    chosen = configs.find((c) => c.id?.toLowerCase() === env.BLACKBAUD_PAYMENT_CONFIG_ID?.toLowerCase());
    if (!chosen) {
      throw new BlackbaudError(
        'payment_config_not_found',
        `Pinned BLACKBAUD_PAYMENT_CONFIG_ID not found among active configurations`,
        503
      );
    }
  } else if (env.GIVE_TEST_MODE === 'true') {
    chosen = configs.find((c) => (c.process_mode ?? '').toLowerCase() !== 'live') ?? configs[0];
  } else {
    chosen = configs.find((c) => (c.process_mode ?? '').toLowerCase() === 'live') ?? configs[0];
  }

  await env.BLACKBAUD_TOKENS.put(PAYCONFIG_CACHE, JSON.stringify(chosen), { expirationTtl: 3600 });
  return chosen;
}

// ---------------------------------------------------------------------------
// Designations

export interface Designation {
  fund_id: string;
  label: string;
}

export function getDesignations(env: Env): Designation[] {
  if (env.GIVING_DESIGNATIONS) {
    try {
      const parsed = JSON.parse(env.GIVING_DESIGNATIONS) as Designation[];
      const clean = parsed.filter((d) => d && typeof d.fund_id === 'string' && typeof d.label === 'string');
      if (clean.length > 0) return clean;
    } catch {
      // fall through to the default fund
    }
  }
  if (env.BLACKBAUD_DEFAULT_FUND_ID) {
    return [{ fund_id: env.BLACKBAUD_DEFAULT_FUND_ID, label: 'Where Most Needed' }];
  }
  return [];
}

// Campaign flyer deep-links (?designation=) that should not appear on the
// public dropdown. 2026-08-28: Land Cruiser PDFs encoded the High School
// Blackbaud form; /landcruiser now lands here on fund 175 (Vehicle Match).
export const CAMPAIGN_DESIGNATIONS: Designation[] = [
  { fund_id: '175', label: 'Land Cruisers' },
];

export function resolveDesignation(env: Env, fundId: string): Designation | undefined {
  return (
    getDesignations(env).find((d) => d.fund_id === fundId) ??
    CAMPAIGN_DESIGNATIONS.find((d) => d.fund_id === fundId)
  );
}

// ---------------------------------------------------------------------------
// Constituents

export interface DonorInput {
  first: string;
  last: string;
  email: string;
  phone?: string;
  /** When set, the gift belongs to an Organization constituent, not the person. */
  org_name?: string;
}

interface SearchResult {
  id: string;
  email?: string;
  name?: string;
  type?: string;
  inactive?: boolean;
  deceased?: boolean;
}

/**
 * Best-effort donor lookup by email. The search call is an optimization to
 * avoid duplicate constituents; it must NEVER block a gift. Environments
 * differ in which query params they accept (a param combo that 400s in one
 * tenant works in another), so this walks progressively simpler queries and
 * finally gives up and returns null (caller creates a fresh constituent,
 * which Favor's team can merge later).
 */
export async function searchConstituentByEmail(env: Env, email: string): Promise<SearchResult | null> {
  const e = encodeURIComponent(email);
  const attempts = [
    `search_text=${e}&search_field=email_address&strict_search=true&limit=10`,
    `search_text=${e}&search_field=email_address&limit=10`,
    `search_text=${e}&limit=25`,
  ];
  const wanted = email.toLowerCase();
  for (const qs of attempts) {
    const res = await bbFetch(env, `/constituent/v1/constituents/search?${qs}`);
    if (res.ok) {
      const found = (await res.json()) as { value?: SearchResult[] };
      const match = (found.value ?? []).find(
        (r) => (r.email ?? '').toLowerCase() === wanted && !r.deceased
      );
      return match ?? null;
    }
    const body = await res.text();
    console.error(`[blackbaud] constituent search variant failed (${res.status}): ${qs} :: ${body.slice(0, 300)}`);
    if (res.status !== 400) break; // auth/5xx problems will not improve by simplifying the query
  }
  return null;
}

export async function findOrCreateConstituent(env: Env, donor: DonorInput): Promise<string> {
  const existing = await searchConstituentByEmail(env, donor.email);
  // Reuse an existing record only when its type matches the gift. Without this
  // gate, an organization gift whose contact email already belongs to a person
  // would attach to that Individual record (Daniel's exact concern): a church
  // typed into the form must never book under an Individual. An org gift only
  // reuses an Organization record; a personal gift only reuses a non-org
  // record. Any mismatch falls through and creates the correct new record,
  // which the team can merge later if needed.
  if (existing) {
    const isOrgRecord = (existing.type ?? '').toLowerCase() === 'organization';
    const wantOrg = !!donor.org_name;
    if (isOrgRecord === wantOrg) return existing.id;
  }

  // Organization gifts get an Organization record (Daniel, 2026-08-05):
  // a church typed into the person fields must never become an Individual
  // constituent. The person stays on the gift reference as the contact.
  const body: Record<string, unknown> = donor.org_name
    ? {
        type: 'Organization',
        name: donor.org_name,
        email: { address: donor.email, type: 'Email', primary: true },
      }
    : {
        type: 'Individual',
        first: donor.first,
        last: donor.last,
        email: { address: donor.email, type: 'Email', primary: true },
      };
  if (donor.phone) {
    body.phone = { number: donor.phone, type: 'Home', primary: true };
  }
  try {
    const created = await bbJson<{ id: string }>(env, '/constituent/v1/constituents', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return created.id;
  } catch (err) {
    // Phone/email type tables vary per environment. Retry once without phone
    // before giving up so a table mismatch never blocks a gift.
    if (donor.phone && err instanceof BlackbaudError && err.status === 400) {
      delete body.phone;
      const created = await bbJson<{ id: string }>(env, '/constituent/v1/constituents', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return created.id;
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Gifts

export interface GiftSplitInput {
  fund_id: string;
  amount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

/** ISO date exactly one month from now (recurring schedule start). */
export function nextMonthIso(): string {
  const d = new Date();
  const targetMonth = d.getUTCMonth() + 1;
  const next = new Date(Date.UTC(d.getUTCFullYear(), targetMonth, d.getUTCDate()));
  // Handle month-length rollover (e.g. Jan 31 -> Feb): clamp to last day.
  if (next.getUTCMonth() !== ((targetMonth) % 12)) {
    next.setUTCDate(0);
  }
  return next.toISOString();
}

/**
 * Stamp the "Partner" constituent code on a web donor (Daniel, 2026-08-06).
 * Checks first so a repeat donor never collects duplicates. Failure-isolated:
 * runs after the gift exists in Blackbaud and must never affect it.
 */
export async function ensureConstituentCode(
  env: Env,
  constituentId: string,
  description: string
): Promise<void> {
  try {
    const existing = await bbJson<{ value?: Array<{ description?: string }> }>(
      env,
      `/constituent/v1/constituents/${encodeURIComponent(constituentId)}/constituentcodes?limit=50`
    );
    const has = (existing.value ?? []).some(
      (c) => (c.description ?? '').toLowerCase() === description.toLowerCase()
    );
    if (has) return;
    await bbJson(env, '/constituent/v1/constituentcodes', {
      method: 'POST',
      body: JSON.stringify({ constituent_id: constituentId, description }),
    });
  } catch (err) {
    console.error(
      `[blackbaud] constituent code "${description}" for ${constituentId} failed: ${err instanceof Error ? err.message : err}`
    );
  }
}

/**
 * Make the org-gift promise true (Daniel, 2026-08-06): "the record will be in
 * the organization's name, with you as the contact." Creates (or finds) an
 * Individual record for the contact person and links it to the Organization
 * with a relationship marked is_organization_contact.
 *
 * Relationship TYPE values live in a per-tenant table, so unknown values 400.
 * The attempts walk from the most standard pairing down to a bare link; if
 * every attempt fails, the contact Individual still exists and the gift
 * reference still names them, so nothing is lost beyond the link itself.
 * Failure-isolated: runs post-gift and never affects it.
 */
export async function ensureOrgContact(
  env: Env,
  orgId: string,
  contact: { first: string; last: string; email: string; phone?: string }
): Promise<void> {
  try {
    // Explicitly rebuild WITHOUT org_name: this creates or reuses the PERSON.
    // Callers pass the whole donor object, and if org_name leaked through,
    // findOrCreateConstituent would mint a second Organization instead of the
    // contact Individual. The type-gate then keeps the org record (which
    // shares this email) from being reused for the person.
    const personId = await findOrCreateConstituent(env, {
      first: contact.first,
      last: contact.last,
      email: contact.email,
      phone: contact.phone,
    });
    if (personId === orgId) return; // paranoid guard; the type gate should prevent this

    const attempts: Array<Record<string, unknown>> = [
      { type: 'Employee', reciprocal_type: 'Employer' },
      { type: 'Contact', reciprocal_type: 'Contact' },
      {},
    ];
    for (const extra of attempts) {
      try {
        await bbJson(env, '/constituent/v1/relationships', {
          method: 'POST',
          body: JSON.stringify({
            constituent_id: personId,
            relation_id: orgId,
            is_organization_contact: true,
            is_primary_business: true,
            ...extra,
          }),
        });
        return;
      } catch (err) {
        if (err instanceof BlackbaudError && err.status === 400) continue;
        throw err;
      }
    }
    console.error(`[blackbaud] all relationship variants 400ed linking ${personId} -> org ${orgId}`);
  } catch (err) {
    console.error(
      `[blackbaud] org contact link for org ${orgId} failed: ${err instanceof Error ? err.message : err}`
    );
  }
}

/**
 * The gift date as Favor's own calendar date, not UTC's.
 *
 * Will's real $1 test (2026-08-06, 9:11pm ET) recorded as August 7 because
 * new Date().toISOString() is UTC, where it was already tomorrow. RE NXT gift
 * dates are calendar dates in the org's world (Florida, Eastern), and
 * Daniel's sync stores them as "YYYY-MM-DDT00:00:00". Any gift after 8pm EDT
 * (7pm EST) would land on the wrong day, every single evening.
 */
export function etGiftDate(now = new Date()): string {
  const et = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now); // en-CA gives YYYY-MM-DD
  return `${et}T00:00:00`;
}

export function buildReference(parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(' | ').slice(0, 250);
}

export async function createGift(env: Env, gift: Record<string, unknown>): Promise<{ id: string }> {
  return bbJson<{ id: string }>(env, '/gift/v1/gifts', {
    method: 'POST',
    body: JSON.stringify(gift),
  });
}

export async function deleteGiftQuietly(env: Env, giftId: string): Promise<void> {
  try {
    await bbFetch(env, `/gift/v1/gifts/${giftId}`, { method: 'DELETE' });
  } catch {
    // best effort cleanup only
  }
}

export async function convertRecurringGiftToAutomatic(
  env: Env,
  giftId: string,
  paymentConfigId: string,
  accountToken: string
): Promise<{ automated: boolean; detail?: string }> {
  try {
    const check = await bbJson<{ can_be_converted?: boolean; errors?: unknown[] }>(
      env,
      `/gift/v1/recurringgifts/${giftId}/canbeconverted`
    );
    if (check && check.can_be_converted === false) {
      return { automated: false, detail: 'Blackbaud reports the gift cannot be auto-converted' };
    }
  } catch {
    // The check endpoint failing is not fatal; try the conversion anyway.
  }
  try {
    await bbJson(env, `/gift/v1/recurringgifts/${giftId}/converttoautomatic`, {
      method: 'POST',
      body: JSON.stringify({
        bbps_configuration_id: paymentConfigId,
        account_token: accountToken,
      }),
    });
    return { automated: true };
  } catch (err) {
    const detail = err instanceof BlackbaudError ? JSON.stringify(err.detail).slice(0, 500) : String(err);
    return { automated: false, detail };
  }
}

/** True when the card token exists in the BBPS vault (wallet payments skip vaulting). */
export async function cardTokenVaulted(env: Env, cardToken: string): Promise<boolean> {
  const res = await bbFetch(env, `/payments/v1/cards/${cardToken}`);
  return res.ok;
}

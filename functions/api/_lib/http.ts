// Small HTTP helpers shared by the giving endpoints.

import { BlackbaudError, type Env } from './blackbaud';

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

export function errorJson(code: string, message: string, status = 400, detail?: unknown): Response {
  return json({ ok: false, error: code, message, detail }, status);
}

function describeError(err: unknown): { code: string; message: string; status: number } {
  if (err instanceof BlackbaudError) {
    console.error(`[blackbaud] ${err.code}: ${err.message}`, err.detail ?? '');
    // detail stays in the logs; SKY API payloads can echo donor data.
    return { code: err.code, message: err.message, status: err.status };
  }
  console.error('[give] unexpected error', err);
  return {
    code: 'internal',
    message: 'Something went wrong on our side. Your card was not charged twice; please try again or email us.',
    status: 500,
  };
}

export function handleError(err: unknown): Response {
  const d = describeError(err);
  return errorJson(d.code, d.message, d.status);
}

/**
 * What the giving form may do after a failed gift request:
 *   same          nothing was charged; send the same authorization again
 *   new_checkout  nothing was charged and the authorization is spent or
 *                 refused; open the card window for a new one
 *   wait          the first request with this key is still running
 *   none          the charge may have gone through; never charge again, ask
 *                 the giver to email
 */
export type GiftRetry = 'same' | 'new_checkout' | 'wait' | 'none';

/** handleError for the gift routes, plus the retry the form may make. */
export function giftError(err: unknown, retry: GiftRetry): Response {
  const d = describeError(err);
  return json({ ok: false, error: d.code, message: d.message, retry }, d.status);
}

/**
 * Persist the last giving errors to KV so failures are diagnosable after the
 * fact (added 2026-08-17: a week of donate-recurring 400s left no trace
 * because console.error output is not retained). Read back via
 * GET /api/blackbaud/errlog with the setup key. Best effort, never throws.
 */
export async function recordGiveError(env: Env, route: string, err: unknown): Promise<void> {
  try {
    const entry = {
      at: new Date().toISOString(),
      route,
      code: err instanceof BlackbaudError ? err.code : 'internal',
      message: err instanceof Error ? err.message : String(err),
      detail: err instanceof BlackbaudError ? JSON.stringify(err.detail ?? null).slice(0, 800) : null,
    };
    const raw = await env.BLACKBAUD_TOKENS.get('bb:errlog');
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    list.unshift(entry);
    await env.BLACKBAUD_TOKENS.put('bb:errlog', JSON.stringify(list.slice(0, 20)));
  } catch {
    /* diagnostics must never affect the request */
  }
}

const MAX_BODY_BYTES = 32 * 1024;

export async function readJsonBody<T>(request: Request): Promise<T> {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    throw new BlackbaudError('payload_too_large', 'Request body too large', 413);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new BlackbaudError('bad_json', 'Request body must be JSON', 400);
  }
}

/** Admin endpoints require ?key=BLACKBAUD_SETUP_KEY (or header X-Setup-Key). */
export function requireSetupKey(env: Env, request: Request): void {
  const configured = env.BLACKBAUD_SETUP_KEY;
  if (!configured) {
    throw new BlackbaudError(
      'setup_key_missing',
      'BLACKBAUD_SETUP_KEY is not configured; admin endpoints are disabled.',
      503
    );
  }
  const url = new URL(request.url);
  const supplied = url.searchParams.get('key') ?? request.headers.get('X-Setup-Key') ?? '';
  if (!timingSafeEqualStr(supplied, configured)) {
    throw new BlackbaudError('forbidden', 'Invalid or missing setup key', 403);
  }
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Validation helpers

export function asAmount(value: unknown, min = 1, max = 250000): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) throw new BlackbaudError('bad_amount', 'Amount must be a number', 400);
  const rounded = Math.round(n * 100) / 100;
  if (rounded < min || rounded > max) {
    throw new BlackbaudError('bad_amount', `Amount must be between $${min} and $${max.toLocaleString()}`, 400);
  }
  return rounded;
}

export function asTrimmed(value: unknown, field: string, maxLen: number, required = true): string {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!s && required) throw new BlackbaudError('missing_field', `${field} is required`, 400);
  return s.slice(0, maxLen);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function asEmail(value: unknown): string {
  const s = asTrimmed(value, 'email', 254);
  if (!EMAIL_RE.test(s)) throw new BlackbaudError('bad_email', 'A valid email address is required', 400);
  return s;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function asUuid(value: unknown, field: string): string {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!UUID_RE.test(s)) throw new BlackbaudError('bad_token', `${field} must be a UUID`, 400);
  return s.toLowerCase();
}

// ---------------------------------------------------------------------------
// Idempotency (KV-backed, 24h)
//
// The giving form sends one idempotency key with each card authorization and
// sends the same pair again when it retries. Under bb:idem:<key> KV holds:
//
//   {"_idem":"pending"}      a request with this key is running. Another one
//                            (a double press, or a retry after the browser
//                            stopped waiting) is told to wait and runs nothing.
//   {"_idem":"unconfirmed"}  the charge was sent and no answer came back, or
//                            the request stopped after sending it. Nobody can
//                            say whether the card was charged, so this key
//                            never runs again and the giver is asked to email.
//   the finished response    replayed as is.
//
// bb:idem-charge:<key> is set the moment the charge is sent, so a request
// that dies mid-way leaves proof that a charge may have gone out. A request
// that fails before the charge releases the key, so the same authorization
// can be tried again. bb:idem-txn:<checkout token> points at the key that
// used the authorization, so one authorization never goes to Blackbaud under
// two keys.
//
// KV is eventually consistent between data centers: two requests in two
// locations a second apart can both find no marker. A retry from the same
// browser lands in the same location, where a write usually shows at once.
// Each marker is its own key because KV allows one write a second per key.

const IDEM_TTL = 86400;
/** How long a running request holds its key before a retry may look again. */
export const IDEM_LOCK_MS = 120_000;

interface IdemMarker {
  _idem: 'pending' | 'unconfirmed';
  at: number;
}

const idemKey = (key: string) => 'bb:idem:' + key;
const chargeKey = (key: string) => 'bb:idem-charge:' + key;
const txnKey = (token: string) => 'bb:idem-txn:' + token;

function marker(raw: string): IdemMarker | null {
  try {
    const parsed = JSON.parse(raw) as Partial<IdemMarker>;
    return parsed && (parsed._idem === 'pending' || parsed._idem === 'unconfirmed') ? (parsed as IdemMarker) : null;
  } catch {
    return null;
  }
}

function replay(stored: string): Response {
  return new Response(stored, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Idempotent-Replay': 'true' },
  });
}

export const STILL_PROCESSING =
  'Your gift is still being processed. Wait a few seconds, then press the button to check on it. Your card will not be charged twice.';
export const CHARGE_UNCONFIRMED =
  'We could not confirm this gift with the card processor, so your card may have been charged. Please do not give again yet. Email info@favorintl.org and we will check it and finish it with you.';

function stillProcessing(): Response {
  return json({ ok: false, error: 'in_progress', message: STILL_PROCESSING, retry: 'wait' }, 409);
}

export function chargeUnconfirmed(status = 409): Response {
  return json({ ok: false, error: 'charge_unconfirmed', message: CHARGE_UNCONFIRMED, retry: 'none' }, status);
}

async function put(env: Env, key: string, value: string): Promise<void> {
  try {
    await env.BLACKBAUD_TOKENS.put(key, value, { expirationTtl: IDEM_TTL });
  } catch (err) {
    // A failed marker must never fail a gift; it only weakens the guard.
    console.error(`[give] idempotency write ${key.split(':').slice(0, 2).join(':')} failed`, err);
  }
}

async function stateOf(env: Env, key: string): Promise<Response | 'free'> {
  const stored = await env.BLACKBAUD_TOKENS.get(idemKey(key));
  if (!stored) return 'free';
  const m = marker(stored);
  if (!m) return replay(stored);
  if (m._idem === 'unconfirmed') return chargeUnconfirmed();
  if (Date.now() - m.at < IDEM_LOCK_MS) return stillProcessing();
  // The request that set this marker stopped without finishing. If it had
  // sent the charge, the outcome is unknown; if not, nothing was charged.
  if (await env.BLACKBAUD_TOKENS.get(chargeKey(key))) {
    await put(env, idemKey(key), JSON.stringify({ _idem: 'unconfirmed', at: Date.now() }));
    return chargeUnconfirmed();
  }
  return 'free';
}

/**
 * Read-only check before a gift request does anything: the finished answer
 * to replay, a wait or unconfirmed answer, or null when the request may run.
 */
export async function idempotencyCheck(env: Env, key: string, checkoutToken: string): Promise<Response | null> {
  const own = await stateOf(env, key);
  if (own !== 'free') return own;
  const holder = await env.BLACKBAUD_TOKENS.get(txnKey(checkoutToken));
  if (holder && holder !== key) {
    const other = await stateOf(env, holder);
    if (other !== 'free') return other;
  }
  return null;
}

/** Hold the key (and the authorization) for this request. Call after validation, before any Blackbaud write. */
export async function idempotencyClaim(env: Env, key: string, checkoutToken: string): Promise<void> {
  await put(env, idemKey(key), JSON.stringify({ _idem: 'pending', at: Date.now() }));
  await put(env, txnKey(checkoutToken), key);
}

/** Call right before the Blackbaud call that charges the card. */
export async function idempotencyCharging(env: Env, key: string): Promise<void> {
  await put(env, chargeKey(key), String(Date.now()));
}

/** The charge got no clear answer: this key never runs again. */
export async function idempotencyUnconfirmed(env: Env, key: string): Promise<void> {
  await put(env, idemKey(key), JSON.stringify({ _idem: 'unconfirmed', at: Date.now() }));
}

/** Nothing was charged: let the same key and authorization try again. */
export async function idempotencyRelease(env: Env, key: string, checkoutToken: string): Promise<void> {
  for (const k of [idemKey(key), chargeKey(key), txnKey(checkoutToken)]) {
    try {
      await env.BLACKBAUD_TOKENS.delete(k);
    } catch (err) {
      console.error('[give] idempotency release failed', err);
    }
  }
}

/** Keep the finished answer for 24 hours. Never throws: the gift is already made. */
export async function idempotencyStore(env: Env, key: string, body: unknown): Promise<void> {
  await put(env, idemKey(key), JSON.stringify(body));
}

/**
 * Whether a failed charge call left the card uncharged, and what the form may
 * try next; null when nobody can say. A token error means the call never went
 * out. A 4xx answer means Blackbaud refused it, and the Gift API creates the
 * gift and the charge in one call, so no gift and no charge exist (INFERRED
 * from the API's design; the route's own comment relies on the same). A 400
 * or 422 is a refused card or a spent authorization, so the form opens the
 * card window again. A 5xx answer, a 2xx answer that is not JSON, or no
 * answer at all leaves the outcome unknown.
 */
export function chargeRefused(err: unknown): GiftRetry | null {
  if (!(err instanceof BlackbaudError)) return null;
  // Raised while getting an access token, before the gift call goes out.
  if (['not_configured', 'not_connected', 'oauth_bad_token_response', 'oauth_exchange_failed'].includes(err.code)) {
    return 'same';
  }
  if (err.code !== 'sky_api_error') return null;
  if (err.status === 400 || err.status === 422) return 'new_checkout';
  if (err.status >= 401 && err.status < 500) return 'same';
  return null;
}

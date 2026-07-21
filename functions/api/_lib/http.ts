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

export function handleError(err: unknown): Response {
  if (err instanceof BlackbaudError) {
    console.error(`[blackbaud] ${err.code}: ${err.message}`, err.detail ?? '');
    // detail stays in the logs; SKY API payloads can echo donor data.
    return errorJson(err.code, err.message, err.status);
  }
  console.error('[give] unexpected error', err);
  return errorJson('internal', 'Something went wrong on our side. Your card was not charged twice; please try again or email us.', 500);
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

export async function idempotencyHit(env: Env, key: string): Promise<Response | null> {
  const stored = await env.BLACKBAUD_TOKENS.get('bb:idem:' + key);
  if (!stored) return null;
  return new Response(stored, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Idempotent-Replay': 'true' },
  });
}

export async function idempotencyStore(env: Env, key: string, body: unknown): Promise<void> {
  await env.BLACKBAUD_TOKENS.put('bb:idem:' + key, JSON.stringify(body), { expirationTtl: 86400 });
}

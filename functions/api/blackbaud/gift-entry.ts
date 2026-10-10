// /api/blackbaud/gift-entry: the hub's mail-day gift entry writes unapproved gift batches through this route.
// Setup-key guarded, like /api/blackbaud/ops, but with its own allowance (400 calls a day, KV bb:ge:count:<utc day>) so
// gift entry can never spend the upkeep allowance or the giving form's share. The route does what P0 proved
// (2026-10-10): create a batch, add gifts to it, read it back, make an attachment after Jennifer commits the batch, and
// delete a batch this route created while it is still unapproved. It cannot approve a batch (Blackbaud has no such route),
// cannot create a gift outside a batch, and cannot touch the Payments API.
//
// POST  ?key=<BLACKBAUD_SETUP_KEY>   { "calls": [ { "method": "POST", "path": "/gift-batch/v1/giftbatches", "body": {...} } ] }   up to 5
// GET   ?key=...&log=YYYY-MM-DD      the day's write ledger and the call count
//
// KV bb:ge:only (a constituent id) locks every gift write to that one record, for test runs.

import { bbFetch, requireCredentials, type Env } from '../_lib/blackbaud';
import { errorJson, handleError, json, requireSetupKey } from '../_lib/http';

const DEFAULT_CAP = 400;
const WARN_AT = 300;
const MAX_CALLS = 5;
const LOG_TTL = 180 * 86400;
const QUOTA_STOP_KEY = 'bb:ops:quota_stop';

interface Call {
  method?: unknown;
  path?: unknown;
  body?: unknown;
}

interface Result {
  ok: boolean;
  status: number;
  method: string;
  path: string;
  body: unknown;
}

const BATCH_KEYS = ['batch_number', 'batch_description', 'expected_batch_total', 'expected_number'];
const GIFT_KEYS = ['type', 'constituent_id', 'amount', 'date', 'gift_splits', 'payments', 'reference', 'soft_credits', 'constituency', 'fundraisers', 'default_fundraiser_credits', 'is_anonymous'];
const ATTACH_KEYS = ['parent_id', 'type', 'file_id', 'file_name', 'name', 'date'];
const DOC_KEYS = ['file_name', 'upload_thumbnail'];

const READS: RegExp[] = [
  /^\/gift-batch\/v1\/giftbatches$/,
  /^\/gift-batch\/v1\/giftbatches\/\d+$/,
  /^\/gift\/v1\/gifts$/,
  /^\/gift\/v1\/gifts\/\d+$/,
  /^\/gift\/v1\/gifts\/\d+\/attachments$/,
  /^\/gft-gifts\/v2\/batchgifts\/\d+$/,
  /^\/constituent\/v1\/constituents\/\d+$/,
];

const refusal = (method: string, path: string, why: string): Result => ({ ok: false, status: 0, method, path, body: { refused: why } });

function onlyKeys(body: unknown, keys: string[]): string | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'body must be a JSON object';
  const extra = Object.keys(body as Record<string, unknown>).filter((k) => !keys.includes(k));
  return extra.length ? `body keys not allowed here: ${extra.join(', ')}` : null;
}

/** Every gift in a batch post must be a donation to a real partner id, and, in a test run, to the one allowed record. */
function checkGifts(body: unknown, only: string): string | null {
  const bad = onlyKeys(body, ['gifts']);
  if (bad) return bad;
  const gifts = (body as { gifts?: unknown }).gifts;
  if (!Array.isArray(gifts) || gifts.length < 1 || gifts.length > 60) return 'send between 1 and 60 gifts';
  for (const g of gifts) {
    const why = onlyKeys(g, GIFT_KEYS);
    if (why) return why;
    const gift = g as Record<string, any>;
    if (gift.type !== 'Donation') return 'only Donation gifts';
    if (!/^\d{1,12}$/.test(String(gift.constituent_id ?? ''))) return 'constituent_id missing';
    if (typeof gift.reference === 'string' && gift.reference.length > 255) return 'reference is over 255 characters';
    if (only) {
      if (String(gift.constituent_id) !== only) return `test lock: gifts go to ${only} only`;
      for (const s of Array.isArray(gift.soft_credits) ? gift.soft_credits : []) {
        if (String((s as any)?.constituent_id) !== only) return `test lock: soft credits go to ${only} only`;
      }
    }
  }
  return null;
}

async function check(env: Env, method: string, path: string, body: unknown, only: string): Promise<string | null> {
  if (!path.startsWith('/') || path.includes('..') || path.includes('//')) return 'bad path';
  const pathname = path.split('?')[0];
  if (method === 'GET') return READS.some((r) => r.test(pathname)) ? null : 'path is outside gift entry reads';
  if (method === 'POST' && pathname === '/gift-batch/v1/giftbatches') return onlyKeys(body, BATCH_KEYS);
  if (method === 'POST' && /^\/gift\/v1\/giftbatches\/\d+\/gifts$/.test(pathname)) return checkGifts(body, only);
  if (method === 'POST' && pathname === '/gift/v1/documents') return onlyKeys(body, DOC_KEYS);
  if (method === 'POST' && pathname === '/gift/v1/gifts/attachments') return onlyKeys(body, ATTACH_KEYS);
  const doomed = method === 'DELETE' ? /^\/gift-batch\/v1\/giftbatches\/(\d+)$/.exec(pathname) : null;
  if (doomed) {
    // Only a batch this route made. Blackbaud refuses to delete an approved one, and the hub never asks twice.
    const made = await env.BLACKBAUD_TOKENS.get(`bb:ge:batch:${doomed[1]}`);
    return made ? null : 'this route did not create that batch';
  }
  return `no write rule for ${method} ${pathname}`;
}

async function bump(env: Env, day: string, by: number): Promise<number> {
  const key = `bb:ge:count:${day}`;
  const current = Number((await env.BLACKBAUD_TOKENS.get(key)) ?? '0') || 0;
  try {
    await env.BLACKBAUD_TOKENS.put(key, String(current + by), { expirationTtl: 3 * 86400 });
  } catch {
    /* the count is a guard rail, never a reason to fail a call */
  }
  return current + by;
}

async function ledger(env: Env, day: string, entry: Record<string, unknown>): Promise<void> {
  try {
    await env.BLACKBAUD_TOKENS.put(`bb:ge:log:${day}:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, JSON.stringify(entry), { expirationTtl: LOG_TTL });
  } catch {
    /* best effort */
  }
}

async function run(env: Env, day: string, call: Call, only: string): Promise<Result> {
  const method = String(call.method ?? 'GET').toUpperCase();
  const path = String(call.path ?? '');
  const why = await check(env, method, path, call.body, only);
  if (why) return refusal(method, path, why);

  const init: RequestInit = { method };
  if (method !== 'GET' && method !== 'DELETE' && call.body !== undefined) init.body = JSON.stringify(call.body);
  const res = await bbFetch(env, path, init);
  const text = await res.text();
  let body: unknown = null;
  if (text.trim()) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text.slice(0, 2000);
    }
  }
  if (method === 'POST' && res.ok && path.split('?')[0] === '/gift-batch/v1/giftbatches' && body && typeof body === 'object') {
    const id = String((body as { batch_id?: unknown }).batch_id ?? '');
    if (/^\d+$/.test(id)) await env.BLACKBAUD_TOKENS.put(`bb:ge:batch:${id}`, new Date().toISOString(), { expirationTtl: 30 * 86400 }).catch(() => {});
  }
  if (method !== 'GET') {
    await ledger(env, day, {
      at: new Date().toISOString(),
      method,
      path,
      status: res.status,
      sent: call.body === undefined ? null : JSON.stringify(call.body).slice(0, 500),
      got: res.ok ? null : JSON.stringify(body).slice(0, 400),
    });
  }
  return { ok: res.ok, status: res.status, method, path, body };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    requireCredentials(env);
    const payload = (await request.json().catch(() => null)) as { calls?: unknown } | null;
    const calls = payload && Array.isArray(payload.calls) ? (payload.calls as Call[]) : [];
    if (calls.length < 1 || calls.length > MAX_CALLS) return errorJson('bad_batch', `Send between 1 and ${MAX_CALLS} calls`, 400);

    const stopUntil = Number((await env.BLACKBAUD_TOKENS.get(QUOTA_STOP_KEY)) ?? '0') || 0;
    if (Date.now() < stopUntil) return errorJson('quota_stop', 'Blackbaud is out of allowance; gift entry waits for the reset', 429, { until: new Date(stopUntil).toISOString() });

    const day = new Date().toISOString().slice(0, 10);
    const cap = Number((await env.BLACKBAUD_TOKENS.get('bb:ge:cap')) ?? '') || DEFAULT_CAP;
    const only = ((await env.BLACKBAUD_TOKENS.get('bb:ge:only')) ?? '').trim();
    const used = await bump(env, day, calls.length);
    if (used > cap) return errorJson('daily_cap', `Gift entry is capped at ${cap} Blackbaud calls a day`, 429, { used });

    const results: Result[] = [];
    for (const call of calls) {
      const result = await run(env, day, call, only);
      results.push(result);
      if (result.status === 403 && JSON.stringify(result.body ?? '').includes('quota')) {
        const reset = new Date();
        reset.setUTCHours(24, 5, 0, 0);
        await env.BLACKBAUD_TOKENS.put(QUOTA_STOP_KEY, String(reset.getTime()), { expirationTtl: 86400 }).catch(() => {});
      }
      if (result.status === 0 || result.status === 429 || result.status === 403) break;
    }
    return json({ ok: results.every((r) => r.ok), calls_today: used, cap, warn: used >= WARN_AT, results });
  } catch (err) {
    return handleError(err);
  }
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    const search = new URL(request.url).searchParams;
    const day = (search.get('log') ?? new Date().toISOString().slice(0, 10)).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return errorJson('bad_day', 'log must be YYYY-MM-DD', 400);
    const cap = Number((await env.BLACKBAUD_TOKENS.get('bb:ge:cap')) ?? '') || DEFAULT_CAP;
    const calls = Number((await env.BLACKBAUD_TOKENS.get(`bb:ge:count:${day}`)) ?? '0') || 0;
    const entries: unknown[] = [];
    if (search.get('entries') === '1') {
      const list = await env.BLACKBAUD_TOKENS.list({ prefix: `bb:ge:log:${day}:`, limit: 200 });
      for (const k of list.keys) {
        const raw = await env.BLACKBAUD_TOKENS.get(k.name);
        if (raw) entries.push(JSON.parse(raw));
      }
    }
    return json({ ok: true, day, calls, cap, warn_at: WARN_AT, only: ((await env.BLACKBAUD_TOKENS.get('bb:ge:only')) ?? '') || null, entries });
  } catch (err) {
    return handleError(err);
  }
};

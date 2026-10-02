// /api/blackbaud/ops — guarded pass-through to the SKY API for database
// upkeep (monthly source codes, new-record review, gift data verification,
// assignment cleanup). Setup-key guarded like the other admin routes.
//
// POST ?key=<BLACKBAUD_SETUP_KEY>
//      { "method": "GET", "path": "/constituent/v1/constituents/123" }
//      { "method": "PATCH", "path": "/gift/v1/gifts/66187", "body": { ... } }
//      { "calls": [ { ... }, { ... } ] }      up to 15, run in order
//
// GET  ?key=...&log=2026-10-02               the day's write ledger
//
// Reads are open across the record APIs. Writes pass only when the method
// and path match WRITE_RULES below, and where a rule names body keys, only
// those keys. Nothing here can delete a constituent or a gift, change a gift
// amount, or reach the Payments API.
//
// Every write lands in a KV ledger (180 days) with its status, so any change
// made through this route can be traced to a day and a call. A daily cap
// keeps upkeep work from spending the allowance the giving form needs; the
// website, the partner portal and this route share one subscription. The
// count runs per UTC day, the same window Blackbaud uses.

import { bbFetch, etGiftDate, requireCredentials, type Env } from '../_lib/blackbaud';
import { errorJson, handleError, json, requireSetupKey } from '../_lib/http';

const READ_PREFIXES = [
  '/constituent/v1/',
  '/gift/v1/',
  '/fundraising/v1/',
  '/nxt-data-integration/v1/re/',
  '/query/',
];

interface WriteRule {
  methods: string[];
  path: RegExp;
  /** When set, the JSON body may carry only these top-level keys. */
  keys?: string[];
}

const WRITE_RULES: WriteRule[] = [
  // Code table entries (monthly source codes).
  { methods: ['POST'], path: /^\/nxt-data-integration\/v1\/re\/codetables\/\d+\/tableentries$/ },
  // Gift appeal, campaign, fund and package on existing splits. Amount and
  // constituent stay out of reach.
  { methods: ['PATCH'], path: /^\/gift\/v1\/gifts\/\d+$/, keys: ['gift_splits'] },
  { methods: ['POST'], path: /^\/gift\/v1\/gifts\/customfields$/ },
  { methods: ['PATCH', 'DELETE'], path: /^\/gift\/v1\/gifts\/customfields\/\d+$/ },
  // New-record review: names, codes, custom fields, addresses, actions.
  {
    methods: ['PATCH'],
    path: /^\/constituent\/v1\/constituents\/\d+$/,
    keys: ['title', 'first', 'middle', 'last', 'suffix', 'preferred_name', 'former_name', 'name', 'inactive'],
  },
  { methods: ['POST'], path: /^\/constituent\/v1\/constituents\/customfields$/ },
  { methods: ['PATCH', 'DELETE'], path: /^\/constituent\/v1\/constituents\/customfields\/\d+$/ },
  { methods: ['POST'], path: /^\/constituent\/v1\/constituentcodes$/ },
  { methods: ['PATCH', 'DELETE'], path: /^\/constituent\/v1\/constituentcodes\/\d+$/ },
  { methods: ['PATCH', 'DELETE'], path: /^\/constituent\/v1\/addresses\/\d+$/ },
  { methods: ['PATCH'], path: /^\/constituent\/v1\/(emailaddresses|phones)\/\d+$/ },
  // Primary addressee and salutation. Records the giving form creates have none.
  { methods: ['POST'], path: /^\/constituent\/v1\/primarynameformats$/ },
  { methods: ['PATCH'], path: /^\/constituent\/v1\/primarynameformats\/[A-Za-z0-9_-]+$/ },
  { methods: ['POST'], path: /^\/constituent\/v1\/actions$/ },
  { methods: ['PATCH'], path: /^\/constituent\/v1\/actions\/\d+$/ },
  // Fundraiser assignments: add and end. No delete.
  { methods: ['POST'], path: /^\/fundraising\/v1\/fundraisers\/assignments$/ },
  { methods: ['PATCH'], path: /^\/fundraising\/v1\/fundraisers\/assignments\/\d+$/ },
  // Run a saved query (backups, verification exports).
  { methods: ['POST'], path: /^\/query\/queries\/executebyid$/ },
];

// Blackbaud counts the allowance per UTC day. On 2026-10-02 the key this site
// uses stopped at about 1,000 calls and the giving form went down until the
// reset, so the default leaves giving and the portal most of that tier. KV key
// bb:ops:cap raises it once a larger tier is confirmed on this key.
const DEFAULT_DAILY_CAP = 300;
const MAX_BATCH = 15;
const LOG_TTL_SECONDS = 180 * 86400;
const QUOTA_STOP_KEY = 'bb:ops:quota_stop';

interface OpsCall {
  method?: unknown;
  path?: unknown;
  body?: unknown;
}

interface OpsResult {
  ok: boolean;
  status: number;
  method: string;
  path: string;
  body: unknown;
}

function refusal(method: string, path: string, why: string): OpsResult {
  return { ok: false, status: 0, method, path, body: { refused: why } };
}

function check(method: string, path: string, body: unknown): string | null {
  if (!path.startsWith('/') || path.includes('..') || path.includes('//')) return 'bad path';
  const pathname = path.split('?')[0];
  if (!READ_PREFIXES.some((p) => pathname.startsWith(p))) return 'path is outside the record APIs';
  if (method === 'GET') return null;
  const rule = WRITE_RULES.find((r) => r.methods.includes(method) && r.path.test(pathname));
  if (!rule) return `no write rule for ${method} ${pathname}`;
  if (rule.keys) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return 'body must be a JSON object';
    const extra = Object.keys(body as Record<string, unknown>).filter((k) => !rule.keys!.includes(k));
    if (extra.length > 0) return `body keys not allowed here: ${extra.join(', ')}`;
  }
  return null;
}

async function bump(env: Env, day: string, by: number): Promise<number> {
  const key = `bb:ops:count:${day}`;
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
    const key = `bb:ops:log:${day}:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await env.BLACKBAUD_TOKENS.put(key, JSON.stringify(entry), { expirationTtl: LOG_TTL_SECONDS });
  } catch {
    /* best effort */
  }
}

async function run(env: Env, day: string, call: OpsCall): Promise<OpsResult> {
  const method = String(call.method ?? 'GET').toUpperCase();
  const path = String(call.path ?? '');
  const why = check(method, path, call.body);
  if (why) return refusal(method, path, why);

  const init: RequestInit = { method };
  if (method !== 'GET' && call.body !== undefined) init.body = JSON.stringify(call.body);
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
  if (method !== 'GET') {
    await ledger(env, day, {
      at: new Date().toISOString(),
      method,
      path,
      status: res.status,
      sent: call.body === undefined ? null : JSON.stringify(call.body).slice(0, 600),
      got: res.ok ? null : JSON.stringify(body).slice(0, 400),
    });
  }
  return { ok: res.ok, status: res.status, method, path, body };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    requireCredentials(env);
    const payload = (await request.json().catch(() => null)) as (OpsCall & { calls?: unknown }) | null;
    if (!payload || typeof payload !== 'object') return errorJson('bad_json', 'Request body must be JSON', 400);

    const calls: OpsCall[] = Array.isArray(payload.calls) ? (payload.calls as OpsCall[]) : [payload];
    if (calls.length === 0 || calls.length > MAX_BATCH) {
      return errorJson('bad_batch', `Send between 1 and ${MAX_BATCH} calls`, 400);
    }

    // Once Blackbaud refuses a call on quota, upkeep waits for the reset
    // instead of spending retries the giving form could use.
    const stopUntil = Number((await env.BLACKBAUD_TOKENS.get(QUOTA_STOP_KEY)) ?? '0') || 0;
    if (Date.now() < stopUntil) {
      return errorJson('quota_stop', 'Blackbaud is out of allowance; upkeep waits for the reset', 429, {
        until: new Date(stopUntil).toISOString(),
      });
    }

    const day = etGiftDate().slice(0, 10);
    const cap = Number((await env.BLACKBAUD_TOKENS.get('bb:ops:cap')) ?? '') || DEFAULT_DAILY_CAP;
    const used = await bump(env, new Date().toISOString().slice(0, 10), calls.length);
    if (used > cap) {
      return errorJson('daily_cap', `Upkeep calls are capped at ${cap} a day so giving keeps its allowance`, 429, { used });
    }

    const results: OpsResult[] = [];
    for (const call of calls) {
      const result = await run(env, day, call);
      results.push(result);
      if (result.status === 403 && JSON.stringify(result.body ?? '').includes('quota')) {
        const reset = new Date();
        reset.setUTCHours(24, 5, 0, 0);
        await env.BLACKBAUD_TOKENS.put(QUOTA_STOP_KEY, String(reset.getTime()), { expirationTtl: 86400 }).catch(() => {});
      }
      // A refused or throttled call stops the batch so later calls never run
      // against a state the earlier ones were meant to set up.
      if (result.status === 0 || result.status === 429 || result.status === 403) break;
    }
    return json({ ok: results.every((r) => r.ok), calls_today: used, cap, results });
  } catch (err) {
    return handleError(err);
  }
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    const search = new URL(request.url).searchParams;
    const day = (search.get('log') ?? etGiftDate().slice(0, 10)).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return errorJson('bad_day', 'log must be YYYY-MM-DD', 400);

    const entries: unknown[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 5; page++) {
      const list = await env.BLACKBAUD_TOKENS.list({ prefix: `bb:ops:log:${day}:`, cursor, limit: 1000 });
      for (const k of list.keys) {
        const raw = await env.BLACKBAUD_TOKENS.get(k.name);
        if (raw) entries.push(JSON.parse(raw));
        if (entries.length >= 400) break;
      }
      if (list.list_complete || entries.length >= 400) break;
      cursor = list.cursor;
    }
    const count = Number((await env.BLACKBAUD_TOKENS.get(`bb:ops:count:${day}`)) ?? '0') || 0;
    return json({ ok: true, day, calls: count, writes: entries.length, entries });
  } catch (err) {
    return handleError(err);
  }
};

// POST /api/blackbaud/recurring-edit?key=<BLACKBAUD_SETUP_KEY>
// Body: { "id": "39792", "op": "amount", "amount": 35 } | { "id": "...", "op": "frequency", "frequency": "QUARTERLY" } | { "id": "...", "op": "status", "status": "Held" } | { "id": "...", "op": "skip" } | { "id": "...", "op": "next_date", "date": "2026-11-07" }
//
// FavorOS's Recurring gifts tool changes a schedule through this route. One schedule per call. The route has its own allowance
// (150 Blackbaud calls a day, KV bb:rec:count:<utc day>) so it never spends the giving form's or the upkeep route's share. KV
// bb:rec:only (a constituent id) locks every change to that one record, for test runs. Each change lands in the KV ledger.
//
// GET ?key=...&log=YYYY-MM-DD   the day's count and cap.

import { requireCredentials, BlackbaudError, type Env } from '../_lib/blackbaud';
import { errorJson, handleError, json, readJsonBody, requireSetupKey } from '../_lib/http';
import { applyRecurringEdit, type EditInput } from '../_lib/recurring-edit';

const CAP = 150;
const LOG_TTL = 180 * 86400;

const today = () => new Date().toISOString().slice(0, 10);

async function count(env: Env, day: string): Promise<number> {
  return Number((await env.BLACKBAUD_TOKENS.get(`bb:rec:count:${day}`)) ?? '0') || 0;
}

async function bump(env: Env, day: string, used: number, by: number): Promise<void> {
  try {
    await env.BLACKBAUD_TOKENS.put(`bb:rec:count:${day}`, String(used + by), { expirationTtl: 3 * 86400 });
  } catch {
    /* the count is a guard rail, never a reason to fail a call */
  }
}

async function ledger(env: Env, day: string, entry: Record<string, unknown>): Promise<void> {
  try {
    await env.BLACKBAUD_TOKENS.put(`bb:rec:log:${day}:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, JSON.stringify(entry), { expirationTtl: LOG_TTL });
  } catch {
    /* best effort */
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    requireCredentials(env);
    const body = await readJsonBody<EditInput>(request);
    const day = today();
    const cap = Number((await env.BLACKBAUD_TOKENS.get('bb:rec:cap')) ?? '') || CAP;
    const used = await count(env, day);
    if (used >= cap) return errorJson('daily_cap', `Schedule changes are capped at ${cap} Blackbaud calls a day`, 429, { used });
    const only = ((await env.BLACKBAUD_TOKENS.get('bb:rec:only')) ?? '').trim();
    try {
      const out = await applyRecurringEdit(env, body, only);
      await ledger(env, day, { at: new Date().toISOString(), id: out.id, op: out.op, before: out.before, after: out.after });
      await bump(env, day, used, out.calls);
      return json(out);
    } catch (err) {
      await ledger(env, day, { at: new Date().toISOString(), id: String(body?.id ?? ''), op: String(body?.op ?? ''), error: err instanceof BlackbaudError ? err.code : 'error' });
      await bump(env, day, used, 3);
      throw err;
    }
  } catch (err) {
    return handleError(err);
  }
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    const day = (new URL(request.url).searchParams.get('log') ?? today()).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return errorJson('bad_day', 'log must be YYYY-MM-DD', 400);
    const cap = Number((await env.BLACKBAUD_TOKENS.get('bb:rec:cap')) ?? '') || CAP;
    return json({ ok: true, day, calls: await count(env, day), cap });
  } catch (err) {
    return handleError(err);
  }
};

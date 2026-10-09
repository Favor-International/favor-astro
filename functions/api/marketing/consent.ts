// POST /api/marketing/consent
// Body: { email: string, kind: 'email', constituent_ids?: string[], dry_run?: boolean }
//
// Write-back from the marketing platform (favor-marketing) when someone
// unsubscribes, bounces or complains. Sets do_not_email on every Blackbaud
// email record that holds the address, on every constituent that has it,
// primary or not. emails.do_not_email is the flag staff, the mail house and
// the data-health checks read (2,810 email records carried it on 2026-10-09).
//
// Until 2026-10-09 this route added a "Do Not Email" solicit code through
// POST /commpref/v1/solicitcodes and matched only the primary email. Not one
// of the 96 unsubscribes queued from 2026-08-10 to 2026-10-07 reached
// Blackbaud that way: every row in the marketing consent ledger still had
// bb_synced = 0. Staff do not read solicit codes, so the route now writes the
// email flag through PATCH /constituent/v1/emailaddresses/{id}, the same call
// the upkeep route (/api/blackbaud/ops) makes every week.
//
// Candidates: the constituent ids the caller found in the D1 mirror (any
// email row with the address, so secondary addresses count) plus Blackbaud's
// own strict email search. Calls per request: one search, one email list per
// candidate (at most 10), one PATCH per email record that changes. A typical
// unsubscribe costs 3; an address already flagged costs 2.
//
// Answers:
//   200 { ok: true, updated, unchanged, not_found }   every matching row now carries the flag
//   200 { ok: true, not_found: true }                  no Blackbaud email record has this address
//   502 { ok: false, failed }                          a read or PATCH failed; the caller retries
//   503 quota_stop                                     Blackbaud is out of allowance; retry after the reset
//   422 sms_not_supported                              Blackbaud has no do-not-text flag this route can set

import { bbFetch, requireCredentials, type Env } from '../_lib/blackbaud';
import { errorJson, handleError, json, readJsonBody } from '../_lib/http';
import { requireMarketingKey } from './_guard';

const MAX_CANDIDATES = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Shared with /api/blackbaud/ops: once Blackbaud refuses a call on quota,
// every non-giving caller waits for the reset so the giving form keeps room.
const QUOTA_STOP_KEY = 'bb:ops:quota_stop';

interface Body {
  email?: unknown;
  kind?: unknown;
  constituent_id?: unknown;
  constituent_ids?: unknown;
  dry_run?: unknown;
}

interface EmailRow {
  id: string | number;
  address?: string;
  do_not_email?: boolean;
  inactive?: boolean;
  primary?: boolean;
}

interface Touched {
  constituent_id: string;
  email_id: string;
  primary: boolean;
  inactive: boolean;
}

class QuotaStop extends Error {}

const norm = (s: unknown) => String(s ?? '').trim().toLowerCase();

async function isQuotaRefusal(res: Response): Promise<boolean> {
  if (res.status !== 403) return false;
  const text = await res.clone().text().catch(() => '');
  return /quota/i.test(text);
}

async function noteQuotaStop(env: Env): Promise<void> {
  const reset = new Date();
  reset.setUTCHours(24, 5, 0, 0);
  await env.BLACKBAUD_TOKENS.put(QUOTA_STOP_KEY, String(reset.getTime()), { expirationTtl: 86400 }).catch(() => {});
}

async function sky(env: Env, path: string, init: RequestInit, counter: { calls: number }): Promise<Response> {
  counter.calls++;
  const res = await bbFetch(env, path, init);
  if (await isQuotaRefusal(res)) {
    await noteQuotaStop(env);
    throw new QuotaStop('Blackbaud is out of call allowance');
  }
  return res;
}

async function searchIds(env: Env, email: string, counter: { calls: number }): Promise<string[]> {
  const e = encodeURIComponent(email);
  for (const qs of [
    `search_text=${e}&search_field=email_address&strict_search=true&limit=25`,
    `search_text=${e}&search_field=email_address&limit=25`,
  ]) {
    const res = await sky(env, `/constituent/v1/constituents/search?${qs}`, { method: 'GET' }, counter);
    if (res.status === 400) continue; // strict_search unsupported: fall back once
    if (!res.ok) throw new Error(`constituent search failed (${res.status})`);
    const found = (await res.json()) as { value?: Array<{ id: string | number }> };
    return (found.value ?? []).map((r) => String(r.id));
  }
  return [];
}

export const onRequestPost: PagesFunction<Env & { MARKETING_API_KEY?: string }> = async ({ request, env }) => {
  try {
    const denied = requireMarketingKey(env, request);
    if (denied) return denied;
    requireCredentials(env);

    const body = await readJsonBody<Body>(request);
    if (body.kind === 'sms') {
      return errorJson(
        'sms_not_supported',
        'Blackbaud has no do-not-text flag this route can set; SMS opt-outs stay in the marketing consent ledger',
        422
      );
    }
    if (body.kind !== undefined && body.kind !== 'email') return errorJson('bad_kind', 'kind must be email', 400);
    const email = norm(body.email);
    if (!EMAIL_RE.test(email)) return errorJson('bad_email', 'A valid email is required', 400);
    const dryRun = body.dry_run === true;

    const stopUntil = Number((await env.BLACKBAUD_TOKENS.get(QUOTA_STOP_KEY)) ?? '0') || 0;
    if (Date.now() < stopUntil) {
      return errorJson('quota_stop', 'Blackbaud is out of allowance; retry after the reset', 503, {
        until: new Date(stopUntil).toISOString(),
      });
    }

    const given = [
      ...(Array.isArray(body.constituent_ids) ? body.constituent_ids : []),
      ...(body.constituent_id != null ? [body.constituent_id] : []),
    ]
      .map((v) => String(v).trim())
      .filter((v) => /^\d+$/.test(v));

    const counter = { calls: 0 };
    const searched = await searchIds(env, email, counter);
    const candidates = [...new Set([...given, ...searched])].slice(0, MAX_CANDIDATES);

    const updated: Touched[] = [];
    const unchanged: Touched[] = [];
    const failed: Array<Touched & { status: number }> = [];
    const unreadable: Array<{ constituent_id: string; status: number }> = [];

    for (const cid of candidates) {
      const list = await sky(
        env,
        `/constituent/v1/constituents/${encodeURIComponent(cid)}/emailaddresses?include_inactive=true`,
        { method: 'GET' },
        counter
      );
      // The D1 mirror keeps records deleted in Blackbaud; a 404 here is one of those.
      if (list.status === 404) continue;
      if (!list.ok) {
        unreadable.push({ constituent_id: cid, status: list.status });
        continue;
      }
      const rows = (((await list.json()) as { value?: EmailRow[] }).value ?? []).filter((r) => norm(r.address) === email);
      for (const row of rows) {
        const t: Touched = {
          constituent_id: cid,
          email_id: String(row.id),
          primary: row.primary === true,
          inactive: row.inactive === true,
        };
        if (row.do_not_email === true) {
          unchanged.push(t);
          continue;
        }
        if (dryRun) {
          updated.push(t);
          continue;
        }
        const res = await sky(
          env,
          `/constituent/v1/emailaddresses/${encodeURIComponent(String(row.id))}`,
          { method: 'PATCH', body: JSON.stringify({ do_not_email: true }) },
          counter
        );
        if (res.ok) updated.push(t);
        else failed.push({ ...t, status: res.status });
      }
    }

    const notFound = updated.length + unchanged.length + failed.length === 0;
    const out = {
      email,
      dry_run: dryRun,
      candidates,
      updated,
      unchanged,
      failed,
      unreadable,
      not_found: notFound && unreadable.length === 0,
      calls: counter.calls,
    };
    // Any failed write or unreadable candidate means the address may still be
    // emailable in Blackbaud: answer 502 so the queue retries, never a quiet ok.
    if (failed.length || unreadable.length) return json({ ok: false, ...out }, 502);
    return json({ ok: true, ...out });
  } catch (err) {
    if (err instanceof QuotaStop) return errorJson('quota_stop', err.message, 503);
    return handleError(err);
  }
};

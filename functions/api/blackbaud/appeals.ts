// /api/blackbaud/appeals — admin view + create for RE NXT appeal records,
// setup-key guarded like the other admin routes.
//
// GET  ?key=<BLACKBAUD_SETUP_KEY>&q=<text>   Walks the full appeal table
//      (same pagination as campaign.ts, which a single 500-row page misses)
//      and returns records whose lookup_id or description contains q.
//
// POST ?key=<BLACKBAUD_SETUP_KEY>            Creates an appeal. Body:
//      { "appeal_id": "L26A-WS", "description": "...", "start_date": "2026-10-01" }
//      Built for the direct-mail QR appeals (first use: October 2026 letter,
//      /RAKIE). On success it purges the campaign-codes and marketing-appeals
//      KV caches so gift attribution resolves the new code immediately
//      instead of after the 24h cache expiry. The appeal category cannot be
//      set here (SKY wants a category record id we have no list endpoint
//      for); set it in RE NXT if reporting needs it.

import { bbJson, requireCredentials, type Env } from '../_lib/blackbaud';
import { asTrimmed, handleError, json, requireSetupKey } from '../_lib/http';

interface AppealRecord {
  id: string;
  lookup_id?: string;
  description?: string;
  inactive?: boolean;
  start_date?: string;
  end_date?: string;
}

async function listAllAppeals(env: Env): Promise<AppealRecord[]> {
  const all: AppealRecord[] = [];
  for (let page = 0; page < 20; page++) {
    const data = await bbJson<{ value?: AppealRecord[] }>(
      env,
      `/fundraising/v1/appeals?limit=500&offset=${page * 500}`
    );
    const batch = data.value ?? [];
    all.push(...batch);
    if (batch.length < 500) break;
  }
  return all;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    requireCredentials(env);
    const q = (new URL(request.url).searchParams.get('q') ?? '').trim().toUpperCase();
    const appeals = await listAllAppeals(env);
    const matches = q
      ? appeals.filter(
          (a) =>
            (a.lookup_id ?? '').toUpperCase().includes(q) ||
            (a.description ?? '').toUpperCase().includes(q)
        )
      : appeals.slice(0, 50);
    return json({ ok: true, total: appeals.length, matches });
  } catch (err) {
    return handleError(err);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    requireCredentials(env);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const lookupId = asTrimmed(body.appeal_id, 'appeal_id', 20);
    const description = asTrimmed(body.description, 'description', 255);
    const startDate = asTrimmed(body.start_date, 'start_date', 10, false) || undefined;
    const endDate = asTrimmed(body.end_date, 'end_date', 10, false) || undefined;

    // Refuse a duplicate lookup code rather than trusting SKY to.
    const existing = (await listAllAppeals(env)).find(
      (a) => (a.lookup_id ?? '').toUpperCase() === lookupId.toUpperCase()
    );
    if (existing) {
      return json({ ok: false, error: 'duplicate', existing }, 409);
    }

    const created = await bbJson<{ id: string }>(env, '/fundraising/v1/appeals', {
      method: 'POST',
      body: JSON.stringify({
        appeal_id: lookupId,
        description,
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
      }),
    });

    // Attribution reads these caches; a stale one would send /RAKIE gifts to
    // the fallback Website appeal for up to a day.
    await env.BLACKBAUD_TOKENS.delete('bb:cache:campaign-codes:v2');
    await env.BLACKBAUD_TOKENS.delete('bb:cache:marketing-appeals');

    return json({ ok: true, id: created.id, appeal_id: lookupId, description });
  } catch (err) {
    return handleError(err);
  }
};

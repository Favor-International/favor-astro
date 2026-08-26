// /api/blackbaud/appeals — admin view + create for RE NXT appeal records,
// setup-key guarded like the other admin routes.
//
// GET  ?key=<BLACKBAUD_SETUP_KEY>&q=<text>   Walks the full appeal table
//      (same pagination as campaign.ts, which a single 500-row page misses)
//      and returns records whose lookup_id or description contains q.
//
// GET  ?key=...&id=<record id>               One appeal through the Data
//      Integration API, returned raw. Unlike the Fundraising read, this view
//      carries id-based fields (appeal_category_id), which is the only way
//      to learn a category id: there is no category list endpoint, so the
//      id is harvested from an existing appeal that already has it.
//
// POST ?key=<BLACKBAUD_SETUP_KEY>            Creates an appeal. Body:
//      { "appeal_id": "L26A-WS", "description": "...", "start_date": "2026-10-01",
//        "appeal_category_id": 123 }          (category optional)
//
// PATCH ?key=...                             Updates an appeal. Body:
//      { "id": "2354", "appeal_category_id": 123, "description": "..." }
//
//      Built for the direct-mail QR appeals (first use: October 2026 letter,
//      /RAKIE). Create and update purge the campaign-codes and
//      marketing-appeals KV caches so gift attribution resolves changes
//      immediately instead of after the 24h cache expiry.

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
    const search = new URL(request.url).searchParams;
    const id = (search.get('id') ?? '').trim();
    if (id) {
      if (!/^\d+$/.test(id)) throw new Error('id must be numeric');
      const record = await bbJson<Record<string, unknown>>(env, `/nxt-data-integration/v1/re/appeals/${id}`);
      return json({ ok: true, record });
    }
    const q = (search.get('q') ?? '').trim().toUpperCase();
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
    const categoryId = Number.isInteger(body.appeal_category_id)
      ? (body.appeal_category_id as number)
      : undefined;

    // Refuse a duplicate lookup code rather than trusting SKY to.
    const existing = (await listAllAppeals(env)).find(
      (a) => (a.lookup_id ?? '').toUpperCase() === lookupId.toUpperCase()
    );
    if (existing) {
      return json({ ok: false, error: 'duplicate', existing }, 409);
    }

    // Appeal creation is not in the Fundraising API (POST /fundraising/v1/
    // appeals 404s, verified 2026-08-26); it lives in the NXT Data
    // Integration API, which the Standard subscription key covers.
    const created = await bbJson<{ id: string }>(env, '/nxt-data-integration/v1/re/appeals', {
      method: 'POST',
      body: JSON.stringify({
        appeal_id: lookupId,
        description,
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
        ...(categoryId !== undefined ? { appeal_category_id: categoryId } : {}),
      }),
    });

    await purgeCodeCaches(env);
    return json({ ok: true, id: created.id, appeal_id: lookupId, description });
  } catch (err) {
    return handleError(err);
  }
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    requireCredentials(env);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const id = asTrimmed(body.id, 'id', 12);
    if (!/^\d+$/.test(id)) throw new Error('id must be numeric');

    const patch: Record<string, unknown> = {};
    if (Number.isInteger(body.appeal_category_id)) patch.appeal_category_id = body.appeal_category_id;
    const description = asTrimmed(body.description, 'description', 255, false);
    if (description) patch.description = description;
    const startDate = asTrimmed(body.start_date, 'start_date', 10, false);
    if (startDate) patch.start_date = startDate;
    const endDate = asTrimmed(body.end_date, 'end_date', 10, false);
    if (endDate) patch.end_date = endDate;
    if (typeof body.inactive === 'boolean') patch.inactive = body.inactive;
    if (Object.keys(patch).length === 0) {
      return json({ ok: false, error: 'empty_patch', message: 'No updatable fields in body' }, 400);
    }

    await bbJson(env, `/nxt-data-integration/v1/re/appeals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });

    await purgeCodeCaches(env);
    const record = await bbJson<Record<string, unknown>>(env, `/nxt-data-integration/v1/re/appeals/${id}`);
    return json({ ok: true, record });
  } catch (err) {
    return handleError(err);
  }
};

// Attribution reads these caches; a stale one would send /RAKIE gifts to
// the fallback Website appeal for up to a day.
async function purgeCodeCaches(env: Env): Promise<void> {
  await env.BLACKBAUD_TOKENS.delete('bb:cache:campaign-codes:v2');
  await env.BLACKBAUD_TOKENS.delete('bb:cache:marketing-appeals');
}

// POST /api/blackbaud/gift-date?key=<BLACKBAUD_SETUP_KEY>
// Body: { "id": "63564", "date": "2026-08-06" }
//
// Admin correction for a gift's date in RE NXT. Exists because the donate
// endpoints stamped UTC dates until 2026-08-06, so any evening gift (after
// 8pm EDT) landed on the next day; Will's real $1 launch test was the first
// caught. The endpoints now stamp Eastern calendar dates, and this fixes any
// record written before that.
//
// Narrow on purpose: date only, one gift at a time, same setup-key guard as
// the other admin routes.

import { bbFetch, requireCredentials, type Env } from '../_lib/blackbaud';
import { errorJson, handleError, json, readJsonBody, requireSetupKey } from '../_lib/http';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    requireCredentials(env);
    const body = await readJsonBody<{ id?: unknown; date?: unknown }>(request);
    const id = String(body.id ?? '').trim();
    const date = String(body.date ?? '').trim();
    if (!/^\d+$/.test(id)) return errorJson('bad_id', 'id must be a Blackbaud gift id', 400);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return errorJson('bad_date', 'date must be YYYY-MM-DD', 400);

    const res = await bbFetch(env, `/gift/v1/gifts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ date: `${date}T00:00:00` }),
    });
    if (!res.ok) {
      const text = await res.text();
      return errorJson('patch_failed', `Blackbaud PATCH ${res.status}: ${text.slice(0, 300)}`, 502);
    }
    return json({ ok: true, id, date });
  } catch (err) {
    return handleError(err);
  }
};

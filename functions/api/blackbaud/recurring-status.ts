// POST /api/blackbaud/recurring-status?key=<BLACKBAUD_SETUP_KEY>
// Body: { "id": "39792", "status": "Terminated" }
//
// Admin status write for a RecurringGift, with GET readback. Same helper the
// portal gateway uses. Setup-key guarded. One gift at a time.

import { requireCredentials, type Env } from '../_lib/blackbaud';
import { errorJson, handleError, json, readJsonBody, requireSetupKey } from '../_lib/http';
import { isRecurringStatus, setRecurringGiftStatus } from '../_lib/recurring-status';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    requireCredentials(env);
    const body = await readJsonBody<{ id?: unknown; status?: unknown }>(request);
    const id = String(body.id ?? '').trim();
    const status = String(body.status ?? '').trim();
    if (!/^\d+$/.test(id)) return errorJson('bad_id', 'id must be a Blackbaud gift id', 400);
    if (!isRecurringStatus(status)) {
      return errorJson('bad_status', 'status must be Active, Held, or Terminated', 400);
    }
    const result = await setRecurringGiftStatus(env, id, status);
    return json({ ok: true, id, ...result });
  } catch (err) {
    return handleError(err);
  }
};

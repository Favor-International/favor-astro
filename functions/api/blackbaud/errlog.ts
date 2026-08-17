// GET /api/blackbaud/errlog?key=<BLACKBAUD_SETUP_KEY>
// The last 20 giving errors recorded by recordGiveError (http.ts), newest
// first. Added 2026-08-17 while diagnosing a week of donate-recurring 400s
// that console.error could not explain after the fact.

import { type Env } from '../_lib/blackbaud';
import { handleError, json, requireSetupKey } from '../_lib/http';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    const raw = await env.BLACKBAUD_TOKENS.get('bb:errlog');
    return json({ ok: true, errors: raw ? JSON.parse(raw) : [] });
  } catch (err) {
    return handleError(err);
  }
};

// /api/blackbaud/solicit?key=<BLACKBAUD_SETUP_KEY>&constituent_id=<id>
//
// Admin view and repair for solicit codes (the RE NXT opt-out flags the
// marketing write-back sets). GET lists a constituent's solicit codes so an
// unsubscribe can be verified end to end; POST adds one:
//   POST body { constituent_id: "12824", code?: "Do Not Email" }
// Setup-key guarded like the other admin routes.

import { bbJson, requireCredentials, type Env } from '../_lib/blackbaud';
import { errorJson, handleError, json, readJsonBody, requireSetupKey } from '../_lib/http';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    requireCredentials(env);
    const id = (new URL(request.url).searchParams.get('constituent_id') ?? '').trim();
    if (!id) return errorJson('bad_id', 'constituent_id required', 400);
    // Solicit codes live in the Communication Preference service, not the
    // Constituent API. Probed live 2026-08-10: the collection route with a
    // constituent_id query param is the one that exists; note it needs the
    // "Communication Preference" product on the SKY subscription key (a 401
    // here means the product is missing from the subscription, not a bad key).
    const codes = await bbJson<{ value?: unknown[] }>(
      env,
      `/commpref/v1/solicitcodes?constituent_id=${encodeURIComponent(id)}&limit=50`
    );
    return json({ ok: true, constituent_id: id, solicit_codes: codes.value ?? [] });
  } catch (err) {
    return handleError(err);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    requireCredentials(env);
    const body = await readJsonBody<{ constituent_id?: string; code?: string }>(request);
    const id = (body.constituent_id ?? '').trim();
    if (!id) return errorJson('bad_id', 'constituent_id required', 400);
    const description = (body.code ?? 'Do Not Email').trim();
    const created = await bbJson<{ id?: string }>(env, `/commpref/v1/solicitcodes`, {
      method: 'POST',
      body: JSON.stringify({
        constituent_id: id,
        solicit_code: description,
        start_date: new Date().toISOString().slice(0, 10),
      }),
    });
    return json({ ok: true, constituent_id: id, code: description, record: created ?? null });
  } catch (err) {
    return handleError(err);
  }
};

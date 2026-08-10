// POST /api/marketing/consent
// Body: { email?: string, constituent_id?: string, kind: 'email'|'sms', code?: string }
//
// Write-back from the marketing platform when someone unsubscribes: adds a
// solicit code to the constituent so RE NXT reflects the opt-out. The code
// description defaults to "Do Not Email" / "Do Not Text"; pass `code` to use
// a different description from Favor's solicit-code table.

import { bbFetch, bbJson, requireCredentials, type Env } from '../_lib/blackbaud';
import { errorJson, handleError, json, readJsonBody } from '../_lib/http';
import { requireMarketingKey } from './_guard';

interface Body {
  email?: string;
  constituent_id?: string;
  kind: 'email' | 'sms';
  code?: string;
}

async function findByEmail(env: Env, email: string): Promise<string | null> {
  const e = encodeURIComponent(email);
  const attempts = [
    `search_text=${e}&search_field=email_address&strict_search=true&limit=10`,
    `search_text=${e}&search_field=email_address&limit=10`,
  ];
  for (const qs of attempts) {
    const res = await bbFetch(env, `/constituent/v1/constituents/search?${qs}`);
    if (!res.ok) {
      if (res.status !== 400) break;
      continue;
    }
    const found = (await res.json()) as { value?: Array<{ id: string; email?: string; deceased?: boolean }> };
    const match = (found.value ?? []).find((r) => (r.email ?? '').toLowerCase() === email && !r.deceased);
    if (match) return match.id;
  }
  return null;
}

export const onRequestPost: PagesFunction<Env & { MARKETING_API_KEY?: string }> = async ({ request, env }) => {
  try {
    const denied = requireMarketingKey(env, request);
    if (denied) return denied;
    requireCredentials(env);

    const body = await readJsonBody<Body>(request);
    if (body.kind !== 'email' && body.kind !== 'sms') return errorJson('bad_kind', 'kind must be email or sms', 400);

    let constituentId = body.constituent_id ?? null;
    if (!constituentId && body.email) constituentId = await findByEmail(env, body.email.trim().toLowerCase());
    if (!constituentId) return json({ ok: false, error: 'constituent_not_found' }, 404);

    const description = body.code ?? (body.kind === 'email' ? 'Do Not Email' : 'Do Not Text');
    // Solicit codes are a Communication Preference service entity; the old
    // /constituent/v1 path 404ed, which silently broke every unsubscribe
    // write-back until the Johnson removal exposed it (2026-08-10). Route
    // probed live the same day. Requires the "Communication Preference"
    // product on the SKY subscription; a 401 means the product is missing.
    await bbJson(env, `/commpref/v1/solicitcodes`, {
      method: 'POST',
      body: JSON.stringify({
        constituent_id: constituentId,
        solicit_code: description,
        start_date: new Date().toISOString().slice(0, 10),
      }),
    });
    return json({ ok: true, constituent_id: constituentId, code: description });
  } catch (err) {
    return handleError(err);
  }
};

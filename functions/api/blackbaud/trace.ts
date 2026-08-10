// GET /api/blackbaud/trace?key=<BLACKBAUD_SETUP_KEY>&name=<search text>
//
// Admin forensics for "where did this constituent come from?" questions
// (Daniel, 2026-08-09: three website-created records he could not trace).
// For each constituent matching the search: the record itself with its
// created date, its email addresses, its relationships (an org link means
// gift-contact), its gifts (none plus Prospect code means newsletter; none
// and no code likely an abandoned checkout), and its constituent codes.
//
// Read-only, a handful of SKY calls per lookup, setup-key guarded like the
// other admin routes.

import { bbJson, requireCredentials, type Env } from '../_lib/blackbaud';
import { errorJson, handleError, json, requireSetupKey } from '../_lib/http';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    requireCredentials(env);
    const url = new URL(request.url);
    const name = (url.searchParams.get('name') ?? '').trim();
    if (name.length < 3 || name.length > 80) return errorJson('bad_name', 'name (3-80 chars) required', 400);

    const found = await bbJson<{ value?: Array<{ id: string; name?: string; email?: string; deceased?: boolean }> }>(
      env,
      `/constituent/v1/constituents/search?search_text=${encodeURIComponent(name)}&limit=8`
    );
    const results = [];
    for (const hit of (found.value ?? []).slice(0, 5)) {
      const [detail, rels, gifts, codes] = await Promise.all([
        bbJson<Record<string, unknown>>(env, `/constituent/v1/constituents/${hit.id}`).catch(() => null),
        bbJson<{ value?: unknown[] }>(env, `/constituent/v1/constituents/${hit.id}/relationships`).catch(() => ({ value: [] })),
        bbJson<{ value?: unknown[] }>(env, `/gift/v1/gifts?constituent_id=${hit.id}&limit=10`).catch(() => ({ value: [] })),
        bbJson<{ value?: unknown[] }>(env, `/constituent/v1/constituents/${hit.id}/constituentcodes`).catch(() => ({ value: [] })),
      ]);
      results.push({
        id: hit.id,
        name: hit.name,
        email: hit.email,
        date_added: detail?.date_added ?? null,
        first: detail?.first ?? null,
        last: detail?.last ?? null,
        relationships: (rels.value ?? []).map((r) => {
          const x = r as Record<string, unknown>;
          return { name: x.name, type: x.type, reciprocal: x.reciprocal_type, is_org_contact: x.is_organization_contact };
        }),
        gifts: (gifts.value ?? []).map((g) => {
          const x = g as Record<string, unknown>;
          return { id: x.id, type: x.type, amount: (x.amount as { value?: number })?.value, date: x.date };
        }),
        codes: (codes.value ?? []).map((c) => (c as Record<string, unknown>).description),
      });
    }
    return json({ ok: true, query: name, results });
  } catch (err) {
    return handleError(err);
  }
};

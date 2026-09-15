// GET  /api/blackbaud/org-contact-fix?key=<SETUP>&id=<org constituent id>
// POST /api/blackbaud/org-contact-fix?key=<SETUP>
// Body: { "ids": ["36763", "36762"] }
//
// Inspect or repair website org-contact relationships that stored the person
// as Employer of the organization (Daniel, 2026-09-02). GET returns the
// current links. POST flips only Employer/Employee pairs on the org record.

import { bbJson, repairReversedOrgContact, requireCredentials, type Env } from '../_lib/blackbaud';
import { errorJson, handleError, json, readJsonBody, requireSetupKey } from '../_lib/http';

function asIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((v) => String(v ?? '').trim()).filter((id) => /^\d+$/.test(id));
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    requireCredentials(env);
    const id = (new URL(request.url).searchParams.get('id') ?? '').trim();
    if (!/^\d+$/.test(id)) return errorJson('bad_id', 'id must be a numeric organization constituent id', 400);
    const [core, rels] = await Promise.all([
      bbJson<Record<string, unknown>>(env, `/constituent/v1/constituents/${encodeURIComponent(id)}`),
      bbJson<{ value?: Array<Record<string, unknown>> }>(
        env,
        `/constituent/v1/constituents/${encodeURIComponent(id)}/relationships?limit=50`
      ),
    ]);
    return json({
      ok: true,
      id,
      name: core.name ?? null,
      type: core.type ?? null,
      relationships: (rels.value ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        reciprocal: r.reciprocal_type,
        is_org_contact: r.is_organization_contact,
        reversed: String(r.type ?? '').toLowerCase() === 'employer' && String(r.reciprocal_type ?? '').toLowerCase() === 'employee',
      })),
    });
  } catch (err) {
    return handleError(err);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    requireCredentials(env);
    const body = await readJsonBody<{ ids?: unknown }>(request);
    const ids = asIds(body.ids);
    if (!ids.length) return errorJson('bad_ids', 'ids must be an array of numeric constituent ids', 400);
    const results = [];
    for (const id of ids.slice(0, 40)) {
      try {
        const flipped = await repairReversedOrgContact(env, id);
        results.push({ id, ok: true, flipped });
      } catch (err) {
        results.push({
          id,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return json({ ok: true, results });
  } catch (err) {
    return handleError(err);
  }
};

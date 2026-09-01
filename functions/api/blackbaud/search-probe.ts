// GET /api/blackbaud/search-probe?key=<BLACKBAUD_SETUP_KEY>&email=<address>[&id=<constituent id>]
//
// Admin forensics for duplicate-constituent reports (Liana Rizzi, 2026-08-31):
// replays the exact three search variants the giving form's
// searchConstituentByEmail() runs and returns each variant's raw hits, so we
// can see what SKY actually returned for a donor's address. With &id= it also
// lists every email address on that constituent, since search results carry
// only the primary email. Read-only, setup-key guarded like the other admin
// routes.

import { bbFetch, requireCredentials, type Env } from '../_lib/blackbaud';
import { handleError, json, requireSetupKey } from '../_lib/http';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    requireCredentials(env);

    const url = new URL(request.url);
    const email = (url.searchParams.get('email') ?? '').trim();
    const id = (url.searchParams.get('id') ?? '').trim();
    const out: Record<string, unknown> = { email, id: id || null };

    if (email) {
      const e = encodeURIComponent(email);
      const attempts = [
        `search_text=${e}&search_field=email_address&strict_search=true&limit=10`,
        `search_text=${e}&search_field=email_address&limit=10`,
        `search_text=${e}&limit=25`,
      ];
      const variants = [];
      for (const qs of attempts) {
        const res = await bbFetch(env, `/constituent/v1/constituents/search?${qs}`);
        const text = await res.text();
        let hits: unknown = null;
        try {
          const body = JSON.parse(text) as { value?: Record<string, unknown>[] };
          hits = (body.value ?? []).map((r) => ({
            id: r.id, name: r.name, email: r.email, type: r.type ?? null,
            deceased: r.deceased ?? null, inactive: r.inactive ?? null,
          }));
        } catch {
          hits = text.slice(0, 500);
        }
        variants.push({ qs, status: res.status, hits });
      }
      out.variants = variants;
    }

    if (id) {
      const res = await bbFetch(env, `/constituent/v1/constituents/${id}/emailaddresses?include_inactive=true`);
      const text = await res.text();
      try {
        const body = JSON.parse(text) as { value?: Record<string, unknown>[] };
        out.emailaddresses = (body.value ?? []).map((r) => ({
          address: r.address, type: r.type, primary: r.primary, inactive: r.inactive,
        }));
      } catch {
        out.emailaddresses = text.slice(0, 500);
      }
    }

    return json(out);
  } catch (err) {
    return handleError(err);
  }
};

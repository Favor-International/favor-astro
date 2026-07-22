// POST /api/marketing/action
// Body: { constituent_id?: string, email?: string, summary: string }
//
// Records a completed marketing touch (campaign send) as a constituent
// Action so RE NXT shows the communication history.

import { bbFetch, bbJson, requireCredentials, type Env } from '../_lib/blackbaud';
import { errorJson, handleError, json, readJsonBody } from '../_lib/http';
import { requireMarketingKey } from './_guard';

interface Body {
  constituent_id?: string;
  email?: string;
  summary: string;
}

export const onRequestPost: PagesFunction<Env & { MARKETING_API_KEY?: string }> = async ({ request, env }) => {
  try {
    const denied = requireMarketingKey(env, request);
    if (denied) return denied;
    requireCredentials(env);

    const body = await readJsonBody<Body>(request);
    const summary = (body.summary ?? '').trim().slice(0, 255);
    if (!summary) return errorJson('bad_summary', 'summary is required', 400);

    let constituentId = body.constituent_id ?? null;
    if (!constituentId && body.email) {
      const e = encodeURIComponent(body.email.trim().toLowerCase());
      const res = await bbFetch(env, `/constituent/v1/constituents/search?search_text=${e}&search_field=email_address&limit=10`);
      if (res.ok) {
        const found = (await res.json()) as { value?: Array<{ id: string; email?: string }> };
        constituentId = (found.value ?? [])[0]?.id ?? null;
      }
    }
    if (!constituentId) return json({ ok: false, error: 'constituent_not_found' }, 404);

    const now = new Date();
    await bbJson(env, `/constituent/v1/actions`, {
      method: 'POST',
      body: JSON.stringify({
        constituent_id: constituentId,
        category: 'Task/Other',
        date: { d: now.getUTCDate(), m: now.getUTCMonth() + 1, y: now.getUTCFullYear() },
        summary,
        completed: true,
        completed_date: { d: now.getUTCDate(), m: now.getUTCMonth() + 1, y: now.getUTCFullYear() },
      }),
    });
    return json({ ok: true, constituent_id: constituentId });
  } catch (err) {
    return handleError(err);
  }
};

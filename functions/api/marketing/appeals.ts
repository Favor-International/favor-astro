// GET /api/marketing/appeals — appeal id -> description map for the marketing
// platform (attribution reporting: which appeal raised which dollar). One SKY
// call, cached an hour. Read-only; mirrors funds.ts.

import { bbJson, requireCredentials, type Env } from '../_lib/blackbaud';
import { handleError, json } from '../_lib/http';
import { requireMarketingKey } from './_guard';

export const onRequestGet: PagesFunction<Env & { MARKETING_API_KEY?: string }> = async ({ request, env }) => {
  try {
    const denied = requireMarketingKey(env, request);
    if (denied) return denied;
    requireCredentials(env);

    const cached = await env.BLACKBAUD_TOKENS.get('bb:cache:marketing-appeals');
    if (cached) return json({ ok: true, value: JSON.parse(cached) });

    const data = await bbJson<{ value?: Array<{ id: string; description?: string; category?: string }> }>(
      env,
      '/fundraising/v1/appeals?limit=500',
    );
    const value = (data.value ?? []).map(a => ({
      id: a.id,
      description: a.description ?? String(a.id),
      category: a.category ?? null,
    }));
    await env.BLACKBAUD_TOKENS.put('bb:cache:marketing-appeals', JSON.stringify(value), { expirationTtl: 3600 });
    return json({ ok: true, value });
  } catch (err) {
    return handleError(err);
  }
};

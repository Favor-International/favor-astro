// GET /api/marketing/funds — fund id -> description map for the marketing
// platform (dashboards, gift history display). One SKY call, cached an hour.

import { bbJson, requireCredentials, type Env } from '../_lib/blackbaud';
import { handleError, json } from '../_lib/http';
import { requireMarketingKey } from './_guard';

export const onRequestGet: PagesFunction<Env & { MARKETING_API_KEY?: string }> = async ({ request, env }) => {
  try {
    const denied = requireMarketingKey(env, request);
    if (denied) return denied;
    requireCredentials(env);

    const cached = await env.BLACKBAUD_TOKENS.get('bb:cache:marketing-funds');
    if (cached) return json({ ok: true, value: JSON.parse(cached) });

    const data = await bbJson<{ value?: Array<{ id: string; description?: string }> }>(env, '/fundraising/v1/funds?limit=500');
    const value = (data.value ?? []).map(f => ({ id: f.id, description: f.description ?? String(f.id) }));
    await env.BLACKBAUD_TOKENS.put('bb:cache:marketing-funds', JSON.stringify(value), { expirationTtl: 3600 });
    return json({ ok: true, value });
  } catch (err) {
    return handleError(err);
  }
};

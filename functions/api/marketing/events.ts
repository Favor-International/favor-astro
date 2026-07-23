// GET /api/marketing/events?continuation=<token>&limit=<n> — events list proxy
// for the marketing platform (event attendance, registrations). Read-only,
// paginated like gifts.ts. No writes.

import { bbJson, requireCredentials, type Env } from '../_lib/blackbaud';
import { handleError, json } from '../_lib/http';
import { requireMarketingKey } from './_guard';

export const onRequestGet: PagesFunction<Env & { MARKETING_API_KEY?: string }> = async ({ request, env }) => {
  try {
    const denied = requireMarketingKey(env, request);
    if (denied) return denied;
    requireCredentials(env);

    const url = new URL(request.url);
    const limit = Math.min(500, Math.max(1, Number(url.searchParams.get('limit') ?? 100)));
    const continuation = url.searchParams.get('continuation');

    let path: string;
    if (continuation) {
      if (!continuation.startsWith('/event/v1/events')) {
        return json({ ok: false, error: 'bad continuation' }, 400);
      }
      path = continuation;
    } else {
      path = `/event/v1/events?limit=${limit}`;
    }

    const data = await bbJson<{ count?: number; value?: unknown[]; next_link?: string }>(env, path);
    let next: string | null = null;
    if (data.next_link) {
      const u = new URL(data.next_link);
      next = u.pathname + u.search;
    }
    return json({ ok: true, count: data.count ?? null, value: data.value ?? [], continuation: next });
  } catch (err) {
    return handleError(err);
  }
};

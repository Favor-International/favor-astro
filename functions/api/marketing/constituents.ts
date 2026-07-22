// GET /api/marketing/constituents?date_modified=<iso>&continuation=<token>&limit=500
//
// Server-to-server list endpoint for the favor-marketing Worker's mirror
// sync. Pages through SKY constituent records, newest watermark logic lives
// on the marketing side; this endpoint is a thin authenticated proxy so the
// single OAuth token stays owned by this app.

import { bbJson, requireCredentials, type Env } from '../_lib/blackbaud';
import { handleError, json } from '../_lib/http';
import { requireMarketingKey } from './_guard';

export const onRequestGet: PagesFunction<Env & { MARKETING_API_KEY?: string }> = async ({ request, env }) => {
  try {
    const denied = requireMarketingKey(env, request);
    if (denied) return denied;
    requireCredentials(env);

    const url = new URL(request.url);
    const limit = Math.min(500, Math.max(1, Number(url.searchParams.get('limit') ?? 500)));
    const dateModified = url.searchParams.get('date_modified');
    const continuation = url.searchParams.get('continuation');

    let path: string;
    if (continuation) {
      // continuation is the next_link path+query the previous page returned
      if (!continuation.startsWith('/constituent/v1/constituents')) {
        return json({ ok: false, error: 'bad continuation' }, 400);
      }
      path = continuation;
    } else {
      const qs = new URLSearchParams({ limit: String(limit), include_inactive: 'false' });
      if (dateModified) qs.set('date_modified', dateModified);
      path = `/constituent/v1/constituents?${qs}`;
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

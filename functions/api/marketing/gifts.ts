// GET /api/marketing/gifts?date_modified=<iso>&continuation=<token>&limit=500
//
// Gift list proxy for the favor-marketing mirror: giving history powers
// segments (monthly partners, lapsed, new donors) and donor profiles.
// Same shape as the constituents proxy: thin, authenticated, watermark
// logic lives on the marketing side.

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
      if (!continuation.startsWith('/gift/v1/gifts')) {
        return json({ ok: false, error: 'bad continuation' }, 400);
      }
      path = continuation;
    } else {
      const qs = new URLSearchParams({ limit: String(limit) });
      if (dateModified) qs.set('date_modified', dateModified);
      path = `/gift/v1/gifts?${qs}`;
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

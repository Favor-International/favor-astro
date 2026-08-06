// GET /api/newsletter/list?key=<BLACKBAUD_SETUP_KEY>
//
// Admin export of newsletter signups captured in KV, for pulling the list
// into GHL (or wherever the newsletter ends up living). Same setup-key guard
// as the other admin endpoints.

import type { Env } from '../_lib/blackbaud';
import { handleError, json, requireSetupKey } from '../_lib/http';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    const subs: Array<{ email: string; at?: string; source?: string }> = [];
    let cursor: string | undefined;
    do {
      const page = await env.BLACKBAUD_TOKENS.list({ prefix: 'nl:sub:', cursor, limit: 1000 });
      for (const k of page.keys) {
        const raw = await env.BLACKBAUD_TOKENS.get(k.name);
        if (!raw) continue;
        try {
          subs.push(JSON.parse(raw) as { email: string; at?: string; source?: string });
        } catch {
          subs.push({ email: k.name.slice('nl:sub:'.length) });
        }
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
    subs.sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''));
    return json({ ok: true, count: subs.length, subscribers: subs });
  } catch (err) {
    return handleError(err);
  }
};

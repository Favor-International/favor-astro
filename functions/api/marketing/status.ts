// GET /api/marketing/status — is the gateway ready (credentials + token)?

import { readStoredTokens, requireCredentials, type Env } from '../_lib/blackbaud';
import { handleError, json } from '../_lib/http';
import { requireMarketingKey } from './_guard';

export const onRequestGet: PagesFunction<Env & { MARKETING_API_KEY?: string }> = async ({ request, env }) => {
  try {
    const denied = requireMarketingKey(env, request);
    if (denied) return denied;
    let configured = true;
    try { requireCredentials(env); } catch { configured = false; }
    const tokens = configured ? await readStoredTokens(env) : null;
    return json({ ok: true, connected: configured && tokens !== null });
  } catch (err) {
    return handleError(err);
  }
};

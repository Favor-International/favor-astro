// GET /api/blackbaud/campaign-codes?key=<BLACKBAUD_SETUP_KEY>
//
// Verifies that the Campaign One giving codes resolve to real RE NXT record
// ids before gifts depend on them. Runs the same resolution the donate
// endpoints use (campaign.ts), one entry per campaign source. A null entry
// means that source would fall back to the standing Website appeal.
// Read-only and setup-key guarded like the other admin routes.

import { requireCredentials, type Env } from '../_lib/blackbaud';
import { resolveCampaignCodes } from '../_lib/campaign';
import { handleError, json, requireSetupKey } from '../_lib/http';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    requireCredentials(env);
    const out: Record<string, unknown> = {};
    for (const source of ['email', 'fb', 'ig', 'yt', 'default']) {
      out[source] = await resolveCampaignCodes(env, source);
    }
    return json({ ok: true, resolved: out });
  } catch (err) {
    return handleError(err);
  }
};

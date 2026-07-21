// GET /api/blackbaud/funds?key=<BLACKBAUD_SETUP_KEY>
//
// Admin helper: lists active RE NXT funds so the team can pick fund_ids for
// GIVING_DESIGNATIONS / BLACKBAUD_DEFAULT_FUND_ID without opening RE NXT.

import { bbJson, requireCredentials, type Env } from '../_lib/blackbaud';
import { handleError, json, requireSetupKey } from '../_lib/http';

interface Fund {
  id: string;
  description?: string;
  lookup_id?: string;
  category?: string;
  type?: string;
  inactive?: boolean;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    requireCredentials(env);
    const data = await bbJson<{ count?: number; value?: Fund[] }>(env, '/fundraising/v1/funds?limit=500');
    const funds = (data.value ?? [])
      .filter((f) => !f.inactive)
      .map((f) => ({ fund_id: f.id, description: f.description, lookup_id: f.lookup_id, category: f.category }));
    return json({ count: funds.length, funds });
  } catch (err) {
    return handleError(err);
  }
};

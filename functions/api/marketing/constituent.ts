// GET /api/marketing/constituent?id=<constituent_id>
//
// Deep single-record bundle for the marketing platform's donor profile:
// core record, relationships, Blackbaud notes, all emails/phones/addresses,
// and constituent codes — fetched in parallel (6 SKY calls, failure-isolated
// per section so one 404 never empties the profile).

import { bbJson, requireCredentials, type Env } from '../_lib/blackbaud';
import { errorJson, handleError, json } from '../_lib/http';
import { requireMarketingKey } from './_guard';

const safe = async <T,>(p: Promise<T>): Promise<T | null> => p.catch(() => null);

export const onRequestGet: PagesFunction<Env & { MARKETING_API_KEY?: string }> = async ({ request, env }) => {
  try {
    const denied = requireMarketingKey(env, request);
    if (denied) return denied;
    requireCredentials(env);

    const id = new URL(request.url).searchParams.get('id');
    if (!id || !/^\d+$/.test(id)) return errorJson('bad_id', 'numeric id required', 400);
    const e = encodeURIComponent(id);

    const [core, relationships, notes, emails, phones, addresses, codes] = await Promise.all([
      safe(bbJson<any>(env, `/constituent/v1/constituents/${e}`)),
      safe(bbJson<any>(env, `/constituent/v1/constituents/${e}/relationships`)),
      safe(bbJson<any>(env, `/constituent/v1/constituents/${e}/notes`)),
      safe(bbJson<any>(env, `/constituent/v1/constituents/${e}/emailaddresses`)),
      safe(bbJson<any>(env, `/constituent/v1/constituents/${e}/phones`)),
      safe(bbJson<any>(env, `/constituent/v1/constituents/${e}/addresses`)),
      safe(bbJson<any>(env, `/constituent/v1/constituents/${e}/constituentcodes`)),
    ]);

    return json({
      ok: true,
      core,
      relationships: relationships?.value ?? [],
      notes: notes?.value ?? [],
      emails: emails?.value ?? [],
      phones: phones?.value ?? [],
      addresses: addresses?.value ?? [],
      codes: codes?.value ?? [],
    });
  } catch (err) {
    return handleError(err);
  }
};

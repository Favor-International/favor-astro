// Campaign giving-code attribution (Campaign One "Accelerator", 2026-08-10).
//
// A gift arriving from a campaign surface carries a campaign_source in the
// request body ('email' | 'fb' | 'ig' | 'yt' | 'default'). The source maps to
// the appeal LOOKUP codes Daniel Casella issued for the campaign, and every
// campaign gift also carries the campaign itself on its split. Lookup codes
// are resolved to RE NXT record ids through the SKY fundraising lists, cached
// in KV for a day.
//
// Failure-isolated by contract: resolution problems degrade to the standing
// Website appeal (GIVE_APPEAL_RECORD_ID) rather than blocking a gift. The
// source value is a whitelist key, never free text, so nothing client-supplied
// reaches Blackbaud unchecked.

import { bbJson, type Env } from './blackbaud';

/** Campaign One: monthly-partner acquisition, closes 2026-09-04. */
const CAMPAIGN_LOOKUP = 'M2608-SGA1';

const APPEAL_LOOKUP_BY_SOURCE: Record<string, string> = {
  email: 'N268-EMW2',
  fb: 'M200-FB',
  ig: 'M200-IG',
  yt: 'M200-YT',
  default: 'M268-SGA1',
};

const CODES_CACHE = 'bb:cache:campaign-codes:v1';

export interface CampaignCodes {
  campaign_id?: string;
  appeal_id?: string;
  /** The resolved appeal lookup code, for the gift reference. */
  appeal_lookup?: string;
}

interface FundraisingRecord {
  id: string;
  lookup_id?: string;
  description?: string;
  inactive?: boolean;
}

/** True when the body value names a known campaign source. */
export function isCampaignSource(value: unknown): value is string {
  return typeof value === 'string' && value in APPEAL_LOOKUP_BY_SOURCE;
}

async function lookupMaps(env: Env): Promise<{ appeals: Record<string, string>; campaigns: Record<string, string> }> {
  const cached = await env.BLACKBAUD_TOKENS.get(CODES_CACHE);
  if (cached) {
    try {
      return JSON.parse(cached) as { appeals: Record<string, string>; campaigns: Record<string, string> };
    } catch {
      /* refetch */
    }
  }
  const [appealData, campaignData] = await Promise.all([
    bbJson<{ value?: FundraisingRecord[] }>(env, '/fundraising/v1/appeals?limit=500'),
    bbJson<{ value?: FundraisingRecord[] }>(env, '/fundraising/v1/campaigns?limit=500'),
  ]);
  const toMap = (records: FundraisingRecord[] | undefined): Record<string, string> => {
    const map: Record<string, string> = {};
    for (const r of records ?? []) {
      // lookup_id is the code Daniel issues; description is the fallback in
      // case a tenant leaves lookup_id blank and codes the description instead.
      for (const key of [r.lookup_id, r.description]) {
        if (key) map[key.trim().toUpperCase()] ??= r.id;
      }
    }
    return map;
  };
  const maps = { appeals: toMap(appealData.value), campaigns: toMap(campaignData.value) };
  await env.BLACKBAUD_TOKENS.put(CODES_CACHE, JSON.stringify(maps), { expirationTtl: 86400 });
  return maps;
}

/**
 * Resolve a whitelisted campaign source to gift-split record ids. Returns null
 * for unknown sources or on any resolution failure; the caller then keeps the
 * standing Website appeal, and the gift is never blocked.
 */
export async function resolveCampaignCodes(env: Env, source: unknown): Promise<CampaignCodes | null> {
  if (!isCampaignSource(source)) return null;
  const appealLookup = APPEAL_LOOKUP_BY_SOURCE[source];
  try {
    const maps = await lookupMaps(env);
    const codes: CampaignCodes = {};
    const appealId = maps.appeals[appealLookup.toUpperCase()];
    if (appealId) {
      codes.appeal_id = appealId;
      codes.appeal_lookup = appealLookup;
    }
    const campaignId = maps.campaigns[CAMPAIGN_LOOKUP.toUpperCase()];
    if (campaignId) codes.campaign_id = campaignId;
    if (!codes.appeal_id && !codes.campaign_id) {
      console.error(`[campaign] neither appeal ${appealLookup} nor campaign ${CAMPAIGN_LOOKUP} resolved to a record id`);
      return null;
    }
    if (!codes.appeal_id) console.error(`[campaign] appeal lookup ${appealLookup} not found in RE NXT`);
    if (!codes.campaign_id) console.error(`[campaign] campaign lookup ${CAMPAIGN_LOOKUP} not found in RE NXT`);
    return codes;
  } catch (err) {
    console.error(`[campaign] code resolution failed for source "${source}": ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

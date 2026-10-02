// Giving-source attribution (Campaign One "Accelerator" 2026-08-10;
// generalized 2026-08-26 for the direct-mail QR sources).
//
// A gift arriving from an attributed surface carries a campaign_source in the
// request body. Each whitelisted source maps to an appeal LOOKUP code, an
// optional campaign lookup code, and the label the gift reference prints so
// staff reading the gift in RE NXT know where it came from. Lookup codes are
// resolved to RE NXT record ids through the SKY fundraising lists, cached in
// KV for a day.
//
// Failure-isolated by contract: resolution problems degrade to the standing
// Website appeal (GIVE_APPEAL_RECORD_ID) rather than blocking a gift. The
// source value is a whitelist key, never free text, so nothing client-supplied
// reaches Blackbaud unchecked.

import { bbJson, type Env } from './blackbaud';

/** Campaign One: monthly-partner acquisition, closes 2026-09-04. */
const CAMPAIGN_LOOKUP = 'M2608-SGA1';

interface SourceAttribution {
  appeal: string;
  campaign?: string;
  /** Prefix of the reference line staff read on the gift in RE NXT. */
  label: string;
}

const ATTRIBUTION_BY_SOURCE: Record<string, SourceAttribution> = {
  email: { appeal: 'N268-EMW2', campaign: CAMPAIGN_LOOKUP, label: 'Campaign One' },
  fb: { appeal: 'M200-FB', campaign: CAMPAIGN_LOOKUP, label: 'Campaign One' },
  ig: { appeal: 'M200-IG', campaign: CAMPAIGN_LOOKUP, label: 'Campaign One' },
  yt: { appeal: 'M200-YT', campaign: CAMPAIGN_LOOKUP, label: 'Campaign One' },
  default: { appeal: 'M268-SGA1', campaign: CAMPAIGN_LOOKUP, label: 'Campaign One' },
  // October 2026 appeal letter, reached by the QR shortlink /RAKIE. Appeal
  // code scheme: L = appeal letter, 26 = 2026, A = October (1-9 Jan-Sep,
  // A/B/C Oct/Nov/Dec), -WS = the website addendum for online gifts (same
  // convention as R255-WS). No campaign: the letter is not Campaign One.
  l26a: { appeal: 'L26A-WS', label: 'Online gift for the October appeal letter' },
  // Email newsletters: one key per issue, N<yy><month>-EMW<week> per the
  // appeal scheme, so each gift names the newsletter that drove it.
  'n269-emw5': { appeal: 'N269-EMW5', label: 'Online gift from the Sep 30 2026 email newsletter' },
};

// Dated codes resolve by pattern (2026-10-02), so a new newsletter or appeal
// letter needs only its appeal record in RE NXT, never a code change here:
//   n<yy><m>-emw<1-5>   email newsletter       -> appeal N<YY><M>-EMW<n>
//   l<yy><m>            appeal letter QR code  -> appeal L<YY><M>-WS
// <m> is the appeal scheme's month character: 1-9 for Jan-Sep, a/b/c for
// Oct/Nov/Dec. A key whose appeal does not exist yet falls back to the
// Website appeal like any other unresolved source.
const MONTH_NAMES: Record<string, string> = {
  '1': 'Jan', '2': 'Feb', '3': 'Mar', '4': 'Apr', '5': 'May', '6': 'Jun',
  '7': 'Jul', '8': 'Aug', '9': 'Sep', a: 'Oct', b: 'Nov', c: 'Dec',
};
export const NEWSLETTER_SRC = /^n(\d{2})([1-9abc])-emw([1-5])$/;
export const LETTER_SRC = /^l(\d{2})([1-9abc])$/;

function datedAttribution(source: string): SourceAttribution | null {
  const n = NEWSLETTER_SRC.exec(source);
  if (n) {
    return {
      appeal: source.toUpperCase(),
      label: `Online gift from the ${MONTH_NAMES[n[2]]} 20${n[1]} week ${n[3]} email newsletter`,
    };
  }
  const l = LETTER_SRC.exec(source);
  if (l) {
    return {
      appeal: `${source.toUpperCase()}-WS`,
      label: `Online gift for the ${MONTH_NAMES[l[2]]} 20${l[1]} appeal letter`,
    };
  }
  return null;
}

function attributionFor(source: string): SourceAttribution | null {
  return Object.hasOwn(ATTRIBUTION_BY_SOURCE, source) ? ATTRIBUTION_BY_SOURCE[source] : datedAttribution(source);
}

/** All whitelisted sources, for the admin verification endpoint. */
export const CAMPAIGN_SOURCES = Object.keys(ATTRIBUTION_BY_SOURCE);

/** The reference-line label for a whitelisted source. */
export function campaignLabel(source: string): string {
  return attributionFor(source)?.label ?? 'Campaign';
}

// v2: v1 cached a single-page appeal list that missed the campaign codes.
const CODES_CACHE = 'bb:cache:campaign-codes:v2';

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
  return typeof value === 'string' && attributionFor(value) !== null;
}

interface LookupMaps {
  appeals: Record<string, string>;
  campaigns: Record<string, string>;
  /** Epoch ms when the lists were read from RE NXT. */
  at?: number;
}

async function lookupMaps(env: Env, fresh = false): Promise<LookupMaps> {
  const cached = fresh ? null : await env.BLACKBAUD_TOKENS.get(CODES_CACHE);
  if (cached) {
    try {
      return JSON.parse(cached) as LookupMaps;
    } catch {
      /* refetch */
    }
  }
  // The appeal table holds thousands of records (one per historic mailing),
  // so a single page misses recently added codes. Walk the list to the end,
  // capped defensively at 20 pages / 10,000 records.
  const listAll = async (path: string): Promise<FundraisingRecord[]> => {
    const all: FundraisingRecord[] = [];
    for (let page = 0; page < 20; page++) {
      const data = await bbJson<{ value?: FundraisingRecord[]; count?: number }>(
        env,
        `${path}?limit=500&offset=${page * 500}`
      );
      const batch = data.value ?? [];
      all.push(...batch);
      if (batch.length < 500) break;
    }
    return all;
  };
  const [appealValue, campaignValue] = await Promise.all([
    listAll('/fundraising/v1/appeals'),
    listAll('/fundraising/v1/campaigns'),
  ]);
  const appealData = { value: appealValue };
  const campaignData = { value: campaignValue };
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
  const maps: LookupMaps = { appeals: toMap(appealData.value), campaigns: toMap(campaignData.value), at: Date.now() };
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
  const attribution = attributionFor(source);
  if (!attribution) return null;
  const appealLookup = attribution.appeal;
  try {
    let maps = await lookupMaps(env);
    // An appeal created by hand in RE NXT is missing from a cached list for
    // up to a day. Reread once when the cache is over ten minutes old, so a
    // new issue's code resolves on its first gift.
    if (!maps.appeals[appealLookup.toUpperCase()] && Date.now() - (maps.at ?? 0) > 10 * 60 * 1000) {
      maps = await lookupMaps(env, true);
    }
    const codes: CampaignCodes = {};
    const appealId = maps.appeals[appealLookup.toUpperCase()];
    if (appealId) {
      codes.appeal_id = appealId;
      codes.appeal_lookup = appealLookup;
    }
    if (attribution.campaign) {
      const campaignId = maps.campaigns[attribution.campaign.toUpperCase()];
      if (campaignId) codes.campaign_id = campaignId;
      if (!codes.campaign_id) console.error(`[campaign] campaign lookup ${attribution.campaign} not found in RE NXT`);
    }
    if (!codes.appeal_id && !codes.campaign_id) {
      console.error(`[campaign] neither appeal ${appealLookup} nor campaign ${attribution.campaign ?? '(none)'} resolved to a record id`);
      return null;
    }
    if (!codes.appeal_id) console.error(`[campaign] appeal lookup ${appealLookup} not found in RE NXT`);
    return codes;
  } catch (err) {
    console.error(`[campaign] code resolution failed for source "${source}": ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

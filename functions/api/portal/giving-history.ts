// GET /api/portal/giving-history?email=<donor email>
//
// Server-to-server endpoint for the Favor Partner Portal (favor-portal
// Worker on the same Cloudflare account). The portal authenticates its
// signed-in user, then asks here for that user's giving history; this app
// owns the single Blackbaud OAuth token so the portal never needs its own
// (SKY API refresh tokens are single-use; a second refresher would corrupt
// the rotation).
//
// Auth: Authorization: Bearer <PORTAL_API_KEY>  (or X-Portal-Key header).
// Never expose this endpoint to browsers; the key lives only in the two
// Cloudflare apps' environments.

import { bbFetch, bbJson, requireCredentials, BlackbaudError, type Env } from '../_lib/blackbaud';
import { errorJson, handleError, json } from '../_lib/http';

interface GiftSplit {
  fund_id?: string;
  amount?: { value?: number };
}
interface GiftRead {
  id: string;
  amount?: { value?: number };
  date?: string;
  type?: string;
  gift_status?: string;
  lookup_id?: string;
  is_anonymous?: boolean;
  gift_splits?: GiftSplit[];
  payments?: Array<{ payment_method?: string }>;
  receipts?: Array<{ status?: string; number?: number; date?: string }>;
  recurring_gift_schedule?: { frequency?: string; start_date?: string };
}

interface LifetimeGivingRead {
  total_giving?: { value?: number };
  total_received_giving?: { value?: number };
  consecutive_years_given?: number;
  total_years_given?: number;
}
interface GivingSummaryRead {
  id?: string;
  amount?: { value?: number };
  date?: string;
}

// Read-only constituent giving summaries (authoritative, server-computed).
// Failure-isolated: any error returns null so the core history still serves.
async function lifetimeGiving(env: Env, constituentId: string): Promise<LifetimeGivingRead | null> {
  try {
    return await bbJson<LifetimeGivingRead>(
      env,
      `/constituent/v1/constituents/${encodeURIComponent(constituentId)}/givingsummary/lifetimegiving`
    );
  } catch {
    return null;
  }
}
async function firstGift(env: Env, constituentId: string): Promise<GivingSummaryRead | null> {
  try {
    return await bbJson<GivingSummaryRead>(
      env,
      `/constituent/v1/constituents/${encodeURIComponent(constituentId)}/givingsummary/first`
    );
  } catch {
    return null;
  }
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

async function fundNames(env: Env): Promise<Map<string, string>> {
  const cached = await env.BLACKBAUD_TOKENS.get('bb:cache:fundnames');
  if (cached) {
    try {
      return new Map(JSON.parse(cached) as Array<[string, string]>);
    } catch {
      /* refetch */
    }
  }
  const data = await bbJson<{ value?: Array<{ id: string; description?: string }> }>(
    env,
    '/fundraising/v1/funds?limit=500'
  );
  const map = new Map((data.value ?? []).map((f) => [f.id, f.description ?? f.id]));
  await env.BLACKBAUD_TOKENS.put('bb:cache:fundnames', JSON.stringify([...map]), { expirationTtl: 3600 });
  return map;
}

export const onRequestGet: PagesFunction<Env & { PORTAL_API_KEY?: string }> = async ({ request, env }) => {
  try {
    if (!env.PORTAL_API_KEY) {
      return errorJson('portal_disabled', 'PORTAL_API_KEY is not configured', 503);
    }
    const supplied =
      (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '') ||
      request.headers.get('X-Portal-Key') ||
      '';
    if (!timingSafeEqualStr(supplied, env.PORTAL_API_KEY)) {
      return errorJson('forbidden', 'Invalid portal key', 403);
    }
    requireCredentials(env);

    const url = new URL(request.url);
    const email = (url.searchParams.get('email') ?? '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return errorJson('bad_email', 'A valid email query parameter is required', 400);
    }

    // Primary path since 2026-08-05: favor-data-api reads the RE NXT sync
    // database, so a portal login costs zero SKY API calls and sees realtime
    // gifts the sync has not pulled yet. The identical response shape means
    // the portal cannot tell which path served it. Any failure falls through
    // to the original SKY implementation below, so the portal keeps working
    // even if the data worker is down.
    const dataEnv = env as typeof env & { DATA_API_URL?: string; DATA_API_KEY?: string };
    if (dataEnv.DATA_API_URL && dataEnv.DATA_API_KEY) {
      try {
        const res = await fetch(
          `${dataEnv.DATA_API_URL.replace(/\/$/, '')}/giving-history?email=${encodeURIComponent(email)}`,
          {
            headers: { Authorization: `Bearer ${dataEnv.DATA_API_KEY}` },
            signal: AbortSignal.timeout(8000),
          }
        );
        if (res.ok) {
          return new Response(await res.text(), {
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          });
        }
        console.error(`[portal/giving-history] data api returned ${res.status}; falling back to SKY`);
      } catch (err) {
        console.error(
          `[portal/giving-history] data api unreachable (${err instanceof Error ? err.message : err}); falling back to SKY`
        );
      }
    }

    // Same resilient search strategy as the giving flow: variants, then give up.
    const e = encodeURIComponent(email);
    const attempts = [
      `search_text=${e}&search_field=email_address&strict_search=true&limit=10`,
      `search_text=${e}&search_field=email_address&limit=10`,
      `search_text=${e}&limit=25`,
    ];
    let constituentId: string | null = null;
    let constituentName: string | undefined;
    for (const qs of attempts) {
      const res = await bbFetch(env, `/constituent/v1/constituents/search?${qs}`);
      if (!res.ok) {
        if (res.status !== 400) break;
        continue;
      }
      const found = (await res.json()) as {
        value?: Array<{ id: string; email?: string; name?: string; deceased?: boolean }>;
      };
      const match = (found.value ?? []).find((r) => (r.email ?? '').toLowerCase() === email && !r.deceased);
      if (match) {
        constituentId = match.id;
        constituentName = match.name;
      }
      break;
    }

    if (!constituentId) {
      return json({ ok: true, constituent: null, gifts: [], summary: { total_given: 0, gift_count: 0 } });
    }

    const [giftData, funds, lifetime, first] = await Promise.all([
      bbJson<{ count?: number; value?: GiftRead[] }>(
        env,
        `/gift/v1/gifts?constituent_id=${encodeURIComponent(constituentId)}&limit=200`
      ),
      fundNames(env),
      lifetimeGiving(env, constituentId),
      firstGift(env, constituentId),
    ]);

    const gifts = (giftData.value ?? [])
      .map((g) => {
        const receipt = (g.receipts ?? []).find((r) => (r.status ?? '').toLowerCase() === 'receipted');
        return {
          id: g.id,
          lookup_id: g.lookup_id,
          date: g.date ?? null,
          amount: g.amount?.value ?? 0,
          type: g.type ?? 'Donation',
          status: g.gift_status ?? null,
          is_recurring: g.type === 'RecurringGift',
          is_recurring_payment: g.type === 'RecurringGiftPayment',
          frequency: g.recurring_gift_schedule?.frequency ?? null,
          designation: g.gift_splits?.length ? funds.get(g.gift_splits[0].fund_id ?? '') ?? null : null,
          payment_method: g.payments?.[0]?.payment_method ?? null,
          receipted: !!receipt,
          receipt_number: receipt?.number ?? null,
          receipt_date: receipt?.date ?? null,
          anonymous: g.is_anonymous === true,
        };
      })
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

    // RecurringGift rows are schedules, not money received; count payments +
    // one-time gifts for totals.
    const counted = gifts.filter((g) => !g.is_recurring);
    const currentYear = new Date().getUTCFullYear();
    const summary = {
      total_given: Math.round(counted.reduce((s, g) => s + g.amount, 0) * 100) / 100,
      ytd_given:
        Math.round(
          counted
            .filter((g) => (g.date ?? '').startsWith(String(currentYear)))
            .reduce((s, g) => s + g.amount, 0) * 100
        ) / 100,
      gift_count: counted.length,
      active_recurring: gifts.filter((g) => g.is_recurring && (g.status ?? '') === 'Active').length,
    };

    // Authoritative lifetime (server-computed, not capped by the 200-gift
    // page) and the donor's first-gift date for "partner since".
    const lifetimeTotal = lifetime?.total_received_giving?.value ?? lifetime?.total_giving?.value ?? null;
    const enriched = {
      ...summary,
      lifetime_total: lifetimeTotal,
      consecutive_years_given: lifetime?.consecutive_years_given ?? null,
      total_years_given: lifetime?.total_years_given ?? null,
      first_gift_date: first?.date ?? null,
      first_gift_amount: first?.amount?.value ?? null,
    };

    return json({
      ok: true,
      constituent: { id: constituentId, name: constituentName ?? null, email },
      gifts,
      summary: enriched,
    });
  } catch (err) {
    if (err instanceof BlackbaudError) return handleError(err);
    return handleError(err);
  }
};

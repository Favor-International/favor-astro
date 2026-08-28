// Client for favor-data-api, the private worker in front of the RE NXT sync
// database (see docs/portal-data-plan-2026-08-05.md).
//
// pushGiftRealtime solves the "where's my $35 gift" gap: Daniel's sync runs
// every 12 hours, so a partner who gives and then opens their portal would
// not see the gift. We insert it the moment Blackbaud confirms it, keyed on
// the Blackbaud gift id, which is the sync table's primary key. The sync
// upserts the same id later and replaces our provisional row with the full
// record. Same row twice, never a duplicate.
//
// Fire-and-forget by contract: this must NEVER fail or delay a gift. The
// gift already exists in Blackbaud (the system of record) before this runs;
// the worst case of a lost push is the partner seeing the gift after the
// next sync instead of instantly.

export interface DataApiEnv {
  DATA_API_URL?: string;
  DATA_API_KEY?: string;
}

export interface RealtimeGiftPush {
  id: string;
  constituent_id: string;
  amount: number;
  date: string;
  type: 'Donation' | 'RecurringGift' | 'RecurringGiftPayment';
  gift_status?: string;
  gift_splits: unknown[];
  payment_method?: string;
  raw_json?: Record<string, unknown>;
  /** Lets giving-history find this gift by email before Daniel's 12-hour sync. */
  email?: string;
  first?: string;
  last?: string;
  org_name?: string;
}

export async function pushGiftRealtime(env: DataApiEnv, gift: RealtimeGiftPush): Promise<void> {
  if (!env.DATA_API_URL || !env.DATA_API_KEY) return;
  try {
    const res = await fetch(`${env.DATA_API_URL.replace(/\/$/, '')}/gifts/realtime`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.DATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gift),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error(`[dataapi] realtime push for gift ${gift.id} returned ${res.status}`);
    }
  } catch (err) {
    console.error(
      `[dataapi] realtime push for gift ${gift.id} failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Every constituent id carrying this email, from the sync database (all email
 * rows, not only the primary). Returns null when the data API is not
 * configured or unreachable, so callers can fall back to the SKY search.
 */
export async function constituentIdsForEmail(env: DataApiEnv, email: string): Promise<string[] | null> {
  if (!env.DATA_API_URL || !env.DATA_API_KEY) return null;
  try {
    const res = await fetch(
      `${env.DATA_API_URL.replace(/\/$/, '')}/constituent-ids?email=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${env.DATA_API_KEY}` }, signal: AbortSignal.timeout(8000) }
    );
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; ids?: string[] };
    return res.ok && data.ok && Array.isArray(data.ids) ? data.ids : null;
  } catch {
    return null;
  }
}

/**
 * Stamp a RecurringGift's live status onto the D1 mirror so the portal's
 * next giving-history read is not twelve hours behind. Fire-and-forget:
 * Blackbaud already has the status; a missed push only means the UI lags
 * until the next sync.
 */
export async function pushGiftStatus(env: DataApiEnv, giftId: string, giftStatus: string): Promise<void> {
  if (!env.DATA_API_URL || !env.DATA_API_KEY) return;
  try {
    const res = await fetch(`${env.DATA_API_URL.replace(/\/$/, '')}/gifts/status`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.DATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: giftId, gift_status: giftStatus }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error(`[dataapi] status push for gift ${giftId} returned ${res.status}`);
    }
  } catch (err) {
    console.error(
      `[dataapi] status push for gift ${giftId} failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

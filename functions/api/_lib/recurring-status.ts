// Recurring-gift status writes (pause / resume / cancel).
//
// 2026-08-28 Blandford: PUT /gift/v1/recurringgifts/{id}/status returned 200
// with an empty body and left gift 39792 Active. Amount changes already
// GET-read back after PATCH for the same reason. Status writes now do too,
// and fall through to PATCH /gift/v1/gifts/{id} if the PUT was a no-op.

import { bbFetch, bbJson, etGiftDate, BlackbaudError, type Env } from './blackbaud';

export const RECURRING_STATUSES = ['Active', 'Held', 'Terminated'] as const;
export type RecurringStatus = (typeof RECURRING_STATUSES)[number];

export function isRecurringStatus(value: string): value is RecurringStatus {
  return (RECURRING_STATUSES as readonly string[]).includes(value);
}

export interface StatusAttempt {
  method: string;
  http_status: number;
  readback: string | null;
}

interface GiftStatusRead {
  gift_status?: string;
}

async function readGiftStatus(env: Env, giftId: string): Promise<string | null> {
  const gift = await bbJson<GiftStatusRead>(env, `/gift/v1/gifts/${encodeURIComponent(giftId)}`);
  return gift.gift_status ?? null;
}

async function skyWrite(
  env: Env,
  path: string,
  method: string,
  body: unknown
): Promise<number> {
  const res = await bbFetch(env, path, { method, body: JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) {
    throw new BlackbaudError(
      'sky_api_error',
      `SKY API ${method} ${path} failed (${res.status})`,
      res.status >= 500 ? 502 : res.status,
      text.slice(0, 500)
    );
  }
  return res.status;
}

/**
 * Set a RecurringGift to Active / Held / Terminated and prove it with a GET.
 * Returns the status Blackbaud actually stored. Throws if it still does not
 * match after every write we know how to send.
 */
export async function setRecurringGiftStatus(
  env: Env,
  giftId: string,
  wanted: RecurringStatus
): Promise<{ applied: RecurringStatus; attempts: StatusAttempt[] }> {
  const attempts: StatusAttempt[] = [];
  const id = encodeURIComponent(giftId);

  const record = async (method: string, httpStatus: number): Promise<string | null> => {
    const readback = await readGiftStatus(env, giftId);
    attempts.push({ method, http_status: httpStatus, readback });
    return readback;
  };

  let http = await skyWrite(env, `/gift/v1/recurringgifts/${id}/status`, 'PUT', { status: wanted });
  let now = await record('PUT /gift/v1/recurringgifts/{id}/status', http);
  if (now === wanted) return { applied: wanted, attempts };

  http = await skyWrite(env, `/gift/v1/gifts/${id}`, 'PATCH', { gift_status: wanted });
  now = await record('PATCH /gift/v1/gifts/{id} gift_status', http);
  if (now === wanted) return { applied: wanted, attempts };

  if (wanted === 'Terminated') {
    http = await skyWrite(env, `/gift/v1/gifts/${id}`, 'PATCH', {
      gift_status: 'Terminated',
      recurring_gift_schedule: { end_date: etGiftDate() },
    });
    now = await record('PATCH /gift/v1/gifts/{id} gift_status+end_date', http);
    if (now === wanted) return { applied: wanted, attempts };
  }

  throw new BlackbaudError(
    'status_not_applied',
    `Blackbaud accepted the ${wanted} request but the schedule is still ${now ?? 'unknown'}. The office has to change it in Raiser's Edge.`,
    502,
    { wanted, readback: now, attempts }
  );
}

// Fire-and-degrade notification to the Favor Partner Portal after a
// successful gift. The portal provisions the donor's account, sends the
// welcome email, and returns a one-time dashboard login URL for the
// thank-you page. Any failure returns null and never affects the gift.

import type { Env } from './blackbaud';

export interface GiftCompletedInput {
  email: string;
  first: string;
  last: string;
  phone?: string;
  amount: number;
  frequency: 'once' | 'monthly';
  designation: string;
  constituent_id?: string;
  /** Blackbaud gift id for the money row (Donation or RecurringGiftPayment). */
  gift_id?: string;
  /** RecurringGiftPayment id when frequency is monthly; preferred over gift_id for history. */
  payment_gift_id?: string;
  gift_date?: string;
}

export async function notifyPortalGiftCompleted(
  env: Env & { PORTAL_HOOK_URL?: string; PORTAL_API_KEY?: string },
  input: GiftCompletedInput
): Promise<string | null> {
  const base = env.PORTAL_HOOK_URL;
  const key = env.PORTAL_API_KEY;
  if (!base || !key) return null;
  try {
    const res = await fetch(base.replace(/\/$/, '') + '/api/portal-hooks/gift-completed', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error(`[portal-hook] responded ${res.status}`);
      return null;
    }
    const data = (await res.json()) as { ok?: boolean; login_url?: string };
    return data.ok && typeof data.login_url === 'string' ? data.login_url : null;
  } catch (err) {
    console.error('[portal-hook] failed', err instanceof Error ? err.message : err);
    return null;
  }
}

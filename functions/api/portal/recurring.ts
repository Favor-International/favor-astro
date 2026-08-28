// POST /api/portal/recurring
//
// Server-to-server recurring-gift management for the Favor Partner Portal.
// Body: { email, gift_id, action: "pause"|"resume"|"cancel" }
//       { email, gift_id, action: "update_card", card_token: uuid }
//       { email, gift_id, amount: 123.45 }
//
// Ownership is enforced HERE, not trusted from the caller: the gift is
// fetched from the Gift API and its constituent_id must match the
// constituent found for the supplied email. Actions map to:
//   pause/resume/cancel -> setRecurringGiftStatus (PUT status, GET readback,
//                          PATCH gift_status if the PUT was a no-op).
//                          Do not return ok until Blackbaud stores the status.
//   amount              -> PATCH /gift/v1/gifts/{id} then GET to confirm.
//                          SKY often returns 200 without applying an amount
//                          amendment on RecurringGift. If the readback does
//                          not match, we return 502 instead of lying.
//
// Auth: Authorization: Bearer <PORTAL_API_KEY> (same trust pair as
// giving-history).

import {
  bbFetch,
  bbJson,
  cardTokenVaulted,
  convertRecurringGiftToAutomatic,
  getPaymentConfig,
  requireCredentials,
  BlackbaudError,
  type Env,
} from '../_lib/blackbaud';
import { errorJson, handleError, json, readJsonBody } from '../_lib/http';
import { constituentIdsForEmail, pushGiftStatus, type DataApiEnv } from '../_lib/dataapi';
import { setRecurringGiftStatus } from '../_lib/recurring-status';

interface GiftDetail {
  id: string;
  type?: string;
  constituent_id?: string;
  amount?: { value?: number };
  gift_status?: string;
  gift_splits?: Array<{ id?: string; fund_id?: string; amount?: { value?: number } }>;
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

async function constituentIdForEmail(env: Env, email: string): Promise<string | null> {
  const e = encodeURIComponent(email);
  const attempts = [
    `search_text=${e}&search_field=email_address&strict_search=true&limit=10`,
    `search_text=${e}&search_field=email_address&limit=10`,
    `search_text=${e}&limit=25`,
  ];
  for (const qs of attempts) {
    const res = await bbFetch(env, `/constituent/v1/constituents/search?${qs}`);
    if (!res.ok) {
      if (res.status !== 400) break;
      continue;
    }
    const found = (await res.json()) as { value?: Array<{ id: string; email?: string; deceased?: boolean }> };
    const match = (found.value ?? []).find((r) => (r.email ?? '').toLowerCase() === email && !r.deceased);
    return match ? match.id : null;
  }
  return null;
}

interface RecurringBody {
  email?: unknown;
  gift_id?: unknown;
  action?: unknown;
  amount?: unknown;
  card_token?: unknown;
}

export const onRequestPost: PagesFunction<Env & DataApiEnv & { PORTAL_API_KEY?: string }> = async ({ request, env }) => {
  try {
    if (!env.PORTAL_API_KEY) return errorJson('portal_disabled', 'PORTAL_API_KEY is not configured', 503);
    const supplied = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!timingSafeEqualStr(supplied, env.PORTAL_API_KEY)) {
      return errorJson('forbidden', 'Invalid portal key', 403);
    }
    requireCredentials(env);

    const body = await readJsonBody<RecurringBody>(request);
    const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';
    const giftId = typeof body.gift_id === 'string' ? body.gift_id.trim() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return errorJson('bad_email', 'Valid email required', 400);
    if (!giftId || giftId.length > 40) return errorJson('bad_gift', 'gift_id required', 400);

    // Ownership: the gift must belong to a constituent carrying this email.
    // The sync database knows every email row; the SKY search (fallback)
    // only matches the primary address, which locked out donors whose portal
    // email is secondary on their record.
    const [ids, gift] = await Promise.all([
      constituentIdsForEmail(env, email),
      bbJson<GiftDetail>(env, `/gift/v1/gifts/${encodeURIComponent(giftId)}`),
    ]);
    let owned = ids !== null && !!gift.constituent_id && ids.includes(String(gift.constituent_id));
    if (!owned && ids === null) {
      const constituentId = await constituentIdForEmail(env, email);
      owned = !!constituentId && gift.constituent_id === constituentId;
    }
    if (!owned) {
      return errorJson('not_owner', 'This gift does not belong to that donor', 403);
    }
    if (gift.type !== 'RecurringGift') {
      return errorJson('not_recurring', 'Only recurring gifts can be managed here', 400);
    }

    const action = typeof body.action === 'string' ? body.action : null;
    if (action === 'pause' || action === 'resume' || action === 'cancel') {
      const status = action === 'pause' ? 'Held' : action === 'resume' ? 'Active' : 'Terminated';
      // PUT /status has returned 200 and left the gift Active (Blandford
      // 39792, 2026-08-28). setRecurringGiftStatus GET-reads back and falls
      // through to PATCH if the PUT was a no-op. Do not return ok until
      // Blackbaud stores the status we sent.
      const result = await setRecurringGiftStatus(env, giftId, status);
      await pushGiftStatus(env, giftId, result.applied);
      return json({ ok: true, status: result.applied, attempts: result.attempts });
    }

    // Change the card on file (Will, 2026-08-06: partners must be able to do
    // this themselves). The portal opened Blackbaud Checkout, which vaulted
    // the new card under card_token; the card itself never touches us, so PCI
    // scope is unchanged. Re-running converttoautomatic with the new token
    // repoints the schedule at the new card.
    if (action === 'update_card') {
      const cardToken = typeof body.card_token === 'string' ? body.card_token.trim() : '';
      if (!/^[0-9a-f-]{36}$/i.test(cardToken)) return errorJson('bad_card_token', 'card_token required', 400);

      const vaulted = await cardTokenVaulted(env, cardToken);
      if (!vaulted) {
        return errorJson('card_not_vaulted', 'That card was not saved. Please try again, and avoid digital wallets for monthly gifts.', 400);
      }
      const payConfig = await getPaymentConfig(env);
      const conv = await convertRecurringGiftToAutomatic(env, giftId, payConfig.id, cardToken);
      if (!conv.automated) {
        return errorJson('card_update_failed', conv.detail ?? 'Blackbaud rejected the card update', 502);
      }
      return json({ ok: true, action: 'update_card' });
    }

    const amountRaw = Number(body.amount);
    if (Number.isFinite(amountRaw)) {
      const amount = Math.round(amountRaw * 100) / 100;
      if (amount < 1 || amount > 250000) return errorJson('bad_amount', 'Amount must be between $1 and $250,000', 400);
      const fundId = gift.gift_splits?.[0]?.fund_id;
      if (!fundId) return errorJson('no_split', 'The gift has no fund split to update', 502);
      const splitId = gift.gift_splits?.[0]?.id;
      const splitBody: Record<string, unknown> = { fund_id: fundId, amount: { value: amount } };
      if (splitId) splitBody.id = splitId;
      await bbJson(env, `/gift/v1/gifts/${encodeURIComponent(giftId)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          amount: { value: amount },
          gift_splits: [splitBody],
        }),
      });
      const read = await bbJson<GiftDetail>(env, `/gift/v1/gifts/${encodeURIComponent(giftId)}`);
      if (read.amount?.value !== amount) {
        return errorJson(
          'amount_not_applied',
          'Blackbaud accepted the request but the schedule amount did not change. Email the office to amend the gift in Raisers Edge.',
          502
        );
      }
      return json({ ok: true, amount });
    }

    return errorJson('bad_request', 'Provide action (pause|resume|cancel) or amount', 400);
  } catch (err) {
    if (err instanceof BlackbaudError && err.status === 404) {
      return errorJson('not_found', 'Recurring gift not found', 404);
    }
    return handleError(err);
  }
};

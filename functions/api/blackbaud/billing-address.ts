// GET /api/blackbaud/billing-address?key=<BLACKBAUD_SETUP_KEY>&gift=<gift id>[&apply=1]
//
// What billing address does the card transaction behind this gift carry, and
// would it be saved on the giving record? Without apply=1 nothing is written.
// With it, the address is saved only when the record holds no address at all.
//
// Used to check the giving form's address capture and to fill in the records
// the form created before it captured one. Setup-key guarded. The response
// carries the city, state, postal code and country, and says whether a street
// line exists without repeating it. No card detail is read or returned.

import { bbFetch, bbJson, requireCredentials, type Env } from '../_lib/blackbaud';
import { giftBillingAddress, saveBillingAddress } from '../_lib/billing-address';
import { errorJson, handleError, json, requireSetupKey } from '../_lib/http';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    requireCredentials(env);
    const q = new URL(request.url).searchParams;
    const giftId = (q.get('gift') ?? '').trim();
    if (!/^\d+$/.test(giftId)) return errorJson('bad_gift', 'gift must be a Blackbaud gift id', 400);

    const gift = await bbJson<{ constituent_id?: string; payments?: Array<{ bbps_transaction_id?: string }> }>(
      env,
      `/gift/v1/gifts/${giftId}`
    );
    const constituentId = String(gift.constituent_id ?? '');
    const hasTransaction = (gift.payments ?? []).some((p) => Boolean(p.bbps_transaction_id));

    // &shape=1: which fields the transaction carries, by name only, for when Blackbaud's
    // response does not match what normalizeBilling expects. No values are returned.
    if (q.get('shape') === '1') {
      const transactionId = (gift.payments ?? []).map((p) => p.bbps_transaction_id).find(Boolean);
      if (!transactionId) return json({ ok: true, gift_id: giftId, has_transaction: false });
      const res = await bbFetch(env, `/payments/v1/transactions/${encodeURIComponent(transactionId)}`);
      const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
      const filled = (o: unknown) =>
        o && typeof o === 'object' ? Object.entries(o as Record<string, unknown>).filter(([, v]) => v !== null && v !== '').map(([k]) => k) : [];
      return json({
        ok: true,
        gift_id: giftId,
        status: res.status,
        keys: body ? Object.keys(body) : [],
        billing_info_filled: filled(body?.billing_info),
        payment_method: body?.payment_method ?? body?.transaction_type ?? null,
      });
    }
    const billing = await giftBillingAddress(env, giftId);
    if (!billing) {
      return json({ ok: true, gift_id: giftId, constituent_id: constituentId, has_transaction: hasTransaction, billing: null });
    }
    const outcome = await saveBillingAddress(env, constituentId, billing, q.get('apply') !== '1');
    return json({
      ok: true,
      gift_id: giftId,
      constituent_id: constituentId,
      has_transaction: hasTransaction,
      billing: {
        has_street: Boolean(billing.address_lines),
        city: billing.city,
        state: billing.state,
        postal_code: billing.postal_code,
        country: billing.country,
      },
      applied: q.get('apply') === '1',
      outcome,
    });
  } catch (err) {
    return handleError(err);
  }
};

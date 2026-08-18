// GET /api/blackbaud/recurring-test?key=<BLACKBAUD_SETUP_KEY>
//
// Diagnostic for RecurringGift create / amount PATCH. Nothing is charged:
// charge_transaction is never set. Default post_status is DoNotPost.
//
// &prove_amount=1&gift_id=<id>  PATCH an existing RecurringGift on Will's
//   test constituent (27202) from its current amount to +1, GET readback,
//   then PATCH back. Same SKY payload the partner portal uses for amount
//   changes. Does not touch other constituents.
// &cleanup=1  DELETE leftover $1 RecurringGifts on 27202 whose reference
//   marks them as DIAGNOSTIC (the keep=1 leftovers from 2026-08-17/18).
// &probe_amount_api=1  Hit Gift v1 and Gift v2 amount/amendment routes with
//   a fake id (or &gift_id=) and return each status + body. Read-only except
//   the PATCHes, which SKY will reject on a missing gift. Does not touch
//   Jennifer or any other real donor.

import { bbFetch, bbJson, deleteGiftQuietly, etGiftDate, nextMonthIso, BlackbaudError, type Env } from '../_lib/blackbaud';
import { json, requireSetupKey } from '../_lib/http';

async function skyHit(env: Env, method: string, path: string, body?: unknown) {
  const res = await bbFetch(env, path, {
    method,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let parsed: unknown = text.slice(0, 500);
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text.slice(0, 500);
  }
  return { method, path, status: res.status, body: parsed };
}

const TEST_CONSTITUENT = '27202';

type GiftDetail = {
  id: string;
  type?: string;
  constituent_id?: string;
  amount?: { value?: number };
  reference?: string;
  gift_splits?: Array<{ id?: string; fund_id?: string; amount?: { value?: number } }>;
};

async function patchAmount(env: Env, gift: GiftDetail, amount: number): Promise<void> {
  const split = gift.gift_splits?.[0];
  const fundId = split?.fund_id ?? '79';
  const splitBody: Record<string, unknown> = { fund_id: fundId, amount: { value: amount } };
  if (split?.id) splitBody.id = split.id;
  await bbJson(env, `/gift/v1/gifts/${encodeURIComponent(gift.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      amount: { value: amount },
      gift_splits: [splitBody],
    }),
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    const url = new URL(request.url);
    const constituentId = url.searchParams.get('constituent_id') ?? TEST_CONSTITUENT;
    if (constituentId !== TEST_CONSTITUENT) {
      return json({ ok: false, code: 'wrong_constituent', message: 'This diagnostic only runs against the test constituent.' }, 400);
    }

    if (url.searchParams.get('probe_amount_api') === '1') {
      const id = (url.searchParams.get('gift_id') ?? '99999999').trim();
      const amountBody = { amount: { value: 2 } };
      const splitBody = {
        amount: { value: 2 },
        gift_splits: [{ fund_id: '79', amount: { value: 2 } }],
      };
      const hits = [];
      const listed = await bbJson<{ value?: GiftDetail[] }>(
        env,
        `/gift/v1/gifts?constituent_id=${TEST_CONSTITUENT}&limit=25`
      );
      const recurringOnTest = (listed.value ?? [])
        .filter((g) => g.type === 'RecurringGift')
        .map((g) => ({ id: g.id, amount: g.amount?.value }));
      hits.push(await skyHit(env, 'GET', `/gift/v1/gifts/${id}`));
      hits.push(await skyHit(env, 'PATCH', `/gift/v1/gifts/${id}`, amountBody));
      hits.push(await skyHit(env, 'PATCH', `/gift/v1/gifts/${id}`, splitBody));
      hits.push(await skyHit(env, 'PATCH', `/gift/v1/gifts/${id}`, { receipt_amount: { value: 2 } }));
      hits.push(await skyHit(env, 'GET', `/gift/v1/recurringgifts/${id}`));
      hits.push(await skyHit(env, 'PUT', `/gift/v1/recurringgifts/${id}`, amountBody));
      hits.push(await skyHit(env, 'PATCH', `/gift/v1/recurringgifts/${id}`, amountBody));
      hits.push(await skyHit(env, 'POST', `/gift/v1/recurringgifts/${id}/amendments`, amountBody));
      hits.push(await skyHit(env, 'GET', `/gift/v1/recurringgifts/${id}/amendments`));
      hits.push(await skyHit(env, 'GET', `/gift/v1/gifts/${id}/amendments`));
      hits.push(await skyHit(env, 'GET', `/gft-gifts/v2/gifts/${id}`));
      hits.push(await skyHit(env, 'PATCH', `/gft-gifts/v2/gifts/${id}`, amountBody));
      hits.push(await skyHit(env, 'GET', `/gft-gifts/v2/recurringgifts/${id}`));
      hits.push(await skyHit(env, 'PATCH', `/gft-gifts/v2/recurringgifts/${id}`, amountBody));
      hits.push(await skyHit(env, 'GET', `/gft-gifts/v2/recurringgifts/${id}/amendments`));
      hits.push(await skyHit(env, 'POST', `/gft-gifts/v2/recurringgifts/${id}/amendments`, amountBody));
      hits.push(await skyHit(env, 'PATCH', `/gft-gifts/v2/recurringgifts/${id}/amendments/amount`, amountBody));
      hits.push(await skyHit(env, 'PATCH', `/gft-gifts/v2/recurringgifts/${id}/amendments/giftamount`, amountBody));
      hits.push(await skyHit(env, 'PATCH', `/gft-gifts/v2/recurringgifts/${id}/amendments/schedule`, amountBody));
      hits.push(await skyHit(env, 'PATCH', `/gft-gifts/v2/recurringgifts/${id}/amendments/paymentinformation`, amountBody));
      return json({ ok: true, probe: true, gift_id: id, recurring_on_test_constituent: recurringOnTest, hits });
    }

    if (url.searchParams.get('cleanup') === '1') {
      const listed = await bbJson<{ value?: GiftDetail[] }>(
        env,
        `/gift/v1/gifts?constituent_id=${TEST_CONSTITUENT}&limit=25`
      );
      const deleted: string[] = [];
      for (const row of listed.value ?? []) {
        if (row.type !== 'RecurringGift') continue;
        const detail = await bbJson<GiftDetail>(env, `/gift/v1/gifts/${encodeURIComponent(row.id)}`);
        const ref = (detail.reference ?? '').toUpperCase();
        if (detail.amount?.value === 1 && ref.includes('DIAGNOSTIC')) {
          await deleteGiftQuietly(env, detail.id);
          deleted.push(detail.id);
        }
      }
      return json({ ok: true, cleanup: true, deleted });
    }

    const existingId = (url.searchParams.get('gift_id') ?? '').trim();
    if (url.searchParams.get('inspect') === '1' && existingId) {
      const gift = await bbJson<GiftDetail>(env, `/gift/v1/gifts/${encodeURIComponent(existingId)}`);
      if (String(gift.constituent_id) !== TEST_CONSTITUENT) {
        return json({ ok: false, code: 'wrong_constituent', message: 'Gift is not on the test constituent.' }, 400);
      }
      return json({
        ok: true,
        id: gift.id,
        type: gift.type,
        amount: gift.amount?.value,
        reference: gift.reference ?? null,
        splits: gift.gift_splits ?? [],
      });
    }

    if (url.searchParams.get('prove_amount') === '1' && existingId) {
      const gift = await bbJson<GiftDetail>(env, `/gift/v1/gifts/${encodeURIComponent(existingId)}`);
      if (String(gift.constituent_id) !== TEST_CONSTITUENT) {
        return json({ ok: false, code: 'wrong_constituent', message: 'Gift is not on the test constituent.' }, 400);
      }
      if (gift.type !== 'RecurringGift') {
        return json({ ok: false, code: 'not_recurring', message: 'Only RecurringGift records can prove amount PATCH.' }, 400);
      }
      const original = gift.amount?.value ?? 1;
      const patched = Math.round((original + 1) * 100) / 100;
      await patchAmount(env, gift, patched);
      let after: GiftDetail;
      try {
        after = await bbJson<GiftDetail>(env, `/gift/v1/gifts/${encodeURIComponent(gift.id)}`);
      } finally {
        await patchAmount(env, gift, original);
      }
      const restored = await bbJson<GiftDetail>(env, `/gift/v1/gifts/${encodeURIComponent(gift.id)}`);
      return json({
        ok: true,
        gift_id: gift.id,
        amount_proof: {
          original,
          patched,
          readback: after.amount?.value,
          patch_ok: after.amount?.value === patched,
          restored: restored.amount?.value,
          restored_ok: restored.amount?.value === original,
        },
      });
    }

    const variant = url.searchParams.get('variant') ?? 'none';
    const payments =
      variant === 'bare' ? [{ payment_method: 'CreditCard' }]
      : variant === 'token' ? [{ payment_method: 'CreditCard', account_token: crypto.randomUUID(), bbps_configuration_id: url.searchParams.get('config') ?? undefined }]
      : variant === 'checkout' ? [{ payment_method: 'CreditCard', checkout_transaction_id: crypto.randomUUID() }]
      : undefined;
    const payload: Record<string, unknown> = {
      type: 'RecurringGift',
      constituent_id: constituentId,
      amount: { value: 1 },
      date: etGiftDate(),
      gift_status: 'Active',
      post_status: url.searchParams.get('post') ?? 'DoNotPost',
      is_anonymous: false,
      gift_splits: [{ fund_id: '79', amount: { value: 1 }, appeal_id: '2353', campaign_id: '223' }],
      reference: 'DIAGNOSTIC recurring test (auto-deleted)',
      recurring_gift_schedule: { frequency: 'MONTHLY', start_date: nextMonthIso() },
    };
    if (payments) payload.payments = payments;
    let createdId: string | undefined;
    try {
      const created = await bbJson<{ id: string }>(env, '/gift/v1/gifts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      createdId = created.id;
      if (url.searchParams.get('keep') !== '1') await deleteGiftQuietly(env, created.id);
      return json({
        ok: true,
        created_id: created.id,
        deleted: url.searchParams.get('keep') !== '1',
      });
    } catch (err) {
      if (createdId && url.searchParams.get('keep') !== '1') {
        await deleteGiftQuietly(env, createdId);
      }
      if (err instanceof BlackbaudError) {
        return json({ ok: false, sky_status: err.status, code: err.code, message: err.message, detail: err.detail ?? null });
      }
      throw err;
    }
  } catch (err) {
    if (err instanceof BlackbaudError) {
      return json({ ok: false, sky_status: err.status, code: err.code, message: err.message, detail: err.detail ?? null });
    }
    return json({
      ok: false,
      code: 'internal',
      message: err instanceof Error ? err.message : String(err),
    }, 500);
  }
};

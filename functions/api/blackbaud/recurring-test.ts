// GET /api/blackbaud/recurring-test?key=<BLACKBAUD_SETUP_KEY>
//
// Diagnostic for the monthly-giving outage (2026-08-17): executes exactly the
// RecurringGift creation that donate-recurring performs in step 2 (no
// payments array, so nothing is charged and no card is involved), against a
// known constituent, and returns SKY's verbatim response. The created record
// is deleted immediately. Pass &keep=1 to leave it for inspection in RE NXT.

import { bbJson, deleteGiftQuietly, etGiftDate, nextMonthIso, BlackbaudError, type Env } from '../_lib/blackbaud';
import { handleError, json, requireSetupKey } from '../_lib/http';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    const url = new URL(request.url);
    const constituentId = url.searchParams.get('constituent_id') ?? '27202'; // Will's record
    // Variants probe what SKY's new "payments field is required" validation
    // accepts. None can charge anything: charge_transaction is never set and
    // the tokens are fabricated UUIDs.
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
      post_status: 'NotPosted',
      is_anonymous: false,
      gift_splits: [{ fund_id: '79', amount: { value: 1 }, appeal_id: '2353', campaign_id: '223' }],
      reference: 'DIAGNOSTIC recurring test (auto-deleted)',
      recurring_gift_schedule: { frequency: 'MONTHLY', start_date: nextMonthIso() },
    };
    if (payments) payload.payments = payments;
    try {
      const created = await bbJson<{ id: string }>(env, '/gift/v1/gifts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (url.searchParams.get('keep') !== '1') await deleteGiftQuietly(env, created.id);
      return json({ ok: true, created_id: created.id, deleted: url.searchParams.get('keep') !== '1' });
    } catch (err) {
      if (err instanceof BlackbaudError) {
        return json({ ok: false, sky_status: err.status, code: err.code, message: err.message, detail: err.detail ?? null });
      }
      throw err;
    }
  } catch (err) {
    return handleError(err);
  }
};

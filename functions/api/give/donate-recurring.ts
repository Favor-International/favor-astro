// POST /api/give/donate-recurring
//
// Monthly Favor Partner gift. The browser opened Blackbaud Checkout with a
// fresh card_token, so Checkout charged the first installment AND vaulted
// the card under that token (wallets are disabled for monthly gifts because
// they do not tokenize). This endpoint then:
//   1. finds or creates the constituent
//   2. creates the RecurringGift with a MONTHLY schedule starting next month
//   3. records + charges the first installment as a RecurringGiftPayment
//      (checkout_transaction_id + charge_transaction: true)
//   4. converts the recurring gift to automatic so Blackbaud charges the
//      vaulted card on schedule from next month on
//
// If step 3 fails the recurring gift shell is deleted (best effort) and the
// donor sees a clean retryable error. If step 4 fails the money and records
// are still correct; the response carries a warning so the team can convert
// manually in RE NXT.
//
// Body: same as /api/give/donate plus card_token (uuid the browser generated
// and passed to Blackbaud Checkout).

import {
  buildReference,
  cardTokenVaulted,
  convertRecurringGiftToAutomatic,
  createGift,
  deleteGiftQuietly,
  findOrCreateConstituent,
  getDesignations,
  getPaymentConfig,
  nextMonthIso,
  BlackbaudError,
  type Env,
} from '../_lib/blackbaud';
import {
  asAmount,
  asEmail,
  asTrimmed,
  asUuid,
  errorJson,
  handleError,
  idempotencyHit,
  idempotencyStore,
  json,
  readJsonBody,
} from '../_lib/http';
import { verifyTurnstile } from '../_lib/turnstile';
import { notifyPortalGiftCompleted } from '../_lib/portal';
import { computeTotal } from './donate';

interface RecurringBody {
  idempotency_key?: string;
  amount?: unknown;
  designation_fund_id?: unknown;
  donor?: { first?: unknown; last?: unknown; email?: unknown; phone?: unknown };
  anonymous?: unknown;
  note?: unknown;
  org_name?: unknown;
  cover_fees?: unknown;
  email_optin?: unknown;
  sms_optin?: unknown;
  checkout?: { transaction_token?: unknown };
  card_token?: unknown;
  turnstile_token?: unknown;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await readJsonBody<RecurringBody>(request);

    const idem = asUuid(body.idempotency_key, 'idempotency_key');
    const replay = await idempotencyHit(env, idem);
    if (replay) return replay;

    await verifyTurnstile(env, body.turnstile_token, request.headers.get('CF-Connecting-IP'));

    const amount = asAmount(body.amount);
    const coverFees = body.cover_fees === true;
    const total = computeTotal(env, amount, coverFees);

    const fundId = asTrimmed(body.designation_fund_id, 'designation', 64);
    const designation = getDesignations(env).find((d) => d.fund_id === fundId);
    if (!designation) return errorJson('bad_designation', 'Unknown designation', 400);

    const donor = {
      first: asTrimmed(body.donor?.first, 'first name', 50),
      last: asTrimmed(body.donor?.last, 'last name', 100),
      email: asEmail(body.donor?.email),
      phone: asTrimmed(body.donor?.phone, 'phone', 25, false) || undefined,
      org_name: asTrimmed(body.org_name, 'organization name', 120, false) || undefined,
    };
    const note = asTrimmed(body.note, 'note', 400, false);
    const checkoutToken = asUuid(body.checkout?.transaction_token, 'checkout.transaction_token');
    const cardToken = asUuid(body.card_token, 'card_token');

    const payConfig = await getPaymentConfig(env);
    const constituentId = await findOrCreateConstituent(env, donor);

    const reference = buildReference([
      'Monthly Favor Partner gift via favorintl.org',
      `Designation: ${designation.label}`,
      donor.org_name && `Organization gift; contact: ${donor.first} ${donor.last}`,
      coverFees && 'Donor covered processing fees',
      body.email_optin === true && 'Opted in: email updates',
      body.sms_optin === true && 'Opted in: text updates',
      note && `Donor note: ${note}`,
    ]);

    // Website appeal on the split (Daniel, 2026-08-05), same as one-time gifts.
    const appealId = (env.GIVE_APPEAL_RECORD_ID ?? '').trim();
    const split: Record<string, unknown> = { fund_id: designation.fund_id, amount: { value: total } };
    if (appealId) split.appeal_id = appealId;

    const baseGift = {
      constituent_id: constituentId,
      date: new Date().toISOString(),
      gift_status: 'Active',
      post_status: 'NotPosted',
      is_anonymous: body.anonymous === true,
      gift_splits: [split],
      reference,
    };

    // 2. Recurring gift with schedule. payments[] carries the vaulted card
    // token; some environments reject payments on RecurringGift creation, so
    // retry once without it (converttoautomatic supplies the token anyway).
    let recurring: { id: string };
    const recurringPayload: Record<string, unknown> = {
      ...baseGift,
      type: 'RecurringGift',
      amount: { value: total },
      recurring_gift_schedule: { frequency: 'MONTHLY', start_date: nextMonthIso() },
      payments: [
        {
          payment_method: 'CreditCard',
          account_token: cardToken,
          bbps_configuration_id: payConfig.id,
        },
      ],
    };
    try {
      recurring = await createGift(env, recurringPayload);
    } catch (err) {
      if (err instanceof BlackbaudError && err.status === 400) {
        delete recurringPayload.payments;
        recurring = await createGift(env, recurringPayload);
      } else {
        throw err;
      }
    }

    // 3. First installment: charge the checkout authorization and link it.
    let payment: { id: string };
    try {
      payment = await createGift(env, {
        ...baseGift,
        type: 'RecurringGiftPayment',
        amount: { value: total },
        linked_gifts: [recurring.id],
        payments: [
          {
            payment_method: 'CreditCard',
            checkout_transaction_id: checkoutToken,
            charge_transaction: true,
          },
        ],
      });
    } catch (err) {
      await deleteGiftQuietly(env, recurring.id);
      throw err;
    }

    // 4. Automate future installments against the vaulted card.
    let automated = false;
    let warning: string | undefined;
    const vaulted = await cardTokenVaulted(env, cardToken);
    if (vaulted) {
      const conv = await convertRecurringGiftToAutomatic(env, recurring.id, payConfig.id, cardToken);
      automated = conv.automated;
      if (!conv.automated) {
        warning = `Recurring gift ${recurring.id} was created and the first month was charged, but automatic processing could not be enabled (${conv.detail ?? 'unknown'}). Enable it manually in RE NXT.`;
      }
    } else {
      warning = `Recurring gift ${recurring.id} was created and the first month was charged, but the card was not vaulted (likely a digital wallet). Set up automatic processing manually in RE NXT.`;
    }
    if (warning) console.error('[give/recurring] ' + warning);

    const portalLoginUrl = await notifyPortalGiftCompleted(env, {
      email: donor.email,
      first: donor.first,
      last: donor.last,
      phone: donor.phone,
      amount: total,
      frequency: 'monthly',
      designation: designation.label,
      constituent_id: constituentId,
    });

    const result = {
      ok: true,
      gift_id: recurring.id,
      payment_gift_id: payment.id,
      amount: total,
      frequency: 'monthly' as const,
      designation: designation.label,
      automated,
      warning,
      portal_login_url: portalLoginUrl ?? undefined,
    };
    await idempotencyStore(env, idem, result);
    return json(result);
  } catch (err) {
    return handleError(err);
  }
};

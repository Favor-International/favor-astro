// POST /api/give/donate
//
// One-time gift. The browser has already collected the card in Blackbaud
// Checkout and holds an authorization token; this endpoint charges it and
// records the gift in Raiser's Edge NXT in a single Gift API call
// (payments[].checkout_transaction_id + charge_transaction: true), so the
// charge and the record cannot drift apart.
//
// Body:
// {
//   idempotency_key: uuid, amount: 100, designation_fund_id: "123",
//   donor: { first, last, email, phone? },
//   anonymous?: bool, note?: string, cover_fees?: bool,
//   checkout: { transaction_token: uuid },
//   turnstile_token?: string
// }

import {
  buildReference,
  createGift,
  findOrCreateConstituent,
  getDesignations,
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

interface DonateBody {
  idempotency_key?: string;
  amount?: unknown;
  designation_fund_id?: unknown;
  donor?: { first?: unknown; last?: unknown; email?: unknown; phone?: unknown };
  anonymous?: unknown;
  note?: unknown;
  cover_fees?: unknown;
  fee_amount?: unknown;
  email_optin?: unknown;
  sms_optin?: unknown;
  checkout?: { transaction_token?: unknown };
  turnstile_token?: unknown;
}

export function computeTotal(env: Env, amount: number, coverFees: boolean): number {
  if (!coverFees) return amount;
  const rate = Number(env.GIVE_FEE_RATE ?? '0.029');
  const fixed = Number(env.GIVE_FEE_FIXED ?? '0.30');
  return Math.round((amount + amount * rate + fixed) * 100) / 100;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await readJsonBody<DonateBody>(request);

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
    };
    const note = asTrimmed(body.note, 'note', 400, false);
    const checkoutToken = asUuid(body.checkout?.transaction_token, 'checkout.transaction_token');

    const constituentId = await findOrCreateConstituent(env, donor);

    const gift = await createGift(env, {
      type: 'Donation',
      constituent_id: constituentId,
      amount: { value: total },
      date: new Date().toISOString(),
      gift_status: 'Active',
      post_status: 'NotPosted',
      is_anonymous: body.anonymous === true,
      gift_splits: [{ fund_id: designation.fund_id, amount: { value: total } }],
      payments: [
        {
          payment_method: 'CreditCard',
          checkout_transaction_id: checkoutToken,
          charge_transaction: true,
        },
      ],
      reference: buildReference([
        'Online gift via favorintl.org',
        `Designation: ${designation.label}`,
        coverFees && 'Donor covered processing fees',
        body.email_optin === true && 'Opted in: email updates',
        body.sms_optin === true && 'Opted in: text updates',
        note && `Donor note: ${note}`,
      ]),
    });

    // Portal account + welcome email + one-time dashboard login for the
    // thank-you page. Best effort; never blocks or fails the gift.
    const portalLoginUrl = await notifyPortalGiftCompleted(env, {
      email: donor.email,
      first: donor.first,
      last: donor.last,
      phone: donor.phone,
      amount: total,
      frequency: 'once',
      designation: designation.label,
      constituent_id: constituentId,
    });

    const result = {
      ok: true,
      gift_id: gift.id,
      amount: total,
      frequency: 'once' as const,
      designation: designation.label,
      portal_login_url: portalLoginUrl ?? undefined,
    };
    await idempotencyStore(env, idem, result);
    return json(result);
  } catch (err) {
    return handleError(err);
  }
};

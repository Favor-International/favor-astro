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
// If Blackbaud refuses step 3 the recurring gift shell is deleted (best
// effort) and the donor sees a clean retryable error. If step 3 gets no clear
// answer the shell stays, the key is marked unconfirmed, and the donor is
// asked to email instead of paying again. If step 4 fails the money and records
// are still correct; the response carries a warning so the team can convert
// manually in RE NXT.
//
// Body: same as /api/give/donate plus card_token (uuid the browser generated
// and passed to Blackbaud Checkout).

import {
  buildReference,
  etGiftDate,
  cardTokenVaulted,
  convertRecurringGiftToAutomatic,
  createGiftWithCredit,
  deleteGiftQuietly,
  ensureConstituentCode,
  ensureOrgContact,
  findOrCreateConstituent,
  resolveDesignation,
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
  chargeRefused,
  chargeUnconfirmed,
  errorJson,
  giftError,
  idempotencyCharging,
  idempotencyCheck,
  idempotencyClaim,
  idempotencyRelease,
  idempotencyStore,
  idempotencyUnconfirmed,
  json,
  readJsonBody,
  recordGiveError,
} from '../_lib/http';
import { verifyTurnstile } from '../_lib/turnstile';
import { notifyPortalGiftCompleted } from '../_lib/portal';
import { notifyStaffGift } from '../_lib/gift-notify';
import { pushGiftRealtime, type DataApiEnv } from '../_lib/dataapi';
import { campaignLabel, isCampaignSource, resolveCampaignCodes } from '../_lib/campaign';
import { computeTotal, typedAddress, type DonorAddressBody } from './donate';
import { ensureAddressFromForm } from '../_lib/form-address';

interface RecurringBody {
  idempotency_key?: string;
  amount?: unknown;
  designation_fund_id?: unknown;
  donor?: { first?: unknown; last?: unknown; email?: unknown; phone?: unknown } & DonorAddressBody;
  anonymous?: unknown;
  note?: unknown;
  org_name?: unknown;
  cover_fees?: unknown;
  email_optin?: unknown;
  sms_optin?: unknown;
  checkout?: { transaction_token?: unknown };
  card_token?: unknown;
  turnstile_token?: unknown;
  campaign_source?: unknown;
}

interface MonthlyResult {
  ok: true;
  gift_id: string;
  payment_gift_id: string;
  amount: number;
  frequency: 'monthly';
  designation: string;
  automated: boolean;
  warning: string | undefined;
  portal_login_url: string | undefined;
}

export const onRequestPost: PagesFunction<Env & DataApiEnv> = async ({ request, env, waitUntil }) => {
  // How far this request got, so a failure is answered with what the form may
  // safely do next (see GiftRetry in _lib/http.ts).
  let stage: 'checks' | 'claimed' | 'charging' = 'checks';
  let idem = '';
  let checkoutToken = '';
  let scheduleId: string | null = null;
  let charged: MonthlyResult | null = null;
  try {
    const body = await readJsonBody<RecurringBody>(request);

    idem = asUuid(body.idempotency_key, 'idempotency_key');
    checkoutToken = asUuid(body.checkout?.transaction_token, 'checkout.transaction_token');
    const earlier = await idempotencyCheck(env, idem, checkoutToken);
    if (earlier) return earlier;

    await verifyTurnstile(env, body.turnstile_token, request.headers.get('CF-Connecting-IP'));

    const amount = asAmount(body.amount);
    const coverFees = body.cover_fees === true;
    const total = computeTotal(env, amount, coverFees);

    const fundId = asTrimmed(body.designation_fund_id, 'designation', 64);
    const designation = resolveDesignation(env, fundId);
    if (!designation) return errorJson('bad_designation', 'Unknown designation', 400);

    const donor = {
      first: asTrimmed(body.donor?.first, 'first name', 50),
      last: asTrimmed(body.donor?.last, 'last name', 100),
      email: asEmail(body.donor?.email),
      phone: asTrimmed(body.donor?.phone, 'phone', 25, false) || undefined,
      org_name: asTrimmed(body.org_name, 'organization name', 120, false) || undefined,
    };
    const note = asTrimmed(body.note, 'note', 400, false);
    const cardToken = asUuid(body.card_token, 'card_token');

    // From here a second request with this key waits instead of running.
    await idempotencyClaim(env, idem, checkoutToken);
    stage = 'claimed';

    const payConfig = await getPaymentConfig(env);
    const constituentId = await findOrCreateConstituent(env, donor);

    const campaignSource = isCampaignSource(body.campaign_source) ? body.campaign_source : undefined;
    const campaignCodes = campaignSource ? await resolveCampaignCodes(env, campaignSource) : null;
    const campaignRef = asTrimmed((body as { ref?: unknown }).ref, 'ref', 24, false) || undefined;

    const reference = buildReference([
      'Monthly Favor Partner gift via favorintl.org',
      campaignSource && `${campaignLabel(campaignSource)} (${campaignSource}${campaignCodes?.appeal_lookup ? `, appeal ${campaignCodes.appeal_lookup}` : ''}${campaignRef ? `, ref ${campaignRef}` : ''})`,
      `Designation: ${designation.label}`,
      donor.org_name && `Organization gift; contact: ${donor.first} ${donor.last}`,
      coverFees && 'Donor covered processing fees',
      body.email_optin === true && 'Opted in: email updates',
      body.sms_optin === true && 'Opted in: text updates',
      note && `Donor note: ${note}`,
    ]);

    // Website appeal on the split (Daniel, 2026-08-05), same as one-time gifts.
    // Campaign-surface gifts override with the campaign's appeal + campaign
    // codes (Daniel Casella, 2026-08-10); failure degrades to the Website
    // appeal and never blocks the gift.
    const appealId = (env.GIVE_APPEAL_RECORD_ID ?? '').trim();
    const split: Record<string, unknown> = { fund_id: designation.fund_id, amount: { value: total } };
    if (campaignCodes?.appeal_id) split.appeal_id = campaignCodes.appeal_id;
    else if (appealId) split.appeal_id = appealId;
    if (campaignCodes?.campaign_id) split.campaign_id = campaignCodes.campaign_id;

    const baseGift = {
      constituent_id: constituentId,
      date: etGiftDate(),
      gift_status: 'Active',
      post_status: 'NotPosted',
      is_anonymous: body.anonymous === true,
      gift_splits: [split],
      reference,
    };

    // 2. Recurring gift with schedule. Blackbaud tightened this endpoint's
    // validation in early August 2026 (found 2026-08-17 after twelve days of
    // silent monthly failures): the payments array with an account_token and
    // bbps_configuration_id is now REQUIRED (the old retry-without-payments
    // fallback can never succeed again and is gone), and the RecurringGift
    // record itself must carry post_status DoNotPost — schedules are not
    // GL-postable; only the charged RecurringGiftPayment below keeps
    // NotPosted. Verified against production via /api/blackbaud/recurring-test.
    const recurringPayload: Record<string, unknown> = {
      ...baseGift,
      post_status: 'DoNotPost',
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
    // Website-appeal gifts carry the assigned fundraisers' credit from creation
    // (see createGiftWithCredit); campaign and newsletter gifts carry none.
    const credit = !campaignCodes?.appeal_id;
    const recurring: { id: string } = await createGiftWithCredit(env, recurringPayload, credit);
    scheduleId = recurring.id;

    // 3. First installment: charge the checkout authorization and link it.
    // When Blackbaud refuses the charge, the catch below removes the schedule.
    // When no clear answer comes back the schedule stays, because the payment
    // may already be linked to it, and its id goes to the error log.
    stage = 'charging';
    await idempotencyCharging(env, idem);
    const payment: { id: string } = await createGiftWithCredit(env, {
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
    }, credit);
    charged = {
      ok: true,
      gift_id: recurring.id,
      payment_gift_id: payment.id,
      amount: total,
      frequency: 'monthly',
      designation: designation.label,
      automated: false,
      // Replaced below once the conversion runs; it stands if a later step fails.
      warning: `Recurring gift ${recurring.id} was created and the first month was charged, but the request stopped before automatic processing was confirmed. Check it in RE NXT.`,
      portal_login_url: undefined,
    };

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
    charged.automated = automated;
    charged.warning = warning;

    // Post-gift enrichment (Daniel, 2026-08-06): Partner code on the giver,
    // and for org gifts the contact person is created and linked to the org.
    waitUntil(ensureConstituentCode(env, constituentId, 'Partner'));
    if (donor.org_name) {
      waitUntil(ensureOrgContact(env, constituentId, donor));
    }
    // Same as a one-time gift: the typed ZIP becomes the record's state.
    waitUntil(ensureAddressFromForm(env, constituentId, typedAddress(body.donor)));
    waitUntil(
      notifyStaffGift(env, {
        amount: total,
        frequency: 'monthly',
        designation: designation.label,
        giftId: recurring.id,
        paymentGiftId: payment.id,
        giftDate: etGiftDate(),
        donor,
        anonymous: body.anonymous === true,
        note: note || undefined,
        campaignSource,
        campaignRef,
      }).catch((err) => console.error('[gift-notify]', err instanceof Error ? err.message : err))
    );

    // Instant portal visibility for both records: the schedule (drives the
    // portal's "active recurring" count) and the charged first installment
    // (drives the history and totals). Awaited so a thank-you login a few
    // seconds later can see the payment. Never fails the gift.
    const nowIso = etGiftDate();
    const donorLookup = {
      email: donor.email,
      first: donor.first,
      last: donor.last,
      org_name: donor.org_name,
    };
    await Promise.all([
      pushGiftRealtime(env, {
        id: recurring.id,
        constituent_id: constituentId,
        amount: total,
        date: nowIso,
        type: 'RecurringGift',
        gift_splits: [{ ...split, id: recurring.id }],
        payment_method: 'CreditCard',
        raw_json: {
          is_anonymous: body.anonymous === true,
          recurring_gift_schedule: { frequency: 'MONTHLY' },
          source: 'realtime-web',
        },
        ...donorLookup,
      }),
      pushGiftRealtime(env, {
        id: payment.id,
        constituent_id: constituentId,
        amount: total,
        date: nowIso,
        type: 'RecurringGiftPayment',
        gift_splits: [{ ...split, id: payment.id }],
        payment_method: 'CreditCard',
        raw_json: { is_anonymous: body.anonymous === true, source: 'realtime-web' },
        ...donorLookup,
      }),
    ]);

    const portalLoginUrl = await notifyPortalGiftCompleted(env, {
      email: donor.email,
      first: donor.first,
      last: donor.last,
      phone: donor.phone,
      amount: total,
      frequency: 'monthly',
      designation: designation.label,
      constituent_id: constituentId,
      gift_id: recurring.id,
      payment_gift_id: payment.id,
      gift_date: nowIso,
    });

    charged.portal_login_url = portalLoginUrl ?? undefined;
    await idempotencyStore(env, idem, charged);
    return json(charged);
  } catch (err) {
    await recordGiveError(env, 'donate-recurring', err);
    if (charged) {
      // The first month is charged and both gifts are in Blackbaud. A later
      // step that fails never turns that into an error the giver would retry.
      console.error('[give/recurring] ' + charged.warning);
      await idempotencyStore(env, idem, charged);
      return json(charged);
    }
    if (stage === 'charging') {
      const retry = chargeRefused(err);
      if (!retry) {
        await recordGiveError(
          env,
          'donate-recurring',
          new Error(`First payment unconfirmed; recurring gift ${scheduleId} kept for the team to check`)
        );
        await idempotencyUnconfirmed(env, idem);
        return chargeUnconfirmed(502);
      }
      if (scheduleId) await deleteGiftQuietly(env, scheduleId);
      await idempotencyRelease(env, idem, checkoutToken);
      return giftError(err, retry);
    }
    if (stage === 'claimed') await idempotencyRelease(env, idem, checkoutToken);
    return giftError(err, 'same');
  }
};

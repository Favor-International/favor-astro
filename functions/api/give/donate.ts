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
  etGiftDate,
  ensureConstituentCode,
  ensureOrgContact,
  findOrCreateConstituent,
  resolveDesignation,
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
  recordGiveError,
} from '../_lib/http';
import { verifyTurnstile } from '../_lib/turnstile';
import { notifyPortalGiftCompleted } from '../_lib/portal';
import { pushGiftRealtime, type DataApiEnv } from '../_lib/dataapi';
import { campaignLabel, isCampaignSource, resolveCampaignCodes } from '../_lib/campaign';

interface DonateBody {
  idempotency_key?: string;
  amount?: unknown;
  designation_fund_id?: unknown;
  donor?: { first?: unknown; last?: unknown; email?: unknown; phone?: unknown };
  anonymous?: unknown;
  note?: unknown;
  org_name?: unknown;
  cover_fees?: unknown;
  fee_amount?: unknown;
  email_optin?: unknown;
  sms_optin?: unknown;
  checkout?: { transaction_token?: unknown };
  turnstile_token?: unknown;
  campaign_source?: unknown;
}

export function computeTotal(env: Env, amount: number, coverFees: boolean): number {
  if (!coverFees) return amount;
  const rate = Number(env.GIVE_FEE_RATE ?? '0.029');
  const fixed = Number(env.GIVE_FEE_FIXED ?? '0.30');
  return Math.round((amount + amount * rate + fixed) * 100) / 100;
}

export const onRequestPost: PagesFunction<Env & DataApiEnv> = async ({ request, env, waitUntil }) => {
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
    const checkoutToken = asUuid(body.checkout?.transaction_token, 'checkout.transaction_token');

    const constituentId = await findOrCreateConstituent(env, donor);

    // Every online gift carries the Website appeal on its split (Daniel,
    // 2026-08-05), so reporting can separate web giving from mail and events.
    // A gift arriving from a campaign surface overrides it with the campaign's
    // own appeal + campaign codes (Daniel Casella, 2026-08-10); resolution
    // failure degrades back to the Website appeal, never blocks the gift.
    const campaignSource = isCampaignSource(body.campaign_source) ? body.campaign_source : undefined;
    const campaignCodes = campaignSource ? await resolveCampaignCodes(env, campaignSource) : null;
    // ref = the per-email link token (EM2-K4TD style); recorded on the gift
    // reference so revenue can be attributed to a specific send (2026-08-17).
    const campaignRef = asTrimmed((body as { ref?: unknown }).ref, 'ref', 24, false) || undefined;
    const appealId = (env.GIVE_APPEAL_RECORD_ID ?? '').trim();
    const split: Record<string, unknown> = { fund_id: designation.fund_id, amount: { value: total } };
    if (campaignCodes?.appeal_id) split.appeal_id = campaignCodes.appeal_id;
    else if (appealId) split.appeal_id = appealId;
    if (campaignCodes?.campaign_id) split.campaign_id = campaignCodes.campaign_id;

    const gift = await createGift(env, {
      type: 'Donation',
      constituent_id: constituentId,
      amount: { value: total },
      date: etGiftDate(),
      gift_status: 'Active',
      post_status: 'NotPosted',
      is_anonymous: body.anonymous === true,
      gift_splits: [split],
      payments: [
        {
          payment_method: 'CreditCard',
          checkout_transaction_id: checkoutToken,
          charge_transaction: true,
        },
      ],
      reference: buildReference([
        'Online gift via favorintl.org',
        campaignSource && `${campaignLabel(campaignSource)} (${campaignSource}${campaignCodes?.appeal_lookup ? `, appeal ${campaignCodes.appeal_lookup}` : ''}${campaignRef ? `, ref ${campaignRef}` : ''})`,
        `Designation: ${designation.label}`,
        donor.org_name && `Organization gift; contact: ${donor.first} ${donor.last}`,
        coverFees && 'Donor covered processing fees',
        body.email_optin === true && 'Opted in: email updates',
        body.sms_optin === true && 'Opted in: text updates',
        note && `Donor note: ${note}`,
      ]),
    });

    // Post-gift enrichment (Daniel, 2026-08-06), all after the response and
    // failure-isolated: web donors carry the "Partner" constituent code, and
    // an org gift gets its contact person created and linked to the org so
    // the form's "with you as the contact" promise is true in RE NXT.
    waitUntil(ensureConstituentCode(env, constituentId, 'Partner'));
    if (donor.org_name) {
      waitUntil(ensureOrgContact(env, constituentId, donor));
    }

    // Instant portal visibility: write the gift (and the donor email) into
    // the sync database before the thank-you login, so the dashboard is not
    // empty if they open it immediately. Still never fails the gift.
    const giftDate = etGiftDate();
    await pushGiftRealtime(env, {
      id: gift.id,
      constituent_id: constituentId,
      amount: total,
      date: giftDate,
      type: 'Donation',
      gift_splits: [{ ...split, id: gift.id }],
      payment_method: 'CreditCard',
      raw_json: { is_anonymous: body.anonymous === true, source: 'realtime-web' },
      email: donor.email,
      first: donor.first,
      last: donor.last,
      org_name: donor.org_name,
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
      gift_id: gift.id,
      gift_date: giftDate,
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
    await recordGiveError(env, 'donate', err);
    return handleError(err);
  }
};

// GET /api/blackbaud/credit-test?key=<BLACKBAUD_SETUP_KEY>&appeal_a=<id>&appeal_b=<id>&fundraiser_a=<id>&fundraiser_b=<id>
//
// Diagnostic: which parts of a gift can the Gift API set or change?
// Everything runs against Will's test constituent (27202) with $1 gifts that
// carry no payment charge and are removed before the route returns.
//
//   1. Create a Donation with an explicit fundraiser. Does the credit land?
//   2. On that gift: change the appeal through gift_splits alone, then with
//      amount alongside; change the fundraisers. Read back after each.
//   3. &defaults=1  Create a Donation with default_fundraiser_credits. The
//      test constituent is assigned to Partner Care, so both members should
//      appear on the gift.
//   4. &recurring=1  The same appeal and fundraiser edits on a new
//      RecurringGift (no charge; post_status DoNotPost).
//
// Nothing here touches any other constituent.

import { bbFetch, deleteGiftQuietly, etGiftDate, nextMonthIso, type Env } from '../_lib/blackbaud';
import { json, requireSetupKey } from '../_lib/http';

const TEST_CONSTITUENT = '27202';

interface Hit {
  step: string;
  status: number;
  body: unknown;
}

async function sky(env: Env, step: string, method: string, path: string, body?: unknown): Promise<Hit> {
  const res = await bbFetch(env, path, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const text = await res.text();
  let parsed: unknown = null;
  if (text.trim()) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text.slice(0, 600);
    }
  }
  return { step, status: res.status, body: parsed };
}

type Gift = {
  id?: string;
  amount?: { value?: number };
  gift_status?: string;
  fundraisers?: Array<{ constituent_id?: string; amount?: { value?: number } }>;
  gift_splits?: Array<{ id?: string; appeal_id?: string; fund_id?: string; amount?: { value?: number } }>;
};

function view(hit: Hit) {
  const g = (hit.body ?? {}) as Gift;
  return {
    step: hit.step,
    status: hit.status,
    appeal: g.gift_splits?.map((s) => s.appeal_id) ?? null,
    fundraisers: g.fundraisers?.map((f) => `${f.constituent_id}:${f.amount?.value}`) ?? null,
    amount: g.amount?.value ?? null,
    gift_status: g.gift_status ?? null,
  };
}

async function editTrials(env: Env, giftId: string, appealB: string, fundraiserB: string, out: unknown[]) {
  const read = async (step: string) => out.push(view(await sky(env, step, 'GET', `/gift/v1/gifts/${giftId}`)));
  const first = (await sky(env, 'read', 'GET', `/gift/v1/gifts/${giftId}`)).body as Gift;
  const split = first.gift_splits?.[0];
  const splitBody = { id: split?.id, fund_id: split?.fund_id ?? '79', appeal_id: appealB, amount: { value: 1 } };

  const a = await sky(env, 'patch splits only', 'PATCH', `/gift/v1/gifts/${giftId}`, { gift_splits: [splitBody] });
  out.push({ step: a.step, status: a.status, body: a.body });
  await read('after splits only');

  const b = await sky(env, 'patch amount + splits', 'PATCH', `/gift/v1/gifts/${giftId}`, { amount: { value: 1 }, gift_splits: [splitBody] });
  out.push({ step: b.step, status: b.status, body: b.body });
  await read('after amount + splits');

  const c = await sky(env, 'patch fundraisers', 'PATCH', `/gift/v1/gifts/${giftId}`, {
    fundraisers: [{ constituent_id: fundraiserB, amount: { value: 1 } }],
  });
  out.push({ step: c.step, status: c.status, body: c.body });
  await read('after fundraisers');

  const d = await sky(env, 'patch amount + splits + fundraisers', 'PATCH', `/gift/v1/gifts/${giftId}`, {
    amount: { value: 1 },
    gift_splits: [splitBody],
    fundraisers: [{ constituent_id: fundraiserB, amount: { value: 1 } }],
  });
  out.push({ step: d.step, status: d.status, body: d.body });
  await read('after amount + splits + fundraisers');
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const made: string[] = [];
  const out: unknown[] = [];
  let failure: string | null = null;
  try {
    requireSetupKey(env, request);
  } catch {
    return json({ ok: false, message: 'unauthorized' }, 401);
  }
  try {
    const q = new URL(request.url).searchParams;
    // &cleanup=1  Delete any test gift an earlier run left on the test constituent.
    if (q.get('cleanup') === '1') {
      const listed = await sky(env, 'list', 'GET', `/gift/v1/gifts?constituent_id=${TEST_CONSTITUENT}&limit=50&sort=-date_added`);
      const rows = ((listed.body as { value?: Array<{ id: string; reference?: string; amount?: { value?: number } }> } | null)?.value ?? []).filter(
        (g) => g.amount?.value === 1 && (g.reference ?? '').includes('DIAGNOSTIC credit test')
      );
      const removed: unknown[] = [];
      for (const g of rows) {
        await deleteGiftQuietly(env, g.id);
        const after = await sky(env, 'check', 'GET', `/gift/v1/gifts/${g.id}`);
        removed.push({ id: g.id, status: after.status, gift_status: (after.body as Gift | null)?.gift_status ?? null });
      }
      return json({ ok: true, cleanup: removed });
    }
    const appealA = (q.get('appeal_a') ?? '').trim();
    const appealB = (q.get('appeal_b') ?? '').trim();
    const fundraiserA = (q.get('fundraiser_a') ?? '').trim();
    const fundraiserB = (q.get('fundraiser_b') ?? '').trim();
    if (![appealA, appealB, fundraiserA, fundraiserB].every((v) => /^\d+$/.test(v))) {
      return json({ ok: false, message: 'appeal_a, appeal_b, fundraiser_a and fundraiser_b are required record ids' }, 400);
    }

    const base = {
      constituent_id: TEST_CONSTITUENT,
      amount: { value: 1 },
      date: etGiftDate(),
      gift_status: 'Active',
      post_status: 'DoNotPost',
      is_anonymous: false,
      gift_splits: [{ fund_id: '79', amount: { value: 1 }, appeal_id: appealA }],
      reference: 'DIAGNOSTIC credit test (auto-deleted)',
    };

    // 1 and 2: a Donation with an explicit fundraiser, then the edits. &skip_donation=1 leaves these out.
    const created = q.get('skip_donation') === '1' ? { step: 'skipped', status: 0, body: null } : await sky(env, 'create Donation with fundraisers', 'POST', '/gift/v1/gifts', {
      ...base,
      type: 'Donation',
      payments: [{ payment_method: 'Cash' }],
      fundraisers: [{ constituent_id: fundraiserA, amount: { value: 1 } }],
    });
    out.push({ step: created.step, status: created.status, body: created.body });
    const donationId = (created.body as { id?: string } | null)?.id;
    if (donationId) {
      made.push(donationId);
      out.push(view(await sky(env, 'Donation as created', 'GET', `/gift/v1/gifts/${donationId}`)));
      await editTrials(env, donationId, appealB, fundraiserB, out);
    }

    // 3: default fundraiser credit. The test constituent is assigned to Partner Care,
    // so a gift created with the default should carry both Partner Care members.
    if (q.get('defaults') === '1') {
      const def = await sky(env, 'create Donation with default_fundraiser_credits', 'POST', '/gift/v1/gifts', {
        ...base,
        type: 'Donation',
        payments: [{ payment_method: 'Cash' }],
        default_fundraiser_credits: true,
      });
      out.push({ step: def.step, status: def.status, body: def.body });
      const defId = (def.body as { id?: string } | null)?.id;
      if (defId) {
        made.push(defId);
        out.push(view(await sky(env, 'defaults as created', 'GET', `/gift/v1/gifts/${defId}`)));
      }
    }

    // 4: the same edits on a RecurringGift.
    if (q.get('recurring') === '1') {
      // Since August 2026 Blackbaud requires a payments entry with an account token on a
      // recurring gift. A random token is accepted and nothing is charged (the daily giving
      // check creates its test schedule the same way).
      const rec = await sky(env, 'create RecurringGift with default_fundraiser_credits', 'POST', '/gift/v1/gifts', {
        ...base,
        type: 'RecurringGift',
        payments: [{ payment_method: 'CreditCard', account_token: crypto.randomUUID(), bbps_configuration_id: q.get('config') ?? undefined }],
        recurring_gift_schedule: { frequency: 'MONTHLY', start_date: nextMonthIso() },
        default_fundraiser_credits: true,
      });
      out.push({ step: rec.step, status: rec.status, body: rec.body });
      const recId = (rec.body as { id?: string } | null)?.id;
      if (recId) {
        made.push(recId);
        out.push(view(await sky(env, 'RecurringGift as created', 'GET', `/gift/v1/gifts/${recId}`)));
        await editTrials(env, recId, appealB, fundraiserB, out);
      }
    }
  } catch (err) {
    failure = err instanceof Error ? err.message : String(err);
  }

  // Remove everything the trials made, whether or not they finished.
  const cleanup: unknown[] = [];
  for (const id of made) {
    await deleteGiftQuietly(env, id);
    const after = await sky(env, `gift ${id} after cleanup`, 'GET', `/gift/v1/gifts/${id}`);
    cleanup.push({ id, status: after.status, gift_status: (after.body as Gift | null)?.gift_status ?? null });
  }
  return json({ ok: failure === null, failure, results: out, cleanup });
};

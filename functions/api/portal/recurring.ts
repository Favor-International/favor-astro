// POST /api/portal/recurring
//
// Server-to-server recurring-gift management for the Favor Partner Portal.
// Body: { email, gift_id, action: "pause"|"resume"|"cancel" } or
//       { email, gift_id, amount: 123.45 }
//
// Ownership is enforced HERE, not trusted from the caller: the gift is
// fetched from the Gift API and its constituent_id must match the
// constituent found for the supplied email. Actions map to:
//   pause/resume/cancel -> PUT  /gift/v1/recurringgifts/{id}/status
//                          (Held / Active / Terminated)
//   amount              -> PATCH /gift/v1/gifts/{id} (amount + gift_splits)
//
// Auth: Authorization: Bearer <PORTAL_API_KEY> (same trust pair as
// giving-history).

import { bbFetch, bbJson, requireCredentials, BlackbaudError, type Env } from '../_lib/blackbaud';
import { errorJson, handleError, json, readJsonBody } from '../_lib/http';

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
}

export const onRequestPost: PagesFunction<Env & { PORTAL_API_KEY?: string }> = async ({ request, env }) => {
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

    // Ownership: the gift must belong to the constituent for this email.
    const [constituentId, gift] = await Promise.all([
      constituentIdForEmail(env, email),
      bbJson<GiftDetail>(env, `/gift/v1/gifts/${encodeURIComponent(giftId)}`),
    ]);
    if (!constituentId || gift.constituent_id !== constituentId) {
      return errorJson('not_owner', 'This gift does not belong to that donor', 403);
    }
    if (gift.type !== 'RecurringGift') {
      return errorJson('not_recurring', 'Only recurring gifts can be managed here', 400);
    }

    const action = typeof body.action === 'string' ? body.action : null;
    if (action === 'pause' || action === 'resume' || action === 'cancel') {
      const status = action === 'pause' ? 'Held' : action === 'resume' ? 'Active' : 'Terminated';
      await bbJson(env, `/gift/v1/recurringgifts/${encodeURIComponent(giftId)}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      return json({ ok: true, status });
    }

    const amountRaw = Number(body.amount);
    if (Number.isFinite(amountRaw)) {
      const amount = Math.round(amountRaw * 100) / 100;
      if (amount < 1 || amount > 250000) return errorJson('bad_amount', 'Amount must be between $1 and $250,000', 400);
      const fundId = gift.gift_splits?.[0]?.fund_id;
      if (!fundId) return errorJson('no_split', 'The gift has no fund split to update', 502);
      await bbJson(env, `/gift/v1/gifts/${encodeURIComponent(giftId)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          amount: { value: amount },
          gift_splits: [{ fund_id: fundId, amount: { value: amount } }],
        }),
      });
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

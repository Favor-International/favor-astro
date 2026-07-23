// POST /api/marketing/write — Blackbaud write-back for the marketing platform.
// Actions: gift_entry (manual cash/check gifts), constituent_create,
// constituent_update (name + primary email/phone/address upsert).
// Same guarded bearer as the rest of the marketing gateway.

import {
  bbFetch, bbJson, createGift, findOrCreateConstituent, requireCredentials, type Env,
} from '../_lib/blackbaud';
import { errorJson, handleError, json, readJsonBody } from '../_lib/http';
import { requireMarketingKey } from './_guard';

type Body =
  | { action: 'gift_entry'; constituent_id: string; amount: number; date?: string; fund_id: string; payment_method?: string; check_number?: string; reference?: string }
  | { action: 'constituent_create'; first: string; last: string; email?: string; phone?: string }
  | { action: 'constituent_update'; id: string; first?: string; last?: string; email?: string; phone?: string; address?: { address_lines?: string; city?: string; state?: string; postal_code?: string } };

async function upsertPrimary(env: Env, kind: 'emailaddresses' | 'phones', constituentId: string, value: string): Promise<void> {
  const field = kind === 'emailaddresses' ? 'address' : 'number';
  const list = await bbJson<{ value?: any[] }>(env, `/constituent/v1/constituents/${encodeURIComponent(constituentId)}/${kind}`).catch(() => ({ value: [] as any[] }));
  const primary = (list.value ?? []).find((x: any) => x.primary) ?? (list.value ?? [])[0];
  if (primary) {
    const res = await bbFetch(env, `/constituent/v1/${kind}/${encodeURIComponent(primary.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ [field]: value }),
    });
    if (!res.ok) throw new Error(`${kind} PATCH ${res.status}: ${await res.text()}`);
  } else {
    const res = await bbFetch(env, `/constituent/v1/${kind}`, {
      method: 'POST',
      body: JSON.stringify({ constituent_id: constituentId, [field]: value, type: kind === 'phones' ? 'Home' : 'Email', primary: true }),
    });
    if (!res.ok) throw new Error(`${kind} POST ${res.status}: ${await res.text()}`);
  }
}

export const onRequestPost: PagesFunction<Env & { MARKETING_API_KEY?: string }> = async ({ request, env }) => {
  try {
    const denied = requireMarketingKey(env, request);
    if (denied) return denied;
    requireCredentials(env);
    const body = await readJsonBody<Body>(request);

    if (body.action === 'gift_entry') {
      const amount = Number(body.amount);
      if (!(amount > 0 && amount <= 10_000_000)) return errorJson('bad_amount', 'amount out of range', 400);
      if (!/^\d+$/.test(String(body.constituent_id))) return errorJson('bad_constituent', 'numeric constituent_id required', 400);
      if (!body.fund_id) return errorJson('bad_fund', 'fund_id required', 400);
      const method = ['Cash', 'PersonalCheck', 'BusinessCheck', 'CreditCard', 'DirectDebit', 'Other'].includes(String(body.payment_method))
        ? String(body.payment_method) : 'Other';
      const payment: Record<string, unknown> = { payment_method: method };
      if (body.check_number && method.includes('Check')) payment.check_number = String(body.check_number).slice(0, 20);
      const gift = await createGift(env, {
        type: 'Donation',
        constituent_id: String(body.constituent_id),
        amount: { value: amount },
        date: body.date ? `${body.date}T12:00:00Z` : new Date().toISOString(),
        gift_status: 'Active',
        post_status: 'NotPosted',
        gift_splits: [{ fund_id: String(body.fund_id), amount: { value: amount } }],
        payments: [payment],
        reference: (body.reference ? `${body.reference} — ` : '') + 'Entered via Favor Marketing',
      });
      return json({ ok: true, gift_id: gift.id });
    }

    if (body.action === 'constituent_create') {
      if (!body.first?.trim() || !body.last?.trim()) return errorJson('bad_name', 'first and last required', 400);
      const id = await findOrCreateConstituent(env, {
        first: body.first.trim(), last: body.last.trim(),
        email: body.email?.trim().toLowerCase() ?? '', phone: body.phone?.trim(),
      } as any);
      return json({ ok: true, constituent_id: id });
    }

    if (body.action === 'constituent_update') {
      if (!/^\d+$/.test(String(body.id))) return errorJson('bad_id', 'numeric id required', 400);
      const e = encodeURIComponent(body.id);
      if (body.first || body.last) {
        const patch: Record<string, string> = {};
        if (body.first) patch.first = body.first;
        if (body.last) patch.last = body.last;
        const res = await bbFetch(env, `/constituent/v1/constituents/${e}`, { method: 'PATCH', body: JSON.stringify(patch) });
        if (!res.ok) throw new Error(`constituent PATCH ${res.status}: ${await res.text()}`);
      }
      if (body.email) await upsertPrimary(env, 'emailaddresses', body.id, body.email.trim().toLowerCase());
      if (body.phone) await upsertPrimary(env, 'phones', body.id, body.phone.trim());
      if (body.address && (body.address.address_lines || body.address.city)) {
        const res = await bbFetch(env, `/constituent/v1/addresses`, {
          method: 'POST',
          body: JSON.stringify({
            constituent_id: body.id, type: 'Home', preferred: true,
            address_lines: body.address.address_lines ?? '',
            city: body.address.city ?? '', state: body.address.state ?? '', postal_code: body.address.postal_code ?? '',
          }),
        });
        if (!res.ok) throw new Error(`address POST ${res.status}: ${await res.text()}`);
      }
      return json({ ok: true });
    }

    return errorJson('bad_action', 'unknown action', 400);
  } catch (err) {
    return handleError(err);
  }
};

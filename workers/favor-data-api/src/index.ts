// favor-data-api
//
// Private JSON API over re_nxt_data (Daniel's 12-hourly RE NXT sync).
//
//   GET  /health                      liveness, no auth
//   GET  /giving-history?email=       portal giving history, same response
//                                     shape as favor-astro's SKY-backed
//                                     endpoint so the portal needs no changes
//   POST /gifts/realtime              insert a just-completed gift so the
//                                     donor sees it before the next sync
//
// Realtime rows and the sync cannot duplicate: gifts.id is the Blackbaud
// gift id and the table's primary key. We INSERT OR IGNORE; Daniel's sync
// upserts the same id and overwrites our provisional row with the full
// version. (Daniel, 2026-08-05: "It upserts. Blind insert is no way to
// properly manage a data sync.")

export interface Env {
  DB: D1Database;
  DATA_API_KEY?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

function timingSafeEqualStr(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

interface GiftRow {
  id: string;
  gift_amount: number | null;
  gift_date: string | null;
  gift_type: string | null;
  gift_status: string | null;
  gift_splits: string | null;
  gift_payment_method: string | null;
  receipt_status: string | null;
  receipt_number: string | null;
  receipt_date: string | null;
  raw_json: string | null;
}

// The portal's gift shape, identical to the SKY-backed endpoint.
function shapeGift(g: GiftRow, funds: Map<string, string>) {
  let raw: Record<string, unknown> = {};
  try {
    raw = g.raw_json ? (JSON.parse(g.raw_json) as Record<string, unknown>) : {};
  } catch {
    /* provisional realtime rows may carry minimal raw_json */
  }
  let splits: Array<{ fund_id?: string }> = [];
  try {
    splits = g.gift_splits ? (JSON.parse(g.gift_splits) as Array<{ fund_id?: string }>) : [];
  } catch {
    /* ignore */
  }
  const schedule = raw.recurring_gift_schedule as { frequency?: string } | undefined;
  const receipted = (g.receipt_status ?? '').toLowerCase() === 'receipted';
  return {
    id: g.id,
    lookup_id: (raw.lookup_id as string) ?? null,
    date: g.gift_date ?? null,
    amount: g.gift_amount ?? 0,
    type: g.gift_type ?? 'Donation',
    status: g.gift_status ?? null,
    is_recurring: g.gift_type === 'RecurringGift',
    is_recurring_payment: g.gift_type === 'RecurringGiftPayment',
    frequency: schedule?.frequency ?? null,
    designation: splits.length ? funds.get(String(splits[0].fund_id ?? '')) ?? null : null,
    payment_method: g.gift_payment_method ?? null,
    receipted,
    receipt_number: receipted ? g.receipt_number ?? null : null,
    receipt_date: receipted ? g.receipt_date ?? null : null,
    anonymous: raw.is_anonymous === true,
  };
}

async function givingHistory(env: Env, email: string): Promise<Response> {
  // Constituent by email. Emails are their own table; prefer a primary,
  // non-inactive address on a living constituent.
  const who = await env.DB.prepare(
    `SELECT c.id, c.constituent_type, c.first_name, c.last_name, c.organization_name
       FROM emails e JOIN constituents c ON c.id = e.constituent_record_id
      WHERE lower(e.email_address) = ?1
        AND (c.deceased IS NULL OR c.deceased = 0)
      ORDER BY e.is_primary DESC, e.is_inactive ASC
      LIMIT 1`
  )
    .bind(email)
    .first<{ id: string; constituent_type: string | null; first_name: string | null; last_name: string | null; organization_name: string | null }>();

  if (!who) {
    return json({ ok: true, constituent: null, gifts: [], summary: { total_given: 0, gift_count: 0 } });
  }

  const [giftRows, fundRows] = await Promise.all([
    env.DB.prepare(
      `SELECT id, gift_amount, gift_date, gift_type, gift_status, gift_splits,
              gift_payment_method, receipt_status, receipt_number, receipt_date, raw_json
         FROM gifts WHERE constituent_record_id = ?1
        ORDER BY gift_date DESC LIMIT 500`
    )
      .bind(who.id)
      .all<GiftRow>(),
    env.DB.prepare(`SELECT id, fund_description, fund_id FROM funds`).all<{
      id: string;
      fund_description: string | null;
      fund_id: string | null;
    }>(),
  ]);

  const funds = new Map(
    (fundRows.results ?? []).map((f) => [String(f.id), f.fund_description ?? f.fund_id ?? String(f.id)])
  );
  const gifts = (giftRows.results ?? []).map((g) => shapeGift(g, funds));

  // RecurringGift rows are schedules, not money received.
  const counted = gifts.filter((g) => !g.is_recurring);
  const currentYear = new Date().getUTCFullYear();
  const years = [...new Set(counted.map((g) => (g.date ?? '').slice(0, 4)).filter((y) => /^\d{4}$/.test(y)))]
    .map(Number)
    .sort((a, b) => b - a);
  let consecutive = 0;
  for (let i = 0; i < years.length; i++) {
    if (years[i] === years[0] - i) consecutive++;
    else break;
  }
  const oldestFirst = [...counted].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
  const first = oldestFirst[0];

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const summary = {
    total_given: round2(counted.reduce((s, g) => s + g.amount, 0)),
    ytd_given: round2(
      counted.filter((g) => (g.date ?? '').startsWith(String(currentYear))).reduce((s, g) => s + g.amount, 0)
    ),
    gift_count: counted.length,
    active_recurring: gifts.filter((g) => g.is_recurring && (g.status ?? '') === 'Active').length,
    // The sync holds the donor's complete history (no 200-gift page cap), so
    // the lifetime total is the same sum, authoritative from D1.
    lifetime_total: round2(counted.reduce((s, g) => s + g.amount, 0)),
    consecutive_years_given: consecutive || null,
    total_years_given: years.length || null,
    first_gift_date: first?.date ?? null,
    first_gift_amount: first?.amount ?? null,
  };

  const name =
    who.organization_name ?? [who.first_name, who.last_name].filter(Boolean).join(' ') ?? null;
  return json({
    ok: true,
    constituent: { id: who.id, name: name || null, email },
    gifts,
    summary,
  });
}

interface RealtimeGift {
  id?: unknown;
  constituent_id?: unknown;
  amount?: unknown;
  date?: unknown;
  type?: unknown;
  gift_status?: unknown;
  post_status?: unknown;
  payment_method?: unknown;
  gift_splits?: unknown;
  raw_json?: unknown;
}

async function realtimeGift(env: Env, body: RealtimeGift): Promise<Response> {
  const id = String(body.id ?? '').trim();
  const constituentId = String(body.constituent_id ?? '').trim();
  const amount = Number(body.amount);
  if (!id || !constituentId || !Number.isFinite(amount) || amount <= 0) {
    return json({ ok: false, error: 'id, constituent_id, and a positive amount are required' }, 400);
  }
  const now = new Date().toISOString();
  const res = await env.DB.prepare(
    `INSERT INTO gifts (id, date_added, date_modified, gift_amount, gift_date, gift_type,
                        gift_status, gift_splits, constituent_record_id, gift_payment_method,
                        post_status, raw_json, synced_at)
     VALUES (?1, ?2, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?2)
     ON CONFLICT(id) DO NOTHING`
  )
    .bind(
      id,
      now,
      amount,
      String(body.date ?? now),
      String(body.type ?? 'Donation'),
      String(body.gift_status ?? 'Active'),
      typeof body.gift_splits === 'string' ? body.gift_splits : JSON.stringify(body.gift_splits ?? []),
      constituentId,
      String(body.payment_method ?? 'CreditCard'),
      String(body.post_status ?? 'NotPosted'),
      typeof body.raw_json === 'string' ? body.raw_json : JSON.stringify(body.raw_json ?? {})
    )
    .run();
  return json({ ok: true, inserted: (res.meta?.changes ?? 0) > 0 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/health') return json({ ok: true });

    if (!env.DATA_API_KEY) return json({ ok: false, error: 'not configured' }, 503);
    const supplied = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!timingSafeEqualStr(supplied, env.DATA_API_KEY)) {
      return json({ ok: false, error: 'forbidden' }, 403);
    }

    try {
      if (url.pathname === '/giving-history' && request.method === 'GET') {
        const email = (url.searchParams.get('email') ?? '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
          return json({ ok: false, error: 'valid email required' }, 400);
        }
        return await givingHistory(env, email);
      }
      if (url.pathname === '/gifts/realtime' && request.method === 'POST') {
        return await realtimeGift(env, (await request.json()) as RealtimeGift);
      }
      return json({ ok: false, error: 'not found' }, 404);
    } catch (err) {
      console.error('[favor-data-api]', err instanceof Error ? err.message : String(err));
      return json({ ok: false, error: 'internal' }, 500);
    }
  },
};

// POST /newsletter/subscribe
//
// Newsletter signups go INTO Blackbaud (Will, 2026-08-06: "that's how we do
// things now"). The flow:
//   1. bot checks: honeypot field + per-IP rate limit (this endpoint creates
//      real RE NXT records, so it cannot be a free-for-all)
//   2. find-or-create the constituent by email; brand-new records get the
//      "Prospect" constituent code (the standard code for not-yet-donors;
//      existing constituents are left exactly as they are)
//   3. capture the signup in KV either way, because Blackbaud has no clean
//      "wants the newsletter" flag; /api/newsletter/list is the mailing-list
//      export until the marketing stack takes over sends
//
// Blackbaud being down never loses a signup: the KV capture happens first and
// the BB write is failure-isolated. Plain form POST, no JavaScript required.

import {
  ensureConstituentCode,
  findOrCreateConstituent,
  searchConstituentByEmail,
  type Env,
} from '../api/_lib/blackbaud';

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254;

const RATE_LIMIT = 5; // signups per IP per hour

export const onRequestPost: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const back = new URL('/newsletter/', request.url);
  const fail = () => {
    back.searchParams.set('subscribed', '0');
    return Response.redirect(back.toString(), 303);
  };
  const ok = () => {
    back.searchParams.set('subscribed', '1');
    return Response.redirect(back.toString(), 303);
  };

  let email = '';
  let name = '';
  let honeypot = '';
  try {
    const form = await request.formData();
    email = String(form.get('email') ?? '').trim().toLowerCase();
    name = String(form.get('name') ?? '').trim().slice(0, 150);
    honeypot = String(form.get('website') ?? '').trim();
  } catch {
    return fail();
  }

  // Bots fill every field; humans never see this one. Pretend success so the
  // bot moves on, write nothing.
  if (honeypot) return ok();
  if (!emailOk(email) || !name) return fail();

  // Per-IP rate limit so a script cannot mint RE NXT records in bulk.
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  try {
    const rlKey = `nl:rl:${ip}`;
    const count = Number((await env.BLACKBAUD_TOKENS.get(rlKey)) ?? '0');
    if (count >= RATE_LIMIT) return fail();
    await env.BLACKBAUD_TOKENS.put(rlKey, String(count + 1), { expirationTtl: 3600 });
  } catch {
    /* KV hiccup never blocks a signup */
  }

  // 1. Durable capture first, so Blackbaud being down cannot lose the address.
  try {
    await env.BLACKBAUD_TOKENS.put(
      `nl:sub:${email}`,
      JSON.stringify({ email, name, at: new Date().toISOString(), source: request.headers.get('Referer') ?? 'unknown' })
    );
  } catch (err) {
    console.error(`[newsletter] KV write failed: ${err instanceof Error ? err.message : err}`);
    return fail();
  }

  // 2. Into Blackbaud, after the response (waitUntil) and failure-isolated.
  //    Last token is the surname, same parsing as the giving form; a single
  //    word becomes the last name (RE requires one).
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts.length > 1 ? parts[0] : '';
  const last = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
  waitUntil(
    (async () => {
      try {
        const existing = await searchConstituentByEmail(env, email);
        if (existing) return; // already in RE NXT; leave the record alone
        const id = await findOrCreateConstituent(env, { first, last, email });
        await ensureConstituentCode(env, id, 'Prospect');
      } catch (err) {
        console.error(
          `[newsletter] Blackbaud record for signup failed (KV copy is safe): ${err instanceof Error ? err.message : err}`
        );
      }
    })()
  );

  return ok();
};

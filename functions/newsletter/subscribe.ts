// POST /newsletter/subscribe
//
// The newsletter form had no backend at all: it posted here and Pages served
// a 405 (found by Daniel, 2026-08-06, hours before launch).
//
// Signups are captured durably in KV, deliberately NOT into Blackbaud:
// Daniel's direction is to keep newsletter-only contacts out of RE NXT
// (reduce the bloat) and route them to the marketing stack. Until GHL (or its
// replacement) has an inbound hook, KV is the holding tank and the team pulls
// the list from /api/newsletter/list. Nothing is lost in the meantime.
//
// Plain form POST, no JavaScript required; success redirects back to
// /newsletter/?subscribed=1 which renders the confirmation.

import type { Env } from '../api/_lib/blackbaud';

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let email = '';
  try {
    const form = await request.formData();
    email = String(form.get('email') ?? '').trim().toLowerCase();
  } catch {
    /* fall through to the error redirect */
  }

  const back = new URL('/newsletter/', request.url);
  if (!emailOk(email)) {
    back.searchParams.set('subscribed', '0');
    return Response.redirect(back.toString(), 303);
  }

  try {
    // One key per address = free dedup; re-subscribing refreshes the record.
    await env.BLACKBAUD_TOKENS.put(
      `nl:sub:${email}`,
      JSON.stringify({
        email,
        at: new Date().toISOString(),
        source: request.headers.get('Referer') ?? 'unknown',
      })
    );
  } catch (err) {
    console.error(`[newsletter] KV write failed for signup: ${err instanceof Error ? err.message : err}`);
    back.searchParams.set('subscribed', '0');
    return Response.redirect(back.toString(), 303);
  }

  back.searchParams.set('subscribed', '1');
  return Response.redirect(back.toString(), 303);
};

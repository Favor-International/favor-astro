// POST /api/portal/give
//
// A gift started inside the Partner Portal, where the partner is already
// signed in. Body is exactly the public giving body, plus frequency:
//   { frequency: "monthly" | "once", ...same fields as /api/give/donate }
//
// This does NOT reimplement any part of taking money. It delegates to the very
// same handlers the public form uses, with two deliberate differences applied
// through the env it passes down:
//
//   Turnstile is skipped. verifyTurnstile no-ops without TURNSTILE_SECRET_KEY.
//   A challenge proves "a human on favorintl.org"; here we already have a
//   valid PORTAL_API_KEY plus the portal's own authenticated session, which is
//   a stronger claim than a checkbox.
//
//   The welcome-email hook is suppressed. notifyPortalGiftCompleted no-ops
//   without PORTAL_HOOK_URL, and it would otherwise mail a magic sign-in link
//   to a partner who is, by definition, already signed in.
//
// Everything else (validation, fee maths, appeal stamping, constituent
// matching, the Partner code, the realtime push to the sync database) runs
// unchanged, because it is literally the same code.
//
// Auth: Authorization: Bearer <PORTAL_API_KEY>.

import type { Env } from '../_lib/blackbaud';
import { errorJson, handleError } from '../_lib/http';
import { onRequestPost as donateOnce } from '../give/donate';
import { onRequestPost as donateMonthly } from '../give/donate-recurring';

function timingSafeEqualStr(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

type PortalEnv = Env & { PORTAL_API_KEY?: string; PORTAL_HOOK_URL?: string };

export const onRequestPost: PagesFunction<PortalEnv> = async (context) => {
  try {
    const { request, env } = context;
    if (!env.PORTAL_API_KEY) return errorJson('portal_disabled', 'PORTAL_API_KEY is not configured', 503);
    const supplied = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!timingSafeEqualStr(supplied, env.PORTAL_API_KEY)) {
      return errorJson('forbidden', 'Invalid portal key', 403);
    }

    // Read the body once, strip our own routing field, hand the rest on.
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return errorJson('bad_body', 'A JSON body is required', 400);
    const frequency = body.frequency === 'monthly' ? 'monthly' : 'once';
    delete body.frequency;

    const innerRequest = new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // The doctored env is what turns off Turnstile and the welcome email.
    // Both helpers already treat missing config as "not enabled", so nothing
    // in the money path needs to know this call came from the portal.
    const innerEnv: PortalEnv = {
      ...env,
      TURNSTILE_SECRET_KEY: undefined,
      PORTAL_HOOK_URL: undefined,
    };

    const handler = frequency === 'monthly' ? donateMonthly : donateOnce;
    return await handler({ ...context, request: innerRequest, env: innerEnv } as Parameters<typeof handler>[0]);
  } catch (err) {
    return handleError(err);
  }
};

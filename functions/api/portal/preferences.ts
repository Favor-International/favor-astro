// POST /api/portal/preferences
//
// Push a partner's contact preferences into Raiser's Edge NXT.
//
// Will, 2026-08-06: "if I turn off that I want a printed annual report, does
// that interact with Blackbaud? I don't believe it does." It did not. The
// portal stored preferences in its own database and nothing ever told RE NXT.
//
// What RE NXT actually understands (verified against the synced database, not
// assumed): solicit codes are unused at Favor (every row null), but the
// do-not-contact flags on the contact records themselves are real and heavily
// used: emails.do_not_email (2,779 set), addresses.do_not_mail (4,339 set),
// phones.do_not_call (232 set). Those are the fields the mail house and the
// email team read, so those are the fields the portal writes.
//
// Only channel-level consent maps. Per-category choices (newsletter vs event
// invitations) have no RE NXT equivalent and stay in the portal, which is why
// the portal labels them as portal-only rather than pretending.
//
// Auth: Authorization: Bearer <PORTAL_API_KEY>, the same trust pair as
// giving-history and recurring.

import { bbFetch, bbJson, requireCredentials, type Env } from '../_lib/blackbaud';
import { errorJson, handleError, json, readJsonBody } from '../_lib/http';

interface PrefsBody {
  email?: unknown;
  email_opt_out?: unknown;
  mail_opt_out?: unknown;
  phone_opt_out?: unknown;
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

interface ContactRow {
  id: string;
  primary?: boolean;
  inactive?: boolean;
}

/**
 * Set a do-not-contact flag on a constituent's primary record of one kind.
 * Returns what happened so the caller can report honestly instead of assuming.
 */
async function setChannelConsent(
  env: Env,
  constituentId: string,
  kind: 'emailaddresses' | 'addresses' | 'phones',
  field: 'do_not_email' | 'do_not_mail' | 'do_not_call',
  optOut: boolean
): Promise<'updated' | 'unchanged' | 'no_record'> {
  const list = await bbJson<{ value?: ContactRow[] }>(
    env,
    `/constituent/v1/constituents/${encodeURIComponent(constituentId)}/${kind}`
  ).catch(() => ({ value: [] as ContactRow[] }));

  const rows = (list.value ?? []).filter((r) => !r.inactive);
  const target = rows.find((r) => r.primary) ?? rows[0];
  if (!target) return 'no_record';

  const current = (target as Record<string, unknown>)[field];
  if (current === optOut) return 'unchanged';

  const res = await bbFetch(env, `/constituent/v1/${kind}/${encodeURIComponent(target.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ [field]: optOut }),
  });
  if (!res.ok) {
    throw new Error(`${kind} PATCH ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  return 'updated';
}

export const onRequestPost: PagesFunction<Env & { PORTAL_API_KEY?: string }> = async ({ request, env }) => {
  try {
    if (!env.PORTAL_API_KEY) return errorJson('portal_disabled', 'PORTAL_API_KEY is not configured', 503);
    const supplied = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!timingSafeEqualStr(supplied, env.PORTAL_API_KEY)) {
      return errorJson('forbidden', 'Invalid portal key', 403);
    }
    requireCredentials(env);

    const body = await readJsonBody<PrefsBody>(request);
    const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return errorJson('bad_email', 'Valid email required', 400);

    const constituentId = await constituentIdForEmail(env, email);
    if (!constituentId) return errorJson('no_constituent', 'No Blackbaud record for that email', 404);

    // Each channel is applied independently: one failure must not silently
    // discard the others, and the response says exactly what happened.
    const applied: Record<string, string> = {};
    const channels: Array<[string, 'emailaddresses' | 'addresses' | 'phones', 'do_not_email' | 'do_not_mail' | 'do_not_call', unknown]> = [
      ['email', 'emailaddresses', 'do_not_email', body.email_opt_out],
      ['mail', 'addresses', 'do_not_mail', body.mail_opt_out],
      ['phone', 'phones', 'do_not_call', body.phone_opt_out],
    ];
    for (const [name, kind, field, wanted] of channels) {
      if (typeof wanted !== 'boolean') continue;
      try {
        applied[name] = await setChannelConsent(env, constituentId, kind, field, wanted);
      } catch (err) {
        console.error(`[portal/preferences] ${name}: ${err instanceof Error ? err.message : err}`);
        applied[name] = 'failed';
      }
    }

    return json({ ok: true, constituent_id: constituentId, applied });
  } catch (err) {
    return handleError(err);
  }
};

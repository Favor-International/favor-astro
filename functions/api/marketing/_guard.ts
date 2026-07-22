// Shared guard for the marketing-platform gateway (favor-marketing Worker).
// Same server-to-server trust pattern as the portal gateway: a dedicated
// bearer key, timing-safe comparison, never exposed to browsers.

import { errorJson } from '../_lib/http';

export function timingSafeEqualStr(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

export function requireMarketingKey(
  env: { MARKETING_API_KEY?: string },
  request: Request
): Response | null {
  if (!env.MARKETING_API_KEY) {
    return errorJson('marketing_disabled', 'MARKETING_API_KEY is not configured', 503);
  }
  const supplied = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!timingSafeEqualStr(supplied, env.MARKETING_API_KEY)) {
    return errorJson('forbidden', 'Invalid marketing key', 403);
  }
  return null;
}

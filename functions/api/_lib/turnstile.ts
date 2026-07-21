// Cloudflare Turnstile verification. Active only when TURNSTILE_SECRET_KEY is
// configured; otherwise a no-op so previews work before keys exist.

import { BlackbaudError, type Env } from './blackbaud';

export async function verifyTurnstile(env: Env, token: unknown, ip: string | null): Promise<void> {
  if (!env.TURNSTILE_SECRET_KEY) return;
  if (typeof token !== 'string' || !token) {
    throw new BlackbaudError('turnstile_required', 'Human verification is required', 400);
  }
  const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  if (ip) form.set('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });
  const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
  if (!data.success) {
    throw new BlackbaudError('turnstile_failed', 'Human verification failed; please try again', 400, data['error-codes']);
  }
}

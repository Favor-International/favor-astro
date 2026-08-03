// GET /api/give/config
//
// Public bootstrap for the giving form. Returns everything the browser needs
// to open Blackbaud Checkout: public key, payment configuration, designation
// list, fee-cover estimate, and the Turnstile site key when enabled.
// Returns { connected: false } gracefully while setup is incomplete so the
// page can fall back to the other-ways-to-give panel.

import {
  BlackbaudError,
  apiBase,
  getDesignations,
  getPaymentConfig,
  getPublicKey,
  readStoredTokens,
  tokenUrl,
  type Env,
} from '../_lib/blackbaud';
import { handleError, json } from '../_lib/http';

// Hostname only, never the full URL, and never a query string.
const safeHost = (u: string): string => {
  try {
    return new URL(u).host;
  } catch {
    return 'invalid';
  }
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    // Both preconditions used to collapse into a bare { connected: false },
    // which made an offline giving page impossible to diagnose without the
    // admin setup key. The reason code names which precondition failed. It
    // exposes no secret: only whether this site has Blackbaud credentials and
    // whether an admin has completed the one-time consent.
    const hasCreds =
      !!env.BLACKBAUD_CLIENT_ID && !!env.BLACKBAUD_CLIENT_SECRET && !!env.BLACKBAUD_SUBSCRIPTION_KEY;
    if (!hasCreds) {
      return json({ connected: false, reason: 'no_credentials' }, 200, { 'Cache-Control': 'no-store' });
    }
    if (!env.BLACKBAUD_TOKENS) {
      return json({ connected: false, reason: 'no_kv_binding' }, 200, { 'Cache-Control': 'no-store' });
    }
    if (!(await readStoredTokens(env))) {
      return json({ connected: false, reason: 'not_authorized' }, 200, { 'Cache-Control': 'no-store' });
    }

    const designations = getDesignations(env);
    if (designations.length === 0) {
      return json({ connected: true, setup_incomplete: true, reason: 'no_designations' });
    }

    const [publicKey, payConfig] = await Promise.all([getPublicKey(env), getPaymentConfig(env)]);

    return json({
      connected: true,
      public_key: publicKey,
      payment_configuration_id: payConfig.id,
      process_mode: payConfig.process_mode ?? 'Live',
      currency: payConfig.currency ?? 'USD',
      designations,
      fee_rate: Number(env.GIVE_FEE_RATE ?? '0.029'),
      fee_fixed: Number(env.GIVE_FEE_FIXED ?? '0.30'),
      turnstile_site_key: env.TURNSTILE_SITE_KEY ?? null,
    });
  } catch (err) {
    if (err instanceof BlackbaudError && (err.code === 'not_connected' || err.code === 'not_configured')) {
      // Reached when tokens exist but are unusable, typically a refresh token
      // that expired or was revoked. The cure is the same one-time admin
      // consent, so say so rather than reporting a bare false.
      //
      // token_host is reported because the three URL overrides exist so local
      // dev can point at the mock SKY server on 127.0.0.1. If those variables
      // get copied into the deployed environment along with the credentials,
      // production tries to refresh against a loopback address it can never
      // reach, and the failure looks identical to an expired token. The host
      // is not a secret and it tells an operator instantly which one it is.
      // oauth_error is Blackbaud's own code. invalid_grant means the refresh
      // token is spent or revoked and reconnecting fixes it; invalid_client
      // means the client id/secret no longer match the app that issued the
      // token, and reconnecting will keep failing until that is corrected.
      // Neither is a secret, and knowing which saves an operator from looping.
      const detail = err.detail as { status?: number; oauth_error?: string | null } | undefined;
      return json({
        connected: false,
        reason: err.code === 'not_configured' ? 'no_credentials' : 'token_refresh_failed',
        oauth_error: detail?.oauth_error ?? null,
        oauth_status: detail?.status ?? null,
        token_host: safeHost(tokenUrl(env)),
        api_host: safeHost(apiBase(env)),
      });
    }
    return handleError(err);
  }
};

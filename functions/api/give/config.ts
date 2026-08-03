// GET /api/give/config
//
// Public bootstrap for the giving form. Returns everything the browser needs
// to open Blackbaud Checkout: public key, payment configuration, designation
// list, fee-cover estimate, and the Turnstile site key when enabled.
// Returns { connected: false } gracefully while setup is incomplete so the
// page can fall back to the other-ways-to-give panel.

import {
  BlackbaudError,
  getDesignations,
  getPaymentConfig,
  getPublicKey,
  readStoredTokens,
  type Env,
} from '../_lib/blackbaud';
import { handleError, json } from '../_lib/http';

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
      return json({ connected: false, reason: err.code === 'not_configured' ? 'no_credentials' : 'token_refresh_failed' });
    }
    return handleError(err);
  }
};

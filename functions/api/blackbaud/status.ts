// GET /api/blackbaud/status?key=<BLACKBAUD_SETUP_KEY>
//
// Connection health for admins: token freshness, environment, payment
// configuration, and designation setup. Never returns token values.

import {
  getPaymentConfig,
  getPublicKey,
  getDesignations,
  readStoredTokens,
  requireCredentials,
  type Env,
} from '../_lib/blackbaud';
import { handleError, json, requireSetupKey } from '../_lib/http';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    requireCredentials(env);
    const tokens = await readStoredTokens(env);
    if (!tokens) {
      return json({
        connected: false,
        next_step: 'Visit /api/blackbaud/auth?key=... as a Blackbaud admin to connect.',
      });
    }

    const out: Record<string, unknown> = {
      connected: true,
      environment_id: tokens.environment_id,
      environment_name: tokens.environment_name,
      authorized_as: tokens.user_email,
      access_mode: tokens.mode,
      scope: tokens.scope,
      access_token_expires_in_s: Math.max(0, Math.round((tokens.expires_at - Date.now()) / 1000)),
      connected_at: new Date(tokens.obtained_at).toISOString(),
      designations: getDesignations(env),
      designations_configured: getDesignations(env).length > 0,
    };

    try {
      out.public_key = await getPublicKey(env);
      const pc = await getPaymentConfig(env);
      out.payment_configuration = { id: pc.id, name: pc.name, process_mode: pc.process_mode, currency: pc.currency };
    } catch (err) {
      out.payments_error = err instanceof Error ? err.message : String(err);
    }

    return json(out);
  } catch (err) {
    return handleError(err);
  }
};

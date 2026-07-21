// GET /api/blackbaud/auth?key=<BLACKBAUD_SETUP_KEY>
//
// One-time admin connect: redirects to Blackbaud's consent screen. The
// signed-in Blackbaud user must belong to Favor's environment and have
// rights to the APIs the app requests. After consent Blackbaud redirects
// to /api/blackbaud/callback.

import { AUTHORIZE_URL, createOauthState, requireCredentials, type Env } from '../_lib/blackbaud';
import { handleError, requireSetupKey } from '../_lib/http';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    requireCredentials(env);
    const url = new URL(request.url);
    const redirectUri = `${url.origin}/api/blackbaud/callback`;
    const state = await createOauthState(env);
    const authorize = new URL(AUTHORIZE_URL);
    authorize.searchParams.set('client_id', env.BLACKBAUD_CLIENT_ID);
    authorize.searchParams.set('response_type', 'code');
    authorize.searchParams.set('redirect_uri', redirectUri);
    authorize.searchParams.set('state', state);
    return Response.redirect(authorize.toString(), 302);
  } catch (err) {
    return handleError(err);
  }
};

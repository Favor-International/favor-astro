// GET /api/blackbaud/callback?code=...&state=...
//
// OAuth redirect target. Exchanges the authorization code for tokens and
// stores them in KV. Register this exact URL (per environment) in the
// Blackbaud application's Redirect URIs:
//   https://favorintl.org/api/blackbaud/callback
//   https://favor-astro.pages.dev/api/blackbaud/callback
//   http://localhost:8788/api/blackbaud/callback

import { consumeOauthState, exchangeCodeForTokens, type Env } from '../_lib/blackbaud';
import { handleError } from '../_lib/http';

function page(title: string, body: string, status = 200): Response {
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>${title}</title>
<body style="font-family:Montserrat,system-ui,sans-serif;max-width:560px;margin:80px auto;padding:0 20px;color:#25221c">
<h1 style="color:#2b4d24">${title}</h1>${body}
<p style="margin-top:32px"><a href="/give/donate/" style="color:#a36d4c">Open the giving page</a></p></body>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
  );
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const error = url.searchParams.get('error');
    if (error) {
      return page('Connection cancelled', `<p>Blackbaud returned: <code>${error}</code>. No changes were made.</p>`, 400);
    }
    const code = url.searchParams.get('code') ?? '';
    const state = url.searchParams.get('state') ?? '';
    if (!code) return page('Missing code', '<p>No authorization code was returned.</p>', 400);
    if (!(await consumeOauthState(env, state))) {
      return page('State mismatch', '<p>The sign-in link expired or was reused. Start again from /api/blackbaud/auth.</p>', 400);
    }
    const redirectUri = `${url.origin}/api/blackbaud/callback`;
    const stored = await exchangeCodeForTokens(env, code, redirectUri);
    return page(
      'Blackbaud connected',
      `<p>The site is now authorized against <strong>${stored.environment_name ?? 'your Blackbaud environment'}</strong>` +
        (stored.user_email ? ` as <strong>${stored.user_email}</strong>` : '') +
        `.</p><p>Access mode: <code>${stored.mode ?? 'Full'}</code>. Scopes: <code>${stored.scope ?? 'default'}</code>.</p>` +
        `<p>Tokens refresh automatically. Reconnect only if giving stops working and /api/blackbaud/status reports a dead token.</p>`
    );
  } catch (err) {
    return handleError(err);
  }
};

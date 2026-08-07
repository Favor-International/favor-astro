// Catch-all 301 for legacy URLs (the launch cutover, 2026-08-06).
//
// public/_redirects carries an explicit 301 for all 638 URLs from the old
// Webflow sitemap plus structural wildcards. This middleware is the net under
// the net: any OTHER old URL nobody knew about (ancient campaign links, typo'd
// backlinks, pre-Webflow paths) 404s here and gets a 301 to the homepage
// instead of a dead end, which is what Will asked for at cutover.
//
// Deliberately narrow so it cannot break the live site:
// - only GET/HEAD
// - only responses that would have been 404
// - only navigations that accept HTML (a missing image stays a 404; turning
//   it into an HTML redirect would corrupt <img> loads)
// - never /api/* (JSON callers need their real 404s)
//
// Geo routing for the giving page (2026-08-07): a visitor outside the US who
// opens /give/donate/ gets a 302 to /give/international/ (TrustBridge), where
// their gift can earn a local tax receipt. Same narrowness as the 404 net:
// GET HTML navigations only, never /api/*. A 302, not 301, because the same
// browser can cross borders. Bypass with ?usd=1 or the give-usd=1 cookie
// (which ?usd=1 sets, so the choice sticks on later visits).

const GIVE_USD_COOKIE = 'give-usd=1';

export const onRequest: PagesFunction = async ({ request, next }) => {
  const url = new URL(request.url);
  const isHtmlNavigation =
    !url.pathname.startsWith('/api/') &&
    (request.headers.get('Accept') ?? '').includes('text/html');

  // --- Geo routing for /give/donate/ ---
  if (
    request.method === 'GET' &&
    isHtmlNavigation &&
    (url.pathname === '/give/donate/' || url.pathname === '/give/donate')
  ) {
    const cookies = request.headers.get('Cookie') ?? '';
    const wantsUsd =
      url.searchParams.get('usd') === '1' ||
      /(?:^|;\s*)give-usd=1(?:;|$)/.test(cookies);

    if (wantsUsd) {
      // Serve the US form and persist the choice for a year.
      const page = await next();
      const withCookie = new Response(page.body, page);
      withCookie.headers.append(
        'Set-Cookie',
        `${GIVE_USD_COOKIE}; Path=/give/; Max-Age=31536000; SameSite=Lax; Secure`
      );
      return withCookie;
    }

    // Cloudflare sets cf.country from the connecting IP; the CF-IPCountry
    // header is the fallback. 'XX' and 'T1' mean unknown / Tor, and an
    // unknown country stays on the US form rather than guessing.
    const country =
      (request as Request & { cf?: { country?: string } }).cf?.country ??
      request.headers.get('CF-IPCountry') ??
      '';
    if (country && country !== 'US' && country !== 'XX' && country !== 'T1') {
      return Response.redirect(new URL('/give/international/', url).toString(), 302);
    }
  }

  // --- 404 net (unchanged) ---
  const response = await next();
  if (response.status !== 404) return response;
  if (request.method !== 'GET' && request.method !== 'HEAD') return response;
  if (url.pathname.startsWith('/api/')) return response;
  if (!isHtmlNavigation) return response;

  return Response.redirect(new URL('/', url).toString(), 301);
};

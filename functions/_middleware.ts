// Legacy-URL handling and geo routing (launch cutover 2026-08-06, hardened
// 2026-08-08 after Daniel found the redirects dead).
//
// THREE LAYERS, in order:
//
// 1. Vanity shortlinks (the campaign links printed in newsletters, mostly
//    Blackbaud donor forms). These live in vanity-map.json, NOT in
//    _redirects: Cloudflare Pages counts external-target rules against its
//    100-dynamic-rule cap, and past the cap it silently drops every
//    remaining line of the file, wildcards included. That failure took down
//    the tag/newsletter wildcards on 2026-08-08. Serving them here also
//    makes them case-insensitive and trailing-slash tolerant, which
//    _redirects never was.
//
// 2. public/_redirects still carries the sitemap-derived internal 301s and
//    the structural wildcards (all internal targets, well under the caps).
//
// 3. The 404 net: an unknown URL first retries as its normalized form
//    (lowercased, trailing slash stripped) so /About or /sandra/ gets a
//    second chance at layers 1-2, and only then falls back to the homepage.
//    Narrow on purpose: GET/HEAD, HTML navigations, never /api/*, and a
//    missing image stays a 404.
//
// Geo routing (2026-08-07): a visitor outside the US who opens /give/donate/
// gets a 302 to /give/international/ (TrustBridge). Bypass with ?usd=1 or the
// give-usd=1 cookie, which ?usd=1 sets so the choice sticks.

import vanityMap from './_lib/vanity-map.json';

const GIVE_USD_COOKIE = 'give-usd=1';

const normalizePath = (pathname: string): string => {
  const lower = pathname.toLowerCase();
  return lower.length > 1 ? lower.replace(/\/+$/, '') : lower;
};

export const onRequest: PagesFunction = async ({ request, next }) => {
  const url = new URL(request.url);
  const isReadRequest = request.method === 'GET' || request.method === 'HEAD';
  const isApi = url.pathname.startsWith('/api/');
  const isHtmlNavigation = !isApi && (request.headers.get('Accept') ?? '').includes('text/html');

  // --- 1. Vanity shortlinks, tolerant of case and trailing slashes.
  //     No Accept gate: campaign links get opened by mail apps and QR
  //     scanners that do not send text/html. ---
  if (isReadRequest && !isApi) {
    const vanity = (vanityMap as Record<string, string>)[normalizePath(url.pathname)];
    if (vanity) return Response.redirect(vanity, 301);
  }

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

  // --- 3. The 404 net. ---
  const response = await next();
  if (response.status !== 404) return response;
  if (!isReadRequest) return response;
  if (isApi) return response;
  if (!isHtmlNavigation) return response;

  // A case or trailing-slash variant deserves a second pass through the
  // rules before giving up (/Sandra, /sandra/, /About). Only when the
  // normalized form differs, so this can never loop.
  const normalized = normalizePath(url.pathname);
  if (normalized !== url.pathname) {
    return Response.redirect(new URL(normalized + url.search, url).toString(), 301);
  }

  return Response.redirect(new URL('/', url).toString(), 301);
};

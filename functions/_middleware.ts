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
export const onRequest: PagesFunction = async ({ request, next }) => {
  const response = await next();
  if (response.status !== 404) return response;
  if (request.method !== 'GET' && request.method !== 'HEAD') return response;

  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return response;
  if (!(request.headers.get('Accept') ?? '').includes('text/html')) return response;

  return Response.redirect(new URL('/', url).toString(), 301);
};

// Cross-origin access to the giving endpoints, for the partner portal only.
//
// The portal lives on my.favorintl.org and the giving endpoints live here on
// favorintl.org. When a signed-in partner starts a monthly gift inside the
// portal, their browser posts straight to these endpoints, exactly as the
// public form does: same validation, same Turnstile check against the real
// visitor IP, same Blackbaud calls. One code path handles money, which is the
// whole point of doing it this way instead of duplicating the logic.
//
// The allow-list is explicit. A wildcard here would let any site post gifts
// from a visitor's browser.

const ALLOWED = new Set([
  'https://my.favorintl.org',
  'https://favorintl.org',
  // opennext preview host for the portal worker
  'https://favor-portal.marketing-6e9.workers.dev',
]);

export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  if (!ALLOWED.has(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Vary': 'Origin',
  };
}

/** Preflight for the JSON POSTs the portal makes. */
export const onRequestOptions: PagesFunction = async ({ request }) => {
  const cors = corsHeaders(request);
  if (!cors['Access-Control-Allow-Origin']) return new Response(null, { status: 403 });
  return new Response(null, {
    status: 204,
    headers: {
      ...cors,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
};

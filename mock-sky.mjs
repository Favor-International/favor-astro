// Minimal mock of the Blackbaud SKY API surface used by favor-astro's
// giving functions. Logs every request (method, path, auth headers present,
// body) to mock-sky.log as JSON lines so the test run can be asserted.
import http from 'node:http';
import fs from 'node:fs';

const LOG = new URL('./mock-sky.log', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
fs.writeFileSync(LOG, '');
const log = (entry) => fs.appendFileSync(LOG, JSON.stringify(entry) + '\n');

let giftSeq = 0;
let constituentCreated = false;
let constituentSeq = 0;

const routes = [
  {
    m: 'POST', p: /^\/token$/, h: (req, body) => ({
      access_token: 'mock-access-token-' + Date.now(),
      refresh_token: 'mock-refresh-token-' + Date.now(),
      expires_in: 3600,
      refresh_token_expires_in: 31536000,
      environment_id: 'p-mockenv123',
      environment_name: 'Favor Mock Environment',
      email: 'admin-mock@favorintl.org',
      mode: 'Limited',
      scope: 'rnxt.w rnxt.r',
      token_type: 'bearer',
    }),
  },
  { m: 'GET', p: /^\/payments\/v1\/checkout\/publickey$/, h: () => ({ public_key: '11111111-2222-3333-4444-555555555555' }) },
  {
    m: 'GET', p: /^\/payments\/v1\/paymentconfigurations$/, h: () => ({
      count: 2,
      value: [
        { id: 'a0a0a0a0-1111-2222-3333-b1b1b1b1b1b1', name: 'BBMS Live USD', process_mode: 'Live', currency: 'USD', active: true },
        { id: 'c2c2c2c2-4444-5555-6666-d3d3d3d3d3d3', name: 'BBMS Test', process_mode: 'Test', currency: 'USD', active: true },
      ],
    }),
  },
  { m: 'GET', p: /^\/payments\/v1\/cards\/[0-9a-f-]+$/, h: () => ({ stored: true }) },
  {
    m: 'GET', p: /^\/constituent\/v1\/constituents\/search/, h: () => (
      constituentCreated
        ? { count: 1, value: [{ id: '280042', email: 'e2e-donor@example.com', name: 'E2E Donor' }] }
        : { count: 0, value: [] }
    ),
  },
  {
    m: 'POST', p: /^\/constituent\/v1\/constituents$/, h: () => {
      constituentCreated = true;
      // Distinct ids per creation so the org-vs-contact relationship path is
      // actually exercised (a fixed id makes personId === orgId and the guard
      // short-circuits, hiding the whole relationship step).
      return { id: String(280041 + ++constituentSeq) };
    },
  },
  { m: 'POST', p: /^\/gift\/v1\/gifts$/, h: () => ({ id: 'gift-' + (++giftSeq) }) },
  // Post-gift enrichment (2026-08-06): Partner code check + add, org contact link.
  { m: 'GET', p: /^\/constituent\/v1\/constituents\/[^/]+\/constituentcodes/, h: () => ({ count: 0, value: [] }) },
  { m: 'POST', p: /^\/constituent\/v1\/constituentcodes$/, h: () => ({ id: 'code-1' }) },
  { m: 'POST', p: /^\/constituent\/v1\/relationships$/, h: () => ({ id: 'rel-1' }) },
  { m: 'GET', p: /^\/gift\/v1\/recurringgifts\/[^/]+\/canbeconverted$/, h: () => ({ can_be_converted: true, token_will_be_required: true }) },
  { m: 'POST', p: /^\/gift\/v1\/recurringgifts\/[^/]+\/converttoautomatic$/, h: () => ({}) },
  { m: 'GET', p: /^\/fundraising\/v1\/funds/, h: () => ({ count: 2, value: [ { id: '42', description: 'Where Most Needed', inactive: false }, { id: '77', description: 'Portable Bible Schools', inactive: false } ] }) },
];

const server = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    const url = new URL(req.url, 'http://x');
    const route = routes.find((r) => r.m === req.method && r.p.test(url.pathname));
    let parsedBody = null;
    try { parsedBody = raw ? JSON.parse(raw) : null; } catch { parsedBody = raw; }
    log({
      method: req.method,
      path: url.pathname + url.search,
      has_authorization: Boolean(req.headers.authorization),
      has_subscription_key: Boolean(req.headers['bb-api-subscription-key']),
      content_type: req.headers['content-type'] ?? null,
      body: req.method === 'POST' && url.pathname === '/token' ? raw : parsedBody,
      matched: Boolean(route),
    });
    if (!route) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'mock: no route for ' + req.method + ' ' + url.pathname }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(route.h(req, parsedBody)));
  });
});

server.listen(9799, '127.0.0.1', () => console.log('mock SKY API on http://127.0.0.1:9799'));

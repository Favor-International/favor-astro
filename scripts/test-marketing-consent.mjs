// Tests for POST /api/marketing/consent (the unsubscribe write-back).
//
// Bundles the real Pages Function with esbuild and runs it against a mocked
// SKY API, so no call reaches Blackbaud. Run from the repo root after
// `npm install` (esbuild ships with Astro):
//
//   node scripts/test-marketing-consent.mjs
//
// ESBUILD_PATH may point at another esbuild entry (a file:// URL) when this
// checkout has no node_modules.

import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const esbuild = await import(process.env.ESBUILD_PATH ?? 'esbuild');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = mkdtempSync(path.join(process.env.TEST_TMP ?? tmpdir(), 'consent-test-'));
const outfile = path.join(outDir, 'consent.mjs');
await esbuild.build({
  entryPoints: [path.join(root, 'functions/api/marketing/consent.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  outfile,
  logLevel: 'error',
});
const { onRequestPost } = await import(pathToFileURL(outfile).href);

const SKY = 'https://api.sky.blackbaud.com';
const KEY = 'test-marketing-key';

function kv(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    m,
    async get(k) { return m.has(k) ? m.get(k) : null; },
    async put(k, v) { m.set(k, String(v)); },
    async delete(k) { m.delete(k); },
  };
}

function makeEnv(store) {
  return {
    MARKETING_API_KEY: KEY,
    BLACKBAUD_CLIENT_ID: 'id',
    BLACKBAUD_CLIENT_SECRET: 'secret',
    BLACKBAUD_SUBSCRIPTION_KEY: 'sub',
    BLACKBAUD_TOKENS: store ?? kv({
      'bb:oauth': JSON.stringify({ access_token: 'tok', refresh_token: 'r', expires_at: Date.now() + 3600e3, obtained_at: Date.now() }),
    }),
  };
}

// A tiny SKY: constituents with email rows, a search index, scripted failures.
function mockSky({ people, searchHits = [], searchFail = false, patchFail = new Set(), quota = false, listFail = new Set() }) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(String(url));
    const method = (init.method ?? 'GET').toUpperCase();
    calls.push(`${method} ${u.pathname}${u.search}`);
    assert.equal(u.origin, SKY, 'only the SKY API is called');
    if (quota) return new Response('{"message":"Out of call volume quota."}', { status: 403 });
    if (u.pathname === '/constituent/v1/constituents/search') {
      // SKY's rule (checked live 2026-10-09): with search_field=email_address
      // only search_text and include_inactive are accepted; anything else is 400.
      const extra = [...u.searchParams.keys()].filter((k) => !['search_text', 'search_field', 'include_inactive'].includes(k));
      if (extra.length) return new Response(JSON.stringify([{ message: `invalid filters ${extra}` }]), { status: 400 });
      if (searchFail) return new Response('{}', { status: 500 });
      return Response.json({ count: searchHits.length, value: searchHits.map((id) => ({ id, email: 'primary-only@x.org' })) });
    }
    let m = u.pathname.match(/^\/constituent\/v1\/constituents\/(\d+)\/emailaddresses$/);
    if (m && method === 'GET') {
      assert.equal(u.searchParams.get('include_inactive'), 'true', 'inactive email rows are included');
      if (listFail.has(m[1])) return new Response('{}', { status: 500 });
      const rows = people[m[1]];
      if (!rows) return new Response('{}', { status: 404 });
      return Response.json({ count: rows.length, value: rows });
    }
    m = u.pathname.match(/^\/constituent\/v1\/emailaddresses\/(\d+)$/);
    if (m && method === 'PATCH') {
      assert.deepEqual(JSON.parse(init.body), { do_not_email: true }, 'only do_not_email is sent');
      if (patchFail.has(m[1])) return new Response('{"error":"boom"}', { status: 500 });
      for (const rows of Object.values(people)) for (const r of rows) if (String(r.id) === m[1]) r.do_not_email = true;
      return new Response('', { status: 200 });
    }
    return new Response('{}', { status: 404 });
  };
  return calls;
}

async function post(body, { key = KEY, env = makeEnv() } = {}) {
  const request = new Request('https://favor-astro.pages.dev/api/marketing/consent', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const res = await onRequestPost({ request, env });
  return { status: res.status, body: await res.json() };
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('flags every matching email record, secondary ones included', async () => {
  const people = {
    '101': [{ id: 1, address: 'a@x.org', primary: true }, { id: 2, address: 'Shared@X.org', primary: false }],
    '202': [{ id: 3, address: 'shared@x.org', primary: true }],
    '303': [{ id: 4, address: 'shared@x.org', primary: false, inactive: true, do_not_email: false }],
  };
  const calls = mockSky({ people, searchHits: ['202'] });
  const r = await post({ email: ' Shared@x.org ', kind: 'email', constituent_ids: ['101', '303'] });
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, true);
  assert.deepEqual(r.body.updated.map((t) => t.email_id).sort(), ['2', '3', '4']);
  assert.equal(people['101'][0].do_not_email, undefined, 'a different address on the same record is untouched');
  assert.equal(r.body.not_found, false);
  assert.equal(r.body.calls, calls.length);
  assert.equal(calls.filter((c) => c.startsWith('PATCH')).length, 3);
});

test('an address already flagged costs no PATCH', async () => {
  const people = { '27202': [{ id: 40621, address: 'will@favorintl.org', primary: true, do_not_email: true }] };
  const calls = mockSky({ people, searchHits: ['27202'] });
  const r = await post({ email: 'will@favorintl.org', kind: 'email' });
  assert.equal(r.status, 200);
  assert.equal(r.body.unchanged.length, 1);
  assert.equal(r.body.updated.length, 0);
  assert.equal(calls.length, 2);
});

test('no Blackbaud record answers not_found, ok', async () => {
  mockSky({ people: {}, searchHits: [] });
  const r = await post({ email: 'nobody@x.org', kind: 'email', constituent_ids: ['999'] });
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, true);
  assert.equal(r.body.not_found, true);
});

test('a failed PATCH answers 502 so the queue retries', async () => {
  const people = { '101': [{ id: 7, address: 'p@x.org' }, { id: 8, address: 'p@x.org' }] };
  mockSky({ people, searchHits: ['101'], patchFail: new Set(['8']) });
  const r = await post({ email: 'p@x.org', kind: 'email' });
  assert.equal(r.status, 502);
  assert.equal(r.body.ok, false);
  assert.equal(r.body.updated.length, 1);
  assert.equal(r.body.failed[0].email_id, '8');
});

test('an unreadable candidate answers 502, never not_found', async () => {
  mockSky({ people: {}, searchHits: ['555'], listFail: new Set(['555']) });
  const r = await post({ email: 'q@x.org', kind: 'email' });
  assert.equal(r.status, 502);
  assert.equal(r.body.not_found, false);
});

test('dry run reports what would change and writes nothing', async () => {
  const people = { '101': [{ id: 9, address: 'd@x.org' }] };
  const calls = mockSky({ people, searchHits: ['101'] });
  const r = await post({ email: 'd@x.org', kind: 'email', dry_run: true });
  assert.equal(r.status, 200);
  assert.equal(r.body.updated.length, 1);
  assert.equal(calls.some((c) => c.startsWith('PATCH')), false);
  assert.equal(people['101'][0].do_not_email, undefined);
});

test('the email search sends only the filters SKY accepts, once', async () => {
  const people = { '101': [{ id: 11, address: 's@x.org' }] };
  const calls = mockSky({ people, searchHits: ['101'] });
  const r = await post({ email: 's@x.org', kind: 'email' });
  assert.equal(r.status, 200);
  assert.equal(r.body.updated.length, 1);
  const searches = calls.filter((c) => c.includes('/search'));
  assert.equal(searches.length, 1);
  assert.match(searches[0], /search_field=email_address&include_inactive=true$/);
});

test('a failed email search is an error the caller retries, never not_found', async () => {
  mockSky({ people: {}, searchFail: true });
  const r = await post({ email: 's@x.org', kind: 'email', constituent_ids: ['101'] });
  assert.ok(r.status >= 500);
  assert.notEqual(r.body.not_found, true);
});

test('candidates are capped at 10 and ids must be numeric', async () => {
  const ids = Array.from({ length: 15 }, (_, i) => String(1000 + i));
  const calls = mockSky({ people: {}, searchHits: [] });
  const r = await post({ email: 'c@x.org', kind: 'email', constituent_ids: [...ids, '12; DROP', '../x'] });
  assert.equal(r.status, 200);
  assert.equal(r.body.candidates.length, 10);
  assert.equal(calls.filter((c) => c.includes('/emailaddresses')).length, 10);
});

test('SMS answers 422 and makes no call', async () => {
  const calls = mockSky({ people: {} });
  const r = await post({ email: 'm@x.org', kind: 'sms' });
  assert.equal(r.status, 422);
  assert.equal(calls.length, 0);
});

test('a wrong key is refused before any call', async () => {
  const calls = mockSky({ people: {} });
  const r = await post({ email: 'm@x.org', kind: 'email' }, { key: 'nope-nope-nope-nope' });
  assert.equal(r.status, 403);
  assert.equal(calls.length, 0);
});

test('a quota refusal stops, sets the shared stop key, and later calls wait', async () => {
  const env = makeEnv();
  mockSky({ people: {}, quota: true });
  const r = await post({ email: 'z@x.org', kind: 'email' }, { env });
  assert.equal(r.status, 503);
  assert.equal(r.body.error, 'quota_stop');
  assert.ok(Number(env.BLACKBAUD_TOKENS.m.get('bb:ops:quota_stop')) > Date.now());
  const calls = mockSky({ people: {} });
  const r2 = await post({ email: 'z@x.org', kind: 'email' }, { env });
  assert.equal(r2.status, 503);
  assert.equal(calls.length, 0);
});

test('a malformed email is refused', async () => {
  const calls = mockSky({ people: {} });
  const r = await post({ email: 'not-an-email', kind: 'email' });
  assert.equal(r.status, 400);
  assert.equal(calls.length, 0);
});

let failed = 0;
for (const [name, fn] of tests) {
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (err) {
    failed++;
    console.log(`FAIL ${name}\n     ${err?.stack ?? err}`);
  }
}
rmSync(outDir, { recursive: true, force: true });
console.log(`\n${tests.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

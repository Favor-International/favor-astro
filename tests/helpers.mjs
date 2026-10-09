// Test doubles for the Pages Functions: an in-memory KV namespace, an env
// with a stored Blackbaud token, and a fetch stub that answers SKY calls from
// a list of handlers and records every request. Nothing here reaches the
// network.

export class FakeKV {
  constructor() {
    this.map = new Map();
    this.puts = [];
  }
  async get(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  async put(key, value) {
    this.puts.push(key);
    this.map.set(key, String(value));
  }
  async delete(key) {
    this.map.delete(key);
  }
  async list({ prefix = '' } = {}) {
    const keys = [...this.map.keys()].filter((k) => k.startsWith(prefix)).sort().map((name) => ({ name }));
    return { keys, list_complete: true, cursor: undefined };
  }
}

export function makeEnv(extra = {}) {
  const kv = new FakeKV();
  kv.map.set(
    'bb:oauth',
    JSON.stringify({ access_token: 'test-access', refresh_token: 'test-refresh', expires_at: Date.now() + 3600_000 })
  );
  return {
    BLACKBAUD_TOKENS: kv,
    BLACKBAUD_CLIENT_ID: 'id',
    BLACKBAUD_CLIENT_SECRET: 'secret',
    BLACKBAUD_SUBSCRIPTION_KEY: 'sub',
    BLACKBAUD_SETUP_KEY: 'setup-key',
    ...extra,
  };
}

/**
 * Replace global fetch. `handler(method, path, body)` returns
 * { status, body } or a Promise of one; every call is recorded in `calls`.
 */
export function stubFetch(handler) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    const method = (init.method ?? 'GET').toUpperCase();
    const body = init.body ? JSON.parse(init.body) : undefined;
    const call = { method, host: url.host, path: url.pathname + url.search, body };
    calls.push(call);
    const out = await handler(method, call.path, body, call);
    if (out instanceof Error) throw out;
    const status = out?.status ?? 200;
    const text = out?.body === undefined ? '' : JSON.stringify(out.body);
    return new Response(status === 204 ? null : text, { status, headers: { 'Content-Type': 'application/json' } });
  };
  return { calls, restore: () => (globalThis.fetch = original) };
}

export function post(url, body, headers = {}) {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

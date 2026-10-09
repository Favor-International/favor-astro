// The giving routes never charge one gift twice: a retry with the same key
// replays or waits, a charge with no clear answer is never sent again, and a
// failure before the charge can be retried with the same authorization.
// Blackbaud is a stub; nothing here reaches the network.

import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, post, stubFetch } from './helpers.mjs';
import { onRequestPost as donate } from '../functions/api/give/donate.ts';
import { onRequestPost as donateMonthly } from '../functions/api/give/donate-recurring.ts';
import { IDEM_LOCK_MS } from '../functions/api/_lib/http.ts';

const KEY = '11111111-2222-4333-8444-555555555555';
const TOKEN = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const CARD = 'cccccccc-dddd-4eee-8fff-000000000000';

const quiet = console.error;
beforeEach(() => (console.error = () => {}));
afterEach(() => (console.error = quiet));

function giftBody(over = {}) {
  return {
    idempotency_key: KEY,
    amount: 25,
    designation_fund_id: '1',
    donor: { first: 'Test', last: 'Giver', email: 'giver@example.org' },
    checkout: { transaction_token: TOKEN },
    ...over,
  };
}

function env() {
  const e = makeEnv({ BLACKBAUD_DEFAULT_FUND_ID: '1' });
  e.BLACKBAUD_TOKENS.map.set('bb:cache:payconfig', JSON.stringify({ id: 'pc-1', process_mode: 'Live' }));
  return e;
}

/** Blackbaud stub. `charge(body)` answers the gift call that charges the card. */
function sky(charge) {
  let giftSeq = 0;
  return stubFetch(async (method, path, body) => {
    if (method === 'GET' && path.startsWith('/constituent/v1/constituents/search')) return { body: { value: [] } };
    if (method === 'POST' && path === '/constituent/v1/constituents') return { body: { id: '50001' } };
    if (path.includes('/constituentcodes')) return { body: { value: [{ description: 'Partner' }] } };
    if (method === 'POST' && path === '/gift/v1/gifts') {
      if (body.type === 'RecurringGift') return { body: { id: 'R' + ++giftSeq } };
      return charge(body);
    }
    if (method === 'GET' && path.startsWith('/payments/v1/cards/')) return { status: 200, body: {} };
    if (path.endsWith('/canbeconverted')) return { body: { can_be_converted: true } };
    return { status: 200, body: {} };
  });
}

async function run(handler, e, body) {
  const pending = [];
  const res = await handler({ request: post('https://favorintl.org/api/give/donate', body), env: e, waitUntil: (p) => pending.push(p) });
  await Promise.allSettled(pending);
  return { status: res.status, replay: res.headers.get('Idempotent-Replay'), body: await res.json() };
}

const charges = (f) => f.calls.filter((c) => c.method === 'POST' && c.path === '/gift/v1/gifts' && c.body.payments?.[0]?.charge_transaction);

test('a finished gift is replayed for the same key with no second charge', async () => {
  const e = env();
  const f = sky(() => ({ body: { id: '66001' } }));
  try {
    const first = await run(donate, e, giftBody());
    assert.equal(first.status, 200);
    assert.equal(first.body.gift_id, '66001');
    const again = await run(donate, e, giftBody());
    assert.equal(again.replay, 'true');
    assert.deepEqual(again.body, first.body);
    assert.equal(charges(f).length, 1);
  } finally {
    f.restore();
  }
});

test('a retry while the first request is still charging waits and charges nothing', async () => {
  const e = env();
  let release;
  const held = new Promise((r) => (release = r));
  let n = 0;
  // Only the first charge is slow; a second one (the defect) answers at once.
  const f = sky(async () => {
    if (++n === 1) await held;
    return { body: { id: '6600' + (n + 1) } };
  });
  try {
    const first = run(donate, e, giftBody());
    // Let the first request reach the charge call, as when the browser
    // stops waiting for a slow answer and the giver presses again.
    while (charges(f).length === 0) await new Promise((r) => setTimeout(r, 1));
    const retry = await run(donate, e, giftBody());
    assert.equal(retry.status, 409);
    assert.equal(retry.body.retry, 'wait');
    release();
    const done = await first;
    assert.equal(done.body.gift_id, '66002');
    const later = await run(donate, e, giftBody());
    assert.equal(later.replay, 'true');
    assert.equal(charges(f).length, 1);
  } finally {
    f.restore();
  }
});

test('a charge with no clear answer is never sent again under that key', async () => {
  const e = env();
  const f = sky(() => ({ status: 503, body: { message: 'Service Unavailable' } }));
  try {
    const first = await run(donate, e, giftBody());
    assert.equal(first.status, 502);
    assert.equal(first.body.retry, 'none');
    assert.equal(first.body.error, 'charge_unconfirmed');
    const before = f.calls.length;
    const retry = await run(donate, e, giftBody());
    assert.equal(retry.status, 409);
    assert.equal(retry.body.retry, 'none');
    assert.equal(f.calls.length, before, 'the retry made no Blackbaud call');
  } finally {
    f.restore();
  }
});

test('a network failure on the charge is treated the same way', async () => {
  const e = env();
  const f = sky(() => new TypeError('fetch failed'));
  try {
    const first = await run(donate, e, giftBody());
    assert.equal(first.body.retry, 'none');
    const retry = await run(donate, e, giftBody());
    assert.equal(retry.body.error, 'charge_unconfirmed');
    assert.equal(charges(f).length, 1);
  } finally {
    f.restore();
  }
});

test('a refused card frees the key and asks for the card again', async () => {
  const e = env();
  let n = 0;
  const f = sky(() => (++n === 1 ? { status: 400, body: { message: 'Transaction declined' } } : { body: { id: '66003' } }));
  try {
    const first = await run(donate, e, giftBody());
    assert.equal(first.status, 400);
    assert.equal(first.body.retry, 'new_checkout');
    const second = await run(donate, e, giftBody({ idempotency_key: '22222222-3333-4444-8555-666666666666', checkout: { transaction_token: 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff' } }));
    assert.equal(second.body.gift_id, '66003');
  } finally {
    f.restore();
  }
});

test('a failure before the charge frees the key for the same authorization', async () => {
  const e = env();
  let down = true;
  const f = stubFetch(async (method, path, body) => {
    if (path.startsWith('/constituent/v1/constituents/search')) return { body: { value: [] } };
    if (method === 'POST' && path === '/constituent/v1/constituents') {
      return down ? { status: 503, body: {} } : { body: { id: '50001' } };
    }
    if (method === 'POST' && path === '/gift/v1/gifts') return { body: { id: '66004' } };
    return { body: { value: [{ description: 'Partner' }] } };
  });
  try {
    const first = await run(donate, e, giftBody());
    assert.equal(first.body.ok, false);
    assert.equal(first.body.retry, 'same');
    assert.equal(charges(f).length, 0);
    down = false;
    const retry = await run(donate, e, giftBody());
    assert.equal(retry.body.gift_id, '66004');
    assert.equal(charges(f).length, 1);
  } finally {
    f.restore();
  }
});

test('one authorization under a second key replays the first answer', async () => {
  const e = env();
  const f = sky(() => ({ body: { id: '66005' } }));
  try {
    await run(donate, e, giftBody());
    const other = await run(donate, e, giftBody({ idempotency_key: '33333333-4444-4555-8666-777777777777' }));
    assert.equal(other.replay, 'true');
    assert.equal(other.body.gift_id, '66005');
    assert.equal(charges(f).length, 1);
  } finally {
    f.restore();
  }
});

test('a request that stopped after sending the charge leaves the key unconfirmed', async () => {
  const e = env();
  const kv = e.BLACKBAUD_TOKENS;
  kv.map.set('bb:idem:' + KEY, JSON.stringify({ _idem: 'pending', at: Date.now() - IDEM_LOCK_MS - 1000 }));
  kv.map.set('bb:idem-charge:' + KEY, String(Date.now() - IDEM_LOCK_MS));
  const f = sky(() => ({ body: { id: '66006' } }));
  try {
    const r = await run(donate, e, giftBody());
    assert.equal(r.body.error, 'charge_unconfirmed');
    assert.equal(f.calls.length, 0);
  } finally {
    f.restore();
  }
});

test('a request that stopped before the charge lets the key run again', async () => {
  const e = env();
  e.BLACKBAUD_TOKENS.map.set('bb:idem:' + KEY, JSON.stringify({ _idem: 'pending', at: Date.now() - IDEM_LOCK_MS - 1000 }));
  const f = sky(() => ({ body: { id: '66007' } }));
  try {
    const r = await run(donate, e, giftBody());
    assert.equal(r.body.gift_id, '66007');
  } finally {
    f.restore();
  }
});

test('an answer stored before this change still replays', async () => {
  const e = env();
  const old = { ok: true, gift_id: '65000', amount: 25, frequency: 'once', designation: 'Where Most Needed' };
  e.BLACKBAUD_TOKENS.map.set('bb:idem:' + KEY, JSON.stringify(old));
  const f = sky(() => ({ body: { id: '66008' } }));
  try {
    const r = await run(donate, e, giftBody());
    assert.equal(r.replay, 'true');
    assert.deepEqual(r.body, old);
    assert.equal(f.calls.length, 0);
  } finally {
    f.restore();
  }
});

// ---- monthly ---------------------------------------------------------------

const monthly = (over = {}) => giftBody({ card_token: CARD, ...over });

test('monthly: a finished gift is replayed with no second charge', async () => {
  const e = env();
  const f = sky(() => ({ body: { id: 'P1' } }));
  try {
    const first = await run(donateMonthly, e, monthly());
    assert.equal(first.body.ok, true);
    assert.equal(first.body.automated, true);
    const again = await run(donateMonthly, e, monthly());
    assert.equal(again.replay, 'true');
    assert.equal(charges(f).length, 1);
  } finally {
    f.restore();
  }
});

test('monthly: a refused first payment removes the schedule and asks for the card again', async () => {
  const e = env();
  const f = sky(() => ({ status: 400, body: { message: 'Transaction declined' } }));
  try {
    const r = await run(donateMonthly, e, monthly());
    assert.equal(r.body.retry, 'new_checkout');
    assert.ok(f.calls.some((c) => c.method === 'DELETE' && c.path === '/gift/v1/gifts/R1'));
  } finally {
    f.restore();
  }
});

test('monthly: a first payment with no clear answer keeps the schedule and never charges again', async () => {
  const e = env();
  const f = sky(() => ({ status: 504, body: {} }));
  try {
    const r = await run(donateMonthly, e, monthly());
    assert.equal(r.body.retry, 'none');
    assert.ok(!f.calls.some((c) => c.method === 'DELETE' || c.method === 'PATCH'), 'the schedule is left alone');
    const retry = await run(donateMonthly, e, monthly());
    assert.equal(retry.body.error, 'charge_unconfirmed');
    assert.equal(charges(f).length, 1);
    const log = JSON.parse(e.BLACKBAUD_TOKENS.map.get('bb:errlog'));
    assert.ok(log.some((x) => /recurring gift R1 kept/.test(x.message)));
  } finally {
    f.restore();
  }
});

test('monthly: a failure after the charge still reports the gift as made', async () => {
  const e = env();
  const f = stubFetch(async (method, path, body) => {
    if (path.startsWith('/constituent/v1/constituents/search')) return { body: { value: [] } };
    if (method === 'POST' && path === '/constituent/v1/constituents') return { body: { id: '50001' } };
    if (method === 'POST' && path === '/gift/v1/gifts') return { body: { id: body.type === 'RecurringGift' ? 'R9' : 'P9' } };
    if (path.startsWith('/payments/v1/cards/')) return new TypeError('fetch failed');
    return { body: { value: [] } };
  });
  try {
    const r = await run(donateMonthly, e, monthly());
    assert.equal(r.status, 200);
    assert.equal(r.body.ok, true);
    assert.equal(r.body.payment_gift_id, 'P9');
    assert.match(r.body.warning, /first month was charged/);
    const again = await run(donateMonthly, e, monthly());
    assert.equal(again.replay, 'true');
  } finally {
    f.restore();
  }
});

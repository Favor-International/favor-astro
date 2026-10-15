// The recurring schedule edit route: what it sends, what it refuses, and that it proves a change with a read. Every Blackbaud call is
// a stand-in (stubFetch); nothing here reaches Blackbaud. Ids, names and amounts are made up.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, post, stubFetch } from './helpers.mjs';
import { onRequestPost } from '../functions/api/blackbaud/recurring-edit.ts';

const URL_ = 'https://favorintl.org/api/blackbaud/recurring-edit?key=setup-key';

function schedule(over = {}) {
  return {
    id: '9001',
    type: 'RecurringGift',
    constituent_id: '27202',
    gift_status: 'Active',
    amount: { value: 25 },
    gift_splits: [{ id: '5001', fund_id: '79', amount: { value: 25 } }],
    post_status: 'DoNotPost',
    payments: [{ payment_method: 'CreditCard', account_token: 'tok-made-up', bbps_configuration_id: 'cfg-made-up' }],
    recurring_gift_schedule: { frequency: 'MONTHLY', start_date: '2025-01-05T00:00:00', next_transaction_date: '2026-11-05T00:00:00' },
    ...over,
  };
}

/** A fake Blackbaud that keeps one schedule, applies a PATCH the way SKY does, and can be told to ignore it. */
function bb(initial, { ignore = false, refuseFull = false } = {}) {
  const state = { gift: initial };
  const f = stubFetch((method, path, body) => {
    if (method === 'GET') return { status: 200, body: state.gift };
    if (method === 'PATCH' && path.startsWith('/gift/v1/gifts/')) {
      if (refuseFull && body.payments) return { status: 400, body: { message: 'refused' } };
      if (ignore) return { status: 200 };
      if (body.amount) state.gift = { ...state.gift, amount: body.amount, gift_splits: body.gift_splits };
      if (body.recurring_gift_schedule) state.gift = { ...state.gift, recurring_gift_schedule: { ...state.gift.recurring_gift_schedule, ...body.recurring_gift_schedule } };
      if (body.gift_status) state.gift = { ...state.gift, gift_status: body.gift_status };
      return { status: 200 };
    }
    if (method === 'PUT' && path.endsWith('/status')) {
      state.gift = { ...state.gift, gift_status: body.status };
      return { status: 200 };
    }
    return { status: 404 };
  });
  return { state, f };
}

async function send(env, payload) {
  const res = await onRequestPost({ request: post(URL_, payload), env });
  return { status: res.status, body: await res.json() };
}
const writes = (f) => f.calls.filter((c) => c.method !== 'GET');

test('an amount change sends DoNotPost and the payments, reads back, and reports before and after', async () => {
  const env = makeEnv();
  const { f } = bb(schedule());
  try {
    const r = await send(env, { id: '9001', op: 'amount', amount: 40 });
    assert.equal(r.status, 200);
    assert.equal(r.body.before.amount, 25);
    assert.equal(r.body.after.amount, 40);
    const w = writes(f);
    assert.equal(w.length, 1);
    assert.equal(w[0].body.post_status, 'DoNotPost');
    assert.equal(w[0].body.payments.length, 1);
    assert.deepEqual(w[0].body.gift_splits, [{ fund_id: '79', amount: { value: 40 }, id: '5001' }]);
    assert.ok(!JSON.stringify(r.body).includes('tok-made-up'), 'a payment token never comes back');
    const logged = [...env.BLACKBAUD_TOKENS.map.entries()].filter(([k]) => k.startsWith('bb:rec:log:'));
    assert.equal(logged.length, 1);
    assert.ok(!logged[0][1].includes('tok-made-up'));
  } finally {
    f.restore();
  }
});

test('a 400 on the full body falls back once to the minimal body', async () => {
  const env = makeEnv();
  const { f } = bb(schedule(), { refuseFull: true });
  try {
    const r = await send(env, { id: '9001', op: 'amount', amount: 30 });
    assert.equal(r.status, 200);
    assert.equal(writes(f).length, 2);
    assert.equal(writes(f)[1].body.payments, undefined);
  } finally {
    f.restore();
  }
});

test('a write Blackbaud ignores is an error, not a success', async () => {
  const env = makeEnv();
  const { f } = bb(schedule(), { ignore: true });
  try {
    const r = await send(env, { id: '9001', op: 'amount', amount: 55 });
    assert.equal(r.status, 502);
    assert.equal(r.body.error, 'not_applied');
  } finally {
    f.restore();
  }
});

test('frequency changes keep the start date and go out with DoNotPost', async () => {
  const env = makeEnv();
  const { f } = bb(schedule());
  try {
    const r = await send(env, { id: '9001', op: 'frequency', frequency: 'quarterly' });
    assert.equal(r.status, 200);
    assert.equal(r.body.after.frequency, 'QUARTERLY');
    const w = writes(f)[0].body;
    assert.equal(w.recurring_gift_schedule.start_date, '2025-01-05T00:00:00');
    assert.equal(w.post_status, 'DoNotPost');
  } finally {
    f.restore();
  }
});

test('status goes through the status helper and is read back', async () => {
  const env = makeEnv();
  const { f } = bb(schedule());
  try {
    const r = await send(env, { id: '9001', op: 'status', status: 'Held' });
    assert.equal(r.status, 200);
    assert.equal(r.body.after.status, 'Held');
  } finally {
    f.restore();
  }
});

test('refusals send nothing: bad amount, bad frequency, not a schedule, split schedule, stopped schedule, test lock', async () => {
  const env = makeEnv();
  const cases = [
    [schedule(), { id: '9001', op: 'amount', amount: 0.5 }, 400],
    [schedule(), { id: '9001', op: 'amount', amount: 'abc' }, 400],
    [schedule(), { id: '9001', op: 'frequency', frequency: 'DAILY' }, 400],
    [schedule(), { id: 'x', op: 'amount', amount: 10 }, 400],
    [schedule(), { id: '9001', op: 'delete' }, 400],
    [schedule({ type: 'Donation' }), { id: '9001', op: 'amount', amount: 10 }, 409],
    [schedule({ gift_splits: [{ id: '1', fund_id: '79' }, { id: '2', fund_id: '80' }] }), { id: '9001', op: 'amount', amount: 10 }, 409],
    [schedule({ gift_status: 'Terminated' }), { id: '9001', op: 'amount', amount: 10 }, 409],
    [schedule({ gift_status: 'Terminated' }), { id: '9001', op: 'status', status: 'Active' }, 409],
  ];
  for (const [gift, payload, status] of cases) {
    const { f } = bb(gift);
    try {
      const r = await send(env, payload);
      assert.equal(r.status, status, JSON.stringify(payload));
      assert.equal(writes(f).length, 0, 'no write for ' + JSON.stringify(payload));
    } finally {
      f.restore();
    }
  }
  const locked = makeEnv();
  locked.BLACKBAUD_TOKENS.map.set('bb:rec:only', '11111');
  const { f } = bb(schedule());
  try {
    const r = await send(locked, { id: '9001', op: 'amount', amount: 10 });
    assert.equal(r.status, 403);
    assert.equal(writes(f).length, 0);
  } finally {
    f.restore();
  }
});

test('the setup key is required and the daily cap stops writes', async () => {
  const env = makeEnv();
  const { f } = bb(schedule());
  try {
    const res = await onRequestPost({ request: post('https://favorintl.org/api/blackbaud/recurring-edit?key=wrong', { id: '9001', op: 'amount', amount: 10 }), env });
    assert.equal(res.status, 403);
    env.BLACKBAUD_TOKENS.map.set(`bb:rec:count:${new Date().toISOString().slice(0, 10)}`, '150');
    const r = await send(env, { id: '9001', op: 'amount', amount: 10 });
    assert.equal(r.status, 429);
    assert.equal(f.calls.length, 0);
  } finally {
    f.restore();
  }
});

// The upkeep route's write rules for action tags, notes and attachments, and
// the ledger and daily cap those writes pass through.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, post, stubFetch } from './helpers.mjs';
import { onRequestPost } from '../functions/api/blackbaud/ops.ts';

const URL_ = 'https://favorintl.org/api/blackbaud/ops?key=setup-key';

async function send(env, payload) {
  const res = await onRequestPost({ request: post(URL_, payload), env });
  return { status: res.status, body: await res.json() };
}

function sky() {
  return stubFetch((method, path) => {
    if (method === 'POST') return { status: 200, body: { id: '9001' } };
    return { status: 200 };
  });
}

const ledgerEntries = (env) =>
  [...env.BLACKBAUD_TOKENS.map.entries()].filter(([k]) => k.startsWith('bb:ops:log:')).map(([, v]) => JSON.parse(v));

test('a Thanked tag on an action passes, reaches Blackbaud once, and lands in the ledger', async () => {
  const env = makeEnv();
  const f = sky();
  try {
    const tag = { parent_id: '116224', category: 'Thanked', value: 'Thanked', date: '2026-10-09T00:00:00' };
    const r = await send(env, { method: 'POST', path: '/constituent/v1/actions/customfields', body: tag });
    assert.equal(r.status, 200);
    assert.equal(r.body.ok, true);
    assert.equal(r.body.calls_today, 1);
    assert.equal(f.calls.length, 1);
    assert.equal(f.calls[0].path, '/constituent/v1/actions/customfields');
    assert.deepEqual(f.calls[0].body, tag);
    const log = ledgerEntries(env);
    assert.equal(log.length, 1);
    assert.equal(log[0].method, 'POST');
    assert.equal(log[0].path, '/constituent/v1/actions/customfields');
    assert.equal(log[0].status, 200);
  } finally {
    f.restore();
  }
});

test('the hub probe (an empty tag body) gets past the route, so the hub can tell the rule is live', async () => {
  const env = makeEnv();
  const f = stubFetch(() => ({ status: 400, body: { message: 'category is required' } }));
  try {
    const r = await send(env, { method: 'POST', path: '/constituent/v1/actions/customfields', body: {} });
    assert.equal(r.body.results[0].status, 400);
    assert.equal(r.body.results[0].body.refused, undefined);
    assert.equal(f.calls.length, 1);
  } finally {
    f.restore();
  }
});

test('tag edit and delete pass; edit cannot move a tag to another action', async () => {
  const env = makeEnv();
  const f = sky();
  try {
    const edit = await send(env, {
      method: 'PATCH',
      path: '/constituent/v1/actions/customfields/76701',
      body: { value: 'Thanked', comment: 'by phone' },
    });
    assert.equal(edit.body.ok, true);
    const del = await send(env, { method: 'DELETE', path: '/constituent/v1/actions/customfields/76701' });
    assert.equal(del.body.ok, true);
    const move = await send(env, {
      method: 'PATCH',
      path: '/constituent/v1/actions/customfields/76701',
      body: { parent_id: '1', value: 'Thanked' },
    });
    assert.match(move.body.results[0].body.refused, /body keys not allowed here: parent_id/);
    assert.equal(f.calls.length, 2);
  } finally {
    f.restore();
  }
});

test('an action note can be added but not edited or deleted', async () => {
  const env = makeEnv();
  const f = sky();
  try {
    const add = await send(env, {
      method: 'POST',
      path: '/constituent/v1/actions/notes',
      body: { parent_id: '116224', date: { d: 9, m: 10, y: 2026 }, type: 'General', summary: 'Called', text: 'Left a message' },
    });
    assert.equal(add.body.ok, true);
    for (const method of ['PATCH', 'DELETE']) {
      const r = await send(env, { method, path: '/constituent/v1/actions/notes/12', body: method === 'PATCH' ? { text: 'x' } : undefined });
      assert.match(r.body.results[0].body.refused, /no write rule/);
    }
    assert.equal(f.calls.length, 1);
  } finally {
    f.restore();
  }
});

test('an action attachment can be added and removed by its GUID; edits and numeric ids are refused', async () => {
  const env = makeEnv();
  const f = sky();
  try {
    const add = await send(env, {
      method: 'POST',
      path: '/constituent/v1/actions/attachments',
      body: { parent_id: '116224', type: 'Link', name: 'Proposal', url: 'https://favorintl.org/' },
    });
    assert.equal(add.body.ok, true);
    const del = await send(env, {
      method: 'DELETE',
      path: '/constituent/v1/actions/attachments/F7AEAD3D-7F86-4B8D-909B-B76706C0DB04',
    });
    assert.equal(del.body.ok, true);
    const edit = await send(env, {
      method: 'PATCH',
      path: '/constituent/v1/actions/attachments/F7AEAD3D-7F86-4B8D-909B-B76706C0DB04',
      body: { name: 'x' },
    });
    assert.match(edit.body.results[0].body.refused, /no write rule/);
    const odd = await send(env, { method: 'DELETE', path: '/constituent/v1/actions/attachments/12' });
    assert.match(odd.body.results[0].body.refused, /no write rule/);
    const extra = await send(env, {
      method: 'POST',
      path: '/constituent/v1/actions/attachments',
      body: { parent_id: '116224', type: 'Link', url: 'https://favorintl.org/', constituent_id: '1' },
    });
    assert.match(extra.body.results[0].body.refused, /constituent_id/);
    assert.equal(f.calls.length, 2);
  } finally {
    f.restore();
  }
});

test('the daily cap still holds for the new writes', async () => {
  const env = makeEnv();
  env.BLACKBAUD_TOKENS.map.set('bb:ops:cap', '2');
  const f = sky();
  try {
    const tag = { parent_id: '116224', category: 'Thanked', value: 'Thanked' };
    const r = await send(env, {
      calls: [
        { method: 'POST', path: '/constituent/v1/actions/customfields', body: tag },
        { method: 'POST', path: '/constituent/v1/actions/customfields', body: tag },
        { method: 'POST', path: '/constituent/v1/actions/customfields', body: tag },
      ],
    });
    assert.equal(r.status, 429);
    assert.equal(r.body.error, 'daily_cap');
    assert.equal(f.calls.length, 0);
  } finally {
    f.restore();
  }
});

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

test('an action note can be added, changed and removed', async () => {
  const env = makeEnv();
  const f = sky();
  try {
    const add = await send(env, {
      method: 'POST',
      path: '/constituent/v1/actions/notes',
      body: { parent_id: '116224', date: { d: 9, m: 10, y: 2026 }, type: 'Note (general)', summary: 'Called', text: 'Left a message' },
    });
    assert.equal(add.body.ok, true);
    const edit = await send(env, { method: 'PATCH', path: '/constituent/v1/actions/notes/12', body: { text: 'Left a second message' } });
    assert.equal(edit.body.ok, true);
    const del = await send(env, { method: 'DELETE', path: '/constituent/v1/actions/notes/12' });
    assert.equal(del.body.ok, true);
    const bad = await send(env, { method: 'PATCH', path: '/constituent/v1/actions/notes/12', body: { parent_id: '1' } });
    assert.match(bad.body.results[0].body.refused, /body keys not allowed/);
    assert.equal(f.calls.length, 3);
  } finally {
    f.restore();
  }
});

test('every action field Blackbaud accepts passes on an edit, and nothing else does', async () => {
  const env = makeEnv();
  const f = sky();
  try {
    const body = {
      category: 'Meeting', completed: false, date: '2026-10-12T00:00:00', description: 'x', direction: 'Inbound', end_time: '10:30', start_time: '10:00',
      fundraisers: ['10496'], location: 'Residence', opportunity_id: '1527', outcome: 'Successful', priority: 'High', status: 'Open', summary: 's', type: 'RDD Action',
    };
    const ok = await send(env, { method: 'PATCH', path: '/constituent/v1/actions/119186', body });
    assert.equal(ok.body.ok, true);
    const bad = await send(env, { method: 'PATCH', path: '/constituent/v1/actions/119186', body: { constituent_id: '1' } });
    assert.match(bad.body.results[0].body.refused, /constituent_id/);
    const create = await send(env, { method: 'POST', path: '/constituent/v1/actions', body: { ...body, constituent_id: '27202', author: 'Hub' } });
    assert.equal(create.body.ok, true);
    assert.equal(f.calls.length, 2);
  } finally {
    f.restore();
  }
});

test('any action tag category can be added, changed and removed from its own action', async () => {
  const env = makeEnv();
  const f = stubFetch((method, path) => {
    if (method === 'GET') return { status: 200, body: { value: [{ id: '55', category: 'Number of Referrals' }] } };
    if (method === 'POST') return { status: 200, body: { id: '55' } };
    return { status: 200 };
  });
  try {
    const add = await send(env, { method: 'POST', path: '/constituent/v1/actions/customfields', body: { parent_id: '119186', category: 'Number of Referrals', value: 3 } });
    assert.equal(add.body.ok, true);
    const edit = await send(env, { method: 'PATCH', path: '/constituent/v1/actions/customfields/55', body: { value: 4 } });
    assert.equal(edit.body.ok, true);
    const noAction = await send(env, { method: 'DELETE', path: '/constituent/v1/actions/customfields/55' });
    assert.match(noAction.body.results[0].body.refused, /\?action=/);
    const wrong = await send(env, { method: 'DELETE', path: '/constituent/v1/actions/customfields/77?action=119186' });
    assert.match(wrong.body.results[0].body.refused, /must be on that action/);
    const del = await send(env, { method: 'DELETE', path: '/constituent/v1/actions/customfields/55?action=119186' });
    assert.equal(del.body.ok, true);
    assert.equal(f.calls.filter((c) => c.method === 'DELETE').length, 1);
    assert.equal(f.calls.find((c) => c.method === 'DELETE').path, '/constituent/v1/actions/customfields/55');
  } finally {
    f.restore();
  }
});

test('action attachments: a link or an uploaded file, renamed, removed', async () => {
  const env = makeEnv();
  const f = sky();
  try {
    const doc = await send(env, { method: 'POST', path: '/constituent/v1/documents', body: { file_name: 'letter.pdf', upload_thumbnail: false } });
    assert.equal(doc.body.ok, true);
    const link = await send(env, { method: 'POST', path: '/constituent/v1/actions/attachments', body: { parent_id: '119186', name: 'Letter', type: 'Link', url: 'https://example.org/x' } });
    assert.equal(link.body.ok, true);
    const ren = await send(env, { method: 'PATCH', path: '/constituent/v1/actions/attachments/e8e5cf09-2ddb-4f5a-949d-9b824e0a6ba6', body: { name: 'Thank-you letter' } });
    assert.equal(ren.body.ok, true);
    const del = await send(env, { method: 'DELETE', path: '/constituent/v1/actions/attachments/9' });
    assert.equal(del.body.ok, true);
    assert.equal(f.calls.length, 4);
  } finally {
    f.restore();
  }
});

test('opportunities can be read, created and edited, never deleted', async () => {
  const env = makeEnv();
  const f = sky();
  try {
    const read = await send(env, { method: 'GET', path: '/opportunity/v1/opportunities?constituent_id=27202' });
    assert.equal(read.body.ok, true);
    const add = await send(env, { method: 'POST', path: '/opportunity/v1/opportunities', body: { constituent_id: '27202', name: 'Test ask', status: 'Planned', purpose: 'Annual Giving', ask_amount: { value: 5000 }, fundraisers: [{ constituent_id: '10496' }] } });
    assert.equal(add.body.ok, true);
    const edit = await send(env, { method: 'PATCH', path: '/opportunity/v1/opportunities/1527', body: { status: 'Awarded - Closed', expected_amount: { value: 5000 }, inactive: true } });
    assert.equal(edit.body.ok, true);
    const bad = await send(env, { method: 'PATCH', path: '/opportunity/v1/opportunities/1527', body: { constituent_id: '1' } });
    assert.match(bad.body.results[0].body.refused, /constituent_id/);
    const del = await send(env, { method: 'DELETE', path: '/opportunity/v1/opportunities/1527' });
    assert.match(del.body.results[0].body.refused, /constituent=/);
    assert.equal(f.calls.length, 3);
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

test('an opportunity is removed only with its own partner named and no gift linked', async () => {
  const env = makeEnv();
  const f = stubFetch((method, path) => {
    if (method === 'GET' && path.endsWith('/9')) return { status: 200, body: { id: '9', constituent_id: '27202', linked_gifts: [] } };
    if (method === 'GET' && path.endsWith('/10')) return { status: 200, body: { id: '10', constituent_id: '27202', linked_gifts: ['55'] } };
    return { status: 200 };
  });
  try {
    const wrong = await send(env, { method: 'DELETE', path: '/opportunity/v1/opportunities/9?constituent=1' });
    assert.match(wrong.body.results[0].body.refused, /does not belong/);
    const gift = await send(env, { method: 'DELETE', path: '/opportunity/v1/opportunities/10?constituent=27202' });
    assert.match(gift.body.results[0].body.refused, /gift is linked/);
    const ok = await send(env, { method: 'DELETE', path: '/opportunity/v1/opportunities/9?constituent=27202' });
    assert.equal(ok.body.ok, true);
    const sent = f.calls.filter((c) => c.method === 'DELETE');
    assert.equal(sent.length, 1);
    assert.equal(sent[0].path, '/opportunity/v1/opportunities/9');
  } finally {
    f.restore();
  }
});

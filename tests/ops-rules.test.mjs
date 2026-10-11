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

test('a new partner can be created with its contact details inline, and a spouse link made, and nothing else rides along', async () => {
  const env = makeEnv();
  const f = sky();
  try {
    const body = { type: 'Individual', first: 'Test', last: 'Person', address: { type: 'Home', city: 'Tampa' }, email: { address: 'x@example.com', type: 'Email', primary: true }, phone: { number: '(813) 555-0100', type: 'Cell Phone' } };
    const ok = await send(env, { method: 'POST', path: '/constituent/v1/constituents', body });
    assert.equal(ok.body.ok, true);
    assert.deepEqual(f.calls[0].body, body);
    const rel = await send(env, { method: 'POST', path: '/constituent/v1/relationships', body: { constituent_id: '1', relation_id: '2', type: 'Spouse', reciprocal_type: 'Spouse', is_spouse: true } });
    assert.equal(rel.body.ok, true);
    const before = f.calls.length;
    const bad = await send(env, { method: 'POST', path: '/constituent/v1/constituents', body: { type: 'Individual', last: 'X', lookup_id: '5' } });
    assert.match(bad.body.results[0].body.refused, /body keys not allowed/);
    const badRel = await send(env, { method: 'POST', path: '/constituent/v1/relationships', body: { constituent_id: '1', relation_id: '2', comment: 'x' } });
    assert.match(badRel.body.results[0].body.refused, /body keys not allowed/);
    const del = await send(env, { method: 'DELETE', path: '/constituent/v1/relationships/5' });
    assert.match(del.body.results[0].body.refused, /no write rule/);
    assert.equal(f.calls.length, before);
  } finally {
    f.restore();
  }
});

test('the Contact tab writes: a new address with its dates, a narrowed address change, the record flags and the deceased mark', async () => {
  const env = makeEnv();
  const f = sky();
  try {
    const add = { constituent_id: '27202', type: 'Seasonal', address_lines: '1 Test Rd', city: 'Tampa', state: 'FL', postal_code: '33606', preferred: false, seasonal_start: '05/01', seasonal_end: '10/15' };
    assert.equal((await send(env, { method: 'POST', path: '/constituent/v1/addresses', body: add })).body.ok, true);
    assert.equal((await send(env, { method: 'PATCH', path: '/constituent/v1/addresses/55', body: { end: '2026-10-10', preferred: false } })).body.ok, true);
    const noOwner = await send(env, { method: 'PATCH', path: '/constituent/v1/addresses/55', body: { constituent_id: '1' } });
    assert.match(noOwner.body.results[0].body.refused, /constituent_id/);
    const extra = await send(env, { method: 'POST', path: '/constituent/v1/addresses', body: { ...add, lookup_id: '5' } });
    assert.match(extra.body.results[0].body.refused, /body keys not allowed/);
    const flags = { gives_anonymously: true, requests_no_email: false, no_valid_address: false, deceased: true, deceased_date: { d: 10, m: 10, y: 2026 } };
    assert.equal((await send(env, { method: 'PATCH', path: '/constituent/v1/constituents/27202', body: flags })).body.ok, true);
    const bad = await send(env, { method: 'PATCH', path: '/constituent/v1/constituents/27202', body: { lookup_id: '1' } });
    assert.match(bad.body.results[0].body.refused, /lookup_id/);
    assert.equal(f.calls.length, 3);
  } finally {
    f.restore();
  }
});

test('a contact row is removed only when it was added in the last 24 hours', async () => {
  const env = makeEnv();
  const fresh = new Date(Date.now() - 3600000).toISOString();
  const old = new Date(Date.now() - 3 * 86400000).toISOString();
  const f = stubFetch((method, path) => {
    if (method === 'GET' && path.endsWith('/phones/1')) return { status: 200, body: { id: '1', date_added: fresh } };
    if (method === 'GET' && path.endsWith('/phones/2')) return { status: 200, body: { id: '2', date_added: old } };
    if (method === 'GET' && path.endsWith('/addresses/3')) return { status: 200, body: { id: '3' } };
    return { status: 200 };
  });
  try {
    assert.equal((await send(env, { method: 'DELETE', path: '/constituent/v1/phones/1' })).body.ok, true);
    const stale = await send(env, { method: 'DELETE', path: '/constituent/v1/phones/2' });
    assert.match(stale.body.results[0].body.refused, /last 24 hours/);
    const unknown = await send(env, { method: 'DELETE', path: '/constituent/v1/addresses/3' });
    assert.match(unknown.body.results[0].body.refused, /last 24 hours/);
    assert.equal(f.calls.filter((c) => c.method === 'DELETE').length, 1);
  } finally {
    f.restore();
  }
});

test('solicit codes: read and add pass, only an end date or comment can be changed, no delete', async () => {
  const env = makeEnv();
  const f = sky();
  try {
    assert.equal((await send(env, { method: 'GET', path: '/commpref/v1/solicitcodes?constituent_id=27202' })).body.ok, true);
    assert.equal((await send(env, { method: 'POST', path: '/commpref/v1/solicitcodes', body: { constituent_id: '27202', solicit_code: 'Do Not Solicit', start_date: '2026-10-10', comment: 'test' } })).body.ok, true);
    assert.equal((await send(env, { method: 'PATCH', path: '/commpref/v1/solicitcodes/9', body: { end_date: '2026-10-10' } })).body.ok, true);
    const bad = await send(env, { method: 'POST', path: '/commpref/v1/solicitcodes', body: { constituent_id: '27202', solicit_code: 'x', channel: 'y' } });
    assert.match(bad.body.results[0].body.refused, /body keys not allowed/);
    const del = await send(env, { method: 'DELETE', path: '/commpref/v1/solicitcodes/9' });
    assert.match(del.body.results[0].body.refused, /no write rule/);
  } finally {
    f.restore();
  }
});

test('an organization contact link and a titled person can be created', async () => {
  const env = makeEnv();
  const f = sky();
  try {
    const p = await send(env, { method: 'POST', path: '/constituent/v1/constituents', body: { type: 'Individual', title: 'Dr.', first: 'A', middle: 'B', last: 'C', suffix: 'Jr.' } });
    assert.equal(p.body.ok, true);
    const rel = await send(env, { method: 'POST', path: '/constituent/v1/relationships', body: { constituent_id: '1', relation_id: '2', type: 'Contact', reciprocal_type: 'Organization', is_organization_contact: true, position: 'Pastor', organization_contact_type: 'Primary' } });
    assert.equal(rel.body.ok, true);
  } finally {
    f.restore();
  }
});

// favor-data-api's realtime gift push against an in-memory SQLite copy of the
// mirror's tables. The stand-in email row it writes for a new partner must
// never be a primary email, and must not be written when the record already
// holds that address.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import worker from '../workers/favor-data-api/src/index.ts';

const SCHEMA = `
CREATE TABLE constituents (id TEXT PRIMARY KEY, date_added TEXT, date_modified TEXT, constituent_type TEXT,
  first_name TEXT, last_name TEXT, organization_name TEXT, deceased INTEGER DEFAULT 0, inactive INTEGER DEFAULT 0,
  raw_json TEXT, synced_at TEXT);
CREATE TABLE emails (id TEXT PRIMARY KEY, date_added TEXT, date_modified TEXT, constituent_record_id TEXT,
  email_address TEXT, is_primary INTEGER DEFAULT 1, do_not_email INTEGER DEFAULT 0, is_inactive INTEGER DEFAULT 0,
  raw_json TEXT, synced_at TEXT);
CREATE TABLE gifts (id TEXT PRIMARY KEY, date_added TEXT, date_modified TEXT, gift_amount REAL, gift_date TEXT,
  gift_type TEXT, gift_status TEXT, gift_splits TEXT, constituent_record_id TEXT, gift_payment_method TEXT,
  receipt_status TEXT, receipt_number TEXT, receipt_date TEXT, post_status TEXT, raw_json TEXT, synced_at TEXT);
CREATE TABLE funds (id TEXT PRIMARY KEY, fund_id TEXT, fund_description TEXT);
`;

/** The slice of the D1 API the worker uses, over node:sqlite. */
function d1(db) {
  const statement = (sql, args = []) => ({
    bind: (...a) => statement(sql, a),
    async run() {
      const r = db.prepare(sql).run(...args);
      return { meta: { changes: Number(r.changes) } };
    },
    async first() {
      return db.prepare(sql).get(...args) ?? null;
    },
    async all() {
      return { results: db.prepare(sql).all(...args) };
    },
  });
  return { prepare: (sql) => statement(sql) };
}

function setup() {
  const db = new DatabaseSync(':memory:');
  db.exec(SCHEMA);
  return { db, env: { DB: d1(db), DATA_API_KEY: 'k' } };
}

async function call(env, method, path, body) {
  const res = await worker.fetch(
    new Request('https://data.example' + path, {
      method,
      headers: { Authorization: 'Bearer k', 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }),
    env
  );
  return res.json();
}

const gift = (over = {}) => ({
  id: '70001',
  constituent_id: '50001',
  amount: 25,
  date: '2026-10-09',
  type: 'Donation',
  gift_splits: [],
  email: 'New.Partner@Example.org',
  first: 'New',
  last: 'Partner',
  ...over,
});

test('a new partner gets a stand-in email that is not primary, and the portal still finds the gift', async () => {
  const { db, env } = setup();
  const r = await call(env, 'POST', '/gifts/realtime', gift());
  assert.equal(r.ok, true);
  const rows = db.prepare('SELECT id, email_address, is_primary, do_not_email FROM emails').all();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, 'rt-50001-new-partner-example-org');
  assert.equal(rows[0].email_address, 'new.partner@example.org');
  assert.equal(rows[0].is_primary, 0);
  const history = await call(env, 'GET', '/giving-history?email=new.partner@example.org');
  assert.equal(history.constituent.id, '50001');
  assert.equal(history.gifts.length, 1);
  const ids = await call(env, 'GET', '/constituent-ids?email=new.partner@example.org');
  assert.deepEqual(ids.ids, ['50001']);
});

test('a record with a different primary address keeps one primary email', async () => {
  const { db, env } = setup();
  db.prepare(`INSERT INTO constituents (id, first_name, last_name, deceased) VALUES ('50002', 'Ann', 'Lee', 0)`).run();
  db.prepare(`INSERT INTO emails (id, constituent_record_id, email_address, is_primary) VALUES ('81001', '50002', 'ann@home.org', 1)`).run();
  await call(env, 'POST', '/gifts/realtime', gift({ id: '70002', constituent_id: '50002', email: 'ann@work.org' }));
  const primaries = db.prepare(`SELECT id FROM emails WHERE constituent_record_id = '50002' AND is_primary = 1`).all();
  assert.deepEqual(primaries.map((r) => r.id), ['81001']);
  assert.equal(db.prepare(`SELECT COUNT(*) n FROM emails WHERE constituent_record_id = '50002'`).get().n, 2);
});

test('no stand-in is written when the record already holds the address', async () => {
  const { db, env } = setup();
  db.prepare(`INSERT INTO constituents (id, first_name, last_name, deceased) VALUES ('50003', 'Bo', 'Ng', 0)`).run();
  db.prepare(`INSERT INTO emails (id, constituent_record_id, email_address, is_primary) VALUES ('81002', '50003', 'bo@ng.org', 1)`).run();
  await call(env, 'POST', '/gifts/realtime', gift({ id: '70003', constituent_id: '50003', email: 'BO@ng.org' }));
  const rows = db.prepare(`SELECT id FROM emails WHERE constituent_record_id = '50003'`).all();
  assert.deepEqual(rows.map((r) => r.id), ['81002']);
});

test('a second gift from the same new partner adds no second stand-in', async () => {
  const { db, env } = setup();
  await call(env, 'POST', '/gifts/realtime', gift());
  await call(env, 'POST', '/gifts/realtime', gift({ id: '70004' }));
  assert.equal(db.prepare('SELECT COUNT(*) n FROM emails').get().n, 1);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM gifts').get().n, 2);
});

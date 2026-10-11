// /api/blackbaud/ops — guarded pass-through to the SKY API for database
// upkeep (monthly source codes, new-record review, gift data verification,
// assignment cleanup). Setup-key guarded like the other admin routes.
//
// POST ?key=<BLACKBAUD_SETUP_KEY>
//      { "method": "GET", "path": "/constituent/v1/constituents/123" }
//      { "method": "PATCH", "path": "/gift/v1/gifts/66187", "body": { ... } }
//      { "calls": [ { ... }, { ... } ] }      up to 15, run in order
//
// GET  ?key=...&log=2026-10-02               the day's write ledger
//
// Reads are open across the record APIs. Writes pass only when the method
// and path match WRITE_RULES below, and where a rule names body keys, only
// those keys. Nothing here can delete a gift, change a gift amount, or reach
// the Payments API. A constituent can be deleted only as the last step of
// folding in a duplicate: it must hold no gifts and the caller must restate
// its lookup ID.
//
// Every write lands in a KV ledger (180 days) with its status, so any change
// made through this route can be traced to a day and a call. A daily cap
// keeps upkeep work from spending the allowance the giving form needs; the
// website, the partner portal and this route share one subscription. The
// count runs per UTC day, the same window Blackbaud uses.

import { bbFetch, requireCredentials, type Env } from '../_lib/blackbaud';
import { errorJson, handleError, json, requireSetupKey } from '../_lib/http';

const READ_PREFIXES = [
  '/constituent/v1/',
  '/gift/v1/',
  '/gft-gifts/',
  '/gift-batch/v1/',
  '/fundraising/v1/',
  '/nxt-data-integration/v1/re/',
  '/query/',
  '/import/',
  '/opportunity/v1/',
];

interface WriteRule {
  methods: string[];
  path: RegExp;
  /** When set, the JSON body may carry only these top-level keys. */
  keys?: string[];
  /** When set and the body names a category, it must be one of these. */
  categories?: string[];
}

// Action tags (custom fields on an action). The Work Center edits every
// category Blackbaud offers on an action, so the category is not limited here;
// the body keys are.
const ACTION_TAG_DELETE = /^\/constituent\/v1\/actions\/customfields\/(\d+)$/;

// Every field Blackbaud's ActionEdit accepts (SKY constituent v1).
const ACTION_EDIT_KEYS = [
  'category', 'completed', 'completed_date', 'date', 'description', 'direction', 'end_time', 'fundraisers', 'location',
  'opportunity_id', 'outcome', 'priority', 'start_time', 'status', 'summary', 'type', 'campaign_id', 'fund_id', 'appeal_id',
  'issue', 'letter_code',
];
// ActionAdd: the same fields plus the partner and the author.
const ACTION_ADD_KEYS = [...ACTION_EDIT_KEYS, 'constituent_id', 'author'];
// OpportunityEdit (SKY opportunity v1). Funded amount is the opportunity's own
// field; no gift is created, changed or linked through it.
const OPPORTUNITY_EDIT_KEYS = [
  'ask_amount', 'ask_date', 'campaign_id', 'deadline', 'expected_amount', 'expected_date', 'fund_id', 'funded_amount',
  'funded_date', 'fundraisers', 'inactive', 'name', 'summary', 'purpose', 'status', 'likelihood', 'gift_type', 'reason',
  'original_ask_amount', 'original_ask_date', 'instrument', 'org_contact_id', 'date_rated',
];
const OPPORTUNITY_ADD_KEYS = [...OPPORTUNITY_EDIT_KEYS, 'constituent_id'];

// Address body keys (SKY AddressAdd and AddressEdit). The partner is named on create only.
const ADDRESS_KEYS = [
  'address_lines', 'city', 'state', 'postal_code', 'country', 'county', 'type', 'preferred', 'do_not_mail', 'start', 'end',
  'seasonal_start', 'seasonal_end', 'inactive',
];

const WRITE_RULES: WriteRule[] = [
  // Code table entries (monthly source codes).
  { methods: ['POST'], path: /^\/nxt-data-integration\/v1\/re\/codetables\/\d+\/tableentries$/ },
  // Gift appeal, campaign, fund and package on existing splits, the gift's
  // constituency and its gift code. Amount and constituent stay out of reach.
  { methods: ['PATCH'], path: /^\/gift\/v1\/gifts\/\d+$/, keys: ['gift_splits', 'constituency', 'gift_code'] },
  { methods: ['POST'], path: /^\/gift\/v1\/gifts\/customfields$/ },
  { methods: ['PATCH', 'DELETE'], path: /^\/gift\/v1\/gifts\/customfields\/\d+$/ },
  // New-record review: names, codes, custom fields, addresses, actions.
  {
    methods: ['PATCH'],
    path: /^\/constituent\/v1\/constituents\/\d+$/,
    keys: [
      'title', 'first', 'middle', 'last', 'suffix', 'preferred_name', 'former_name', 'name', 'inactive',
      // The Work Center's Record tab: the deceased mark and date, and the three record flags.
      'deceased', 'deceased_date', 'gives_anonymously', 'requests_no_email', 'no_valid_address',
    ],
  },
  // A new partner from the Work Center's Add a partner (Support only, behind the hub's duplicate check and its "none of these is the same
  // person" tick): the record with its address, email and phone inline, and a spouse link for a household. The code and the holder use
  // the constituent code and assignment rules below.
  { methods: ['POST'], path: /^\/constituent\/v1\/constituents$/, keys: ['type', 'first', 'last', 'name', 'address', 'email', 'phone', 'middle', 'title', 'suffix'] },
  {
    methods: ['POST'],
    path: /^\/constituent\/v1\/relationships$/,
    keys: ['constituent_id', 'relation_id', 'type', 'reciprocal_type', 'is_spouse', 'is_organization_contact', 'position', 'organization_contact_type'],
  },
  { methods: ['POST'], path: /^\/constituent\/v1\/constituents\/customfields$/ },
  { methods: ['PATCH', 'DELETE'], path: /^\/constituent\/v1\/constituents\/customfields\/\d+$/ },
  { methods: ['POST'], path: /^\/constituent\/v1\/constituentcodes$/ },
  { methods: ['PATCH', 'DELETE'], path: /^\/constituent\/v1\/constituentcodes\/\d+$/ },
  // Addresses (the Work Center's Contact tab): add, change, end. A delete passes only for a row added in the last 24 hours (the Undo of
  // an add); checked in run().
  { methods: ['POST'], path: /^\/constituent\/v1\/addresses$/, keys: ADDRESS_KEYS.concat('constituent_id') },
  { methods: ['PATCH'], path: /^\/constituent\/v1\/addresses\/\d+$/, keys: ADDRESS_KEYS },
  { methods: ['PATCH'], path: /^\/constituent\/v1\/(emailaddresses|phones)\/\d+$/ },
  // Solicit codes are the Constituent API's communication preferences, readable per partner. (The Communication Preference API's own /commpref/v1/solicitcodes route lists the code table only, and its POST answers 404; probed 2026-10-10.)
  { methods: ['POST'], path: /^\/constituent\/v1\/communicationpreferences$/, keys: ['constituent_id', 'solicit_code', 'start', 'end'] },
  { methods: ['PATCH'], path: /^\/constituent\/v1\/communicationpreferences\/\d+$/, keys: ['solicit_code', 'start', 'end'] },
  // Primary addressee and salutation. Records the giving form creates have none.
  { methods: ['POST'], path: /^\/constituent\/v1\/primarynameformats$/ },
  { methods: ['PATCH'], path: /^\/constituent\/v1\/primarynameformats\/[A-Za-z0-9_-]+$/ },
  // Actions (Work Center): every field Blackbaud accepts on create and edit.
  { methods: ['POST'], path: /^\/constituent\/v1\/actions$/, keys: ACTION_ADD_KEYS },
  { methods: ['PATCH'], path: /^\/constituent\/v1\/actions\/\d+$/, keys: ACTION_EDIT_KEYS },
  // Action tags: add, change and remove (removal names its action, checked in run()).
  { methods: ['POST'], path: /^\/constituent\/v1\/actions\/customfields$/, keys: ['parent_id', 'category', 'value', 'date', 'comment'] },
  { methods: ['PATCH'], path: /^\/constituent\/v1\/actions\/customfields\/\d+$/, keys: ['value', 'date', 'comment'] },
  // Action notes: add, change, remove.
  { methods: ['POST'], path: /^\/constituent\/v1\/actions\/notes$/, keys: ['parent_id', 'date', 'type', 'summary', 'text', 'author'] },
  { methods: ['PATCH'], path: /^\/constituent\/v1\/actions\/notes\/\d+$/, keys: ['date', 'type', 'summary', 'text'] },
  { methods: ['DELETE'], path: /^\/constituent\/v1\/actions\/notes\/\d+$/ },
  // Action attachments: a link, or a file put first at the upload address
  // POST /documents returns. Change the name or link, remove.
  { methods: ['POST'], path: /^\/constituent\/v1\/documents$/, keys: ['file_name', 'upload_thumbnail'] },
  {
    methods: ['POST'],
    path: /^\/constituent\/v1\/actions\/attachments$/,
    keys: ['parent_id', 'name', 'type', 'url', 'date', 'file_id', 'file_name', 'thumbnail_id', 'tags'],
  },
  // Attachment ids are GUIDs.
  { methods: ['PATCH'], path: /^\/constituent\/v1\/actions\/attachments\/[A-Za-z0-9-]{1,40}$/, keys: ['name', 'date', 'url', 'tags'] },
  { methods: ['DELETE'], path: /^\/constituent\/v1\/actions\/attachments\/[A-Za-z0-9-]{1,40}$/ },
  // Opportunities (moves management): create and edit. No delete; an
  // opportunity is marked inactive instead.
  { methods: ['POST'], path: /^\/opportunity\/v1\/opportunities$/, keys: OPPORTUNITY_ADD_KEYS },
  { methods: ['PATCH'], path: /^\/opportunity\/v1\/opportunities\/\d+$/, keys: OPPORTUNITY_EDIT_KEYS },
  // Fundraiser assignments: add and end. No delete.
  { methods: ['POST'], path: /^\/fundraising\/v1\/fundraisers\/assignments$/ },
  { methods: ['PATCH'], path: /^\/fundraising\/v1\/fundraisers\/assignments\/\d+$/ },
  // Run a saved query (backups, verification exports).
  { methods: ['POST'], path: /^\/query\/queries\/executebyid$/ },
  // Run an unsaved query. Reads only: the gift phase copies a saved query's
  // criteria and asks for gift IDs where the saved output is a total.
  { methods: ['POST'], path: /^\/query\/queries\/execute$/ },
  // Saved queries: criteria only (no rename, move or delete), and the refresh
  // a static query needs before its global change runs.
  { methods: ['PATCH'], path: /^\/query\/queries\/\d+$/, keys: ['filter_fields'] },
  { methods: ['POST'], path: /^\/query\/queries\/refreshstaticquery$/ },
  // Folding a duplicate record into the one already on file: carry its contact
  // rows and notes over, remove the copied actions from the duplicate.
  { methods: ['POST'], path: /^\/constituent\/v1\/(emailaddresses|phones|notes)$/ },
  // A note on the partner record, changed or removed from the hub's partner view (and the Undo of one just added).
  { methods: ['PATCH'], path: /^\/constituent\/v1\/notes\/\d+$/, keys: ['date', 'summary', 'text', 'type'] },
  { methods: ['DELETE'], path: /^\/constituent\/v1\/notes\/\d+$/ },
  { methods: ['DELETE'], path: /^\/constituent\/v1\/actions\/\d+$/ },
  // Import jobs (Blackbaud's Import API, in preview): set a job up, start it,
  // remove it. The file itself goes to the upload address the job returns.
  { methods: ['POST'], path: /^\/import\/jobs$/, keys: ['file_name', 'header_row', 'validation_mode'] },
  { methods: ['PATCH'], path: /^\/import\/jobs\/[A-Za-z0-9-]+$/, keys: ['file_name', 'header_row', 'validation_mode'] },
  { methods: ['POST'], path: /^\/import\/jobs\/start$/, keys: ['job_id'] },
  { methods: ['DELETE'], path: /^\/import\/jobs\/[A-Za-z0-9-]+$/ },
];

// The duplicate itself can then be deleted. The caller restates the lookup ID
// (?lookup=) and the record must hold no gifts; both are checked here against
// Blackbaud before the delete is sent.
// A contact row (address, phone, email) can be removed only when this route made it in the last 48 hours: the Undo of an add from the hub.
// Older rows, and rows made any other way, are ended or marked inactive, never deleted. Blackbaud does not stamp a new row at once, so the
// route keeps its own note of each row it creates (KV bb:ops:made:<kind>:<id>, the partner it was made for) and checks that note.
const DELETE_CONTACT = /^\/constituent\/v1\/(addresses|phones|emailaddresses)\/(\d+)$/;

// A solicit code is removed on the same terms: only one this route made in the last 48 hours, for the partner the caller names.
const DELETE_COMMPREF = /^\/constituent\/v1\/communicationpreferences\/(\d+)$/;

const MADE_CONTACT = /^\/constituent\/v1\/(addresses|phones|emailaddresses|communicationpreferences)$/;
const MADE_TTL_SECONDS = 2 * 86400;

const DELETE_CONSTITUENT = /^\/constituent\/v1\/constituents\/(\d+)$/;

// An opportunity can be removed only when the caller restates its partner
// (?constituent=<system id>) and no gift is linked to it: the Work Center's
// Undo of an opportunity it just added. Checked against Blackbaud in run().
const DELETE_OPPORTUNITY = /^\/opportunity\/v1\/opportunities\/(\d+)$/;

// Blackbaud counts the allowance per UTC day. On 2026-10-02 the key this site
// uses stopped at about 1,000 calls and the giving form went down until the
// reset, so the default leaves giving and the portal most of that tier. KV key
// bb:ops:cap raises it once a larger tier is confirmed on this key.
const DEFAULT_DAILY_CAP = 300;
const MAX_BATCH = 15;
const LOG_TTL_SECONDS = 180 * 86400;
const QUOTA_STOP_KEY = 'bb:ops:quota_stop';

interface OpsCall {
  method?: unknown;
  path?: unknown;
  body?: unknown;
}

interface OpsResult {
  ok: boolean;
  status: number;
  method: string;
  path: string;
  body: unknown;
}

function refusal(method: string, path: string, why: string): OpsResult {
  return { ok: false, status: 0, method, path, body: { refused: why } };
}

function check(method: string, path: string, body: unknown): string | null {
  if (!path.startsWith('/') || path.includes('..') || path.includes('//')) return 'bad path';
  const pathname = path.split('?')[0];
  if (!READ_PREFIXES.some((p) => pathname.startsWith(p))) return 'path is outside the record APIs';
  if (method === 'GET') return null;
  if (method === 'DELETE' && ACTION_TAG_DELETE.test(pathname)) return null; // category verified in run()
  if (method === 'DELETE' && DELETE_CONTACT.test(pathname)) {
    return /[?&]constituent=\d+$/.test(path) ? null : 'removing a contact row needs ?constituent=<its partner>';
  }
  if (method === 'DELETE' && DELETE_COMMPREF.test(pathname)) {
    return /[?&]constituent=\d+$/.test(path) ? null : 'removing a solicit code needs ?constituent=<its partner>';
  }
  if (method === 'DELETE' && DELETE_OPPORTUNITY.test(pathname)) {
    return /[?&]constituent=\d+$/.test(path) ? null : 'removing an opportunity needs ?constituent=<its partner>';
  }
  if (method === 'DELETE' && DELETE_CONSTITUENT.test(pathname)) {
    return /[?&]lookup=\d+$/.test(path) ? null : 'deleting a constituent needs ?lookup=<lookup id>';
  }
  const rule = WRITE_RULES.find((r) => r.methods.includes(method) && r.path.test(pathname));
  if (!rule) return `no write rule for ${method} ${pathname}`;
  if (rule.keys) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return 'body must be a JSON object';
    const extra = Object.keys(body as Record<string, unknown>).filter((k) => !rule.keys!.includes(k));
    if (extra.length > 0) return `body keys not allowed here: ${extra.join(', ')}`;
  }
  if (rule.categories) {
    const category = (body as Record<string, unknown> | undefined)?.category;
    if (category !== undefined && !rule.categories.includes(String(category))) return `tag category not allowed here: ${String(category)}`;
  }
  return null;
}

async function bump(env: Env, day: string, by: number): Promise<number> {
  const key = `bb:ops:count:${day}`;
  const current = Number((await env.BLACKBAUD_TOKENS.get(key)) ?? '0') || 0;
  try {
    await env.BLACKBAUD_TOKENS.put(key, String(current + by), { expirationTtl: 3 * 86400 });
  } catch {
    /* the count is a guard rail, never a reason to fail a call */
  }
  return current + by;
}

async function ledger(env: Env, day: string, entry: Record<string, unknown>): Promise<void> {
  try {
    const key = `bb:ops:log:${day}:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await env.BLACKBAUD_TOKENS.put(key, JSON.stringify(entry), { expirationTtl: LOG_TTL_SECONDS });
  } catch {
    /* best effort */
  }
}

async function run(env: Env, day: string, call: OpsCall): Promise<OpsResult> {
  const method = String(call.method ?? 'GET').toUpperCase();
  const path = String(call.path ?? '');
  const why = check(method, path, call.body);
  if (why) return refusal(method, path, why);

  let tagDelete: string | null = null;
  if (method === 'DELETE' && ACTION_TAG_DELETE.test(path.split('?')[0])) {
    // Blackbaud cannot read one action tag by id, so the caller names the action (?action=<id>) and the route finds the tag in that action's list.
    const tagId = ACTION_TAG_DELETE.exec(path.split('?')[0])![1];
    const parent = new URLSearchParams(path.split('?')[1] ?? '').get('action');
    const read = parent && /^\d+$/.test(parent) ? await bbFetch(env, `/constituent/v1/actions/${parent}/customfields`, { method: 'GET' }) : null;
    const list = read && read.ok ? ((await read.json().catch(() => null)) as { value?: { id?: string; category?: string }[] } | null) : null;
    const tag = list && Array.isArray(list.value) ? list.value.find((t) => String(t.id) === tagId) : null;
    if (!tag) {
      return refusal(method, path, 'a tag is removed with ?action=<its action id>, and the tag must be on that action');
    }
    tagDelete = `/constituent/v1/actions/customfields/${tagId}`;
  }

  let oppDelete: string | null = null;
  const opp = method === 'DELETE' ? DELETE_OPPORTUNITY.exec(path.split('?')[0]) : null;
  if (opp) {
    const owner = new URLSearchParams(path.split('?')[1] ?? '').get('constituent');
    const read = await bbFetch(env, `/opportunity/v1/opportunities/${opp[1]}`, { method: 'GET' });
    const o = read.ok ? ((await read.json().catch(() => null)) as { constituent_id?: string; linked_gifts?: unknown[] } | null) : null;
    if (!o || String(o.constituent_id) !== owner) return refusal(method, path, 'the opportunity does not belong to that partner');
    if (Array.isArray(o.linked_gifts) && o.linked_gifts.length) return refusal(method, path, 'a gift is linked to this opportunity; it cannot be removed here');
    oppDelete = `/opportunity/v1/opportunities/${opp[1]}`;
  }

  // A contact row or solicit code is removed only as the Undo of one this route just made, named with its partner.
  let contactForward: string | null = null;
  const contactDel = method === 'DELETE' ? DELETE_CONTACT.exec(path.split('?')[0]) : null;
  const prefDel = method === 'DELETE' ? DELETE_COMMPREF.exec(path.split('?')[0]) : null;
  if (contactDel || prefDel) {
    const owner = new URLSearchParams(path.split('?')[1] ?? '').get('constituent') ?? '';
    const kind = contactDel ? contactDel[1] : 'communicationpreferences';
    const id = contactDel ? contactDel[2] : prefDel![1];
    const made = await env.BLACKBAUD_TOKENS.get(`bb:ops:made:${kind}:${id}`);
    if (!made || made !== owner) {
      return refusal(method, path, 'only a row this route made in the last two days, on the partner named, can be removed here; end or deactivate older ones');
    }
    contactForward = `/constituent/v1/${kind}/${id}`;
  }

  let forward = oppDelete ?? tagDelete ?? contactForward ?? path;
  const doomed = method === 'DELETE' ? DELETE_CONSTITUENT.exec(path.split('?')[0]) : null;
  if (doomed) {
    const lookup = new URLSearchParams(path.split('?')[1] ?? '').get('lookup');
    const who = await bbFetch(env, `/constituent/v1/constituents/${doomed[1]}`, { method: 'GET' });
    const person = who.ok ? ((await who.json()) as { lookup_id?: string }) : null;
    if (!person || String(person.lookup_id) !== lookup) {
      return refusal(method, path, 'lookup id does not match this record');
    }
    const gifts = await bbFetch(env, `/gift/v1/gifts?constituent_id=${doomed[1]}&limit=1`, { method: 'GET' });
    const found = gifts.ok ? ((await gifts.json()) as { count?: number }) : null;
    if (!found || typeof found.count !== 'number' || found.count > 0) {
      return refusal(method, path, 'this record holds gifts or could not be checked; it cannot be deleted here');
    }
    forward = `/constituent/v1/constituents/${doomed[1]}`;
  }

  const init: RequestInit = { method };
  if (method !== 'GET' && call.body !== undefined) init.body = JSON.stringify(call.body);
  const res = await bbFetch(env, forward, init);
  const text = await res.text();
  let body: unknown = null;
  if (text.trim()) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text.slice(0, 2000);
    }
  }
  if (method === 'POST' && res.ok && body && typeof body === 'object') {
    const kind = MADE_CONTACT.exec(path.split('?')[0]);
    const id = (body as { id?: unknown }).id;
    const owner = (call.body as { constituent_id?: unknown } | undefined)?.constituent_id;
    if (kind && id && owner) {
      await env.BLACKBAUD_TOKENS.put(`bb:ops:made:${kind[1]}:${String(id)}`, String(owner), { expirationTtl: MADE_TTL_SECONDS }).catch(() => {});
    }
  }
  if (method !== 'GET') {
    await ledger(env, day, {
      at: new Date().toISOString(),
      method,
      path,
      status: res.status,
      sent: call.body === undefined ? null : JSON.stringify(call.body).slice(0, 600),
      got: res.ok ? null : JSON.stringify(body).slice(0, 400),
    });
  }
  return { ok: res.ok, status: res.status, method, path, body };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    requireCredentials(env);
    const payload = (await request.json().catch(() => null)) as (OpsCall & { calls?: unknown }) | null;
    if (!payload || typeof payload !== 'object') return errorJson('bad_json', 'Request body must be JSON', 400);

    const calls: OpsCall[] = Array.isArray(payload.calls) ? (payload.calls as OpsCall[]) : [payload];
    if (calls.length === 0 || calls.length > MAX_BATCH) {
      return errorJson('bad_batch', `Send between 1 and ${MAX_BATCH} calls`, 400);
    }

    // Once Blackbaud refuses a call on quota, upkeep waits for the reset
    // instead of spending retries the giving form could use.
    const stopUntil = Number((await env.BLACKBAUD_TOKENS.get(QUOTA_STOP_KEY)) ?? '0') || 0;
    if (Date.now() < stopUntil) {
      return errorJson('quota_stop', 'Blackbaud is out of allowance; upkeep waits for the reset', 429, {
        until: new Date(stopUntil).toISOString(),
      });
    }

    const day = new Date().toISOString().slice(0, 10);
    const cap = Number((await env.BLACKBAUD_TOKENS.get('bb:ops:cap')) ?? '') || DEFAULT_DAILY_CAP;
    const used = await bump(env, day, calls.length);
    if (used > cap) {
      return errorJson('daily_cap', `Upkeep calls are capped at ${cap} a day so giving keeps its allowance`, 429, { used });
    }

    const results: OpsResult[] = [];
    for (const call of calls) {
      const result = await run(env, day, call);
      results.push(result);
      if (result.status === 403 && JSON.stringify(result.body ?? '').includes('quota')) {
        const reset = new Date();
        reset.setUTCHours(24, 5, 0, 0);
        await env.BLACKBAUD_TOKENS.put(QUOTA_STOP_KEY, String(reset.getTime()), { expirationTtl: 86400 }).catch(() => {});
      }
      // A refused or throttled call stops the batch so later calls never run
      // against a state the earlier ones were meant to set up.
      if (result.status === 0 || result.status === 429 || result.status === 403) break;
    }
    return json({ ok: results.every((r) => r.ok), calls_today: used, cap, results });
  } catch (err) {
    return handleError(err);
  }
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireSetupKey(env, request);
    const search = new URL(request.url).searchParams;
    const day = (search.get('log') ?? new Date().toISOString().slice(0, 10)).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return errorJson('bad_day', 'log must be YYYY-MM-DD', 400);

    const entries: unknown[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 5; page++) {
      const list = await env.BLACKBAUD_TOKENS.list({ prefix: `bb:ops:log:${day}:`, cursor, limit: 1000 });
      for (const k of list.keys) {
        const raw = await env.BLACKBAUD_TOKENS.get(k.name);
        if (raw) entries.push(JSON.parse(raw));
        if (entries.length >= 400) break;
      }
      if (list.list_complete || entries.length >= 400) break;
      cursor = list.cursor;
    }
    const count = Number((await env.BLACKBAUD_TOKENS.get(`bb:ops:count:${day}`)) ?? '0') || 0;
    return json({ ok: true, day, calls: count, writes: entries.length, entries });
  } catch (err) {
    return handleError(err);
  }
};

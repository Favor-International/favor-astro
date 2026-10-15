// Staff changes to a recurring gift schedule: the amount, the frequency and the status. FavorOS calls this through
// /api/blackbaud/recurring-edit. Every change reads the schedule first, sends one write, reads the schedule back and answers with
// what Blackbaud stored. A write that did not take is an error, never a success.
//
// Blackbaud's RecurringGift validation (since Aug 2026): the schedule record stays post_status DoNotPost and carries its payments
// array, so both go back on every edit, taken from the single-gift read. Payment tokens never leave this file: they are not logged
// and not returned.

import { bbFetch, bbJson, BlackbaudError, type Env } from './blackbaud';
import { isRecurringStatus, setRecurringGiftStatus, type RecurringStatus } from './recurring-status';

export const FREQUENCIES = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY'] as const;
export type Frequency = (typeof FREQUENCIES)[number];
export const EDIT_OPS = ['amount', 'frequency', 'status', 'skip', 'next_date'] as const;
export type EditOp = (typeof EDIT_OPS)[number];

export interface Snapshot {
  id: string;
  constituent_id: string;
  amount: number | null;
  frequency: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  next_date: string | null;
}

export interface GiftRead {
  id: string;
  type?: string;
  constituent_id?: string;
  gift_status?: string;
  amount?: { value?: number };
  gift_splits?: { id?: string; fund_id?: string; amount?: { value?: number } }[];
  post_status?: string;
  payments?: unknown[];
  recurring_gift_schedule?: { frequency?: string; start_date?: string; end_date?: string; next_transaction_date?: string };
}

export interface EditInput {
  id: string;
  op: EditOp;
  amount?: unknown;
  frequency?: unknown;
  status?: unknown;
  /** next_date only: YYYY-MM-DD, used to put a skipped charge back. */
  date?: unknown;
}

export interface EditResult {
  ok: true;
  id: string;
  op: EditOp;
  before: Snapshot;
  after: Snapshot;
  calls: number;
}

export const snap = (g: GiftRead): Snapshot => ({
  id: String(g.id),
  constituent_id: String(g.constituent_id ?? ''),
  amount: typeof g.amount?.value === 'number' ? g.amount.value : null,
  frequency: g.recurring_gift_schedule?.frequency ?? null,
  status: g.gift_status ?? null,
  start_date: g.recurring_gift_schedule?.start_date?.slice(0, 10) ?? null,
  end_date: g.recurring_gift_schedule?.end_date?.slice(0, 10) ?? null,
  next_date: g.recurring_gift_schedule?.next_transaction_date?.slice(0, 10) ?? null,
});

const read = (env: Env, id: string) => bbJson<GiftRead>(env, `/gift/v1/gifts/${encodeURIComponent(id)}`);

async function patch(env: Env, id: string, body: unknown): Promise<{ ok: boolean; status: number }> {
  const res = await bbFetch(env, `/gift/v1/gifts/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) });
  await res.text().catch(() => '');
  return { ok: res.ok, status: res.status };
}

const MONTHS_PER: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, ANNUALLY: 12 };

/** The date one cycle after `ymd` for this frequency. A month end stays a month end (Jan 31 + 1 month = Feb 28). */
export function addCycle(ymd: string, frequency: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd);
  if (!m) return null;
  const f = frequency.toUpperCase();
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (f === 'WEEKLY') return new Date(Date.UTC(y, mo - 1, d + 7)).toISOString().slice(0, 10);
  const add = MONTHS_PER[f];
  if (!add) return null;
  const last = new Date(Date.UTC(y, mo - 1 + add + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, mo - 1 + add, Math.min(d, last))).toISOString().slice(0, 10);
}

/** Body that moves the next charge date. Keeps the frequency, start and end dates, DoNotPost and the payments. */
export function buildDateBody(g: GiftRead, date: string): { full: Record<string, unknown>; minimal: Record<string, unknown> } {
  const guard: Record<string, unknown> = { post_status: 'DoNotPost' };
  if (Array.isArray(g.payments) && g.payments.length) guard.payments = g.payments;
  const sched = g.recurring_gift_schedule ?? {};
  const schedule: Record<string, unknown> = { frequency: sched.frequency, next_transaction_date: date };
  if (sched.start_date) schedule.start_date = sched.start_date;
  if (sched.end_date) schedule.end_date = sched.end_date;
  return { full: { recurring_gift_schedule: schedule, ...guard }, minimal: { recurring_gift_schedule: schedule } };
}

/** The two bodies for one edit: the full one (DoNotPost and payments) and the older minimal one, used only if the full one is refused with a 400. */
export function buildBodies(g: GiftRead, op: 'amount' | 'frequency', value: number | Frequency): { full: Record<string, unknown>; minimal: Record<string, unknown> } {
  const guard: Record<string, unknown> = { post_status: 'DoNotPost' };
  if (Array.isArray(g.payments) && g.payments.length) guard.payments = g.payments;
  if (op === 'amount') {
    const split = g.gift_splits![0];
    const splitBody: Record<string, unknown> = { fund_id: split.fund_id, amount: { value } };
    if (split.id) splitBody.id = split.id;
    const core = { amount: { value }, gift_splits: [splitBody] };
    return { full: { ...core, ...guard }, minimal: core };
  }
  const sched = g.recurring_gift_schedule ?? {};
  const schedule: Record<string, unknown> = { frequency: value };
  if (sched.start_date) schedule.start_date = sched.start_date;
  if (sched.end_date) schedule.end_date = sched.end_date;
  return { full: { recurring_gift_schedule: schedule, ...guard }, minimal: { recurring_gift_schedule: schedule } };
}

/**
 * Apply one edit. `only` is the test lock: when set, the schedule must belong to that constituent.
 * `calls` counts every Blackbaud request made, for the day's ledger.
 */
export async function applyRecurringEdit(env: Env, inputIn: EditInput, only = ''): Promise<EditResult> {
  let input = inputIn;
  const id = String(input.id ?? '').trim();
  if (!/^\d{1,12}$/.test(id)) throw new BlackbaudError('bad_id', 'id must be a Blackbaud gift id', 400);
  if (!(EDIT_OPS as readonly string[]).includes(input.op)) throw new BlackbaudError('bad_op', 'op must be amount, frequency, status, skip or next_date', 400);
  let calls = 1;
  const g = await read(env, id);
  if (g.type !== 'RecurringGift') throw new BlackbaudError('not_recurring', 'That gift is not a recurring gift schedule.', 409);
  if (only && String(g.constituent_id) !== only) throw new BlackbaudError('test_lock', `Test lock: schedule changes go to constituent ${only} only.`, 403);
  const before = snap(g);

  if (input.op === 'status') {
    const wanted = String(input.status ?? '');
    if (!isRecurringStatus(wanted)) throw new BlackbaudError('bad_status', 'status must be Active, Held or Terminated', 400);
    if (before.status === 'Terminated' && wanted !== 'Terminated') throw new BlackbaudError('ended', 'A stopped schedule cannot be restarted. Set up a new one.', 409);
    if (before.status !== wanted) {
      const out = await setRecurringGiftStatus(env, id, wanted as RecurringStatus);
      calls += out.attempts.length * 2;
    }
  } else if (input.op === 'skip' || input.op === 'next_date') {
    if (before.status !== 'Active') throw new BlackbaudError('not_active', 'Only an active schedule can skip a charge.', 409);
    if (!before.next_date || !before.frequency) throw new BlackbaudError('no_next', 'This schedule has no next charge date to move.', 409);
    const wantedDate = input.op === 'skip' ? addCycle(before.next_date, before.frequency) : String(input.date ?? '').slice(0, 10);
    if (!wantedDate || !/^\d{4}-\d{2}-\d{2}$/.test(wantedDate) || Number.isNaN(Date.parse(wantedDate + 'T12:00:00Z'))) throw new BlackbaudError('bad_date', 'That is not a usable date.', 400);
    if (before.end_date && wantedDate > before.end_date) throw new BlackbaudError('past_end', 'That would pass the end date. Stop the schedule instead.', 409);
    if (Math.abs(Date.parse(wantedDate + 'T12:00:00Z') - Date.parse(before.next_date + 'T12:00:00Z')) > 400 * 86400000) throw new BlackbaudError('bad_date', 'That date is too far from the next charge.', 400);
    if (wantedDate !== before.next_date) {
      const bodies = buildDateBody(g, wantedDate);
      let sent = await patch(env, id, bodies.full);
      calls++;
      if (!sent.ok && sent.status === 400) {
        sent = await patch(env, id, bodies.minimal);
        calls++;
      }
      if (!sent.ok) throw new BlackbaudError('sky_api_error', `Blackbaud refused the change (${sent.status}).`, sent.status >= 500 ? 502 : sent.status);
    }
    input = { ...input, date: wantedDate };
  } else {
    if (before.status !== 'Active' && before.status !== 'Held') throw new BlackbaudError('not_active', 'Only an active or held schedule can be changed.', 409);
    let value: number | Frequency;
    if (input.op === 'amount') {
      const n = typeof input.amount === 'number' ? input.amount : Number(input.amount);
      if (!Number.isFinite(n) || n < 1 || n > 250000) throw new BlackbaudError('bad_amount', 'The amount must be between $1 and $250,000.', 400);
      value = Math.round(n * 100) / 100;
      if (!Array.isArray(g.gift_splits) || g.gift_splits.length !== 1 || !g.gift_splits[0].fund_id) {
        throw new BlackbaudError('split_schedule', 'This schedule is split across funds. It has to be changed in Raisers Edge.', 409);
      }
    } else {
      const f = String(input.frequency ?? '').toUpperCase();
      if (!(FREQUENCIES as readonly string[]).includes(f)) throw new BlackbaudError('bad_frequency', `frequency must be one of ${FREQUENCIES.join(', ')}`, 400);
      value = f as Frequency;
    }
    const noop = input.op === 'amount' ? before.amount === value : before.frequency === value;
    if (!noop) {
      const bodies = buildBodies(g, input.op, value);
      let sent = await patch(env, id, bodies.full);
      calls++;
      if (!sent.ok && sent.status === 400) {
        sent = await patch(env, id, bodies.minimal);
        calls++;
      }
      if (!sent.ok) throw new BlackbaudError('sky_api_error', `Blackbaud refused the change (${sent.status}).`, sent.status >= 500 ? 502 : sent.status);
    }
  }

  const after = snap(await read(env, id));
  calls++;
  const landed =
    input.op === 'amount' ? after.amount === Math.round(Number(input.amount) * 100) / 100
    : input.op === 'frequency' ? after.frequency === String(input.frequency).toUpperCase()
    : input.op === 'skip' || input.op === 'next_date' ? after.next_date === input.date
    : after.status === input.status;
  if (!landed) {
    throw new BlackbaudError('not_applied', 'Blackbaud accepted the change but the schedule still reads the old value. It has to be changed in Raisers Edge.', 502, { before, after });
  }
  return { ok: true, id, op: input.op, before, after, calls };
}

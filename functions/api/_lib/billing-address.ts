// A card gift's billing address, read from Blackbaud Payments and saved on the
// giving record when that record has no address of its own.
//
// Before its ZIP step, the giving form asked for name, email and phone only,
// so a new online partner arrived in Raiser's Edge with a blank address.
// Without a state the daily assignment rule cannot place a partner whose gift
// reaches $1,000 with the RDD for their region (33 such partners sat with
// Partner Care on 2026-10-05), and a year-end receipt has nowhere to go.
// Blackbaud Checkout holds a billing address for some card gifts; this copies
// it over. The form's own ZIP step saves through the same rule (form-address.ts).
//
// Never overwrites: a record that holds any real address is left alone.
// Failure-isolated: callers run it after the gift exists and it never throws.

import { bbFetch, bbJson, type Env } from './blackbaud';

export interface BillingAddress {
  address_lines: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface AddressRow {
  id?: string;
  address_lines?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  formatted_address?: string;
  preferred?: boolean;
  inactive?: boolean;
  type?: string;
}

// Raiser's Edge stores the country's name and a state's postal abbreviation.
const COUNTRIES: Record<string, string> = {
  US: 'United States',
  USA: 'United States',
  'UNITED STATES OF AMERICA': 'United States',
  CA: 'Canada',
  AU: 'Australia',
  NZ: 'New Zealand',
  GB: 'United Kingdom',
  UK: 'United Kingdom',
};

const STATES: Record<string, string> = {
  ALABAMA: 'AL', ALASKA: 'AK', ARIZONA: 'AZ', ARKANSAS: 'AR', CALIFORNIA: 'CA', COLORADO: 'CO', CONNECTICUT: 'CT',
  DELAWARE: 'DE', 'DISTRICT OF COLUMBIA': 'DC', FLORIDA: 'FL', GEORGIA: 'GA', HAWAII: 'HI', IDAHO: 'ID', ILLINOIS: 'IL',
  INDIANA: 'IN', IOWA: 'IA', KANSAS: 'KS', KENTUCKY: 'KY', LOUISIANA: 'LA', MAINE: 'ME', MARYLAND: 'MD',
  MASSACHUSETTS: 'MA', MICHIGAN: 'MI', MINNESOTA: 'MN', MISSISSIPPI: 'MS', MISSOURI: 'MO', MONTANA: 'MT', NEBRASKA: 'NE',
  NEVADA: 'NV', 'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY', 'NORTH CAROLINA': 'NC',
  'NORTH DAKOTA': 'ND', OHIO: 'OH', OKLAHOMA: 'OK', OREGON: 'OR', PENNSYLVANIA: 'PA', 'RHODE ISLAND': 'RI',
  'SOUTH CAROLINA': 'SC', 'SOUTH DAKOTA': 'SD', TENNESSEE: 'TN', TEXAS: 'TX', UTAH: 'UT', VERMONT: 'VT', VIRGINIA: 'VA',
  WASHINGTON: 'WA', 'WEST VIRGINIA': 'WV', WISCONSIN: 'WI', WYOMING: 'WY',
};

const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** Shapes whatever Blackbaud Payments returns into Raiser's Edge address fields. */
export function normalizeBilling(raw: Record<string, unknown> | null | undefined): BillingAddress | null {
  if (!raw) return null;
  const lines = [raw.line1, raw.line2, raw.line3, raw.line4, raw.line5, raw.address, raw.street, raw.address_lines]
    .map(text)
    .filter(Boolean);
  const countryRaw = text(raw.country);
  const country = COUNTRIES[countryRaw.toUpperCase()] ?? countryRaw;
  const stateRaw = text(raw.state);
  const state = country === 'United States' || !country ? STATES[stateRaw.toUpperCase()] ?? stateRaw.toUpperCase() : stateRaw;
  const out: BillingAddress = {
    address_lines: [...new Set(lines)].join('\n'),
    city: text(raw.city),
    state,
    postal_code: text(raw.post_code) || text(raw.postal_code) || text(raw.zip),
    country,
  };
  // A billing address is worth saving only when it places the giver somewhere.
  return out.state || out.postal_code || out.city ? out : null;
}

/** The billing address on the card transaction behind a gift, or null. */
export async function giftBillingAddress(env: Env, giftId: string): Promise<BillingAddress | null> {
  const gift = await bbJson<{ payments?: Array<{ bbps_transaction_id?: string }> }>(
    env,
    `/gift/v1/gifts/${encodeURIComponent(giftId)}`
  );
  const transactionId = (gift.payments ?? []).map((p) => p.bbps_transaction_id).find(Boolean);
  if (!transactionId) return null;
  const res = await bbFetch(env, `/payments/v1/transactions/${encodeURIComponent(transactionId)}`);
  if (!res.ok) return null;
  const transaction = (await res.json().catch(() => null)) as { billing_info?: Record<string, unknown> } | null;
  return normalizeBilling(transaction?.billing_info);
}

const isReal = (a: AddressRow): boolean =>
  Boolean(text(a.address_lines) || text(a.city) || text(a.state) || text(a.postal_code));

export type SaveOutcome =
  | { action: 'saved'; how: 'filled the blank address' | 'added'; state: string; country: string }
  | { action: 'kept'; reason: string }
  | { action: 'none'; reason: string };

/** Saves the address on a record that has none. A record with a real address is left alone. */
export async function saveBillingAddress(
  env: Env,
  constituentId: string,
  billing: BillingAddress,
  dryRun = false
): Promise<SaveOutcome> {
  const existing = await bbJson<{ value?: AddressRow[] }>(
    env,
    `/constituent/v1/constituents/${encodeURIComponent(constituentId)}/addresses?include_inactive=true`
  );
  const rows = existing.value ?? [];
  if (rows.some(isReal)) return { action: 'kept', reason: 'the record already holds an address' };
  const fields: Record<string, unknown> = { preferred: true };
  if (billing.address_lines) fields.address_lines = billing.address_lines;
  if (billing.city) fields.city = billing.city;
  if (billing.state) fields.state = billing.state;
  if (billing.postal_code) fields.postal_code = billing.postal_code;
  if (billing.country) fields.country = billing.country;
  const blank = rows.find((a) => !a.inactive);
  const how = blank?.id ? 'filled the blank address' : 'added';
  if (dryRun) return { action: 'saved', how, state: billing.state, country: billing.country };
  if (blank?.id) {
    await bbJson(env, `/constituent/v1/addresses/${encodeURIComponent(blank.id)}`, {
      method: 'PATCH',
      body: JSON.stringify(fields),
    });
  } else {
    await bbJson(env, '/constituent/v1/addresses', {
      method: 'POST',
      body: JSON.stringify({ constituent_id: constituentId, type: 'Home', ...fields }),
    });
  }
  return { action: 'saved', how, state: billing.state, country: billing.country };
}

/**
 * After an online gift: copy the card's billing address onto a giving record
 * that has no address. Runs after the gift exists and never affects it.
 */
export async function ensureAddressFromGift(env: Env, constituentId: string, giftId: string): Promise<void> {
  try {
    const billing = await giftBillingAddress(env, giftId);
    if (!billing) return;
    const outcome = await saveBillingAddress(env, constituentId, billing);
    if (outcome.action === 'saved') {
      console.log(`[blackbaud] billing address saved on ${constituentId} from gift ${giftId} (${outcome.how})`);
    }
  } catch (err) {
    console.error(
      `[blackbaud] billing address for ${constituentId} from gift ${giftId} failed: ${err instanceof Error ? err.message : err}`
    );
  }
}

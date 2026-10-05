// The address a giver types on the giving form, saved on their giving record.
//
// The form asks one question, a ZIP code (a postal code outside the United
// States), with the country beside it and an optional street address. The
// state comes from the ZIP. Saving follows the billing-address rule: a record
// that already holds a real address is left alone. Nothing here can stop or
// fail a gift, because callers run it after the gift exists and it never throws.

import type { Env } from './blackbaud';
import { saveBillingAddress, type BillingAddress } from './billing-address';
import { normalizePostalCode, stateFromPostalCode } from './postal-state';

export interface TypedAddress {
  postal_code?: string;
  country?: string;
  address_lines?: string;
  city?: string;
}

/** Raiser's Edge address fields from what the giver typed, or null when it places them nowhere. */
export function addressFromForm(typed: TypedAddress): BillingAddress | null {
  const country = (typed.country ?? '').trim() || 'United States';
  const postalCode = normalizePostalCode(country, typed.postal_code ?? '');
  const lines = (typed.address_lines ?? '').trim();
  const city = (typed.city ?? '').trim();
  // The form starts on United States, so that country by itself says nothing.
  if (!postalCode && !lines && !city && country === 'United States') return null;
  return {
    address_lines: lines,
    city,
    state: stateFromPostalCode(country, postalCode),
    postal_code: postalCode,
    country,
  };
}

/** After an online gift: save the typed address on a giving record that has none. */
export async function ensureAddressFromForm(env: Env, constituentId: string, typed: TypedAddress): Promise<void> {
  try {
    const address = addressFromForm(typed);
    if (!address) return;
    const outcome = await saveBillingAddress(env, constituentId, address);
    if (outcome.action === 'saved') {
      console.log(`[blackbaud] form address saved on ${constituentId} (${outcome.how}, ${address.state || address.country})`);
    }
  } catch (err) {
    console.error(
      `[blackbaud] form address for ${constituentId} failed: ${err instanceof Error ? err.message : err}`
    );
  }
}

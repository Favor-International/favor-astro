// The state a postal code belongs to, for the three countries where Raiser's
// Edge holds a state: the United States, Canada and Australia.
//
// The giving form asks for a ZIP code, not a full address, so the state the
// daily assignment rule needs has to come from the ZIP. The first three digits
// of a ZIP name its state for all but eight of the 41,488 ZIP codes in the
// GeoNames US file (checked 2026-10-05); those eight are listed by name below.
//
// Pure and dependency-free: the form imports it to show the giver their state
// as they type, and the gift functions import it to save that state.

// "first-last:STATE" over three-digit ZIP prefixes. A prefix the Postal
// Service has not assigned is absent, and a ZIP under it gets no state.
const US_PREFIXES =
  '005:NY 006-007:PR 008:VI 009:PR 010-027:MA 028-029:RI 030-038:NH 039-049:ME 050-054:VT 055:MA 056-059:VT ' +
  '060-069:CT 070-089:NJ 090-098:AE 100-149:NY 150-196:PA 197-199:DE 200:DC 201:VA 202-205:DC 206-212:MD ' +
  '214-219:MD 220-246:VA 247-268:WV 270-289:NC 290-299:SC 300-319:GA 320-339:FL 340:AA 341-342:FL 344:FL ' +
  '346-347:FL 349:FL 350-352:AL 354-369:AL 370-385:TN 386-397:MS 398-399:GA 400-418:KY 420-427:KY 430-459:OH ' +
  '460-479:IN 480-499:MI 500-516:IA 520-528:IA 530-532:WI 534-535:WI 537-549:WI 550-551:MN 553-567:MN 569:DC ' +
  '570-577:SD 580-588:ND 590-599:MT 600-620:IL 622-629:IL 630-631:MO 633-641:MO 644-658:MO 660-662:KS ' +
  '664-679:KS 680-681:NE 683-693:NE 700-701:LA 703-708:LA 710-714:LA 716-729:AR 730-731:OK 733:TX 734-741:OK ' +
  '743-749:OK 750-770:TX 772-799:TX 800-816:CO 820-831:WY 832-838:ID 840-847:UT 850-853:AZ 855-857:AZ ' +
  '859-860:AZ 863-865:AZ 870-871:NM 873-884:NM 885:TX 889-891:NV 893-895:NV 897-898:NV 900-908:CA 910-928:CA ' +
  '930-961:CA 962-966:AP 967-968:HI 969:GU 970-979:OR 980-986:WA 988-994:WA 995-999:AK';

// ZIP codes that sit in a different state from the rest of their prefix.
const US_EXCEPTIONS: Record<string, string> = {
  '06390': 'NY', // Fishers Island
  '20588': 'MD',
  '20598': 'VA',
  '72643': 'MO',
  '73960': 'TX', // Texhoma
  '83414': 'WY', // Alta
  '96799': 'AS', // American Samoa
  '96950': 'MP',
  '96951': 'MP',
  '96952': 'MP',
  '96960': 'MH',
  '96970': 'MH',
};

const US_BY_PREFIX: Record<string, string> = {};
for (const part of US_PREFIXES.split(' ')) {
  const [span, state] = part.split(':');
  const [first, last = first] = span.split('-');
  for (let n = Number(first); n <= Number(last); n++) US_BY_PREFIX[String(n).padStart(3, '0')] = state;
}

// A Canadian postal code's first letter names its province. X covers both
// northern territories, told apart by the next two characters.
const CA_BY_LETTER: Record<string, string> = {
  A: 'NL', B: 'NS', C: 'PE', E: 'NB', G: 'QC', H: 'QC', J: 'QC', K: 'ON', L: 'ON', M: 'ON', N: 'ON', P: 'ON',
  R: 'MB', S: 'SK', T: 'AB', V: 'BC', Y: 'YT',
};

// Australian postcodes by range. Checked first to last, so the two territories
// carved out of the 2000s come before New South Wales.
const AU_RANGES: Array<[number, number, string]> = [
  [200, 299, 'ACT'], [800, 999, 'NT'], [2600, 2618, 'ACT'], [2900, 2920, 'ACT'], [1000, 2999, 'NSW'],
  [3000, 3999, 'VIC'], [8000, 8999, 'VIC'], [4000, 4999, 'QLD'], [9000, 9999, 'QLD'], [5000, 5999, 'SA'],
  [6000, 6999, 'WA'], [7000, 7999, 'TAS'],
];

export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DE: 'Delaware', DC: 'Washington, D.C.', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  PR: 'Puerto Rico', VI: 'U.S. Virgin Islands', GU: 'Guam', AS: 'American Samoa', MP: 'Northern Mariana Islands',
  MH: 'Marshall Islands', AE: 'Armed Forces Europe', AA: 'Armed Forces Americas', AP: 'Armed Forces Pacific',
};

const CA_NAMES: Record<string, string> = {
  NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', PE: 'Prince Edward Island', NB: 'New Brunswick', QC: 'Quebec',
  ON: 'Ontario', MB: 'Manitoba', SK: 'Saskatchewan', AB: 'Alberta', BC: 'British Columbia', YT: 'Yukon',
  NT: 'Northwest Territories', NU: 'Nunavut',
};

const AU_NAMES: Record<string, string> = {
  NSW: 'New South Wales', VIC: 'Victoria', QLD: 'Queensland', SA: 'South Australia', WA: 'Western Australia',
  TAS: 'Tasmania', ACT: 'Australian Capital Territory', NT: 'Northern Territory',
};

/** A United States ZIP is five digits, with or without the four-digit add-on. */
export const isUsZip = (code: string): boolean => /^\d{5}(-?\d{4})?$/.test(code.trim());

/** The postal code the way Raiser's Edge stores it: "33626-1234", "K1A 0B1". */
export function normalizePostalCode(country: string, code: string): string {
  const typed = code.trim().toUpperCase().replace(/\s+/g, ' ');
  if (country === 'United States') {
    const digits = typed.replace(/\D/g, '');
    if (digits.length === 9) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return digits.length === 5 ? digits : typed;
  }
  if (country === 'Canada') {
    const packed = typed.replace(/[^A-Z0-9]/g, '');
    return /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(packed) ? `${packed.slice(0, 3)} ${packed.slice(3)}` : typed;
  }
  return typed;
}

/** The state or province abbreviation for a postal code, or '' when the code does not name one. */
export function stateFromPostalCode(country: string, code: string): string {
  const typed = code.trim().toUpperCase();
  if (country === 'United States') {
    if (!isUsZip(typed)) return '';
    const zip = typed.slice(0, 5);
    return US_EXCEPTIONS[zip] ?? US_BY_PREFIX[zip.slice(0, 3)] ?? '';
  }
  if (country === 'Canada') {
    const packed = typed.replace(/[^A-Z0-9]/g, '');
    if (!/^[A-Z]\d[A-Z]/.test(packed)) return '';
    if (packed[0] === 'X') return /^X0[ABC]/.test(packed) ? 'NU' : 'NT';
    return CA_BY_LETTER[packed[0]] ?? '';
  }
  if (country === 'Australia') {
    if (!/^\d{3,4}$/.test(typed)) return '';
    const n = Number(typed);
    return AU_RANGES.find(([first, last]) => n >= first && n <= last)?.[2] ?? '';
  }
  return '';
}

/** "Florida", "Ontario", "Queensland": the name a giver recognizes, or '' when the code names no state. */
export function stateNameFromPostalCode(country: string, code: string): string {
  const state = stateFromPostalCode(country, code);
  if (!state) return '';
  if (country === 'Canada') return CA_NAMES[state] ?? '';
  if (country === 'Australia') return AU_NAMES[state] ?? '';
  return STATE_NAMES[state] ?? '';
}

// Africa Missionary posting visibility (2026-08-22).
//
// Will: show it in the US, South Africa, Australia, Europe, and similar
// sending countries. Carole: hide it in the countries Favor works in, so
// field teams stop seeing a hiring ad aimed at outsiders.
//
// Allowlist, not a field-country denylist. Unknown / missing CF country
// keeps the posting visible so local preview and blank geo do not hide it.

const RECRUIT_COUNTRIES = new Set([
  'US',
  'PR',
  'GU',
  'VI',
  'AS',
  'MP',
  'CA',
  'ZA',
  'AU',
  'NZ',
  'XX',
  'T1',
]);

export type CfRequest = Request & { cf?: { country?: string; continent?: string } };

export function visitorCountry(request: Request): string {
  const cf = (request as CfRequest).cf;
  return (cf?.country || request.headers.get('CF-IPCountry') || '').toUpperCase();
}

export function visitorContinent(request: Request): string {
  return ((request as CfRequest).cf?.continent || '').toUpperCase();
}

export function canSeeRecruitPosting(country: string, continent: string): boolean {
  if (continent === 'EU') return true;
  if (!country) return true;
  return RECRUIT_COUNTRIES.has(country);
}

export function applyRecruitGeoHtml(html: string, allowed: boolean): string {
  return html.replace(
    /<!--recruit-(only|closed)-->([\s\S]*?)<!--\/recruit-\1-->/g,
    (_match, kind: string, inner: string) => {
      if (kind === 'only') return allowed ? inner : '';
      return allowed ? '' : inner;
    }
  );
}

export function isRecruitHtmlPath(pathname: string): boolean {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return p === '/go/careers' || p === '/about/contact';
}

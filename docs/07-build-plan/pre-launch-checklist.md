# Pre-Launch Checklist

Work top to bottom. Nothing ships until every box is checked.

## Content

- [ ] All page copy reviewed by Carole or her delegate.
- [ ] Every page passes the "you before we" test.
- [ ] No placeholder text anywhere.
- [ ] All photos have captions with name, role, country.
- [ ] All photos have alt text.
- [ ] No stock photography in production.

## Brand

- [ ] Logo files present in three formats.
- [ ] Favicon set (16, 32, 192, 512, apple-touch-icon).
- [ ] OG default image set.
- [ ] Brand colors used per the 80/15/5 ratio.
- [ ] Montserrat self-hosted, no Google Fonts runtime call.

## Sitemap and navigation

- [ ] Every route in the approved sitemap renders.
- [ ] Primary nav matches PRAY | GIVE | GO | IMPACT | ABOUT.
- [ ] GIVE NOW button visible on every page.
- [ ] PARTNER button visible on every page.
- [ ] No nav level deeper than two.

## Donations

- [ ] One-time gift test in production succeeded.
- [ ] Monthly gift test in production succeeded.
- [ ] Recurring schedule visible in Blackbaud.
- [ ] Receipt email arrived from Blackbaud.
- [ ] Cover-the-fee toggle works.
- [ ] Failed-payment path handled.
- [ ] DAFpay / TrustBridge widget loads.
- [ ] International giving routes link to live partner organizations
      or fall back gracefully.

## Portal

- [ ] Magic-link login works end to end.
- [ ] Giving dashboard displays real Blackbaud data.
- [ ] Resources gated to logged-in users.
- [ ] Logout works.
- [ ] Password-reset path tested (or magic-link-only confirmed).

## Shop

- [ ] At least one product purchasable end to end.
- [ ] Stripe Checkout works on mobile and desktop.
- [ ] Webhook fulfillment notification arrives.
- [ ] Shipping rates correct for US, CA, GB.
- [ ] Tax behavior verified.

## Email

- [ ] Newsletter signup tags subscriber correctly in Mailchimp.
- [ ] Prayer guide download tags subscriber correctly.
- [ ] Welcome series automation triggers on tag.
- [ ] Unsubscribe works.

## Tech

- [ ] Lighthouse 95+ across all four scores on homepage.
- [ ] Lighthouse 90+ on all production pages.
- [ ] No console errors on any page.
- [ ] All forms protected by Turnstile.
- [ ] CSP and security headers verified in `_headers`.
- [ ] All secrets in Cloudflare Pages env vars, not in repo.

## SEO

- [ ] Sitemap submitted to Google Search Console.
- [ ] Robots.txt correct.
- [ ] Schema.org JSON-LD on homepage, story pages, team pages.
- [ ] Canonical tags on every page.
- [ ] Title and meta description on every page.
- [ ] OG image on every page.

## Accessibility

- [ ] Keyboard navigation works on every interactive element.
- [ ] Focus rings visible.
- [ ] Skip-to-content link works.
- [ ] Color contrast meets WCAG 2.1 AA.
- [ ] Form labels visible, not placeholder-only.
- [ ] Axe scan returns zero serious or critical issues.

## Legal

- [ ] Privacy policy reviewed by counsel.
- [ ] Terms reviewed by counsel.
- [ ] Cookie policy (if any cookies are set beyond strictly necessary).
- [ ] ECFA badge in footer with link.
- [ ] 501(c)(3) line in footer.
- [ ] Valrico FL address in footer.

## DNS and infra

- [ ] DNS TTL lowered to 300 the day before cutover.
- [ ] Cutover plan timed for low traffic.
- [ ] Old site preserved at archive URL or in `06-reference/`.
- [ ] 301 redirects in `_redirects` for all known legacy URLs.
- [ ] SSL valid on apex and www.
- [ ] www → apex redirect works.

## Communications

- [ ] Internal team trained on the new portal admin tasks.
- [ ] Carole walks through the new site herself.
- [ ] Launch email drafted and scheduled.
- [ ] Social post drafted.
- [ ] Donor-facing announcement drafted.

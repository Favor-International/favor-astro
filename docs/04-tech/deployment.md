# Deployment

The site auto-deploys from GitHub `main` to Cloudflare Pages.
Preview branches deploy to unique URLs. Staging branch deploys to a
fixed subdomain.

## Branching model

```
main          → production         (favorintl.org)
staging       → staging.favorintl.org
feature/*     → preview URL per branch
hotfix/*      → preview URL, fast-track to main
```

## Pull request flow

1. Branch from `staging`.
2. Open PR into `staging`.
3. Cloudflare Pages builds a preview. Review the preview URL.
4. Merge into `staging`. Verify staging deploy.
5. Open PR from `staging` into `main` for the release.
6. Merge into `main`. Production deploys.

## Pre-deploy checks (run in CI)

GitHub Actions workflow `.github/workflows/check.yml`:

- `npm ci`
- `npm run lint` (Prettier check)
- `npm run typecheck` (Astro check)
- `npm run build` (catches build errors before Cloudflare does)
- Pa11y or Axe accessibility scan on a handful of routes
- Lighthouse CI on production-built static output

PRs that fail any of these are blocked from merging.

## Build command on Cloudflare Pages

```
npm install --frozen-lockfile && npm run build && npx pagefind --site dist
```

`pagefind` builds the static search index after Astro outputs the
site.

## Cache headers

Configure `_headers` file in `public/`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/images/*
  Cache-Control: public, max-age=31536000, immutable

/api/*
  Cache-Control: no-store
```

## Redirects

`_redirects` file in `public/`:

```
# Force apex over www
https://www.favorintl.org/*  https://favorintl.org/:splat  301!

# Old URL preservation (filled in after existing site scrape)
/old-route-1  /new-route-1  301
/old-route-2  /new-route-2  301
```

The `06-reference/existing-site-scrape/` content informs which legacy
URLs need redirects.

## Rollback

If a deploy breaks production:

1. In Cloudflare Pages dashboard → Deployments → find the last good
   deploy → "Rollback to this deployment".
2. Investigate in a branch, fix, PR through staging.

No manual rollback via Git revert needed. Pages keeps the artifacts.

## Monitoring

- Cloudflare Pages build notifications to Slack via webhook.
- Sentry for runtime errors in Pages Functions.
- A weekly Lighthouse run via a GitHub Action posts results to the
  same Slack channel.

## Secret rotation

- Blackbaud refresh token: rotate yearly or sooner if compromised.
- Stripe keys: rotate on staff change.
- Mailchimp key: rotate on staff change.
- Turnstile: usually static, rotate only on abuse.

Document each rotation in `decision-log.md`.

# What Will Needs to Provide

Claude Code handles the scrape, the asset gathering, the optimization,
and the build. This list is what Claude Code **cannot** produce on
its own. Stage these in the prep folder or hand them to Claude Code
when the relevant phase hits.

## Decisions (humans only)

These block specific build phases.

### From Carole

- [ ] **Q1 — Homepage hook.** What is Favor's equivalent of "rescue a
      child for $X a day"? Cost-per-impact framing. Blocks Phase 4
      (homepage).
- [ ] **Q4 — The four ministry pillars.** Confirm names. Best guess
      in `open-questions.md` is Pastor Training, Direct Missionary
      Support, Mercy Ministry, Evangelism and Church Planting.
      Blocks Phase 4 pillar band and Phase 5 pillar pages.
- [ ] List of staff who appear on the new team page (Carole has said
      not the whole staff).
- [ ] List of board members.
- [ ] FY2025 annual report numbers: pastors trained, churches planted,
      Bibles distributed, total nations served, field-vs-overhead
      ratio.
- [ ] Approved list of stories to feature initially (target 8 at
      launch).

### From Josh

- [ ] **Q5 — Pastors and Churches portal: merge or stay separate?**
      Blocks Phase 7.
- [ ] Pastors portal content: program overview, testimonies, inquiry
      form fields.
- [ ] Churches portal content if separate: partnership tiers,
      ambassador program, vision trip details.

### From Stephanie

- [ ] **Q7 — Nav real estate.** Ambassador in the portal dropdown?
      Keep GIVE NOW button alongside the GIVE nav item? Blocks final
      header component.

## Credentials and accounts

Will provides these when Phase 6 or Phase 7 starts, not before.

### Blackbaud (Phase 6)

- [ ] SKY API client ID
- [ ] Client secret
- [ ] Subscription key
- [ ] Sandbox environment access
- [ ] List of designation codes for project-restricted giving
- [ ] Constituent type to use for web donors

### Stripe (Phase 7)

- [ ] Account ownership confirmed
- [ ] Live and test API keys
- [ ] Tax registration status by state
- [ ] Shipping zone preferences

### Mailchimp (Phase 1+ as forms come online)

- [ ] Audience ID and data center prefix
- [ ] API key scoped to that audience
- [ ] Existing tags audit to prevent duplicates

### Cloudflare and GitHub

- [ ] Cloudflare account access for Pages, R2, KV, DNS
- [ ] GitHub organization invite for the new repo

### DAF and stock gifts

- [ ] DAFpay or TrustBridge credentials (or both)

### International giving partners

- [ ] UK partner for Gift Aid routing
- [ ] Canadian partner for CRA-compliant receipts
- [ ] EU partner (if any)
- [ ] If no partners, decision to default international gifts to
      direct USD

## Legal

- [ ] Privacy policy reviewed by counsel
- [ ] Terms of service reviewed
- [ ] Cookie policy if any non-essential cookies (likely none)

## Final approvals

- [ ] Carole signs off on homepage copy draft (end of Phase 4)
- [ ] Stephanie signs off on portal structure (start of Phase 7)
- [ ] Carole signs off on the full site walkthrough (end of Phase 8)
- [ ] Will gives DNS cutover green light (Phase 8 launch)

## What Claude Code handles (so Will doesn't)

- All scraping (favorintl.org, Google Business Profile, Destiny
  Rescue reference screenshots)
- Image classification and optimization
- PDF download from existing site
- Repo init and Cloudflare Pages setup (Will adds secrets and
  approves the Pages connection)
- All component and page building
- All content migration and voice rewriting from scraped pages
- Schema markup, sitemap, robots, redirects from the urls.csv
- Self-hosted Montserrat download
- Logo wrangling — if logos are on the existing site Claude Code
  pulls them from the scrape; if not, asks Will once
- Pre-launch checklist execution
- Lighthouse and accessibility audits
- Pagefind search index

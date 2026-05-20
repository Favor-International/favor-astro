# Prompt: Scrape favorintl.org

Use when running the initial scrape of the existing site.

---

Use the `website-factory-scraping` skill in
`/mnt/skills/user/website-factory-scraping/SKILL.md`. Read it first.

Read `/docs/06-reference/SCRAPE-INSTRUCTIONS.md` for the target
output structure and triage rules.

Scope:

- Every page reachable from `favorintl.org/` nav.
- Every blog or story post.
- Every PDF or downloadable resource.
- The Google Business Profile (reviews and photos).

Output goes into `/docs/06-reference/existing-site-scrape/`.

Classify every image as one of: field-photo, team-photo, logo, stock,
or irrelevant. Stock and irrelevant go in a separate folder for
deletion review.

Build a `urls.csv` mapping every legacy URL to either its new target
or `[NEW PAGE NEEDED]` or `DROP`. Will reviews this for the redirect
plan in `/docs/04-tech/deployment.md`.

End with a `scrape-summary.md` documenting: total pages found, total
images by category, gaps in content that will need to be written from
scratch, and any flagged sensitive content.

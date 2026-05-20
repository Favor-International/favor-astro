# existing-site-scrape — what's in the repo vs what's local

This folder is the trimmed checked-in version of the Phase 1 scrape output.
The full 252 MB of downloaded field photos, raw HTML, and PDFs lives **locally
only** at:

```
<workspace>/favorintl-rebuild/06-reference/existing-site-scrape/
  ├── images/           # 461 classified field/team/headshot/logo/stock/irrelevant
  ├── pages/            # 68 per-URL markdown captures
  ├── raw-html/         # 68 raw HTML snapshots
  └── pdfs/             # 39 downloaded PDFs
```

What's checked into the repo here:

- `scrape-summary.md` — full Phase 1 report
- `urls.csv` — 292-row redirect map (68 scraped + 224 existing Webflow 301s)
- `scrape-manifest.json` — machine-readable manifest
- `image-classification-summary.json` — classifier counts and notes
- `reviews/` — GBP findings JSON (no GBP listing exists for Favor International)

To rebuild the heavy assets from scratch:

```sh
cd <workspace>/scrape-sandbox
node scrape.mjs                 # re-scrape 68 core URLs
node classify-images.mjs        # classify by source-page heuristic
node destiny-rescue.mjs         # re-screenshot destinyrescue.org
node compassion.mjs             # re-screenshot compassion.com
node build-urls-csv.mjs         # regenerate urls.csv
node build-summary.mjs          # regenerate scrape-summary.md
```

The Phase 3 content migration sources from the local `images/` and from the
Webflow CSV exports in `Webflow files/`, not from anything checked into the
repo.

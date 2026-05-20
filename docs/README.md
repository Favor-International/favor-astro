# favorintl-rebuild

Prep folder for the Favor International website rebuild. This is the
brief Claude Code reads before touching a single file in `build/`.

## How this works

Will hands Claude Code two folders side by side:

- `favorintl-rebuild/` — this folder. The brief.
- `build/` — empty. The new Astro site goes here.

Claude Code does everything: scraping, asset gathering, image
classification, component building, content migration, voice
rewriting, deploys. Will reviews and approves. Will does **not**
scrape, stage, or gather.

## How this folder is organized

```
START-HERE.md      Bootstrap prompt for Claude Code. Read first.
CLAUDE.md          Project orientation and hard rules.
README.md          This file.
00-decisions/      Locked decisions, open questions, decision log
01-brand/          Brand book, asset folders (auto-populated by scrape)
02-content/        Voice, page copy stubs, stories, team
03-design/         Page templates, component library, homepage bands
04-tech/           Stack, repo setup, deployment, integrations
05-seo/            Keywords, metadata, schema
06-reference/      Scrape instructions and outputs, Destiny Rescue notes
07-build-plan/     Phases, milestones, pre-launch checklist
08-prompts/        Reusable Claude Code prompts for specific tasks
```

## Status

Phase 0 — Preparation complete. Phase 1 (scrape) begins when Claude
Code runs against this folder.

## How to launch Claude Code

In the parent directory containing both `favorintl-rebuild/` and
`build/`, start Claude Code and say:

> Read `favorintl-rebuild/START-HERE.md` and execute through Phase 1.
> Report back when the scrape summary is ready.

Phase 1 ends with a scrape summary. Will approves, then Claude Code
proceeds to Phase 2 (repo init) and beyond.

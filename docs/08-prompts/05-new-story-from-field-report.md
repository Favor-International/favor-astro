# Prompt: Add a New Story from a Field Report

Use when Will or Carole hands you a raw field update and asks to turn
it into a published story.

---

Read `/docs/02-content/voice-and-tone.md` first.

Input: a raw field report (email, voice memo transcript, or notes
from a vision trip).

Output: an MDX file in `src/content/stories/<country>-<slug>.mdx`
with this frontmatter:

```yaml
---
title: "Title in title case"
slug: "country-short-name"
country: "Uganda"
pillar: "Pastor Training"   # or whatever pillar
date: "2026-MM-DD"
hero_image: "/images/stories/<slug>.jpg"
hero_image_alt: "Specific description"
featured: false
pastor_name: "Real name"
pastor_role: "Role and location"
---
```

Body rules:

- 600 to 900 words.
- Lead with the pastor or partner, not the institution.
- Use real names (with their permission already cleared) and real
  geography.
- One pull quote in Montserrat 700 (component: PullQuote).
- End with a single CTA: Pray, Give, or Go.
- No moralizing summary paragraph at the end. Let the story land.

When done, add the story to the homepage Band 4 rotation if it should
be featured (set `featured: true` and update the CMS pinning logic if
that exists).

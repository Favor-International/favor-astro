// Content collections. Jobs power /go/careers/ (2026-09-14): one markdown
// file per posting, so the next JD is a new file, not a page rewrite.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const jobs = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/jobs' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    type: z.string(),
    location: z.string(),
    team: z.string().optional(),
    compensation: z.string(),
    applyEmail: z.string().email(),
    applySubject: z.string().optional(),
    applyNote: z.string().optional(),
    // open: listed and linkable. draft: the file exists, nothing renders (a JD
    // waiting on approval). closed: listing hides it, detail page is not built.
    status: z.enum(['open', 'draft', 'closed']).default('open'),
    // everywhere: shown to every visitor. sending-countries: wrapped in the
    // recruit-geo markers and stripped by functions/_middleware.ts outside the
    // allowlist (Africa Missionary rule, 2026-08-22).
    visibility: z.enum(['everywhere', 'sending-countries']).default('everywhere'),
    posted: z.coerce.date(),
    image: z.string().default('/images/field-2026/pbs-6.webp'),
    imageAlt: z.string().default('Favor International leaders in the field'),
    order: z.number().default(50),
  }),
});

export const collections = { jobs };

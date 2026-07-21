import type { APIRoute } from 'astro';
import stories from '../data/stories.json';

// Static JSON feed of the latest field stories, consumed cross-origin by the
// Favor partner portal's "From the Field" widget. Prerendered at build time,
// so it refreshes automatically whenever new stories publish and the site
// rebuilds. CORS lives in public/_headers (/field-updates.json rule).

const BASE = 'https://favor-astro.pages.dev';

interface Story {
  slug: string;
  title: string;
  date: string;
  paragraphs?: string[];
  image?: string;
  category?: string;
  tags?: string[];
}

function excerpt(paragraphs: string[] | undefined, max = 180): string {
  const first = paragraphs && paragraphs[0] ? paragraphs[0].trim() : '';
  if (first.length <= max) return first;
  const cut = first.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

export const GET: APIRoute = () => {
  const sorted = [...(stories as Story[])].sort((a, b) => {
    const ta = Date.parse(a.date);
    const tb = Date.parse(b.date);
    return (Number.isNaN(tb) ? -Infinity : tb) - (Number.isNaN(ta) ? -Infinity : ta);
  });
  const latest = sorted.slice(0, 8);
  const updates = latest.map((s) => ({
    title: s.title,
    excerpt: excerpt(s.paragraphs),
    url: `${BASE}/stories/${s.slug}/`,
    image: s.image ? `${BASE}${s.image}` : null,
    date: s.date,
    tag: s.tags && s.tags.length ? s.tags[0] : s.category ?? null,
  }));
  return new Response(
    JSON.stringify({ updated: latest[0]?.date ?? null, count: updates.length, updates }),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  );
};

// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://favorintl.org',
  output: 'static',
  redirects: {
    // Church partnerships moved under /go/ (2026-07-08) so the GO menu
    // highlights correctly when visiting it.
  },
  integrations: [
    // /give/thank-you/ is a post-gift confirmation (noindex); keep it out
    // of the sitemap too.
    sitemap({ filter: (page) => !page.includes('/give/thank-you/') }),
    mdx(),
  ],
  build: { inlineStylesheets: 'auto' },
});

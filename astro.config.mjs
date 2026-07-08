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
    '/give/church-partnership/': '/go/church-partnerships/',
  },
  integrations: [sitemap(), mdx()],
  build: { inlineStylesheets: 'auto' },
});

// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://favorintl.org',
  output: 'static',
  redirects: {
    '/topics/starvation/': '/topics/famine/',
    '/topics/terrorist-areas/': '/topics/restricted-nations/',
    '/topics/upg/': '/topics/unreached-people-groups/',
    '/topics/sahel/': '/topics/sahel-desert-belt/',
    '/topics/sahel-desert/': '/topics/sahel-desert-belt/',
  },
  integrations: [
    // /give/thank-you/ is a post-gift confirmation (noindex); keep it out
    // of the sitemap too.
    sitemap({ filter: (page) => !page.includes('/give/thank-you/') }),
    mdx(),
  ],
  build: { inlineStylesheets: 'auto' },
});

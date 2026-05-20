# Repo Setup

Run this once to initialize. Future deploys are automatic.

## 1. Create the GitHub repository

```bash
gh repo create ServiceLineProDigital/favorintl-rebuild \
  --private \
  --description "Favor International website rebuild — Astro on Cloudflare Pages" \
  --clone

cd favorintl-rebuild
```

If the org name is different, adjust the `gh repo create` path.

## 2. Initialize Astro

```bash
npm create astro@latest . -- --template minimal --typescript strict --install --git
```

## 3. Add core integrations

```bash
npx astro add cloudflare
npx astro add sitemap
npx astro add mdx
```

Confirm `astro.config.mjs` looks like:

```js
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://favorintl.org',
  output: 'static',
  adapter: cloudflare({ mode: 'directory' }),
  integrations: [sitemap(), mdx()],
});
```

## 4. Copy the prep folder into the repo

Place this entire `favorintl-rebuild` folder at `/docs/` in the repo
so Claude has it on every session.

```bash
cp -r /path/to/this/prep-folder ./docs
```

## 5. Initial directory structure

Create the working source structure:

```bash
mkdir -p src/{pages,components,layouts,styles,lib,content}
mkdir -p src/components/{global,band,form,give,portal,story,team,shop}
mkdir -p src/content/{stories,team,board,fieldUpdates,resources}
mkdir -p public/{fonts,images,icons}
mkdir -p functions
```

## 6. Drop in design tokens and globals

Create `src/styles/tokens.css`:

```css
:root {
  /* Colors from brand-book.md */
  --color-gold: #e1a730;
  --color-gold-light: #e0c081;
  --color-terracotta: #a36d4c;
  --color-tan: #ba9a86;
  --color-green: #2b4d24;
  --color-sage: #8b957b;
  --color-sage-light: #c5ccc2;
  --color-white: #ffffff;
  --color-ink: #1a1a1a;

  /* Type */
  --font-sans: 'Montserrat', system-ui, sans-serif;
  --font-size-base: 16px;
  --line-height-base: 1.6;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  --space-24: 96px;

  /* Radius */
  --radius-card: 8px;
  --radius-input: 4px;

  /* Shadow */
  --shadow-soft: 0 1px 3px rgba(43, 77, 36, 0.08);

  /* Layout */
  --content-max: 1200px;
  --prose-max: 720px;
}
```

## 7. Self-host Montserrat

Download Montserrat WOFF2 weights 300/400/600/700/800 from
`google-webfonts-helper` (fonts.google.com mirror) and place in
`public/fonts/`. Reference in `src/styles/fonts.css`:

```css
@font-face {
  font-family: 'Montserrat';
  src: url('/fonts/montserrat-400.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
/* Repeat for 300, 600, 700, 800 */
```

## 8. Cloudflare Pages connection

In the Cloudflare dashboard:

1. **Pages → Create application → Connect to Git**.
2. Pick `favorintl-rebuild`.
3. Production branch: `main`.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Environment variables: add the secrets listed in `stack.md`.
7. Compatibility flags: `nodejs_compat`.
8. Build watch paths: leave default.

After first deploy, point `favorintl.org` (and `www`) at the Pages
project under **Custom domains**.

## 9. Local dev

```bash
npm run dev
# Astro at http://localhost:4321

# To test Pages Functions locally:
npx wrangler pages dev ./dist --compatibility-flag=nodejs_compat
```

## 10. Pre-commit hooks

```bash
npm install -D husky prettier prettier-plugin-astro
npx husky init
echo "npx prettier --check ." > .husky/pre-commit
```

`.prettierrc`:
```json
{
  "plugins": ["prettier-plugin-astro"],
  "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }],
  "singleQuote": true,
  "semi": true,
  "printWidth": 100
}
```

## 11. First commit

```bash
git add .
git commit -m "Initial scaffold: Astro + Cloudflare Pages + tokens"
git push origin main
```

Verify the first auto-deploy on Cloudflare Pages.

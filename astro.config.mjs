// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Required: absolute URLs for the sitemap and for canonical/OG tags in BaseHead.
  site: 'https://nickwitham.com',
  // Output stays static (the default). No adapter — Cloudflare Pages serves dist/ as-is.
  integrations: [sitemap()],
  markdown: {
    // Built-in Shiki. Two themes so code blocks follow prefers-color-scheme;
    // the CSS that switches them lives in Prose.astro.
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
});

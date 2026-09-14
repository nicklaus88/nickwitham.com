# nickwitham.com — Build Specification

**Handoff document for an implementing agent.** Everything needed to build the site is here. Do not invent content, do not add dependencies beyond those listed, and do not skip the acceptance criteria at the end.

- **Repo:** `github.com/nicklaus88/nickwitham.com` (public, default branch `main`, currently empty)
- **Domain:** `nickwitham.com`, registered at Cloudflare
- **Host:** Cloudflare Pages, git-connected to the repo above
- **Owner:** Nick Witham — mechanical engineering / robotics, University of Florida

---

## 0. The one requirement that matters most

The owner has **no project content yet**. He will add projects himself, one at a time, over months.

So the build is judged on this workflow. After the site is built, adding a project must be exactly:

```
1. mkdir src/content/projects/my-new-project/
2. drop cover.jpg (and any other images) into that folder
3. write index.md with frontmatter
4. git push
```

No config edits. No touching a router. No registering the project in a list somewhere. If adding a project requires editing any file outside its own folder, **the build is wrong**.

Everything below serves that requirement.

---

## 1. Stack

| Layer | Choice | Version |
|---|---|---|
| Framework | Astro, static output | 7.3.2 |
| Runtime | Node | ≥ 22.12.0 (Astro 7 requires this) |
| Styling | Plain CSS — custom properties + Astro scoped styles | — |
| UI framework | **None.** No React, Vue, Svelte | — |
| Content | Astro content collections, Markdown | built-in |
| Images | `astro:assets` | built-in |
| Deploy | Cloudflare Pages | — |

### Why Astro

Content collections turn "add a project" into "add a markdown file," which is requirement 0. It ships zero JavaScript by default, so the site is fast without effort. Cloudflare acquired the Astro core team in January 2026, so the Astro-on-Cloudflare path is first-class.

### Why no Tailwind

The site has maybe six components and one page template. Plain CSS with custom properties means no build config, no class-name churn, and a stylesheet the owner can read and edit a year from now without relearning a framework. Astro's scoped `<style>` blocks already solve the collision problem Tailwind exists to solve.

*Tradeoff, stated honestly:* Tailwind would be marginally faster for an agent to write and keeps styles colocated. If the owner already knows Tailwind, it's a defensible swap. Defaulting to plain CSS because long-term maintainability by one non-frontend person is the binding constraint here.

### `astro.config.mjs`

Must set `site: 'https://nickwitham.com'`. This is required for `@astrojs/sitemap` to emit absolute URLs and for canonical/OG tags in `BaseHead.astro` to resolve correctly. Output stays default (`static`); no adapter.

### Do not add

Any CMS, any database, any analytics package (see §9), any animation library, any icon package larger than inline SVG, any font loader beyond a single self-hosted family. No `@astrojs/cloudflare` adapter — output is fully static, so no adapter is needed.

---

## 2. Site structure

Three pages in the nav, plus generated project detail pages.

```
/                 Home — intro + background + featured projects
/projects         The grid of everything
/projects/<slug>  One project, generated per markdown file
/links            Contact and professional links
```

**Note on a deliberate deviation from the brief.** The original plan had a separate `/` and `/about`. This spec merges them: `/` *is* the about page, opening with a short intro and continuing into background, then ending with three featured projects and a link to `/projects`.

Reason: a thin homepage that only says "Hi, I'm Nick" and links elsewhere is a page every visitor clicks through without reading, and it forces the bio to be written twice. One substantive landing page is less to maintain and gets the visitor to the projects faster.

Splitting them later is ~15 minutes of work. If the owner prefers four pages, move the background prose to `src/pages/about.astro` and add the nav entry — no other change required.

---

## 3. File structure

Build exactly this.

```
nickwitham.com/
├── .gitignore
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── README.md                          ← SUPPLIED verbatim, see §10
├── _TEMPLATE.md                       ← SUPPLIED verbatim, see §10
├── public/
│   ├── favicon.svg
│   └── resume.pdf                     ← placeholder, owner replaces
└── src/
    ├── content.config.ts              ← collection schema, see §4
    ├── styles/
    │   └── global.css                 ← all design tokens, see §7
    ├── assets/
    │   └── profile-placeholder.jpg
    ├── components/
    │   ├── BaseHead.astro             ← meta tags, OG, title
    │   ├── Header.astro               ← nav
    │   ├── Footer.astro
    │   ├── ProjectCard.astro          ← the grid tile
    │   ├── Gallery.astro              ← image grid for detail pages
    │   ├── VideoEmbed.astro           ← YouTube click-to-load facade, see §6
    │   └── Prose.astro                ← typographic wrapper for markdown
    ├── layouts/
    │   ├── BaseLayout.astro
    │   └── ProjectLayout.astro
    ├── pages/
    │   ├── index.astro
    │   ├── links.astro
    │   ├── 404.astro
    │   └── projects/
    │       ├── index.astro
    │       └── [...slug].astro
    └── content/
        └── projects/
            ├── example-manipulator/   ← see §8, sample content
            │   ├── index.md
            │   └── cover.jpg
            └── example-suspension/
                ├── index.md
                └── cover.jpg
```

---

## 4. Content schema

`src/content.config.ts`:

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({
    pattern: '**/index.md',
    base: './src/content/projects',
    // REQUIRED — see the warning below. Without this, slugs are wrong.
    generateId: ({ entry }) => entry.replace(/\/index\.md$/, ''),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string().max(220),
      cover: image(),
      coverAlt: z.string(),

      category: z.enum(['research', 'team', 'personal', 'coursework']),
      tags: z.array(z.string()).default([]),

      org: z.string().optional(),
      role: z.string().optional(),
      dateStart: z.coerce.date(),
      dateEnd: z.coerce.date().optional(),

      featured: z.boolean().default(false),
      draft: z.boolean().default(false),

      links: z
        .array(z.object({ label: z.string(), url: z.string().url() }))
        .default([]),

      gallery: z
        .array(z.object({ src: image(), alt: z.string(), caption: z.string().optional() }))
        .default([]),

      videos: z
        .array(
          z.object({
            youtubeId: z.string(),
            title: z.string(),          // required — used as iframe title for a11y
            caption: z.string().optional(),
          })
        )
        .default([]),
    }),
});

export const collections = { projects };
```

### Field notes for the implementer

- **`glob` with `pattern: '**/index.md'`** is what allows one folder per project with images alongside the markdown. Do not flatten this to loose `.md` files — colocated images are the whole point.
- **⚠️ The `generateId` override is not optional.** The glob loader's default ID generation slugifies the filename, so every `index.md` in every project folder would produce the *same* or a wrong ID — either colliding across projects or yielding `/projects/bamboo-harvester/index`. The override strips the trailing `/index.md` so `src/content/projects/bamboo-harvester/index.md` → id `bamboo-harvester` → URL `/projects/bamboo-harvester`. **Verify this explicitly with two projects before moving on.** Log `getCollection('projects').map(e => e.id)` and confirm you get distinct folder names.
- **Rendering the body:** Astro 7 uses the standalone function, not a method on the entry. `import { render } from 'astro:content'`, then `const { Content, headings } = await render(entry)`. The older `await entry.render()` form is legacy — do not use it.
- **`image()`** validates and imports images relative to the markdown file, and returns metadata that `<Image />` consumes directly. This is why covers go in the project folder, not `public/`.
- **`draft`** must actually be honored: filter `draft: true` out of `getCollection` in production, but keep them visible in `astro dev`. This lets the owner commit a half-written project without publishing it. Use `import.meta.env.PROD` for the check.
- **`dateEnd` optional** means ongoing work. Render a missing `dateEnd` as "Present".
- **`summary` capped at 220 chars** so cards stay uniform. The cap is enforced by Zod, so an over-long summary fails the build loudly instead of silently breaking the grid.

### Sorting

Default order everywhere: `dateStart` descending, most recent first. Featured items on the homepage use `featured: true` and the same sort.

---

## 5. Page specifications

### `/` — Home

Sections top to bottom:

1. **Intro.** Name as `<h1>`. One line under it stating what he does. A short paragraph or two of background. A small portrait image (optional — if `profile-placeholder.jpg` is still in place, the layout must look correct without it).
2. **Featured projects.** Up to 3 `ProjectCard`s where `featured: true`, same component as the grid. Heading, then the cards, then a text link "See all projects →".
3. Nothing else. No skills cloud, no timeline, no testimonials, no animated counters.

Placeholder prose is fine and expected — mark it clearly with an HTML comment `<!-- PLACEHOLDER: owner to replace -->` so it's greppable.

### `/projects` — The grid

- Responsive grid of `ProjectCard`. 3 columns ≥1024px, 2 columns ≥640px, 1 column below.
- Sorted `dateStart` descending.
- **Filter bar** above the grid: "All" plus one button per category present in the collection. Vanilla JS, toggling a `hidden` attribute on cards. Must degrade gracefully — with JS disabled, all cards show and the filter bar is hidden via a `no-js` class removed on load. Do not pull in a framework for this.
- Empty state: if the collection has zero published entries, render a short "Projects coming soon" message rather than an empty page.

### `ProjectCard` component

Contains, in order: cover image (4:3, `<Image />`, lazy except the first three), title, one-line meta (`org` · date range), the `summary`, and the tag list. The **entire card is one link** to the detail page — not a "Read more" link, the whole tile. Hover state: subtle lift or border change, nothing elaborate.

### `/projects/[...slug]` — Detail page

Generated via `getStaticPaths` from the collection.

1. Back link to `/projects`.
2. `<h1>` title.
3. Meta row: org, role, date range, category.
4. Cover image, full content width.
5. Videos, if any (§6).
6. Markdown body, rendered through `Prose.astro`, constrained to **68ch** line length.
7. Gallery, if `gallery` is non-empty.
8. Links list, if `links` is non-empty — rendered as labeled buttons (GitHub, Paper, Demo).
9. Prev/next navigation between projects in date order.

The markdown body must support headings, lists, tables, code blocks with syntax highlighting (Astro's built-in Shiki, no extra dependency), images, and blockquotes. Style all of them in `Prose.astro`. Engineering write-ups will use tables and code.

### `/links`

A single centered column. Each entry is a large tap target with label and icon (inline SVG, no icon package): Email, LinkedIn, GitHub, Résumé (`/resume.pdf`), Google Scholar (optional, comment out if unused).

**Deliberate omission: no phone number.** Public phone numbers on personal sites get scraped and resold within weeks, and it adds nothing a recruiter can't get from the email. If the owner insists, the structure supports adding one — but it is not in the default build, and that is a judgment call he should make knowingly.

Email must be a `mailto:` link. No contact form — that needs a backend, and a form on a static site is a maintenance liability for zero gain over `mailto:`.

### `/404`

Short message and a link home. Cloudflare Pages serves `404.html` automatically.

---

## 6. Media handling

### Images

- Project images live **in the project's own folder** under `src/content/projects/`. They are imported through the schema's `image()` helper and rendered with `<Image />` from `astro:assets`, which converts to WebP and generates correct `width`/`height` to prevent layout shift.
- Site chrome images (portrait, favicon source) live in `src/assets/`.
- `public/` is for the two files that must keep an exact URL — `resume.pdf` and `favicon.svg`. **Nothing in `public/` is optimized.** Do not put project photos there, and do not put video there (§6).
- Every image requires `alt`. The schema enforces this for covers and gallery items; do not add an escape hatch.

### Video — YouTube only

Astro has **no native video support**, and this build does not add any. **All video goes to YouTube.** There is no self-hosted video path, no `<video>` element, no files in `public/`. One mechanism, no decisions at authoring time.

This is deliberate. Self-hosting means a 25 MiB per-file Cloudflare ceiling, permanent repo bloat (git keeps every version of a binary forever), manual transcoding, and no adaptive bitrate. YouTube handles all of it and gives back a stable ID.

**`VideoEmbed.astro` must use a click-to-load facade, not a raw iframe.**

A YouTube iframe pulls roughly a megabyte of script before anyone presses play, which will fail the Lighthouse ≥95 target on any page carrying one. Instead:

1. Render the thumbnail as a plain `<img>`: `https://i.ytimg.com/vi/<ID>/maxresdefault.jpg`, with `hqdefault.jpg` as an `onerror` fallback (not every video has a maxres thumbnail).
2. Overlay a play button — inline SVG, real `<button>` element, accessible name from the `title` field.
3. On click, replace the facade with `<iframe src="https://www.youtube-nocookie.com/embed/<ID>?autoplay=1" title="<title>" allow="accelerated-mobile-ads; encrypted-media; picture-in-picture" allowfullscreen loading="lazy">`.
4. Wrap in a 16:9 `aspect-ratio` box so nothing shifts on swap.

This is ~25 lines of vanilla JS in the component's own `<script>`. Do not install `lite-youtube-embed` or any other package for it.

Use `youtube-nocookie.com`, not `youtube.com` — it avoids setting tracking cookies until playback, which keeps the site out of consent-banner territory.

Render multiple videos in order, each with its optional caption below in `--text-muted`.

**Owner-facing note for the README:** unlisted YouTube videos work exactly the same and don't appear on his channel or in search. That's the right default for a project demo clip.

---

## 7. Design direction

The brief is explicit: **the projects should impress, not the website.** The design's job is to disappear. Research on engineering portfolios that work bears this out — the failure mode is text-heavy pages that read like a pasted résumé, and the fix is strong imagery with brief context, not visual ornamentation.

Concretely: generous whitespace, one accent color, real hierarchy through type size and weight, images doing the heavy lifting. No gradients, no glassmorphism, no scroll-jacking, no entrance animations on every element.

### Tokens

Define these in `src/styles/global.css` as custom properties on `:root`. Every component references the tokens — no hard-coded colors or sizes anywhere else.

```css
:root {
  /* Type */
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
               "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;

  --step--1: clamp(0.83rem, 0.8rem + 0.15vw, 0.9rem);
  --step-0:  clamp(1rem, 0.96rem + 0.2vw, 1.09rem);
  --step-1:  clamp(1.2rem, 1.13rem + 0.35vw, 1.37rem);
  --step-2:  clamp(1.44rem, 1.33rem + 0.55vw, 1.73rem);
  --step-3:  clamp(1.73rem, 1.56rem + 0.85vw, 2.18rem);
  --step-4:  clamp(2.07rem, 1.82rem + 1.26vw, 2.75rem);

  /* Space — 4px base */
  --space-2xs: 0.25rem;  --space-xs: 0.5rem;   --space-s: 0.75rem;
  --space-m:   1rem;     --space-l:  1.5rem;   --space-xl: 2.5rem;
  --space-2xl: 4rem;     --space-3xl: 6rem;

  /* Layout */
  --width-content: 68ch;
  --width-page: 1120px;
  --radius: 6px;

  /* Light palette — neutrals carry a faint green cast */
  --bg: #fcfdfc;
  --bg-subtle: #f0f4f1;
  --text: #171a18;
  --text-muted: #5a625c;
  --border: #dce3dd;
  --accent: #1f5f4f;
  --accent-hover: #17483c;
  --accent-text: #ffffff;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #121412;
    --bg-subtle: #1a1d1a;
    --text: #e9ece9;
    --text-muted: #99a39c;
    --border: #2a302c;
    --accent: #6fbfa5;
    --accent-hover: #8ed3ba;
    --accent-text: #0d1f1a;
  }
}
```

### How green is used — read this before styling anything

Green is the owner's preference and should be present throughout, but it must **not** dominate. The approach is two-layer:

**Layer 1 — tinted neutrals.** The grays above are not neutral gray; they're pulled a few points toward green. Backgrounds, borders, and muted text all sit in that family. The effect is a page that reads as quietly green without a single saturated green surface. This is where most of the "green theme" actually lives, and it's the part people feel rather than notice.

**Layer 2 — the accent, used sparingly.** `--accent` appears on: text links, focus rings, the active filter chip, the link-page button borders, blockquote rules, and small hover states. That's the complete list.

**Green must never be:** a full-bleed hero background, a filled header or footer bar, the card background, a large filled button on the homepage, or more than one saturated element visible at once in a given viewport. If a screenshot of any page looks "green," it has gone too far — pull it back to the neutrals.

Rule of thumb: saturated green should occupy well under 5% of any screen.

Other notes:
- The accent green reads as technical rather than corporate-blue, and stays distinct from the ubiquitous "engineer portfolio blue." It exists in exactly one place if it ever needs adjusting.
- Check `--accent` on `--bg` for link contrast in **both** themes; the light-mode green is deliberately dark enough to clear 4.5:1 on body-size text.
- Dark mode is **`prefers-color-scheme` only**. No toggle. A toggle needs persisted state and a flash-of-wrong-theme guard, which is real complexity for a preference the OS already knows.
- Body text ~17px fluid, line-height 1.65, measure capped at 68ch. Long technical prose is the primary content; this is the single highest-leverage typographic decision on the site.
- Fonts: system stack, zero network requests, no layout shift. If the owner later wants a distinct face, self-host one variable font with `font-display: swap` — do not add Google Fonts.

### Non-negotiables

- Visible `:focus-visible` outline on every interactive element.
- Contrast ≥ 4.5:1 for body text in both themes.
- Full keyboard navigation; skip-to-content link as the first focusable element.
- Respect `prefers-reduced-motion` — wrap any transition in the media query.
- Nav collapses to a simple stacked menu on mobile. A `<details>`-based disclosure is preferred over a JS hamburger.
- Tap targets ≥ 44px on `/links`.

---

## 8. Sample content

Create **two** example projects so the pipeline is provably working end to end and the owner has a template to copy.

- Folder names prefixed `example-` so they're obvious and easy to delete.
- `draft: false`, so they render and the grid can be seen populated.
- Cover images: generated solid-color or simple geometric placeholders at 1600×1200. **Do not download stock photos**, and do not use images of real robots or real hardware — nothing that could read as a false claim about the owner's work.
- Body text: lorem-style filler is fine, but it must exercise every markdown feature the layout supports — h2, h3, a table, a fenced code block, a list, a blockquote, an inline image. This doubles as the rendering test.
- One of the two should include a `gallery` and two `videos` entries (use known-good public YouTube IDs, e.g. a ROS or MoveIt demo) so the gallery and the multi-video facade are both exercised.

Add a commented-out, fully-annotated frontmatter template at the top of one example — this is what the owner will copy from.

---

## 9. Deployment

### Cloudflare Pages setup

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variable | `NODE_VERSION` = `22.12.0` |

**The `NODE_VERSION` variable is required.** Astro 7 needs Node ≥ 22.12.0, and Cloudflare's default build image may be older. Omitting it produces a confusing build failure.

Steps: Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → select `nicklaus88/nickwitham.com` → apply the settings above → Save and Deploy. Then Custom Domains → Set up a domain → `nickwitham.com`. Because the domain is registered at Cloudflare, DNS is written automatically; no manual CNAME. Add `www.nickwitham.com` as a second custom domain and let Cloudflare redirect it to the apex.

Free plan limits worth knowing: 25 MiB per file, 20,000 files per site, 500 builds per month, 20-minute build timeout. With video offloaded to YouTube, a portfolio of this kind will not come close to any of them.

*Forward-looking note:* Cloudflare is steering new projects toward Workers with static assets rather than Pages. Pages is not deprecated and remains the simpler git-connected flow, which is the right call here. If the site ever needs Workers features, migration for a static site is straightforward — it is not a decision that locks anything in.

### Analytics

Optional, and off by default. If wanted, use **Cloudflare Web Analytics** — one script tag, no cookies, no consent banner required. Do not add Google Analytics.

### Repository hygiene

`.gitignore` must include `node_modules/`, `dist/`, `.astro/`, `.env*`, `.wrangler/`, plus Windows artifacts `Thumbs.db` and `desktop.ini` (the owner is on Windows and will be handling folders full of project photos).

No LICENSE file. Absent one, the content is all-rights-reserved by default, which is correct for a personal portfolio.

---

## 10. README.md and _TEMPLATE.md — supplied, do not rewrite

**Both files are provided alongside this spec. Commit them to the repo root verbatim.** Do not regenerate them, do not summarize them, do not "improve" them.

- `README.md` → repo root
- `_TEMPLATE.md` → repo root

These are the documents the owner actually uses, written to his level of web experience. They are the contract the rest of the build must satisfy.

**They are also a specification in their own right.** Every command, path, field name, error message, and behavior described in them must be true of the finished build. Specifically, verify:

- `npm run dev`, `npm run build`, `npm run preview` all exist in `package.json` and behave as described.
- The dev server runs on port **4321** (Astro's default — do not change it).
- The Zod error for an over-length `summary` is legible and names the field.
- `draft: true` behaves exactly as documented: visible in dev, absent from the build.
- Cover paths written as `"./cover.jpg"` resolve correctly.
- Missing `dateEnd` renders as "Present".
- The Cloudflare Pages project is named such that the dashboard path in the README is accurate; adjust the README's project name only if it genuinely differs.

The leading underscore in `_TEMPLATE.md` keeps it clearly separate from content. It sits in the repo root, outside `src/content/projects/`, so the glob loader never sees it. Confirm it is not picked up as a collection entry.

---

## 11. Acceptance criteria

The build is done when every one of these passes:

- [ ] `npm run build` completes with zero errors and zero warnings on Node 22.12.0.
- [ ] Creating a new folder in `src/content/projects/` with an `index.md` and a `cover.jpg` produces a working page at `/projects/<folder-name>` with **no other file edited**. Test this; don't assume it.
- [ ] A malformed frontmatter field (missing `coverAlt`, summary over 220 chars) fails the build with a readable Zod error rather than rendering broken.
- [ ] `draft: true` hides a project on `npm run build` but shows it on `npm run dev`.
- [ ] Every page renders correctly at 375px, 768px, and 1440px with no horizontal scroll.
- [ ] Light and dark both render correctly; nothing is invisible or low-contrast in either.
- [ ] Full keyboard traversal of every page; focus is visible at all times.
- [ ] Zero JavaScript shipped on `/` and `/links`. The only scripts anywhere are the `/projects` filter and the `VideoEmbed` facade, each a few lines inline — no bundled runtime, no framework.
- [ ] No YouTube iframe exists in the DOM until the viewer clicks play; verify on a project page with two videos that the network tab shows no `youtube.com` requests on load.
- [ ] Lighthouse ≥ 95 on Performance, Accessibility, and Best Practices for `/`, `/projects`, and a project page **that contains video**.
- [ ] Nothing on any page reads as predominantly green (see §7); saturated green is confined to links, focus rings, and small accents.
- [ ] Every `<img>` has meaningful `alt`. Every page has a unique `<title>` and `<meta name="description">`.
- [ ] `sitemap.xml` and `robots.txt` present (`@astrojs/sitemap` is acceptable as the one permitted extra dependency).
- [ ] `README.md` and `_TEMPLATE.md` are committed verbatim at the repo root, and every claim in them is true of the build (§10).
- [ ] `_TEMPLATE.md` does not appear as a project in the collection.

## 12. Explicit non-goals

Do not build: a blog, a CMS or admin UI, a contact form, a dark-mode toggle, search, i18n, a testimonials section, a skills-percentage bar chart, a downloadable vCard, a chatbot, scroll-triggered animations, a preloader, or a custom cursor.

Do not add a self-hosted video path, a `<video>` element, a `public/video/` directory, or a schema field for local video files. YouTube is the only video mechanism, by decision — not by oversight.

Do not write biographical claims, project descriptions, dates, metrics, or accomplishments. All real content comes from the owner. Placeholders must be visibly marked as placeholders.

# nickwitham.com

Personal engineering portfolio. Built with [Astro](https://astro.build), plain CSS, no frontend framework. Deploys automatically to Cloudflare Pages on every push to `main`.

**If you only read one section, read [Adding a project](#adding-a-project).** That's the thing you'll do over and over; everything else is setup you'll touch once.

---

## Quick start

You need **Node 22.12.0 or newer**. Check with:

```bash
node -v
```

If it's older, install a current version from [nodejs.org](https://nodejs.org), or use [nvm-windows](https://github.com/coreybutler/nvm-windows) if you want to switch between versions.

```bash
npm install     # once, after cloning
npm run dev     # start the local site at http://localhost:4321
```

Leave `npm run dev` running while you work — it reloads automatically when you save a file. Press `Ctrl+C` to stop it.

| Command | What it does |
|---|---|
| `npm run dev` | Local preview at `localhost:4321`, auto-reloads on save |
| `npm run build` | Builds the real site into `dist/`. Catches errors that dev mode lets slide |
| `npm run preview` | Serves the built `dist/` so you can check it before pushing |

**Run `npm run build` before you push.** Dev mode is forgiving about some things the real build is not — most importantly, it shows draft projects that the build will hide, and it's where schema errors surface clearly.

---

## Adding a project

Four steps. You never edit anything outside the project's own folder.

### 1. Make a folder

```
src/content/projects/bamboo-harvester/
```

**The folder name becomes the URL.** `bamboo-harvester` → `nickwitham.com/projects/bamboo-harvester`. Use lowercase, hyphens instead of spaces, no underscores or capitals.

### 2. Add your images to that same folder

```
src/content/projects/bamboo-harvester/
├── cover.jpg
├── gripper-closeup.jpg
└── sim-vs-real.jpg
```

Images live *next to* the markdown file that uses them. This is the whole reason for the one-folder-per-project layout — you never hunt around for where a picture went.

### 3. Create `index.md` in that folder

The filename must be exactly `index.md`. Copy the template from [`_TEMPLATE.md`](./_TEMPLATE.md) in the repo root and fill it in.

### 4. Check it, then push

```bash
npm run dev      # look at it
npm run build    # make sure it really builds
git add .
git commit -m "Add bamboo harvester project"
git push
```

Cloudflare rebuilds and deploys automatically. Usually live in under a minute.

---

## Frontmatter reference

Everything between the two `---` lines at the top of `index.md`.

### Required

| Field | Type | Notes |
|---|---|---|
| `title` | text | The project name, shown as the page heading |
| `summary` | text | The blurb on the project card. **Max 220 characters** — the build fails if you go over, on purpose, so cards stay the same size |
| `cover` | filename | The card image, e.g. `"./cover.jpg"`. Must be in this project's folder |
| `coverAlt` | text | Description of the cover image for screen readers. Describe what's *in* it, not "project cover" |
| `category` | one of four | `research`, `team`, `personal`, or `coursework`. Drives the filter buttons |
| `dateStart` | date | `YYYY-MM-DD`. Used for sorting — newest first |

### Optional

| Field | Type | Notes |
|---|---|---|
| `dateEnd` | date | Leave it out entirely if the work is ongoing — the page will show "Present" |
| `org` | text | Lab, team, or company. Shown in the meta line |
| `role` | text | What you did, e.g. "Manipulation sub-team lead" |
| `tags` | list | Free-form, e.g. `["ROS2", "MoveIt2", "Python"]`. Shown on the card |
| `featured` | true/false | `true` puts it on the homepage. Keep this to about three projects |
| `draft` | true/false | `true` hides it from the live site. See [Drafts](#drafts) |
| `links` | list | Buttons on the detail page — GitHub, paper, demo |
| `gallery` | list | Extra images below the write-up |
| `videos` | list | YouTube clips. See [Video](#video) |

### Everything below the frontmatter

Regular Markdown, and it's the body of the project page. Headings, **bold**, lists, tables, code blocks with syntax highlighting, blockquotes, and inline images all work. Write as much or as little as you want.

---

## Worked example

Illustrative only — this is not a real project, it's here to show the shape.

````markdown
---
title: "Delta Robot Sorting Cell"
summary: "A three-arm delta picker that sorts parts off a moving belt using a
  calibrated overhead camera, hitting 40 picks per minute."
cover: "./cover.jpg"
coverAlt: "Delta robot suspended above a conveyor belt with sorted parts in bins"

category: "personal"
tags: ["ROS2", "OpenCV", "Motion Planning", "Python"]

org: "Personal project"
role: "Sole designer and builder"
dateStart: 2026-01-15
dateEnd: 2026-05-02

featured: true
draft: false

links:
  - label: "GitHub"
    url: "https://github.com/nicklaus88/delta-sorter"
  - label: "Write-up"
    url: "https://example.com/paper.pdf"

gallery:
  - src: "./frame-assembly.jpg"
    alt: "Aluminum extrusion frame with three servo mounts"
    caption: "Frame before the arms went on"
  - src: "./calibration.jpg"
    alt: "Checkerboard calibration target on the conveyor"

videos:
  - youtubeId: "dQw4w9WgXcQ"
    title: "Sorting cell running at full speed"
    caption: "Continuous operation, 40 picks/min"
---

## The problem

Parts arrive on a belt in random orientations...

## Approach

| Stage | Method | Result |
|---|---|---|
| Detection | Overhead camera, color threshold | 98% recall |
| Planning | Inverse kinematics, closed form | < 2 ms |

```python
def inverse_kinematics(x, y, z):
    ...
```

## What I'd do differently

The camera mount flexed under vibration...
````

### Formatting notes that will save you time

- **Wrap long `summary` text** across lines with an indent, like the example. YAML joins it into one line.
- **Quote your text values.** Not strictly required, but a colon or `#` inside an unquoted string will break the file in a confusing way.
- **Dates are unquoted**, in `YYYY-MM-DD` form.
- **Image paths start with `./`** and are relative to `index.md`.
- **Indentation is two spaces**, never tabs. YAML cares.

---

## Images

**Project images go in the project's folder.** They're processed at build time — converted to WebP, resized, and given correct dimensions so the page doesn't jump around while loading. You don't do anything to make that happen.

A few practical points:

- **Shoot or export wide.** Covers are displayed 4:3. Something around 1600×1200 is plenty; the build downsizes as needed.
- **Don't pre-compress.** Hand it the good version and let the build optimize. Compressing first just means compressing twice.
- **`alt` text is required** on covers and gallery images, and that's deliberate. Describe what's in the picture — "Fairino arm gripping a bamboo culm" rather than "project photo."
- **`public/` is not for project images.** Files there are copied as-is with no optimization. It holds `resume.pdf` and the favicon, and that's all it should hold.

---

## Video

**All video goes on YouTube.** There's no self-hosted option, on purpose — video files bloat the repo permanently because git keeps every version of a file forever, and Cloudflare rejects any single file over 25 MB anyway.

To add a clip:

1. Upload to YouTube. **Unlisted works fine** — it won't appear on your channel or in search, but it embeds normally. That's usually what you want for a demo clip.
2. Grab the ID from the URL. In `https://www.youtube.com/watch?v=dQw4w9WgXcQ`, the ID is `dQw4w9WgXcQ` — the part after `v=`. For a `youtu.be/dQw4w9WgXcQ` link it's the part after the slash.
3. Add it to `videos` in your frontmatter.

```yaml
videos:
  - youtubeId: "dQw4w9WgXcQ"
    title: "Arm executing a grasp sequence"
    caption: "Optional text shown under the player"
```

`title` is required — screen readers announce it, and it's what someone hears instead of "video player."

The page shows a thumbnail with a play button and only loads YouTube's player when someone clicks it. That keeps the page fast whether or not anyone watches.

---

## Drafts

Set `draft: true` and the project is visible in `npm run dev` but excluded from the live site.

This means you can commit and push a half-finished write-up without publishing it. Useful when you want the work backed up, or when you're writing on two different machines.

When it's ready, change it to `draft: false` and push.

> Worth double-checking: `npm run build` is what tells you the truth about what's live. If a project shows up in dev but not after a build, `draft: true` is almost always why.

---

## Deploying

Push to `main`. That's it.

```bash
git add .
git commit -m "Add project"
git push
```

Cloudflare Pages sees the push, runs `npm run build`, and publishes `dist/`. Watch it at **Cloudflare dashboard → Workers & Pages → nickwitham-com → Deployments**. If a build fails, the log there tells you which file and which field.

Nothing is deployed from your machine, and there's no separate deploy command. The repo is the source of truth.

---

## Changing the design

Almost everything visual lives in **`src/styles/global.css`**, in the variables at the top.

To change the accent color, edit `--accent` — there's one value for light mode and one inside the `prefers-color-scheme: dark` block. Change both, and check that text is still readable on the background in each.

Spacing, font sizes, and the maximum content width are all variables in that same block. Components reference the variables rather than hard-coded values, so changing one propagates everywhere.

Dark mode follows the visitor's system setting. There's no toggle, by design — one less thing to maintain, and the OS already knows the answer.

---

## Troubleshooting

**Build fails with a long red error mentioning a field name**

A frontmatter field is missing or the wrong type. The message names the project and the field. Common causes: `summary` over 220 characters, `coverAlt` missing, `category` misspelled, or a date that isn't `YYYY-MM-DD`.

**My project doesn't show up**

Check, in this order: is the file named exactly `index.md`? Is `draft` set to `true`? Is the folder under `src/content/projects/`?

**"Cannot find module 'astro:content'"**

Stop the dev server, run `npm install`, start it again.

**Image not found / build can't resolve the cover**

The path is relative to `index.md` and needs the `./` prefix. `"./cover.jpg"`, not `"cover.jpg"` or `"/cover.jpg"`. Check the extension too — `.jpg` and `.JPG` are different to the build.

**Everything renders as one giant code block**

The frontmatter isn't closed. You need `---` on its own line both above and below.

**Error about the Node version**

You're on Node older than 22.12.0. Update Node. If the build fails on Cloudflare but works locally, check that the `NODE_VERSION` environment variable is set to `22.12.0` in the Pages project settings.

**Deploy succeeded but the site looks unchanged**

Hard refresh — `Ctrl+Shift+R`. Cloudflare caches aggressively.

# Project template

Copy everything between the two rulers below into a new file at:

```
src/content/projects/<your-folder-name>/index.md
```

Delete the comment lines you don't need. Fields marked OPTIONAL can be removed entirely — leave them out rather than leaving them blank.

Full field explanations are in [README.md](./README.md#frontmatter-reference).

---

````markdown
---
# ---- REQUIRED ----

title: "Project Name"

# The card blurb. Max 220 characters — the build will fail if you go over.
# Indent continuation lines by two spaces; YAML joins them into one line.
summary: "One or two sentences on what this is and what it does. Lead with the
  outcome, not the background."

# Card image. Must be a file in this same folder. Keep the ./ prefix.
cover: "./cover.jpg"

# Describe what is actually in the image, for screen readers.
coverAlt: "Describe the image contents here"

# Exactly one of: research | team | personal | coursework
category: "research"

# YYYY-MM-DD, unquoted. Used to sort projects, newest first.
dateStart: 2026-01-01


# ---- OPTIONAL — delete any you don't use ----

# Leave dateEnd out entirely if the work is ongoing; the page shows "Present".
dateEnd: 2026-06-01

org: "Lab, team, or company"
role: "What you did"

tags: ["ROS2", "Python", "Motion Planning"]

# true puts this on the homepage. Keep to ~3 projects total.
featured: false

# true hides it from the live site but shows it in `npm run dev`.
draft: false

links:
  - label: "GitHub"
    url: "https://github.com/nicklaus88/repo-name"
  - label: "Paper"
    url: "https://example.com/paper.pdf"

# Extra images, shown below the write-up. All must be in this folder.
gallery:
  - src: "./photo-01.jpg"
    alt: "What is in this photo"
    caption: "Optional caption"
  - src: "./photo-02.jpg"
    alt: "What is in this photo"

# YouTube only. The ID is the part after v= in the URL.
# Unlisted videos work and stay off your channel.
videos:
  - youtubeId: "VIDEO_ID_HERE"
    title: "What the video shows"
    caption: "Optional caption"
---

## Overview

What is it, and why does it exist. Two or three sentences.

## Approach

How you did it. Tables and code blocks both work:

| Component | Choice | Why |
|---|---|---|
| | | |

## Results

What happened. Numbers if you have them.

## What I'd change

The most interesting section to a reader, and the easiest to skip. Worth writing.
````

---

## Reminders

- Folder name becomes the URL: `bamboo-harvester` → `/projects/bamboo-harvester`. Lowercase, hyphens, no spaces.
- The file must be named exactly `index.md`.
- Images go in the same folder as the markdown, paths start with `./`.
- Two-space indentation, never tabs.
- Run `npm run build` before pushing — it catches what dev mode lets slide.

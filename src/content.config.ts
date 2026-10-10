import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({
    pattern: '**/index.md',
    base: './src/content/projects',
    // REQUIRED. Without this the loader would slugify "index.md" for every
    // project and produce colliding or wrong IDs. Stripping the trailing
    // "/index.md" makes the folder name the ID, and the ID becomes the URL:
    //   src/content/projects/bamboo-harvester/index.md -> /projects/bamboo-harvester
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
            title: z.string(), // required — used as the iframe title for a11y
            caption: z.string().optional(),
          })
        )
        .default([]),
    }),
});

export const collections = { projects };

import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;

/**
 * All projects that should be visible in the current environment,
 * sorted by dateStart descending (newest first).
 *
 * Drafts are shown in `astro dev` and hidden in `astro build`.
 */
export async function getProjects(): Promise<Project[]> {
  const all = await getCollection('projects', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true
  );
  return all.sort((a, b) => b.data.dateStart.valueOf() - a.data.dateStart.valueOf());
}

const CATEGORY_LABELS: Record<Project['data']['category'], string> = {
  research: 'Research',
  team: 'Team',
  personal: 'Personal',
  coursework: 'Coursework',
};

export function categoryLabel(category: Project['data']['category']): string {
  return CATEGORY_LABELS[category];
}

const monthYear = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

export function formatDate(date: Date): string {
  return monthYear.format(date);
}

/** "Jan 2026 – Present" or "Jan 2026 – May 2026". Same month collapses to one. */
export function formatDateRange(start: Date, end?: Date): string {
  const a = formatDate(start);
  if (!end) return `${a} – Present`;
  const b = formatDate(end);
  return a === b ? a : `${a} – ${b}`;
}

import type { Category } from '../types';

export const CATEGORIES: Array<Category | 'Trending'> = [
  'Trending',
  'Politics',
  'Sports',
  'Crypto',
  'Economy',
  'Pop Culture',
];

/** Gamma event tag slugs used to backfill under-represented category tabs. */
export const CATEGORY_GAMMA_TAGS: Record<Category, string[]> = {
  Politics: ['politics'],
  Sports: ['sports', 'world-cup', 'ufc'],
  Crypto: ['crypto', 'bitcoin', 'ethereum'],
  Economy: ['finance'],
  'Pop Culture': ['movies', 'music', 'awards', 'celebrity', 'pop-culture'],
};

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

import { caseSchema } from './domain/cases/schema';

const cases = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './content/cases' }),
  schema: caseSchema,
});

export const collections = { cases };

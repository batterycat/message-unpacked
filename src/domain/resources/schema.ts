import { z } from 'zod';

import { supportedLocales } from '../locales';

const idSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const dateSchema = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
);

export const responseResourceSchema = z.object({
  schemaVersion: z.literal(1),
  locale: z.enum(supportedLocales),
  resources: z.array(
    z.object({
      id: idSchema,
      officialName: z.string().min(1),
      purpose: z.enum(['consult', 'query', 'report', 'emergency']),
      owner: z.string().min(1),
      phone: z.string().min(1).optional(),
      canonicalUrl: z.url().optional(),
      sourceUrl: z.url(),
      guidance: z.string().min(1),
      lastVerifiedAt: dateSchema,
      validFrom: dateSchema.optional(),
      retiredAt: dateSchema.optional(),
    }),
  ),
});

export type ResponseResourceRegistry = z.infer<typeof responseResourceSchema>;
export type ResponseResource = ResponseResourceRegistry['resources'][number];

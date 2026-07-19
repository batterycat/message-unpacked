import { z } from 'zod';

import { supportedLocales } from '../locales';

const idSchema = z
  .string()
  .min(3)
  .max(96)
  .regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, 'Use lowercase stable IDs.');

const dateSchema = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use an ISO date (YYYY-MM-DD).'),
);

const caseTextSchema = z
  .string()
  .min(1)
  .refine((value) => !/<\/?[a-z][^>]*>/i.test(value), {
    message: 'HTML is not allowed in case content.',
  })
  .refine(
    (value) => {
      const urls = value.match(/https?:\/\/[^\s)]+/gi) ?? [];
      return urls.every((rawUrl) => {
        try {
          const hostname = new URL(rawUrl).hostname.toLowerCase();
          return (
            hostname === 'example.com' ||
            hostname.endsWith('.example.com') ||
            hostname === 'example.org' ||
            hostname.endsWith('.example.org') ||
            hostname === 'example.net' ||
            hostname.endsWith('.example.net')
          );
        } catch {
          return false;
        }
      });
    },
    { message: 'Scenario text may only contain reserved example URLs.' },
  );

export const learningStages = ['1-2', '3-4', '5-6', '7-9', '10-12'] as const;
export const classifications = [
  'trustworthy',
  'fraud',
  'insufficient-evidence',
] as const;

const sourceSchema = z.object({
  id: idSchema,
  title: caseTextSchema,
  publisher: caseTextSchema,
  canonicalUrl: z.url(),
  publishedAt: dateSchema.optional(),
  accessedAt: dateSchema,
  kind: z.enum(['official', 'news', 'research', 'court-record', 'other']),
  usage: z.enum(['facts-paraphrased', 'licensed-adaptation', 'permission']),
  licenseNote: caseTextSchema,
});

const financialImpactSchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.enum(['TWD', 'USD', 'OTHER']),
  qualifier: z.enum([
    'reported',
    'estimated',
    'at-least',
    'up-to',
    'aggregate',
  ]),
  sourceIds: z.array(idSchema).min(1),
  note: caseTextSchema.optional(),
});

const impactSchema = z.object({
  eventSummary: caseTextSchema,
  period: caseTextSchema.optional(),
  location: caseTextSchema.optional(),
  victimCount: z
    .object({
      count: z.number().int().nonnegative(),
      qualifier: z.enum(['reported', 'estimated', 'at-least', 'up-to']),
      sourceIds: z.array(idSchema).min(1),
    })
    .optional(),
  financialLoss: financialImpactSchema.optional(),
  nonFinancialImpact: caseTextSchema.optional(),
  sourceIds: z.array(idSchema).min(1),
});

export const caseSchema = z
  .object({
    id: idSchema,
    schemaVersion: z.literal(1),
    contentVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    translationGroupId: idSchema,
    locale: z.enum(supportedLocales),
    status: z.enum(['draft', 'published', 'retired']),
    title: caseTextSchema.pipe(z.string().max(120)),
    channel: z.enum(['sms', 'chat', 'email']),
    classification: z.enum(classifications),
    provenance: z.object({
      kind: z.enum(['documented', 'composite', 'classic-pattern', 'fictional']),
      note: caseTextSchema,
    }),
    sources: z.array(sourceSchema).default([]),
    impact: impactSchema.optional(),
    learning: z.object({
      stages: z.array(z.enum(learningStages)).min(1),
      dimensions: z
        .array(
          z.enum(['prevention', 'response', 'post-incident', 'law', 'ethics']),
        )
        .min(1),
      topic: caseTextSchema.pipe(z.string().max(40)),
      readingLevel: z.enum(['easy', 'standard', 'advanced']),
      difficulty: z.enum(['introductory', 'intermediate', 'advanced']),
      contexts: z.array(caseTextSchema).min(1),
      skills: z.array(caseTextSchema).min(1),
      riskTypes: z.array(caseTextSchema).min(1),
      sensitiveContent: z.array(caseTextSchema).default([]),
      trustedAdultRecommended: z.boolean(),
    }),
    messages: z
      .array(
        z.object({
          id: idSchema,
          sender: caseTextSchema,
          body: caseTextSchema,
          timestamp: caseTextSchema.optional(),
          direction: z.enum(['incoming', 'outgoing']).default('incoming'),
        }),
      )
      .min(1),
    clues: z
      .array(
        z.object({
          id: idSchema,
          label: caseTextSchema,
          explanation: caseTextSchema,
        }),
      )
      .min(1),
    choices: z
      .array(
        z.object({
          id: idSchema,
          label: caseTextSchema,
          classification: z.enum(classifications),
          reasoning: caseTextSchema,
          score: z.number().int().min(0).max(100),
        }),
      )
      .min(3),
    recommendedActionIds: z.array(idSchema).default([]),
    debrief: z.object({
      headline: caseTextSchema,
      explanation: caseTextSchema,
      safeActions: z.array(caseTextSchema).min(1),
    }),
    review: z.object({
      lastReviewedAt: dateSchema,
      maintenanceStatus: z.enum(['active', 'needs-review', 'retired']),
    }),
  })
  .superRefine((scenario, context) => {
    const sourceIds = new Set(scenario.sources.map((source) => source.id));
    const needsDocumentedSources = ['documented', 'composite'].includes(
      scenario.provenance.kind,
    );

    if (needsDocumentedSources && scenario.sources.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['sources'],
        message: 'Documented and composite cases require at least one source.',
      });
    }

    if (needsDocumentedSources && !scenario.impact) {
      context.addIssue({
        code: 'custom',
        path: ['impact'],
        message: 'Documented and composite cases require an impact summary.',
      });
    }

    const referencedSourceIds = [
      ...(scenario.impact?.sourceIds ?? []),
      ...(scenario.impact?.financialLoss?.sourceIds ?? []),
      ...(scenario.impact?.victimCount?.sourceIds ?? []),
    ];

    for (const sourceId of referencedSourceIds) {
      if (!sourceIds.has(sourceId)) {
        context.addIssue({
          code: 'custom',
          path: ['impact'],
          message: `Impact references missing source "${sourceId}".`,
        });
      }
    }

    const hasCorrectChoice = scenario.choices.some(
      (choice) => choice.classification === scenario.classification,
    );
    if (!hasCorrectChoice) {
      context.addIssue({
        code: 'custom',
        path: ['choices'],
        message: 'At least one choice must match the case classification.',
      });
    }

    const uniqueMessageIds = new Set(
      scenario.messages.map((message) => message.id),
    );
    if (uniqueMessageIds.size !== scenario.messages.length) {
      context.addIssue({
        code: 'custom',
        path: ['messages'],
        message: 'Message IDs must be unique within a case.',
      });
    }
  });

export type ScenarioCase = z.infer<typeof caseSchema>;
export type Classification = (typeof classifications)[number];

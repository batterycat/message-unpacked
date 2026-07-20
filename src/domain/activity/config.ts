import { z } from 'zod';

import { learningStages } from '../cases/schema';
import { topicIds, type TopicId } from '../cases/topics';
import { supportedLocales } from '../locales';

export const activityDurations = [10, 20, 30] as const;
export const activityModes = ['self-paced', 'projector'] as const;

export type ActivityDuration = (typeof activityDurations)[number];
export type ActivityMode = (typeof activityModes)[number];
export type LearningStage = (typeof learningStages)[number];

const caseIdSchema = z
  .string()
  .min(3)
  .max(96)
  .regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);

export const activityConfigSchema = z
  .object({
    version: z.literal(2),
    locale: z.enum(supportedLocales),
    stage: z.enum(learningStages),
    topicId: z.enum(topicIds),
    durationMinutes: z.union([z.literal(10), z.literal(20), z.literal(30)]),
    mode: z.enum(activityModes),
    caseIds: z
      .array(caseIdSchema)
      .min(1)
      .max(10)
      .refine((caseIds) => new Set(caseIds).size === caseIds.length, {
        message: 'Activity case IDs must be unique.',
      }),
    caseVersions: z
      .array(z.string().regex(/^\d+\.\d+\.\d+$/))
      .min(1)
      .max(10),
  })
  .superRefine((config, context) => {
    if (config.caseIds.length !== config.caseVersions.length) {
      context.addIssue({
        code: 'custom',
        path: ['caseVersions'],
        message: 'Every activity case must carry one content version.',
      });
    }
  });

export type ActivityConfig = z.infer<typeof activityConfigSchema>;

export type ActivityCaseCandidate = {
  id: string;
  contentVersion: string;
  learning: {
    stages: readonly LearningStage[];
    topicId: TopicId;
    topic: string;
    contexts: readonly string[];
  };
};

export type ActivitySetup = Omit<
  ActivityConfig,
  'caseIds' | 'caseVersions' | 'version'
>;

export type ParsedActivityConfig =
  | { status: 'none' }
  | { status: 'invalid'; reason: 'malformed' | 'stale' }
  | { status: 'valid'; config: ActivityConfig };

const durationCaseCount: Record<ActivityDuration, number> = {
  10: 2,
  20: 4,
  30: 6,
};

export function createActivityConfig(
  candidates: readonly ActivityCaseCandidate[],
  setup: ActivitySetup,
): ActivityConfig {
  const stageMatches = candidates
    .filter((candidate) => candidate.learning.stages.includes(setup.stage))
    .sort((left, right) => left.id.localeCompare(right.id));
  const topicMatches = stageMatches.filter(
    (candidate) => candidate.learning.topicId === setup.topicId,
  );
  const remainingMatches = stageMatches.filter(
    (candidate) => !topicMatches.includes(candidate),
  );
  const requestedCount = durationCaseCount[setup.durationMinutes];

  const selectedCases = [...topicMatches, ...remainingMatches].slice(
    0,
    requestedCount,
  );

  return activityConfigSchema.parse({
    ...setup,
    version: 2,
    caseIds: selectedCases.map((candidate) => candidate.id),
    caseVersions: selectedCases.map((candidate) => candidate.contentVersion),
  });
}

export function buildActivityUrl(
  baseUrl: string,
  config: ActivityConfig,
): string {
  const validConfig = activityConfigSchema.parse(config);
  const url = new URL(baseUrl);
  url.search = new URLSearchParams({
    activity: String(validConfig.version),
    lang: validConfig.locale,
    stage: validConfig.stage,
    topic: validConfig.topicId,
    minutes: String(validConfig.durationMinutes),
    mode: validConfig.mode,
    cases: validConfig.caseIds.join(','),
    versions: validConfig.caseVersions.join(','),
  }).toString();
  url.hash = 'demo';
  return url.toString();
}

export function parseActivityConfig(
  searchParams: URLSearchParams,
  availableCases: readonly Pick<
    ActivityCaseCandidate,
    'id' | 'contentVersion'
  >[],
): ParsedActivityConfig {
  if (!searchParams.has('activity')) return { status: 'none' };

  const parsed = activityConfigSchema.safeParse({
    version: Number(searchParams.get('activity')),
    locale: searchParams.get('lang'),
    stage: searchParams.get('stage'),
    topicId: searchParams.get('topic'),
    durationMinutes: Number(searchParams.get('minutes')),
    mode: searchParams.get('mode'),
    caseIds: (searchParams.get('cases') ?? '')
      .split(',')
      .filter((caseId) => caseId.length > 0),
    caseVersions: (searchParams.get('versions') ?? '')
      .split(',')
      .filter((version) => version.length > 0),
  });

  if (!parsed.success) return { status: 'invalid', reason: 'malformed' };

  const availableVersions = new Map(
    availableCases.map((candidate) => [candidate.id, candidate.contentVersion]),
  );
  if (
    parsed.data.caseIds.some(
      (caseId, index) =>
        availableVersions.get(caseId) !== parsed.data.caseVersions[index],
    )
  ) {
    return { status: 'invalid', reason: 'stale' };
  }

  return { status: 'valid', config: parsed.data };
}

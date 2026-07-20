import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { caseSchema, learningStages } from './schema';
import { topicIds, type TopicId } from './topics';

async function loadPublishedChineseCases() {
  const directory = path.join(process.cwd(), 'content', 'cases');
  const fileNames = (await readdir(directory)).filter((fileName) =>
    fileName.endsWith('.zh-TW.yaml'),
  );
  const scenarios = await Promise.all(
    fileNames.map(async (fileName) =>
      caseSchema.parse(
        parse(await readFile(path.join(directory, fileName), 'utf8')),
      ),
    ),
  );

  return scenarios.filter(
    (scenario) =>
      scenario.locale === 'zh-TW' && scenario.status === 'published',
  );
}

describe('published case catalog', () => {
  it('keeps every current topic supplied with at least ten cases', async () => {
    const scenarios = await loadPublishedChineseCases();

    expect(scenarios.length).toBeGreaterThanOrEqual(60);
    expect(
      scenarios.filter((scenario) => scenario.provenance.kind === 'documented'),
    ).toHaveLength(4);
    expect(
      scenarios.filter(
        (scenario) => scenario.provenance.kind === 'classic-pattern',
      ).length,
    ).toBeGreaterThanOrEqual(4);
    expect(
      new Set(scenarios.map((scenario) => scenario.classification)),
    ).toEqual(new Set(['trustworthy', 'fraud', 'insufficient-evidence']));
    expect(new Set(scenarios.map((scenario) => scenario.channel))).toEqual(
      new Set(['sms', 'chat', 'email']),
    );

    const topicCounts = new Map<TopicId, number>();
    for (const scenario of scenarios) {
      topicCounts.set(
        scenario.learning.topicId,
        (topicCounts.get(scenario.learning.topicId) ?? 0) + 1,
      );
    }
    for (const topicId of topicIds) {
      expect(topicCounts.get(topicId)).toBeGreaterThanOrEqual(10);
    }

    const stageCounts = new Map<string, number>();
    for (const scenario of scenarios) {
      for (const stage of scenario.learning.stages) {
        stageCounts.set(stage, (stageCounts.get(stage) ?? 0) + 1);
      }
    }
    for (const stage of learningStages) {
      expect(stageCounts.get(stage)).toBeGreaterThan(0);
    }
  });
});

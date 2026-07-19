import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { caseSchema } from './schema';

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

describe('starter case catalog', () => {
  it('meets the MVP size, provenance, outcome, and channel mix', async () => {
    const scenarios = await loadPublishedChineseCases();

    expect(scenarios.length).toBeGreaterThanOrEqual(12);
    expect(scenarios.length).toBeLessThanOrEqual(20);
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
  });
});

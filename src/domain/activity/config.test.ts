import { describe, expect, it } from 'vitest';

import {
  buildActivityUrl,
  createActivityConfig,
  parseActivityConfig,
  type ActivityCaseCandidate,
} from './config';

const candidates = [
  {
    id: 'case.social-a',
    contentVersion: '1.1.0',
    learning: {
      stages: ['7-9'] as const,
      topicId: 'social-relationships',
      topic: '社群與交友',
      contexts: ['社群平台'],
    },
  },
  {
    id: 'case.gaming',
    contentVersion: '2.0.0',
    learning: {
      stages: ['7-9'] as const,
      topicId: 'gaming-accounts',
      topic: '遊戲與帳號',
      contexts: ['線上遊戲'],
    },
  },
  {
    id: 'case.social-b',
    contentVersion: '1.2.0',
    learning: {
      stages: ['7-9'] as const,
      topicId: 'social-relationships',
      topic: '社群與交友',
      contexts: ['社群平台'],
    },
  },
  {
    id: 'case.senior',
    contentVersion: '1.0.0',
    learning: {
      stages: ['10-12'] as const,
      topicId: 'social-relationships',
      topic: '社群與交友',
      contexts: ['社群平台'],
    },
  },
] as const satisfies readonly ActivityCaseCandidate[];

describe('activity configuration', () => {
  it('selects matching cases deterministically and round-trips through a share URL', () => {
    const config = createActivityConfig(candidates, {
      durationMinutes: 10,
      locale: 'zh-TW',
      mode: 'projector',
      stage: '7-9',
      topicId: 'social-relationships',
    });

    expect(config.caseIds).toEqual(['case.social-a', 'case.social-b']);

    const url = buildActivityUrl('https://school.example.org/zh-TW/', config);
    const parsed = parseActivityConfig(new URL(url).searchParams, candidates);

    expect(parsed).toEqual({ status: 'valid', config });
  });

  it('fills the requested duration from other stage-matching topics when needed', () => {
    const config = createActivityConfig(candidates, {
      durationMinutes: 20,
      locale: 'zh-TW',
      mode: 'self-paced',
      stage: '7-9',
      topicId: 'gaming-accounts',
    });

    expect(config.caseIds).toEqual([
      'case.gaming',
      'case.social-a',
      'case.social-b',
    ]);
  });

  it('distinguishes no activity from malformed and stale links', () => {
    expect(
      parseActivityConfig(new URLSearchParams(), [candidates[0]!]),
    ).toEqual({ status: 'none' });

    expect(
      parseActivityConfig(
        new URLSearchParams(
          'activity=2&lang=zh-TW&stage=7-9&topic=social-relationships&minutes=99&mode=self-paced&cases=case.social-a&versions=1.1.0',
        ),
        [candidates[0]!],
      ),
    ).toEqual({ status: 'invalid', reason: 'malformed' });

    expect(
      parseActivityConfig(
        new URLSearchParams(
          'activity=2&lang=zh-TW&stage=7-9&topic=social-relationships&minutes=10&mode=self-paced&cases=case.retired&versions=1.0.0',
        ),
        [candidates[0]!],
      ),
    ).toEqual({ status: 'invalid', reason: 'stale' });
  });

  it('rejects a shared activity when bundled case content has changed', () => {
    const config = createActivityConfig(candidates, {
      durationMinutes: 10,
      locale: 'zh-TW',
      mode: 'self-paced',
      stage: '7-9',
      topicId: 'social-relationships',
    });
    const url = new URL(buildActivityUrl('https://school.example/', config));

    expect(
      parseActivityConfig(url.searchParams, [
        { ...candidates[0]!, contentVersion: '9.0.0' },
        candidates[2]!,
      ]),
    ).toEqual({ status: 'invalid', reason: 'stale' });
  });
});

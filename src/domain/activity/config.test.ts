import { describe, expect, it } from 'vitest';

import {
  buildActivityUrl,
  createActivityConfig,
  parseActivityConfig,
} from './config';

const candidates = [
  {
    id: 'case.social-a',
    learning: {
      stages: ['7-9'] as const,
      topic: '社群與交友',
      contexts: ['社群平台'],
    },
  },
  {
    id: 'case.gaming',
    learning: {
      stages: ['7-9'] as const,
      topic: '遊戲與帳號',
      contexts: ['線上遊戲'],
    },
  },
  {
    id: 'case.social-b',
    learning: {
      stages: ['7-9'] as const,
      topic: '社群與交友',
      contexts: ['社群平台'],
    },
  },
  {
    id: 'case.senior',
    learning: {
      stages: ['10-12'] as const,
      topic: '社群與交友',
      contexts: ['社群平台'],
    },
  },
];

describe('activity configuration', () => {
  it('selects matching cases deterministically and round-trips through a share URL', () => {
    const config = createActivityConfig(candidates, {
      durationMinutes: 10,
      locale: 'zh-TW',
      mode: 'projector',
      stage: '7-9',
      topic: '社群與交友',
    });

    expect(config.caseIds).toEqual(['case.social-a', 'case.social-b']);

    const url = buildActivityUrl('https://school.example.org/zh-TW/', config);
    const parsed = parseActivityConfig(
      new URL(url).searchParams,
      candidates.map((candidate) => candidate.id),
    );

    expect(parsed).toEqual({ status: 'valid', config });
  });

  it('fills the requested duration from other stage-matching topics when needed', () => {
    const config = createActivityConfig(candidates, {
      durationMinutes: 20,
      locale: 'zh-TW',
      mode: 'self-paced',
      stage: '7-9',
      topic: '遊戲與帳號',
    });

    expect(config.caseIds).toEqual([
      'case.gaming',
      'case.social-a',
      'case.social-b',
    ]);
  });

  it('distinguishes no activity from malformed and stale links', () => {
    expect(
      parseActivityConfig(new URLSearchParams(), ['case.social-a']),
    ).toEqual({ status: 'none' });

    expect(
      parseActivityConfig(
        new URLSearchParams(
          'activity=1&lang=zh-TW&stage=7-9&topic=x&minutes=99&mode=self-paced&cases=case.social-a',
        ),
        ['case.social-a'],
      ),
    ).toEqual({ status: 'invalid', reason: 'malformed' });

    expect(
      parseActivityConfig(
        new URLSearchParams(
          'activity=1&lang=zh-TW&stage=7-9&topic=x&minutes=10&mode=self-paced&cases=case.retired',
        ),
        ['case.social-a'],
      ),
    ).toEqual({ status: 'invalid', reason: 'stale' });
  });
});

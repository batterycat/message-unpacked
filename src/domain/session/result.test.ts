import { describe, expect, it } from 'vitest';

import { summarizeSession } from './result';

describe('summarizeSession', () => {
  it('totals completed attempts and assigns a supportive score band', () => {
    expect(
      summarizeSession([
        { scenarioId: 'case.one', title: '第一題', score: 100 },
        { scenarioId: 'case.two', title: '第二題', score: 80 },
        { scenarioId: 'case.three', title: '第三題', score: 55 },
      ]),
    ).toEqual({
      attempts: [
        { scenarioId: 'case.one', title: '第一題', score: 100 },
        { scenarioId: 'case.two', title: '第二題', score: 80 },
        { scenarioId: 'case.three', title: '第三題', score: 55 },
      ],
      averageScore: 78,
      completedCount: 3,
      maximumScore: 300,
      scoreBand: 'developing',
      totalScore: 235,
    });
  });

  it('returns a neutral practice result for an empty session', () => {
    expect(summarizeSession([])).toMatchObject({
      averageScore: 0,
      completedCount: 0,
      maximumScore: 0,
      scoreBand: 'practice',
      totalScore: 0,
    });
  });
});

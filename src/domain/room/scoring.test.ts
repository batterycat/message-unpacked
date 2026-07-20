import { describe, expect, it } from 'vitest';

import { calculateClassScores } from './scoring';

describe('class-level room scoring', () => {
  it('calculates each answered case as the mean of valid choice scores', () => {
    expect(
      calculateClassScores([
        {
          caseId: 'case.one',
          choiceScores: { safe: 100, partial: 50, unsafe: 0 },
          counts: { safe: 2, partial: 1, unsafe: 1 },
        },
      ]),
    ).toEqual({
      cases: [{ caseId: 'case.one', answeredCount: 4, meanScore: 62.5 }],
      overallMeanScore: 62.5,
    });
  });

  it('uses the mean of answered case means rather than weighting by students', () => {
    expect(
      calculateClassScores([
        {
          caseId: 'case.many-answers',
          choiceScores: { safe: 100 },
          counts: { safe: 10 },
        },
        {
          caseId: 'case.one-answer',
          choiceScores: { unsafe: 0 },
          counts: { unsafe: 1 },
        },
        {
          caseId: 'case.unanswered',
          choiceScores: { safe: 100 },
          counts: { safe: 0 },
        },
      ]),
    ).toEqual({
      cases: [
        {
          caseId: 'case.many-answers',
          answeredCount: 10,
          meanScore: 100,
        },
        { caseId: 'case.one-answer', answeredCount: 1, meanScore: 0 },
        {
          caseId: 'case.unanswered',
          answeredCount: 0,
          meanScore: null,
        },
      ],
      overallMeanScore: 50,
    });
  });

  it('returns no overall mean when every case is unanswered', () => {
    expect(
      calculateClassScores([
        {
          caseId: 'case.one',
          choiceScores: { safe: 100 },
          counts: { safe: 0 },
        },
      ]),
    ).toMatchObject({ overallMeanScore: null });
  });

  it.each([
    [
      {
        caseId: 'case.unknown-choice',
        choiceScores: { safe: 100 },
        counts: { unknown: 1 },
      },
    ],
    [
      {
        caseId: 'case.invalid-count',
        choiceScores: { safe: 100 },
        counts: { safe: -1 },
      },
    ],
    [
      {
        caseId: 'case.invalid-score',
        choiceScores: { safe: 101 },
        counts: { safe: 1 },
      },
    ],
  ])('rejects invalid trusted score inputs: %o', (candidate) => {
    expect(() => calculateClassScores([candidate])).toThrow(RangeError);
  });
});

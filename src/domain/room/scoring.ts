export type CaseScoreInput = {
  caseId: string;
  choiceScores: Readonly<Record<string, number>>;
  counts: Readonly<Record<string, number>>;
};

export type CaseClassScore = {
  caseId: string;
  answeredCount: number;
  meanScore: number | null;
};

export type ClassScores = {
  cases: CaseClassScore[];
  overallMeanScore: number | null;
};

function validateScore(score: number): void {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError('Choice scores must be finite values from 0 to 100.');
  }
}

function validateCount(count: number): void {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RangeError('Choice counts must be nonnegative safe integers.');
  }
}

export function calculateClassScores(
  inputs: readonly CaseScoreInput[],
): ClassScores {
  const caseIds = new Set<string>();
  const cases = inputs.map((input): CaseClassScore => {
    if (caseIds.has(input.caseId)) {
      throw new RangeError('Case score inputs must use unique case IDs.');
    }
    caseIds.add(input.caseId);

    for (const score of Object.values(input.choiceScores)) {
      validateScore(score);
    }

    let answeredCount = 0;
    let scoreTotal = 0;
    for (const [choiceId, count] of Object.entries(input.counts)) {
      validateCount(count);
      const score = input.choiceScores[choiceId];
      if (score === undefined) {
        throw new RangeError(
          `Count references unknown choice ID "${choiceId}".`,
        );
      }
      answeredCount += count;
      scoreTotal += score * count;
    }

    return {
      caseId: input.caseId,
      answeredCount,
      meanScore: answeredCount === 0 ? null : scoreTotal / answeredCount,
    };
  });

  const answeredCaseMeans = cases.flatMap((result) =>
    result.meanScore === null ? [] : [result.meanScore],
  );
  const overallMeanScore =
    answeredCaseMeans.length === 0
      ? null
      : answeredCaseMeans.reduce((total, score) => total + score, 0) /
        answeredCaseMeans.length;

  return { cases, overallMeanScore };
}

export const scoreBands = ['strong', 'developing', 'practice'] as const;

export type ScoreBand = (typeof scoreBands)[number];

export type SessionAttempt = {
  scenarioId: string;
  title: string;
  score: number;
};

export type SessionSummary = {
  attempts: readonly SessionAttempt[];
  averageScore: number;
  completedCount: number;
  maximumScore: number;
  scoreBand: ScoreBand;
  totalScore: number;
};

export function getScoreBand(score: number): ScoreBand {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'developing';
  return 'practice';
}

export function summarizeSession(
  attempts: readonly SessionAttempt[],
): SessionSummary {
  const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
  const completedCount = attempts.length;
  const averageScore =
    completedCount === 0 ? 0 : Math.round(totalScore / completedCount);

  return {
    attempts,
    averageScore,
    completedCount,
    maximumScore: completedCount * 100,
    scoreBand: getScoreBand(averageScore),
    totalScore,
  };
}

export const roomPhases = ['lobby', 'question', 'debrief'] as const;

export type RoomPhase = (typeof roomPhases)[number];
export type RoomRole = 'teacher' | 'student';

export type RoomClientMessage =
  | { type: 'hello'; role: RoomRole }
  | { type: 'teacher-phase'; phase: RoomPhase; caseId?: string }
  | { type: 'answer'; caseId: string; choiceId: string }
  | { type: 'reset-tallies' };

export type RoomServerMessage =
  | {
      type: 'welcome';
      phase: RoomPhase;
      participantCount: number;
      role: RoomRole;
    }
  | { type: 'presence'; participantCount: number }
  | { type: 'phase'; phase: RoomPhase; caseId?: string }
  | { type: 'tally'; caseId: string; counts: Record<string, number> }
  | { type: 'tallies-reset' }
  | { type: 'error'; code: string; message: string };

export type RoomProjection = {
  phase: RoomPhase;
  caseId?: string;
  tallies: Record<string, Record<string, number>>;
};

export type RoomCommandResult = {
  projection: RoomProjection;
  events: RoomServerMessage[];
};

export function createRoomProjection(): RoomProjection {
  return { phase: 'lobby', tallies: {} };
}

function isRoomPhase(value: unknown): value is RoomPhase {
  return typeof value === 'string' && roomPhases.includes(value as RoomPhase);
}

function isRoomRole(value: unknown): value is RoomRole {
  return value === 'teacher' || value === 'student';
}

function isSafeToken(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 96 &&
    /^[a-zA-Z0-9._-]+$/.test(value)
  );
}

export function parseRoomClientMessage(
  value: unknown,
): RoomClientMessage | null {
  if (!value || typeof value !== 'object') return null;
  const message = value as Record<string, unknown>;

  if (message.type === 'hello' && isRoomRole(message.role)) {
    return { type: 'hello', role: message.role };
  }

  if (
    message.type === 'teacher-phase' &&
    isRoomPhase(message.phase) &&
    (message.caseId === undefined || isSafeToken(message.caseId))
  ) {
    return {
      type: 'teacher-phase',
      phase: message.phase,
      ...(message.caseId ? { caseId: message.caseId } : {}),
    };
  }

  if (
    message.type === 'answer' &&
    isSafeToken(message.caseId) &&
    isSafeToken(message.choiceId)
  ) {
    return {
      type: 'answer',
      caseId: message.caseId,
      choiceId: message.choiceId,
    };
  }

  if (message.type === 'reset-tallies') {
    return { type: 'reset-tallies' };
  }

  return null;
}

export function applyRoomMessage(
  projection: RoomProjection,
  message: Exclude<RoomClientMessage, { type: 'hello' }>,
  role: RoomRole,
): RoomCommandResult {
  if (message.type === 'teacher-phase') {
    if (role !== 'teacher') {
      return {
        projection,
        events: [
          {
            type: 'error',
            code: 'teacher-only',
            message: 'Only the teacher can change the activity phase.',
          },
        ],
      };
    }

    const nextCaseId =
      message.phase === 'lobby'
        ? undefined
        : (message.caseId ?? projection.caseId);
    const projectionWithoutCase = {
      phase: projection.phase,
      tallies: message.phase === 'lobby' ? {} : projection.tallies,
    };
    const nextProjection: RoomProjection = {
      ...projectionWithoutCase,
      phase: message.phase,
      ...(nextCaseId ? { caseId: nextCaseId } : {}),
    };
    return {
      projection: nextProjection,
      events: [
        {
          type: 'phase',
          phase: nextProjection.phase,
          ...(nextProjection.caseId ? { caseId: nextProjection.caseId } : {}),
        },
      ],
    };
  }

  if (message.type === 'answer') {
    const caseTallies = projection.tallies[message.caseId] ?? {};
    const nextTallies = {
      ...projection.tallies,
      [message.caseId]: {
        ...caseTallies,
        [message.choiceId]: (caseTallies[message.choiceId] ?? 0) + 1,
      },
    };
    return {
      projection: { ...projection, tallies: nextTallies },
      events: [
        {
          type: 'tally',
          caseId: message.caseId,
          counts: nextTallies[message.caseId] ?? {},
        },
      ],
    };
  }

  if (role !== 'teacher') {
    return {
      projection,
      events: [
        {
          type: 'error',
          code: 'teacher-only',
          message: 'Only the teacher can reset the room tallies.',
        },
      ],
    };
  }

  return {
    projection: { ...projection, tallies: {} },
    events: [{ type: 'tallies-reset' }],
  };
}

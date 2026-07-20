import {
  ROOM_PROTOCOL_VERSION,
  type RoomActivityCase,
  type RoomActivityManifest,
  type RoomCommand,
  type RoomErrorCode,
  type StudentRoomProjection,
  type TeacherRoomProjection,
} from './protocol';

export type RoomEndReason = 'teacher-ended' | 'expired';

export type RoomRevealedResult = {
  answeredCount: number;
  counts: Record<string, number>;
};

export type RoomState = {
  protocolVersion: typeof ROOM_PROTOCOL_VERSION;
  manifest: RoomActivityManifest;
  phase: 'lobby' | 'open' | 'revealed' | 'summary' | 'ended';
  currentCaseIndex: number | null;
  participantCount: number;
  revision: number;
  createdAt: number;
  expiresAt: number;
  answersByParticipant: Record<string, string>;
  revealedResults: Record<string, RoomRevealedResult>;
  endReason?: RoomEndReason;
};

export type RoomActor =
  { role: 'teacher' } | { role: 'student'; participantKey: string };

export type AnswerAcknowledgement = {
  protocolVersion: typeof ROOM_PROTOCOL_VERSION;
  type: 'answer-ack';
  caseId: string;
  choiceId: string;
  outcome: 'accepted' | 'revised' | 'unchanged';
  revision: number;
};

export type RoomCommandError = {
  code: RoomErrorCode;
};

export type RoomCommandResult =
  | {
      status: 'accepted';
      state: RoomState;
      acknowledgement?: AnswerAcknowledgement;
    }
  | { status: 'rejected'; state: RoomState; error: RoomCommandError };

export type CreateRoomStateInput = {
  manifest: RoomActivityManifest;
  createdAt: number;
  expiresAt: number;
  participantCount?: number;
};

export function createRoomState(input: CreateRoomStateInput): RoomState {
  if (
    !Number.isSafeInteger(input.createdAt) ||
    !Number.isSafeInteger(input.expiresAt) ||
    input.createdAt < 0 ||
    input.expiresAt <= input.createdAt
  ) {
    throw new RangeError('Room timestamps must define a positive lifetime.');
  }

  const participantCount = input.participantCount ?? 0;
  if (!Number.isSafeInteger(participantCount) || participantCount < 0) {
    throw new RangeError('Participant count must be a nonnegative integer.');
  }

  return {
    protocolVersion: ROOM_PROTOCOL_VERSION,
    manifest: input.manifest,
    phase: 'lobby',
    currentCaseIndex: null,
    participantCount,
    revision: 0,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
    answersByParticipant: {},
    revealedResults: {},
  };
}

function rejected(state: RoomState, code: RoomErrorCode): RoomCommandResult {
  return { status: 'rejected', state, error: { code } };
}

function endRoom(state: RoomState, endReason: RoomEndReason): RoomState {
  return {
    ...state,
    phase: 'ended',
    revision: state.revision + 1,
    answersByParticipant: {},
    endReason,
  };
}

function currentCase(state: RoomState): RoomActivityCase {
  const activityCase =
    state.currentCaseIndex === null
      ? undefined
      : state.manifest.cases[state.currentCaseIndex];
  if (!activityCase) {
    throw new Error('Room state has no current case for its active phase.');
  }
  return activityCase;
}

function requireTeacher(
  state: RoomState,
  actor: RoomActor,
): RoomCommandResult | null {
  return actor.role === 'teacher' ? null : rejected(state, 'teacher-only');
}

function assertNever(value: never): never {
  throw new Error(`Unhandled room command: ${JSON.stringify(value)}`);
}

export function applyRoomCommand(
  state: RoomState,
  command: RoomCommand,
  actor: RoomActor,
  now: number,
): RoomCommandResult {
  if (state.phase === 'ended') {
    return rejected(
      state,
      state.endReason === 'expired' ? 'room-expired' : 'room-ended',
    );
  }

  if (now >= state.expiresAt) {
    const expiredState = endRoom(state, 'expired');
    return rejected(expiredState, 'room-expired');
  }

  switch (command.type) {
    case 'open-case': {
      const roleError = requireTeacher(state, actor);
      if (roleError) return roleError;
      if (state.phase !== 'lobby' && state.phase !== 'revealed') {
        return rejected(state, 'invalid-phase');
      }

      const nextIndex =
        state.phase === 'lobby' ? 0 : (state.currentCaseIndex ?? -1) + 1;
      if (!state.manifest.cases[nextIndex]) {
        return rejected(state, 'invalid-phase');
      }

      return {
        status: 'accepted',
        state: {
          ...state,
          phase: 'open',
          currentCaseIndex: nextIndex,
          answersByParticipant: {},
          revision: state.revision + 1,
        },
      };
    }

    case 'reveal-current': {
      const roleError = requireTeacher(state, actor);
      if (roleError) return roleError;
      if (state.phase !== 'open') return rejected(state, 'invalid-phase');

      const activityCase = currentCase(state);
      const counts = Object.fromEntries(
        activityCase.choiceIds.map((choiceId) => [choiceId, 0]),
      );
      for (const choiceId of Object.values(state.answersByParticipant)) {
        const previousCount = counts[choiceId];
        if (previousCount === undefined) {
          throw new Error(
            'Room state contains an answer outside the manifest.',
          );
        }
        counts[choiceId] = previousCount + 1;
      }

      return {
        status: 'accepted',
        state: {
          ...state,
          phase: 'revealed',
          answersByParticipant: {},
          revealedResults: {
            ...state.revealedResults,
            [activityCase.id]: {
              answeredCount: Object.keys(state.answersByParticipant).length,
              counts,
            },
          },
          revision: state.revision + 1,
        },
      };
    }

    case 'show-summary': {
      const roleError = requireTeacher(state, actor);
      if (roleError) return roleError;
      if (state.phase !== 'revealed') return rejected(state, 'invalid-phase');
      if (state.currentCaseIndex !== state.manifest.cases.length - 1) {
        return rejected(state, 'cases-remaining');
      }
      return {
        status: 'accepted',
        state: {
          ...state,
          phase: 'summary',
          revision: state.revision + 1,
        },
      };
    }

    case 'end-room': {
      const roleError = requireTeacher(state, actor);
      if (roleError) return roleError;
      return {
        status: 'accepted',
        state: endRoom(state, 'teacher-ended'),
      };
    }

    case 'answer': {
      if (actor.role !== 'student') return rejected(state, 'student-only');
      if (state.phase !== 'open') return rejected(state, 'invalid-phase');

      const activityCase = currentCase(state);
      if (command.caseId !== activityCase.id) {
        return rejected(state, 'invalid-case');
      }
      if (!activityCase.choiceIds.includes(command.choiceId)) {
        return rejected(state, 'invalid-choice');
      }

      const previousChoiceId = state.answersByParticipant[actor.participantKey];
      const outcome =
        previousChoiceId === undefined
          ? 'accepted'
          : previousChoiceId === command.choiceId
            ? 'unchanged'
            : 'revised';
      const nextRevision =
        outcome === 'unchanged' ? state.revision : state.revision + 1;
      const nextState =
        outcome === 'unchanged'
          ? state
          : {
              ...state,
              revision: nextRevision,
              answersByParticipant: {
                ...state.answersByParticipant,
                [actor.participantKey]: command.choiceId,
              },
            };

      return {
        status: 'accepted',
        state: nextState,
        acknowledgement: {
          protocolVersion: ROOM_PROTOCOL_VERSION,
          type: 'answer-ack',
          caseId: command.caseId,
          choiceId: command.choiceId,
          outcome,
          revision: nextRevision,
        },
      };
    }

    default:
      return assertNever(command);
  }
}

function currentCaseReference(state: RoomState) {
  const activityCase = currentCase(state);
  return {
    id: activityCase.id,
    contentVersion: activityCase.contentVersion,
    position: (state.currentCaseIndex ?? 0) + 1,
  };
}

export function projectRoomForTeacher(state: RoomState): TeacherRoomProjection {
  const base = {
    role: 'teacher' as const,
    revision: state.revision,
    participantCount: state.participantCount,
    totalCaseCount: state.manifest.cases.length,
  };

  const phase = state.phase;
  switch (phase) {
    case 'lobby':
      return { ...base, phase: 'lobby' };
    case 'open':
      return {
        ...base,
        phase: 'open',
        currentCase: currentCaseReference(state),
        answeredCount: Object.keys(state.answersByParticipant).length,
      };
    case 'revealed': {
      const activityCase = currentCase(state);
      const result = state.revealedResults[activityCase.id];
      if (!result) throw new Error('Revealed room state has no aggregate.');
      return {
        ...base,
        phase: 'revealed',
        currentCase: currentCaseReference(state),
        answeredCount: result.answeredCount,
        counts: result.counts,
      };
    }
    case 'summary':
      return {
        ...base,
        phase: 'summary',
        results: state.manifest.cases.map((activityCase) => {
          const result = state.revealedResults[activityCase.id];
          if (!result) {
            throw new Error('Summary room state has an incomplete aggregate.');
          }
          return {
            caseId: activityCase.id,
            answeredCount: result.answeredCount,
            counts: result.counts,
          };
        }),
      };
    case 'ended':
      return {
        ...base,
        phase: 'ended',
        reason: state.endReason ?? 'teacher-ended',
      };
    default:
      return assertNever(phase);
  }
}

export function projectRoomForStudent(
  state: RoomState,
  participantKey: string,
): StudentRoomProjection {
  const base = {
    role: 'student' as const,
    revision: state.revision,
    totalCaseCount: state.manifest.cases.length,
  };

  const phase = state.phase;
  switch (phase) {
    case 'lobby':
      return { ...base, phase: 'lobby' };
    case 'open': {
      const activityCase = currentCase(state);
      const submittedChoiceId = state.answersByParticipant[participantKey];
      return {
        ...base,
        phase: 'open',
        currentCase: {
          ...currentCaseReference(state),
          choiceIds: activityCase.choiceIds,
        },
        ...(submittedChoiceId ? { submittedChoiceId } : {}),
      };
    }
    case 'revealed':
      return {
        ...base,
        phase: 'revealed',
        currentCase: currentCaseReference(state),
      };
    case 'summary':
      return { ...base, phase: 'summary' };
    case 'ended':
      return {
        ...base,
        phase: 'ended',
        reason: state.endReason ?? 'teacher-ended',
      };
    default:
      return assertNever(phase);
  }
}

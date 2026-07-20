import { describe, expect, it } from 'vitest';

import {
  ROOM_PROTOCOL_VERSION,
  applyRoomCommand,
  createRoomState,
  projectRoomForStudent,
  projectRoomForTeacher,
  type RoomActivityManifest,
  type RoomCommand,
  type RoomState,
} from './protocol';

const manifest: RoomActivityManifest = {
  protocolVersion: ROOM_PROTOCOL_VERSION,
  locale: 'zh-TW',
  cases: [
    {
      id: 'case.one',
      contentVersion: '1.0.0',
      choiceIds: ['choice.safe', 'choice.risky'],
    },
    {
      id: 'case.two',
      contentVersion: '2.0.0',
      choiceIds: ['choice.stop', 'choice.send'],
    },
  ],
};

const createdAt = 1_000;
const expiresAt = 10_000;

function createState(): RoomState {
  return createRoomState({
    manifest,
    createdAt,
    expiresAt,
    participantCount: 3,
  });
}

function apply(
  state: RoomState,
  command: RoomCommand,
  actor: { role: 'teacher' } | { role: 'student'; participantKey: string },
  now = 2_000,
) {
  return applyRoomCommand(state, command, actor, now);
}

describe('room command state machine', () => {
  it('enforces role-specific commands and command-specific phases', () => {
    const initial = createState();
    expect(
      apply(
        initial,
        { protocolVersion: 1, type: 'open-case' },
        { role: 'student', participantKey: 'student-a' },
      ),
    ).toMatchObject({
      status: 'rejected',
      error: { code: 'teacher-only' },
      state: initial,
    });

    const opened = apply(
      initial,
      { protocolVersion: 1, type: 'open-case' },
      { role: 'teacher' },
    );
    expect(opened).toMatchObject({
      status: 'accepted',
      state: { phase: 'open', currentCaseIndex: 0, revision: 1 },
    });

    expect(
      apply(
        opened.state,
        { protocolVersion: 1, type: 'open-case' },
        { role: 'teacher' },
      ),
    ).toMatchObject({
      status: 'rejected',
      error: { code: 'invalid-phase' },
    });
    expect(
      apply(
        opened.state,
        { protocolVersion: 1, type: 'show-summary' },
        { role: 'teacher' },
      ),
    ).toMatchObject({
      status: 'rejected',
      error: { code: 'invalid-phase' },
    });
  });

  it('acknowledges idempotent answers and revisions without inflating counts', () => {
    const opened = apply(
      createState(),
      { protocolVersion: 1, type: 'open-case' },
      { role: 'teacher' },
    ).state;
    const first = apply(
      opened,
      {
        protocolVersion: 1,
        type: 'answer',
        caseId: 'case.one',
        choiceId: 'choice.safe',
      },
      { role: 'student', participantKey: 'student-a' },
    );
    expect(first).toMatchObject({
      status: 'accepted',
      acknowledgement: { outcome: 'accepted', revision: 2 },
      state: {
        revision: 2,
        answersByParticipant: { 'student-a': 'choice.safe' },
      },
    });

    const retry = apply(
      first.state,
      {
        protocolVersion: 1,
        type: 'answer',
        caseId: 'case.one',
        choiceId: 'choice.safe',
      },
      { role: 'student', participantKey: 'student-a' },
    );
    expect(retry).toMatchObject({
      status: 'accepted',
      acknowledgement: { outcome: 'unchanged', revision: 2 },
      state: {
        revision: 2,
        answersByParticipant: { 'student-a': 'choice.safe' },
      },
    });

    const changed = apply(
      retry.state,
      {
        protocolVersion: 1,
        type: 'answer',
        caseId: 'case.one',
        choiceId: 'choice.risky',
      },
      { role: 'student', participantKey: 'student-a' },
    );
    expect(changed).toMatchObject({
      status: 'accepted',
      acknowledgement: { outcome: 'revised', revision: 3 },
      state: {
        revision: 3,
        answersByParticipant: { 'student-a': 'choice.risky' },
      },
    });
  });

  it('rejects stale cases, unknown choices, teacher answers, and late answers', () => {
    const opened = apply(
      createState(),
      { protocolVersion: 1, type: 'open-case' },
      { role: 'teacher' },
    ).state;

    expect(
      apply(
        opened,
        {
          protocolVersion: 1,
          type: 'answer',
          caseId: 'case.two',
          choiceId: 'choice.stop',
        },
        { role: 'student', participantKey: 'student-a' },
      ),
    ).toMatchObject({ status: 'rejected', error: { code: 'invalid-case' } });
    expect(
      apply(
        opened,
        {
          protocolVersion: 1,
          type: 'answer',
          caseId: 'case.one',
          choiceId: 'choice.unknown',
        },
        { role: 'student', participantKey: 'student-a' },
      ),
    ).toMatchObject({ status: 'rejected', error: { code: 'invalid-choice' } });
    expect(
      apply(
        opened,
        {
          protocolVersion: 1,
          type: 'answer',
          caseId: 'case.one',
          choiceId: 'choice.safe',
        },
        { role: 'teacher' },
      ),
    ).toMatchObject({ status: 'rejected', error: { code: 'student-only' } });

    const revealed = apply(
      opened,
      { protocolVersion: 1, type: 'reveal-current' },
      { role: 'teacher' },
    ).state;
    expect(
      apply(
        revealed,
        {
          protocolVersion: 1,
          type: 'answer',
          caseId: 'case.one',
          choiceId: 'choice.safe',
        },
        { role: 'student', participantKey: 'student-a' },
      ),
    ).toMatchObject({ status: 'rejected', error: { code: 'invalid-phase' } });
  });

  it('reveals aggregates atomically, removes participant answers, and advances in order', () => {
    let state = apply(
      createState(),
      { protocolVersion: 1, type: 'open-case' },
      { role: 'teacher' },
    ).state;
    for (const [participantKey, choiceId] of [
      ['student-a', 'choice.safe'],
      ['student-b', 'choice.risky'],
      ['student-c', 'choice.safe'],
    ] as const) {
      state = apply(
        state,
        {
          protocolVersion: 1,
          type: 'answer',
          caseId: 'case.one',
          choiceId,
        },
        { role: 'student', participantKey },
      ).state;
    }

    const revealed = apply(
      state,
      { protocolVersion: 1, type: 'reveal-current' },
      { role: 'teacher' },
    );
    expect(revealed).toMatchObject({
      status: 'accepted',
      state: {
        phase: 'revealed',
        answersByParticipant: {},
        revealedResults: {
          'case.one': {
            answeredCount: 3,
            counts: { 'choice.safe': 2, 'choice.risky': 1 },
          },
        },
      },
    });

    const next = apply(
      revealed.state,
      { protocolVersion: 1, type: 'open-case' },
      { role: 'teacher' },
    );
    expect(next).toMatchObject({
      status: 'accepted',
      state: { phase: 'open', currentCaseIndex: 1 },
    });
  });

  it('allows summary only after the final case is revealed', () => {
    let state = apply(
      createState(),
      { protocolVersion: 1, type: 'open-case' },
      { role: 'teacher' },
    ).state;
    state = apply(
      state,
      { protocolVersion: 1, type: 'reveal-current' },
      { role: 'teacher' },
    ).state;
    expect(
      apply(
        state,
        { protocolVersion: 1, type: 'show-summary' },
        { role: 'teacher' },
      ),
    ).toMatchObject({ status: 'rejected', error: { code: 'cases-remaining' } });

    state = apply(
      state,
      { protocolVersion: 1, type: 'open-case' },
      { role: 'teacher' },
    ).state;
    state = apply(
      state,
      { protocolVersion: 1, type: 'reveal-current' },
      { role: 'teacher' },
    ).state;
    const summary = apply(
      state,
      { protocolVersion: 1, type: 'show-summary' },
      { role: 'teacher' },
    );
    expect(summary).toMatchObject({
      status: 'accepted',
      state: { phase: 'summary' },
    });
  });

  it('expires before processing a command and can be explicitly ended', () => {
    const expired = apply(
      createState(),
      { protocolVersion: 1, type: 'open-case' },
      { role: 'teacher' },
      expiresAt,
    );
    expect(expired).toMatchObject({
      status: 'rejected',
      error: { code: 'room-expired' },
      state: { phase: 'ended', endReason: 'expired' },
    });

    const ended = apply(
      createState(),
      { protocolVersion: 1, type: 'end-room' },
      { role: 'teacher' },
    );
    expect(ended).toMatchObject({
      status: 'accepted',
      state: {
        phase: 'ended',
        endReason: 'teacher-ended',
        answersByParticipant: {},
      },
    });
  });
});

describe('role-specific reconnect projections', () => {
  it('hides all tallies and scores while answers are open', () => {
    let state = apply(
      createState(),
      { protocolVersion: 1, type: 'open-case' },
      { role: 'teacher' },
    ).state;
    state = apply(
      state,
      {
        protocolVersion: 1,
        type: 'answer',
        caseId: 'case.one',
        choiceId: 'choice.safe',
      },
      { role: 'student', participantKey: 'student-a' },
    ).state;

    expect(projectRoomForTeacher(state)).toEqual({
      role: 'teacher',
      phase: 'open',
      revision: 2,
      participantCount: 3,
      totalCaseCount: 2,
      currentCase: {
        id: 'case.one',
        contentVersion: '1.0.0',
        position: 1,
      },
      answeredCount: 1,
    });
    expect(projectRoomForStudent(state, 'student-a')).toEqual({
      role: 'student',
      phase: 'open',
      revision: 2,
      totalCaseCount: 2,
      currentCase: {
        id: 'case.one',
        contentVersion: '1.0.0',
        position: 1,
        choiceIds: ['choice.safe', 'choice.risky'],
      },
      submittedChoiceId: 'choice.safe',
    });

    expect(JSON.stringify(projectRoomForTeacher(state))).not.toContain(
      'counts',
    );
    expect(
      JSON.stringify(projectRoomForStudent(state, 'student-a')),
    ).not.toContain('participantCount');
  });

  it('reveals counts only to the teacher and never sends teacher summary to students', () => {
    let state = apply(
      createState(),
      { protocolVersion: 1, type: 'open-case' },
      { role: 'teacher' },
    ).state;
    state = apply(
      state,
      {
        protocolVersion: 1,
        type: 'answer',
        caseId: 'case.one',
        choiceId: 'choice.safe',
      },
      { role: 'student', participantKey: 'student-a' },
    ).state;
    state = apply(
      state,
      { protocolVersion: 1, type: 'reveal-current' },
      { role: 'teacher' },
    ).state;

    expect(projectRoomForTeacher(state)).toMatchObject({
      phase: 'revealed',
      answeredCount: 1,
      counts: { 'choice.safe': 1, 'choice.risky': 0 },
    });
    expect(projectRoomForStudent(state, 'student-a')).toEqual({
      role: 'student',
      phase: 'revealed',
      revision: 3,
      totalCaseCount: 2,
      currentCase: {
        id: 'case.one',
        contentVersion: '1.0.0',
        position: 1,
      },
    });
  });
});

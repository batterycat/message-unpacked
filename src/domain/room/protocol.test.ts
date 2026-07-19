import { describe, expect, it } from 'vitest';

import {
  applyRoomMessage,
  createRoomProjection,
  parseRoomClientMessage,
} from './protocol';

describe('classroom room protocol', () => {
  it('rejects malformed or unsafe client messages', () => {
    expect(parseRoomClientMessage({ type: 'hello', role: 'admin' })).toBeNull();
    expect(
      parseRoomClientMessage({
        type: 'answer',
        caseId: 'case/with/path',
        choiceId: 'choice.safe',
      }),
    ).toBeNull();
    expect(
      parseRoomClientMessage({
        type: 'teacher-phase',
        phase: 'question',
        caseId: 'case.safe',
      }),
    ).toEqual({
      type: 'teacher-phase',
      phase: 'question',
      caseId: 'case.safe',
    });
  });

  it('keeps anonymous tallies and only lets teachers control the room', () => {
    const initial = createRoomProjection();
    const answer = applyRoomMessage(
      initial,
      { type: 'answer', caseId: 'case.one', choiceId: 'choice.safe' },
      'student',
    );
    const secondAnswer = applyRoomMessage(
      answer.projection,
      { type: 'answer', caseId: 'case.one', choiceId: 'choice.safe' },
      'student',
    );

    expect(secondAnswer.projection.tallies).toEqual({
      'case.one': { 'choice.safe': 2 },
    });
    expect(
      applyRoomMessage(
        secondAnswer.projection,
        { type: 'teacher-phase', phase: 'debrief', caseId: 'case.one' },
        'student',
      ).events[0],
    ).toMatchObject({ type: 'error', code: 'teacher-only' });

    const teacherChange = applyRoomMessage(
      secondAnswer.projection,
      { type: 'teacher-phase', phase: 'debrief', caseId: 'case.one' },
      'teacher',
    );
    expect(teacherChange.events).toEqual([
      { type: 'phase', phase: 'debrief', caseId: 'case.one' },
    ]);

    const lobby = applyRoomMessage(
      teacherChange.projection,
      { type: 'teacher-phase', phase: 'lobby' },
      'teacher',
    );
    expect(lobby.projection).toEqual({ phase: 'lobby', tallies: {} });
  });
});

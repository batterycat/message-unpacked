import { describe, expect, it } from 'vitest';

import {
  ROOM_PROTOCOL_VERSION,
  parseCreateRoomRequest,
  parseRoomActivityManifest,
  parseRoomClientMessage,
  parseRoomServerMessage,
  parseRoomTicketRequest,
  validateRoomActivityManifest,
  type RoomPolicy,
} from './protocol';

const cases = Array.from({ length: 12 }, (_, index) => ({
  id: `case.${index + 1}`,
  contentVersion: '1.0.0',
  choiceIds: ['choice.safe', 'choice.unsafe'],
}));

const manifest = {
  protocolVersion: ROOM_PROTOCOL_VERSION,
  locale: 'zh-TW',
  cases,
};

const policy: RoomPolicy = {
  maxParticipants: 60,
  maxCases: 12,
  maxChoicesPerCase: 6,
  roomLifetimeSeconds: 7_200,
  maxMessageBytes: 4_096,
  ticketLifetimeSeconds: 30,
  maxPendingConnections: 20,
  pendingConnectionTimeoutSeconds: 10,
  roomCreatesPerMinute: 5,
  ticketAttemptsPerMinute: 120,
  participantMessageBurst: 10,
  participantMessagesPerMinute: 30,
  roomMessagesPerMinute: 600,
  malformedFrameLimit: 5,
};

describe('room external protocol', () => {
  it('keeps a live activity manifest independent of static ActivityConfig caps', () => {
    const parsed = parseRoomActivityManifest(manifest);

    expect(parsed?.cases).toHaveLength(12);
    if (!parsed) throw new Error('Expected a valid live room manifest.');
    expect(validateRoomActivityManifest(parsed, policy)).toEqual({
      success: true,
      manifest: parsed,
    });
    expect(
      validateRoomActivityManifest(parsed, { ...policy, maxCases: 10 }),
    ).toEqual({ success: false, reason: 'too-many-cases' });
  });

  it('rejects malformed, duplicate, unsupported, and extra manifest data', () => {
    expect(
      parseRoomActivityManifest({ ...manifest, protocolVersion: 2 }),
    ).toBeNull();
    expect(
      parseRoomActivityManifest({ ...manifest, cases: [cases[0], cases[0]] }),
    ).toBeNull();
    expect(
      parseRoomActivityManifest({ ...manifest, unexpected: true }),
    ).toBeNull();
    expect(
      parseRoomActivityManifest({
        ...manifest,
        cases: [{ ...cases[0], choiceIds: ['choice.safe', 'choice.safe'] }],
      }),
    ).toBeNull();
  });

  it('strictly parses versioned create and ticket HTTP payloads', () => {
    expect(parseCreateRoomRequest({ protocolVersion: 1, manifest })).toEqual({
      protocolVersion: 1,
      manifest,
    });
    expect(
      parseCreateRoomRequest({
        protocolVersion: 1,
        manifest,
        teacherSecret: 'must-not-be-client-supplied',
      }),
    ).toBeNull();

    expect(
      parseRoomTicketRequest({
        protocolVersion: 1,
        role: 'teacher',
        teacherSecret: 'a'.repeat(43),
      }),
    ).not.toBeNull();
    expect(
      parseRoomTicketRequest({
        protocolVersion: 1,
        role: 'student',
        teacherSecret: 'a'.repeat(43),
      }),
    ).toBeNull();
    expect(
      parseRoomTicketRequest({
        protocolVersion: 1,
        role: 'student',
        participantToken: 'too-short',
      }),
    ).toBeNull();
  });

  it('strictly parses command-specific WebSocket messages', () => {
    expect(
      parseRoomClientMessage({ protocolVersion: 1, type: 'open-case' }),
    ).toEqual({ protocolVersion: 1, type: 'open-case' });
    expect(
      parseRoomClientMessage({
        protocolVersion: 1,
        type: 'answer',
        caseId: 'case.1',
        choiceId: 'choice.safe',
      }),
    ).toEqual({
      protocolVersion: 1,
      type: 'answer',
      caseId: 'case.1',
      choiceId: 'choice.safe',
    });
    expect(
      parseRoomClientMessage({
        protocolVersion: 1,
        type: 'teacher-phase',
        phase: 'open',
      }),
    ).toBeNull();
    expect(
      parseRoomClientMessage({
        protocolVersion: 1,
        type: 'answer',
        caseId: 'case.1',
        choiceId: 'choice.safe',
        score: 100,
      }),
    ).toBeNull();
  });

  it('does not accept broad or unversioned server messages', () => {
    expect(
      parseRoomServerMessage({
        protocolVersion: 1,
        type: 'answer-ack',
        caseId: 'case.1',
        choiceId: 'choice.safe',
        outcome: 'accepted',
        revision: 2,
      }),
    ).not.toBeNull();
    expect(
      parseRoomServerMessage({
        type: 'answer-ack',
        caseId: 'case.1',
        choiceId: 'choice.safe',
        outcome: 'accepted',
        revision: 2,
      }),
    ).toBeNull();
    expect(
      parseRoomServerMessage({
        protocolVersion: 1,
        type: 'tally',
        counts: { 'choice.safe': 2 },
      }),
    ).toBeNull();
    expect(
      parseRoomServerMessage({
        protocolVersion: 1,
        type: 'welcome',
        projection: {
          role: 'student',
          phase: 'open',
          revision: 1,
          totalCaseCount: 1,
          currentCase: {
            id: 'case.1',
            contentVersion: '1.0.0',
            position: 1,
            choiceIds: ['choice.safe', 'choice.safe'],
          },
        },
      }),
    ).toBeNull();
  });
});

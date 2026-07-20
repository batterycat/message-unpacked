import { describe, expect, it } from 'vitest';

import {
  ROOM_PROTOCOL_VERSION,
  parseRoomCapabilities,
  parseRoomPolicy,
} from './protocol';

const validPolicy = {
  maxParticipants: 60,
  maxCases: 10,
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

describe('room policy and capabilities', () => {
  it('accepts complete configurable deployment policy', () => {
    expect(parseRoomPolicy(validPolicy)).toEqual(validPolicy);
    expect(
      parseRoomPolicy({
        ...validPolicy,
        maxParticipants: 480,
        maxCases: 25,
      }),
    ).toMatchObject({ maxParticipants: 480, maxCases: 25 });
  });

  it.each([
    [{ ...validPolicy, maxParticipants: 0 }],
    [{ ...validPolicy, maxCases: Number.NaN }],
    [{ ...validPolicy, roomLifetimeSeconds: 3.5 }],
    [{ ...validPolicy, maxMessageBytes: '4096' }],
    [{ ...validPolicy, maxMessageBytes: 4096, extra: true }],
  ])('fails closed for an invalid explicit policy: %o', (candidate) => {
    expect(parseRoomPolicy(candidate)).toBeNull();
  });

  it('exposes only effective public limits as versioned capabilities', () => {
    const capabilities = {
      protocolVersion: ROOM_PROTOCOL_VERSION,
      maxParticipants: validPolicy.maxParticipants,
      maxCases: validPolicy.maxCases,
      maxChoicesPerCase: validPolicy.maxChoicesPerCase,
      roomLifetimeSeconds: validPolicy.roomLifetimeSeconds,
      maxMessageBytes: validPolicy.maxMessageBytes,
    };

    expect(parseRoomCapabilities(capabilities)).toEqual(capabilities);
    expect(
      parseRoomCapabilities({
        ...capabilities,
        participantMessagesPerMinute: 30,
      }),
    ).toBeNull();
  });
});

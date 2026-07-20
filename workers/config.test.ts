import { describe, expect, it } from 'vitest';

import { loadRoomServiceConfig } from './config';

describe('room service configuration', () => {
  it('uses conservative free-demo defaults while staying disabled', () => {
    expect(loadRoomServiceConfig({})).toEqual({
      ok: true,
      value: {
        allowedOrigins: [],
        enabled: false,
        limits: {
          maxCases: 10,
          maxChoicesPerCase: 6,
          maxMessageBytes: 4096,
          maxParticipants: 60,
          roomTtlMinutes: 120,
        },
      },
    });
  });

  it('accepts explicit limits and exact browser origins', () => {
    expect(
      loadRoomServiceConfig({
        ALLOWED_ORIGINS:
          'https://batterycat.github.io, https://school.example.edu.tw',
        LIVE_ROOMS_ENABLED: 'true',
        MAX_CASES: '20',
        MAX_CHOICES_PER_CASE: '8',
        MAX_MESSAGE_BYTES: '8192',
        MAX_PARTICIPANTS: '120',
        ROOM_TTL_MINUTES: '180',
      }),
    ).toEqual({
      ok: true,
      value: {
        allowedOrigins: [
          'https://batterycat.github.io',
          'https://school.example.edu.tw',
        ],
        enabled: true,
        limits: {
          maxCases: 20,
          maxChoicesPerCase: 8,
          maxMessageBytes: 8192,
          maxParticipants: 120,
          roomTtlMinutes: 180,
        },
      },
    });
  });

  it.each([
    [{ LIVE_ROOMS_ENABLED: 'yes' }, 'LIVE_ROOMS_ENABLED'],
    [{ LIVE_ROOMS_ENABLED: 'true', ALLOWED_ORIGINS: '' }, 'ALLOWED_ORIGINS'],
    [{ MAX_PARTICIPANTS: '0' }, 'MAX_PARTICIPANTS'],
    [{ MAX_PARTICIPANTS: '501' }, 'MAX_PARTICIPANTS'],
    [{ MAX_CASES: '2.5' }, 'MAX_CASES'],
    [{ ROOM_TTL_MINUTES: '1441' }, 'ROOM_TTL_MINUTES'],
    [{ MAX_MESSAGE_BYTES: 'not-a-number' }, 'MAX_MESSAGE_BYTES'],
    [{ ALLOWED_ORIGINS: 'https://ok.example,not-a-url' }, 'ALLOWED_ORIGINS'],
  ])('fails closed for invalid explicit configuration %#', (env, field) => {
    expect(loadRoomServiceConfig(env)).toEqual({
      ok: false,
      error: {
        code: 'config-invalid',
        field,
      },
    });
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ROOM_PROTOCOL_VERSION } from '../../domain/room/protocol';
import {
  getRoomCapabilities,
  localizeRoomErrorCode,
  localizeRoomServiceError,
  normalizeRoomCode,
  RoomServiceError,
  roomReconnectDelay,
  roomSocketUrl,
} from './transport';
import { getCatalog } from '../../i18n/locale';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('classroom transport', () => {
  it('normalizes only Crockford room codes', () => {
    expect(normalizeRoomCode('abcde 12345')).toBe('ABCDE-12345');
    expect(normalizeRoomCode('ABCDE-I2345')).toBeNull();
    expect(normalizeRoomCode('short')).toBeNull();
  });

  it('keeps credentials in an encoded WebSocket ticket query only', () => {
    expect(
      roomSocketUrl(
        'https://rooms.example/service/',
        'ABCDE-12345',
        'ticket/with+symbols',
      ),
    ).toBe(
      'wss://rooms.example/service/v1/rooms/ABCDE-12345/socket?ticket=ticket%2Fwith%2Bsymbols',
    );
  });

  it('uses bounded exponential reconnect delays with jitter', () => {
    expect(roomReconnectDelay(0, () => 0)).toBe(400);
    expect(roomReconnectDelay(0, () => 0.5)).toBe(500);
    expect(roomReconnectDelay(1, () => 1)).toBe(1_200);
    expect(roomReconnectDelay(99, () => 0.5)).toBe(4_000);
  });

  it('validates capabilities received from the service', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          protocolVersion: ROOM_PROTOCOL_VERSION,
          maxParticipants: 60,
          maxCases: 10,
          maxChoicesPerCase: 6,
          roomLifetimeSeconds: 7_200,
          maxMessageBytes: 4_096,
        }),
      ),
    );
    await expect(
      getRoomCapabilities('https://rooms.example'),
    ).resolves.toMatchObject({
      maxParticipants: 60,
      maxCases: 10,
    });
  });

  it('turns non-JSON quota failures into a retryable unavailable state', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response('quota exceeded', { status: 503 })),
    );
    await expect(
      getRoomCapabilities('https://rooms.example'),
    ).rejects.toMatchObject({
      code: 'service-unavailable',
      retryable: true,
    } satisfies Partial<RoomServiceError>);
  });

  it('maps stable backend error codes to the active interface language', () => {
    const error = new RoomServiceError(
      'room-full',
      'Unlocalized server message.',
      false,
    );

    expect(
      localizeRoomServiceError(error, getCatalog('zh-TW').classroomLive),
    ).toBe('這個教室已達人數上限，請告知教師。');
    expect(
      localizeRoomServiceError(error, getCatalog('en').classroomLive),
    ).toBe('This room has reached its participant limit.');
  });

  it('localizes WebSocket errors without exposing backend English messages', () => {
    expect(
      localizeRoomErrorCode(
        'invalid-choice',
        getCatalog('zh-TW').classroomLive,
      ),
    ).toBe(getCatalog('zh-TW').classroomLive.staleActivity);
    expect(
      localizeRoomErrorCode('invalid-phase', getCatalog('zh-TW').classroomLive),
    ).toBe(getCatalog('zh-TW').classroomLive.actionUnavailable);
  });
});

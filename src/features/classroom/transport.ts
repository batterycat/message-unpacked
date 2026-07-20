import {
  ROOM_PROTOCOL_VERSION,
  parseCreateRoomResponse,
  parseRoomCapabilities,
  parseRoomHttpErrorResponse,
  parseRoomTicketResponse,
  type CreateRoomRequest,
  type CreateRoomResponse,
  type RoomCapabilities,
  type RoomErrorCode,
  type RoomTicketRequest,
  type RoomTicketResponse,
} from '../../domain/room/protocol';
import type { MessageCatalog } from '../../i18n/catalogs';

export class RoomServiceError extends Error {
  constructor(
    public readonly code: RoomErrorCode,
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'RoomServiceError';
  }
}

export function isRoomTerminatedError(
  error: unknown,
): error is RoomServiceError {
  return (
    error instanceof RoomServiceError &&
    (error.code === 'room-ended' || error.code === 'room-expired')
  );
}

export function isRoomCredentialError(
  error: unknown,
): error is RoomServiceError {
  return error instanceof RoomServiceError && error.code === 'unauthorized';
}

export function roomReconnectDelay(
  attempt: number,
  random: () => number = Math.random,
): number {
  const boundedAttempt = Math.min(3, Math.max(0, Math.floor(attempt)));
  const jitter = 0.8 + Math.min(1, Math.max(0, random())) * 0.4;
  return Math.round(500 * 2 ** boundedAttempt * jitter);
}

export function localizeRoomServiceError(
  error: unknown,
  copy: MessageCatalog['classroomLive'],
): string {
  if (!(error instanceof RoomServiceError)) return copy.connectionFailed;
  return localizeRoomErrorCode(error.code, copy);
}

export function localizeRoomErrorCode(
  code: RoomErrorCode,
  copy: MessageCatalog['classroomLive'],
): string {
  switch (code) {
    case 'room-full':
      return copy.errorRoomFull;
    case 'room-ended':
    case 'room-expired':
      return copy.errorRoomEnded;
    case 'unauthorized':
      return copy.errorCredential;
    case 'rate-limited':
      return copy.errorRateLimited;
    case 'incompatible-protocol':
      return copy.errorProtocol;
    case 'stale-activity':
    case 'invalid-case':
    case 'invalid-choice':
      return copy.staleActivity;
    default:
      return copy.actionUnavailable;
  }
}

function serviceUrl(baseUrl: string, path: string): URL {
  const base = new URL(baseUrl);
  if (base.protocol !== 'https:' && base.protocol !== 'http:') {
    throw new RoomServiceError(
      'configuration-error',
      'The classroom service URL must use HTTP or HTTPS.',
      false,
    );
  }
  base.pathname = `${base.pathname.replace(/\/$/, '')}${path}`;
  base.search = '';
  base.hash = '';
  return base;
}

async function decodeResponse<T>(
  response: Response,
  parse: (value: unknown) => T | null,
): Promise<T> {
  let decoded: unknown;
  try {
    decoded = await response.json();
  } catch {
    throw new RoomServiceError(
      'service-unavailable',
      'The classroom service returned an unreadable response.',
      true,
    );
  }
  if (!response.ok) {
    const error = parseRoomHttpErrorResponse(decoded);
    throw new RoomServiceError(
      error?.error.code ?? 'service-unavailable',
      error?.error.message ?? 'The classroom service is unavailable.',
      error?.error.retryable ?? response.status >= 500,
    );
  }
  const parsed = parse(decoded);
  if (!parsed) {
    throw new RoomServiceError(
      'incompatible-protocol',
      'The classroom service uses an incompatible response format.',
      false,
    );
  }
  return parsed;
}

async function roomFetch<T>(
  input: URL,
  init: RequestInit,
  parse: (value: unknown) => T | null,
): Promise<T> {
  try {
    const response = await fetch(input, {
      ...init,
      cache: 'no-store',
      headers: {
        accept: 'application/json',
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...init.headers,
      },
    });
    return await decodeResponse(response, parse);
  } catch (error) {
    if (error instanceof RoomServiceError) throw error;
    throw new RoomServiceError(
      'service-unavailable',
      'The classroom service could not be reached.',
      true,
    );
  }
}

export function getRoomCapabilities(
  baseUrl: string,
): Promise<RoomCapabilities> {
  return roomFetch(
    serviceUrl(baseUrl, '/v1/capabilities'),
    { method: 'GET' },
    parseRoomCapabilities,
  );
}

export function createRoom(
  baseUrl: string,
  request: CreateRoomRequest,
): Promise<CreateRoomResponse> {
  return roomFetch(
    serviceUrl(baseUrl, '/v1/rooms'),
    { method: 'POST', body: JSON.stringify(request) },
    parseCreateRoomResponse,
  );
}

export function createRoomTicket(
  baseUrl: string,
  roomCode: string,
  request: RoomTicketRequest,
): Promise<RoomTicketResponse> {
  return roomFetch(
    serviceUrl(baseUrl, `/v1/rooms/${roomCode}/tickets`),
    { method: 'POST', body: JSON.stringify(request) },
    parseRoomTicketResponse,
  );
}

export function roomSocketUrl(
  baseUrl: string,
  roomCode: string,
  ticket: string,
): string {
  const url = serviceUrl(baseUrl, `/v1/rooms/${roomCode}/socket`);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('ticket', ticket);
  return url.toString();
}

export function normalizeRoomCode(value: string): string | null {
  const compact = value.toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (!/^[0-9A-HJKMNP-TV-Z]{10}$/.test(compact)) return null;
  return `${compact.slice(0, 5)}-${compact.slice(5)}`;
}

export function versionedRequest() {
  return { protocolVersion: ROOM_PROTOCOL_VERSION } as const;
}

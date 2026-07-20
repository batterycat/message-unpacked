import {
  ROOM_PROTOCOL_VERSION,
  applyRoomCommand,
  createRoomState,
  parseCreateRoomRequest,
  parseRoomActivityManifest,
  parseRoomClientMessage,
  parseRoomPolicy,
  parseRoomTicketRequest,
  projectRoomForStudent,
  projectRoomForTeacher,
  roomCapabilitiesFromPolicy,
  validateRoomActivityManifest,
  type RoomActivityManifest,
  type RoomActor,
  type RoomErrorCode,
  type RoomPolicy,
  type RoomServerMessage,
  type RoomState,
} from '../src/domain/room/protocol';
import { loadRoomServiceConfig, type RoomServiceConfig } from './config';

const ROOM_CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ROOM_PATH =
  /^\/v1\/rooms\/([0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5})$/;
const TICKET_PATH =
  /^\/v1\/rooms\/([0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5})\/tickets$/;
const SOCKET_PATH =
  /^\/v1\/rooms\/([0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5})\/socket$/;
const MAX_HTTP_BODY_BYTES = 64 * 1024;
const HEX_DIGEST_PATTERN = /^[a-f0-9]{64}$/;

type SocketAttachment = {
  role: 'teacher' | 'student';
  participantKey?: string;
  malformedFrames: number;
  messageWindowStartedAt: number;
  messagesInWindow: number;
  burstTokens: number;
  burstRefilledAt: number;
};

type RoomMetaRow = {
  protocol_version: number;
  locale: string;
  phase: string;
  current_case_index: number | null;
  teacher_secret_digest: string;
  created_at: number;
  expires_at: number;
  revision: number;
  end_reason: string | null;
  max_participants: number;
  max_message_bytes: number;
  malformed_frame_limit: number;
  ticket_lifetime_seconds: number;
  max_pending_connections: number;
  participant_message_burst: number;
  participant_messages_per_minute: number;
  room_messages_per_minute: number;
};

type CaseRow = {
  position: number;
  case_id: string;
  content_version: string;
};

type ChoiceRow = { case_id: string; choice_id: string; position: number };
type AnswerRow = { participant_digest: string; choice_id: string };
type ResultRow = { case_id: string; choice_id: string; answer_count: number };
type TicketRow = {
  role: string;
  participant_digest: string | null;
  expires_at: number;
};

type InternalInitRequest = {
  manifest: RoomActivityManifest;
  teacherSecretDigest: string;
  createdAt: number;
  expiresAt: number;
  policy: RoomPolicy;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUpgrade(request: Request): boolean {
  return request.headers.get('Upgrade')?.toLowerCase() === 'websocket';
}

function randomToken(byteCount: number): string {
  const bytes = new Uint8Array(byteCount);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

function randomRoomCode(): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  const characters = [...bytes].map(
    (byte) => ROOM_CODE_ALPHABET[byte & 31] ?? '0',
  );
  return `${characters.slice(0, 5).join('')}-${characters.slice(5).join('')}`;
}

async function digestSecret(secret: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(secret),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function policyFromConfig(config: RoomServiceConfig): RoomPolicy {
  return {
    maxParticipants: config.limits.maxParticipants,
    maxCases: config.limits.maxCases,
    maxChoicesPerCase: config.limits.maxChoicesPerCase,
    roomLifetimeSeconds: config.limits.roomTtlMinutes * 60,
    maxMessageBytes: config.limits.maxMessageBytes,
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
}

function publicError(
  code: RoomErrorCode,
  message: string,
  status: number,
  retryable = false,
): Response {
  return Response.json(
    {
      protocolVersion: ROOM_PROTOCOL_VERSION,
      error: { code, message, retryable },
    },
    {
      status,
      headers: { 'cache-control': 'no-store' },
    },
  );
}

function internalError(message: string, status: number): Response {
  return Response.json(
    { error: message },
    { status, headers: { 'cache-control': 'no-store' } },
  );
}

async function readJson(
  request: Request,
  maxBytes = MAX_HTTP_BODY_BYTES,
): Promise<{ ok: true; value: unknown } | { ok: false }> {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { ok: false };
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    return { ok: false };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}

function environmentRecord(env: Env): Record<string, string | undefined> {
  return {
    LIVE_ROOMS_ENABLED: env.LIVE_ROOMS_ENABLED,
    ALLOWED_ORIGINS: env.ALLOWED_ORIGINS,
    MAX_PARTICIPANTS: env.MAX_PARTICIPANTS,
    MAX_CASES: env.MAX_CASES,
    ROOM_TTL_MINUTES: env.ROOM_TTL_MINUTES,
    MAX_CHOICES_PER_CASE: env.MAX_CHOICES_PER_CASE,
    MAX_MESSAGE_BYTES: env.MAX_MESSAGE_BYTES,
  };
}

function requestSource(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ?? 'unknown-source';
}

async function consumeRateLimit(
  limiter: RateLimit,
  key: string,
): Promise<boolean | null> {
  try {
    return (await limiter.limit({ key })).success;
  } catch {
    return null;
  }
}

function addBrowserHeaders(response: Response, origin: string): Response {
  const headers = new Headers(response.headers);
  headers.set('access-control-allow-origin', origin);
  headers.set('cache-control', 'no-store');
  headers.set('vary', 'Origin');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
    webSocket: response.webSocket,
  });
}

function preflight(origin: string): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': origin,
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
      'access-control-max-age': '600',
      'cache-control': 'no-store',
      vary: 'Origin',
    },
  });
}

function parseInternalInit(value: unknown): InternalInitRequest | null {
  if (!isRecord(value)) return null;
  const manifest = parseRoomActivityManifest(value.manifest);
  const policy = parseRoomPolicy(value.policy);
  if (!manifest || !policy) return null;
  if (
    typeof value.teacherSecretDigest !== 'string' ||
    !HEX_DIGEST_PATTERN.test(value.teacherSecretDigest) ||
    typeof value.createdAt !== 'number' ||
    !Number.isSafeInteger(value.createdAt) ||
    typeof value.expiresAt !== 'number' ||
    !Number.isSafeInteger(value.expiresAt) ||
    value.expiresAt <= value.createdAt
  ) {
    return null;
  }
  return {
    manifest,
    policy,
    teacherSecretDigest: value.teacherSecretDigest,
    createdAt: value.createdAt,
    expiresAt: value.expiresAt,
  };
}

function errorMessage(code: RoomErrorCode): string {
  const messages: Partial<Record<RoomErrorCode, string>> = {
    'teacher-only': 'Only the teacher can use this control.',
    'student-only': 'Only a student clicker can submit an answer.',
    'invalid-phase': 'This action is not available in the current room phase.',
    'invalid-case': 'The answer does not match the current case.',
    'invalid-choice': 'The selected choice is not available.',
    'cases-remaining': 'Reveal every case before showing the summary.',
    'room-expired': 'This room has expired.',
    'room-ended': 'This room has ended.',
    unauthorized: 'The room credential is not valid.',
    'rate-limited': 'Too many requests. Please wait and try again.',
  };
  return messages[code] ?? 'The room request could not be completed.';
}

export class ClassroomRoom {
  fetch(): Response {
    return internalError(
      'Legacy classroom rooms are no longer available.',
      410,
    );
  }
}

export class ClassroomRoomV2 {
  private roomMessageWindowStartedAt = Date.now();
  private roomMessagesInWindow = 0;

  constructor(
    private readonly ctx: DurableObjectState,
    private readonly env: Env,
  ) {
    void this.env;
    this.ctx.blockConcurrencyWhile(async () => {
      this.createSchema();
    });
  }

  private createSchema(): void {
    const sql = this.ctx.storage.sql;
    sql.exec(`CREATE TABLE IF NOT EXISTS room_meta (
      singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
      protocol_version INTEGER NOT NULL,
      locale TEXT NOT NULL,
      phase TEXT NOT NULL,
      current_case_index INTEGER,
      teacher_secret_digest TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      revision INTEGER NOT NULL,
      end_reason TEXT,
      max_participants INTEGER NOT NULL,
      max_message_bytes INTEGER NOT NULL,
      malformed_frame_limit INTEGER NOT NULL,
      ticket_lifetime_seconds INTEGER NOT NULL,
      max_pending_connections INTEGER NOT NULL,
      participant_message_burst INTEGER NOT NULL,
      participant_messages_per_minute INTEGER NOT NULL,
      room_messages_per_minute INTEGER NOT NULL
    )`);
    sql.exec(`CREATE TABLE IF NOT EXISTS room_cases (
      position INTEGER PRIMARY KEY,
      case_id TEXT NOT NULL UNIQUE,
      content_version TEXT NOT NULL
    )`);
    sql.exec(`CREATE TABLE IF NOT EXISTS room_choices (
      case_id TEXT NOT NULL,
      choice_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      PRIMARY KEY (case_id, choice_id)
    )`);
    sql.exec(`CREATE TABLE IF NOT EXISTS participants (
      token_digest TEXT PRIMARY KEY,
      joined_at INTEGER NOT NULL
    )`);
    sql.exec(`CREATE TABLE IF NOT EXISTS current_answers (
      participant_digest TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      choice_id TEXT NOT NULL
    )`);
    sql.exec(`CREATE TABLE IF NOT EXISTS revealed_results (
      case_id TEXT NOT NULL,
      choice_id TEXT NOT NULL,
      answer_count INTEGER NOT NULL,
      PRIMARY KEY (case_id, choice_id)
    )`);
    sql.exec(`CREATE TABLE IF NOT EXISTS socket_tickets (
      ticket_digest TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      participant_digest TEXT,
      expires_at INTEGER NOT NULL
    )`);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/internal/init' && request.method === 'POST') {
      return this.initialize(request);
    }

    const state = this.loadState();
    if (!state) return internalError('Room not found.', 404);
    if (Date.now() >= state.expiresAt) {
      await this.expireAndDelete(state);
      return internalError('Room expired.', 410);
    }
    if (state.phase === 'ended') {
      await this.closeAndDelete();
      return internalError('Room ended.', 404);
    }

    if (url.pathname === '/internal/tickets' && request.method === 'POST') {
      return this.createTicket(request, state);
    }
    if (url.pathname === '/internal/socket' && request.method === 'GET') {
      return this.upgradeSocket(request, state);
    }
    return internalError('Room route not found.', 404);
  }

  private async initialize(request: Request): Promise<Response> {
    // deleteAll() removes the SQLite schema while a warm object instance may
    // still receive an extremely unlikely future initialization attempt.
    this.createSchema();
    if (this.loadMeta()) return internalError('Room already exists.', 409);
    const decoded = await readJson(request);
    const input = decoded.ok ? parseInternalInit(decoded.value) : null;
    if (!input) return internalError('Invalid room initialization.', 400);
    if (!validateRoomActivityManifest(input.manifest, input.policy).success) {
      return internalError('Room manifest exceeds policy.', 400);
    }
    if (
      input.expiresAt !==
      input.createdAt + input.policy.roomLifetimeSeconds * 1000
    ) {
      return internalError('Room expiry does not match policy.', 400);
    }

    this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec(
        `INSERT INTO room_meta (
          singleton, protocol_version, locale, phase, current_case_index,
          teacher_secret_digest, created_at, expires_at, revision, end_reason,
          max_participants, max_message_bytes, malformed_frame_limit,
          ticket_lifetime_seconds, max_pending_connections,
          participant_message_burst, participant_messages_per_minute,
          room_messages_per_minute
        ) VALUES (1, ?, ?, 'lobby', NULL, ?, ?, ?, 0, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ROOM_PROTOCOL_VERSION,
        input.manifest.locale,
        input.teacherSecretDigest,
        input.createdAt,
        input.expiresAt,
        input.policy.maxParticipants,
        input.policy.maxMessageBytes,
        input.policy.malformedFrameLimit,
        input.policy.ticketLifetimeSeconds,
        input.policy.maxPendingConnections,
        input.policy.participantMessageBurst,
        input.policy.participantMessagesPerMinute,
        input.policy.roomMessagesPerMinute,
      );
      for (const [caseIndex, activityCase] of input.manifest.cases.entries()) {
        this.ctx.storage.sql.exec(
          'INSERT INTO room_cases (position, case_id, content_version) VALUES (?, ?, ?)',
          caseIndex,
          activityCase.id,
          activityCase.contentVersion,
        );
        for (const [
          choiceIndex,
          choiceId,
        ] of activityCase.choiceIds.entries()) {
          this.ctx.storage.sql.exec(
            'INSERT INTO room_choices (case_id, choice_id, position) VALUES (?, ?, ?)',
            activityCase.id,
            choiceId,
            choiceIndex,
          );
        }
      }
    });
    await this.ctx.storage.setAlarm(input.expiresAt);
    return new Response(null, {
      status: 201,
      headers: { 'cache-control': 'no-store' },
    });
  }

  private async createTicket(
    request: Request,
    state: RoomState,
  ): Promise<Response> {
    const decoded = await readJson(request);
    const ticketRequest = decoded.ok
      ? parseRoomTicketRequest(decoded.value)
      : null;
    if (!ticketRequest) return internalError('Invalid ticket request.', 400);

    const meta = this.requireMeta();
    let participantToken: string | undefined;
    let participantDigest: string | null = null;
    let participantAdded = false;

    if (ticketRequest.role === 'teacher') {
      if (
        (await digestSecret(ticketRequest.teacherSecret)) !==
        meta.teacher_secret_digest
      ) {
        return internalError('Unauthorized.', 401);
      }
    } else if (ticketRequest.participantToken) {
      participantDigest = await digestSecret(ticketRequest.participantToken);
      const participant = this.ctx.storage.sql
        .exec<{ token_digest: string }>(
          'SELECT token_digest FROM participants WHERE token_digest = ?',
          participantDigest,
        )
        .toArray()[0];
      if (!participant) return internalError('Unauthorized.', 401);
    } else {
      participantToken = randomToken(24);
      participantDigest = await digestSecret(participantToken);
      participantAdded = this.ctx.storage.transactionSync(() => {
        if (this.participantCount() >= meta.max_participants) return false;
        this.ctx.storage.sql.exec(
          'INSERT INTO participants (token_digest, joined_at) VALUES (?, ?)',
          participantDigest,
          Date.now(),
        );
        return true;
      });
      if (!participantAdded) return internalError('Room is full.', 409);
    }

    const ticket = randomToken(24);
    const ticketDigest = await digestSecret(ticket);
    const ticketExpiresAt = Date.now() + meta.ticket_lifetime_seconds * 1_000;
    const ticketIssued = this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec(
        'DELETE FROM socket_tickets WHERE expires_at <= ?',
        Date.now(),
      );
      const pendingTicketCount = this.ctx.storage.sql
        .exec<{ ticket_count: number }>(
          'SELECT COUNT(*) AS ticket_count FROM socket_tickets',
        )
        .one().ticket_count;
      if (pendingTicketCount >= meta.max_pending_connections) return false;
      this.ctx.storage.sql.exec(
        `INSERT INTO socket_tickets
          (ticket_digest, role, participant_digest, expires_at)
          VALUES (?, ?, ?, ?)`,
        ticketDigest,
        ticketRequest.role,
        participantDigest,
        ticketExpiresAt,
      );
      return true;
    });
    if (!ticketIssued) {
      if (participantAdded && participantDigest) {
        this.ctx.storage.sql.exec(
          'DELETE FROM participants WHERE token_digest = ?',
          participantDigest,
        );
      }
      return internalError('Too many pending socket connections.', 429);
    }

    if (participantAdded) await this.broadcastState(this.loadState() ?? state);
    return Response.json(
      {
        protocolVersion: ROOM_PROTOCOL_VERSION,
        role: ticketRequest.role,
        ticket,
        ticketExpiresAt,
        ...(participantToken ? { participantToken } : {}),
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  }

  private async upgradeSocket(
    request: Request,
    state: RoomState,
  ): Promise<Response> {
    if (!isUpgrade(request)) {
      return internalError('A WebSocket upgrade is required.', 426);
    }
    const url = new URL(request.url);
    const ticket = url.searchParams.get('ticket');
    if (
      !ticket ||
      [...url.searchParams.keys()].some((key) => key !== 'ticket')
    ) {
      return internalError('Invalid socket ticket.', 401);
    }
    const ticketDigest = await digestSecret(ticket);
    const ticketRow = this.ctx.storage.transactionSync(() => {
      const row = this.ctx.storage.sql
        .exec<TicketRow>(
          `SELECT role, participant_digest, expires_at
           FROM socket_tickets WHERE ticket_digest = ?`,
          ticketDigest,
        )
        .toArray()[0];
      if (row) {
        this.ctx.storage.sql.exec(
          'DELETE FROM socket_tickets WHERE ticket_digest = ?',
          ticketDigest,
        );
      }
      return row;
    });
    if (!ticketRow || ticketRow.expires_at <= Date.now()) {
      return internalError('Invalid or expired socket ticket.', 401);
    }
    if (ticketRow.role !== 'teacher' && ticketRow.role !== 'student') {
      return internalError('Invalid socket role.', 401);
    }
    if (ticketRow.role === 'student' && !ticketRow.participant_digest) {
      return internalError('Invalid participant ticket.', 401);
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    const meta = this.requireMeta();
    const now = Date.now();
    const attachment: SocketAttachment = {
      role: ticketRow.role,
      ...(ticketRow.participant_digest
        ? { participantKey: ticketRow.participant_digest }
        : {}),
      malformedFrames: 0,
      messageWindowStartedAt: now,
      messagesInWindow: 0,
      burstTokens: meta.participant_message_burst,
      burstRefilledAt: now,
    };
    server.serializeAttachment(attachment);
    this.ctx.acceptWebSocket(server, [ticketRow.role]);
    this.send(server, {
      protocolVersion: ROOM_PROTOCOL_VERSION,
      type: 'welcome',
      projection: this.projectForAttachment(state, attachment),
    });
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(
    socket: WebSocket,
    rawMessage: string | ArrayBuffer,
  ): Promise<void> {
    const attachment = this.readAttachment(socket);
    if (!attachment) {
      socket.close(1008, 'Invalid room session.');
      return;
    }
    const state = this.loadState();
    if (!state) {
      socket.close(1008, 'Room no longer exists.');
      return;
    }
    if (Date.now() >= state.expiresAt) {
      await this.expireAndDelete(state);
      return;
    }

    const meta = this.requireMeta();
    if (
      typeof rawMessage !== 'string' ||
      new TextEncoder().encode(rawMessage).byteLength > meta.max_message_bytes
    ) {
      this.rejectInvalidFrame(socket, attachment, meta, 'malformed-message');
      return;
    }
    if (!this.consumeMessageAllowance(socket, attachment, meta)) return;

    let decoded: unknown;
    try {
      decoded = JSON.parse(rawMessage) as unknown;
    } catch {
      this.rejectInvalidFrame(socket, attachment, meta, 'malformed-message');
      return;
    }
    const message = parseRoomClientMessage(decoded);
    if (!message) {
      const code =
        isRecord(decoded) &&
        'protocolVersion' in decoded &&
        decoded.protocolVersion !== ROOM_PROTOCOL_VERSION
          ? 'incompatible-protocol'
          : 'malformed-message';
      this.rejectInvalidFrame(socket, attachment, meta, code);
      return;
    }

    if (message.type === 'hello') {
      this.send(socket, {
        protocolVersion: ROOM_PROTOCOL_VERSION,
        type: 'room-state',
        projection: this.projectForAttachment(state, attachment),
      });
      return;
    }

    const actor: RoomActor =
      attachment.role === 'teacher'
        ? { role: 'teacher' }
        : { role: 'student', participantKey: attachment.participantKey ?? '' };
    const result = applyRoomCommand(state, message, actor, Date.now());
    if (result.status === 'rejected') {
      if (
        result.error.code === 'teacher-only' ||
        result.error.code === 'student-only'
      ) {
        this.rejectInvalidFrame(socket, attachment, meta, result.error.code);
      } else {
        this.sendRoomError(socket, result.error.code);
      }
      return;
    }

    this.persistAcceptedCommand(state, result.state, message.type);
    if (result.acknowledgement) this.send(socket, result.acknowledgement);
    await this.broadcastState(result.state);
    if (result.state.phase === 'ended') {
      await this.closeAndDelete();
    }
  }

  webSocketClose(socket: WebSocket): void {
    try {
      socket.close(1000, 'Connection closed.');
    } catch {
      // The peer may already have closed the hibernated socket.
    }
  }

  async alarm(): Promise<void> {
    const state = this.loadState();
    if (!state) {
      await this.ctx.storage.deleteAll();
      return;
    }
    await this.expireAndDelete(state);
  }

  private loadMeta(): RoomMetaRow | null {
    const hasRoomMetaTable =
      this.ctx.storage.sql
        .exec<{ table_count: number }>(
          `SELECT COUNT(*) AS table_count FROM sqlite_master
           WHERE type = 'table' AND name = 'room_meta'`,
        )
        .one().table_count > 0;
    if (!hasRoomMetaTable) return null;
    return (
      this.ctx.storage.sql
        .exec<RoomMetaRow>('SELECT * FROM room_meta WHERE singleton = 1')
        .toArray()[0] ?? null
    );
  }

  private requireMeta(): RoomMetaRow {
    const meta = this.loadMeta();
    if (!meta) throw new Error('Room metadata is missing.');
    return meta;
  }

  private loadState(): RoomState | null {
    const meta = this.loadMeta();
    if (!meta) return null;
    const caseRows = this.ctx.storage.sql
      .exec<CaseRow>(
        'SELECT position, case_id, content_version FROM room_cases ORDER BY position',
      )
      .toArray();
    const choiceRows = this.ctx.storage.sql
      .exec<ChoiceRow>(
        'SELECT case_id, choice_id, position FROM room_choices ORDER BY case_id, position',
      )
      .toArray();
    const manifest = parseRoomActivityManifest({
      protocolVersion: meta.protocol_version,
      locale: meta.locale,
      cases: caseRows.map((activityCase) => ({
        id: activityCase.case_id,
        contentVersion: activityCase.content_version,
        choiceIds: choiceRows
          .filter((choice) => choice.case_id === activityCase.case_id)
          .map((choice) => choice.choice_id),
      })),
    });
    if (!manifest) throw new Error('Persisted room manifest is invalid.');

    const answersByParticipant = Object.fromEntries(
      this.ctx.storage.sql
        .exec<AnswerRow>(
          'SELECT participant_digest, choice_id FROM current_answers',
        )
        .toArray()
        .map((answer) => [answer.participant_digest, answer.choice_id]),
    );
    const revealedResults: RoomState['revealedResults'] = {};
    for (const result of this.ctx.storage.sql
      .exec<ResultRow>(
        `SELECT case_id, choice_id, answer_count
         FROM revealed_results ORDER BY case_id, choice_id`,
      )
      .toArray()) {
      const aggregate = (revealedResults[result.case_id] ??= {
        answeredCount: 0,
        counts: {},
      });
      aggregate.counts[result.choice_id] = result.answer_count;
      aggregate.answeredCount += result.answer_count;
    }

    const initial = createRoomState({
      manifest,
      createdAt: meta.created_at,
      expiresAt: meta.expires_at,
      participantCount: this.participantCount(),
    });
    if (
      !['lobby', 'open', 'revealed', 'summary', 'ended'].includes(meta.phase)
    ) {
      throw new Error('Persisted room phase is invalid.');
    }
    return {
      ...initial,
      phase: meta.phase as RoomState['phase'],
      currentCaseIndex: meta.current_case_index,
      revision: meta.revision,
      answersByParticipant,
      revealedResults,
      ...(meta.end_reason === 'expired' || meta.end_reason === 'teacher-ended'
        ? { endReason: meta.end_reason }
        : {}),
    };
  }

  private participantCount(): number {
    const row = this.ctx.storage.sql
      .exec<{ participant_count: number }>(
        'SELECT COUNT(*) AS participant_count FROM participants',
      )
      .one();
    return row.participant_count;
  }

  private persistAcceptedCommand(
    previous: RoomState,
    next: RoomState,
    commandType: string,
  ): void {
    this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec(
        `UPDATE room_meta
         SET phase = ?, current_case_index = ?, revision = ?, end_reason = ?
         WHERE singleton = 1`,
        next.phase,
        next.currentCaseIndex,
        next.revision,
        next.endReason ?? null,
      );
      if (commandType === 'open-case') {
        this.ctx.storage.sql.exec('DELETE FROM current_answers');
      } else if (commandType === 'answer') {
        const currentCase =
          next.currentCaseIndex === null
            ? undefined
            : next.manifest.cases[next.currentCaseIndex];
        if (!currentCase) throw new Error('Accepted answer has no open case.');
        for (const [participantDigest, choiceId] of Object.entries(
          next.answersByParticipant,
        )) {
          if (previous.answersByParticipant[participantDigest] === choiceId) {
            continue;
          }
          this.ctx.storage.sql.exec(
            `INSERT INTO current_answers
              (participant_digest, case_id, choice_id) VALUES (?, ?, ?)
             ON CONFLICT(participant_digest) DO UPDATE SET
              case_id = excluded.case_id, choice_id = excluded.choice_id`,
            participantDigest,
            currentCase.id,
            choiceId,
          );
        }
      } else if (commandType === 'reveal-current') {
        const currentCase =
          next.currentCaseIndex === null
            ? undefined
            : next.manifest.cases[next.currentCaseIndex];
        const aggregate = currentCase
          ? next.revealedResults[currentCase.id]
          : undefined;
        if (!currentCase || !aggregate) {
          throw new Error('Accepted reveal has no aggregate.');
        }
        this.ctx.storage.sql.exec(
          'DELETE FROM revealed_results WHERE case_id = ?',
          currentCase.id,
        );
        for (const [choiceId, count] of Object.entries(aggregate.counts)) {
          this.ctx.storage.sql.exec(
            `INSERT INTO revealed_results (case_id, choice_id, answer_count)
             VALUES (?, ?, ?)`,
            currentCase.id,
            choiceId,
            count,
          );
        }
        this.ctx.storage.sql.exec('DELETE FROM current_answers');
      }
    });
  }

  private readAttachment(socket: WebSocket): SocketAttachment | null {
    const value = socket.deserializeAttachment();
    if (!isRecord(value)) return null;
    if (value.role !== 'teacher' && value.role !== 'student') return null;
    if (
      typeof value.malformedFrames !== 'number' ||
      typeof value.messageWindowStartedAt !== 'number' ||
      typeof value.messagesInWindow !== 'number' ||
      typeof value.burstTokens !== 'number' ||
      typeof value.burstRefilledAt !== 'number'
    ) {
      return null;
    }
    if (
      value.role === 'student' &&
      (typeof value.participantKey !== 'string' ||
        !HEX_DIGEST_PATTERN.test(value.participantKey))
    ) {
      return null;
    }
    return {
      role: value.role,
      ...(typeof value.participantKey === 'string'
        ? { participantKey: value.participantKey }
        : {}),
      malformedFrames: value.malformedFrames,
      messageWindowStartedAt: value.messageWindowStartedAt,
      messagesInWindow: value.messagesInWindow,
      burstTokens: value.burstTokens,
      burstRefilledAt: value.burstRefilledAt,
    };
  }

  private consumeMessageAllowance(
    socket: WebSocket,
    attachment: SocketAttachment,
    meta: RoomMetaRow,
  ): boolean {
    const now = Date.now();
    if (now - this.roomMessageWindowStartedAt >= 60_000) {
      this.roomMessageWindowStartedAt = now;
      this.roomMessagesInWindow = 0;
    }
    this.roomMessagesInWindow += 1;
    if (this.roomMessagesInWindow > meta.room_messages_per_minute) {
      this.sendRoomError(socket, 'rate-limited', true);
      return false;
    }

    const elapsed = now - attachment.messageWindowStartedAt;
    if (elapsed >= 60_000) {
      attachment.messageWindowStartedAt = now;
      attachment.messagesInWindow = 0;
    }
    attachment.messagesInWindow += 1;
    const perMinute =
      attachment.role === 'student'
        ? meta.participant_messages_per_minute
        : meta.room_messages_per_minute;
    if (attachment.role === 'student') {
      const burstElapsed = Math.max(0, now - attachment.burstRefilledAt);
      attachment.burstTokens = Math.min(
        meta.participant_message_burst,
        attachment.burstTokens +
          (burstElapsed * meta.participant_messages_per_minute) / 60_000,
      );
      attachment.burstRefilledAt = now;
      if (attachment.burstTokens < 1) {
        socket.serializeAttachment(attachment);
        this.sendRoomError(socket, 'rate-limited', true);
        return false;
      }
      attachment.burstTokens -= 1;
    }
    socket.serializeAttachment(attachment);
    if (attachment.messagesInWindow > perMinute) {
      this.sendRoomError(socket, 'rate-limited', true);
      return false;
    }
    return true;
  }

  private rejectInvalidFrame(
    socket: WebSocket,
    attachment: SocketAttachment,
    meta: RoomMetaRow,
    code: RoomErrorCode,
  ): void {
    attachment.malformedFrames += 1;
    socket.serializeAttachment(attachment);
    this.sendRoomError(socket, code);
    if (attachment.malformedFrames >= meta.malformed_frame_limit) {
      socket.close(1008, 'Too many invalid messages.');
    }
  }

  private projectForAttachment(state: RoomState, attachment: SocketAttachment) {
    return attachment.role === 'teacher'
      ? projectRoomForTeacher(state)
      : projectRoomForStudent(state, attachment.participantKey ?? '');
  }

  private async broadcastState(state: RoomState): Promise<void> {
    for (const socket of this.ctx.getWebSockets()) {
      const attachment = this.readAttachment(socket);
      if (!attachment) continue;
      this.send(socket, {
        protocolVersion: ROOM_PROTOCOL_VERSION,
        type: 'room-state',
        projection: this.projectForAttachment(state, attachment),
      });
    }
  }

  private send(socket: WebSocket, message: RoomServerMessage): void {
    try {
      socket.send(JSON.stringify(message));
    } catch {
      try {
        socket.close(1011, 'Room message could not be delivered.');
      } catch {
        // Nothing remains to do for an already closed socket.
      }
    }
  }

  private sendRoomError(
    socket: WebSocket,
    code: RoomErrorCode,
    retryable = false,
  ): void {
    this.send(socket, {
      protocolVersion: ROOM_PROTOCOL_VERSION,
      type: 'error',
      code,
      message: errorMessage(code),
      retryable,
    });
  }

  private async expireAndDelete(state: RoomState): Promise<void> {
    const expired: RoomState = {
      ...state,
      phase: 'ended',
      revision: state.revision + 1,
      answersByParticipant: {},
      endReason: 'expired',
    };
    await this.broadcastState(expired);
    await this.closeAndDelete();
  }

  private async closeAndDelete(): Promise<void> {
    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.close(1000, 'Room ended.');
      } catch {
        // Continue cleanup even if a peer has already gone away.
      }
    }
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
  }
}

async function forwardToRoom(
  env: Env,
  roomCode: string,
  request: Request,
): Promise<Response> {
  const id = env.ROOM.idFromName(roomCode.replace('-', ''));
  return env.ROOM.get(id).fetch(request);
}

async function handleCreateRoom(
  request: Request,
  env: Env,
  config: RoomServiceConfig,
): Promise<Response> {
  const allowed = await consumeRateLimit(
    env.ROOM_CREATES,
    requestSource(request),
  );
  if (allowed === false) {
    return publicError(
      'rate-limited',
      'Too many rooms were created. Please wait and try again.',
      429,
      true,
    );
  }
  if (allowed === null) {
    return publicError(
      'service-unavailable',
      'The room creation safety limit is unavailable.',
      503,
      true,
    );
  }
  const decoded = await readJson(request);
  const body = decoded.ok ? parseCreateRoomRequest(decoded.value) : null;
  if (!body) {
    return publicError(
      'malformed-message',
      'The room manifest could not be read.',
      400,
    );
  }
  const policy = policyFromConfig(config);
  const validation = validateRoomActivityManifest(body.manifest, policy);
  if (!validation.success) {
    return publicError(
      'malformed-message',
      'The room manifest exceeds this service limits.',
      400,
    );
  }

  const teacherSecret = randomToken(32);
  const teacherSecretDigest = await digestSecret(teacherSecret);
  const createdAt = Date.now();
  const expiresAt = createdAt + policy.roomLifetimeSeconds * 1000;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const roomCode = randomRoomCode();
    const response = await forwardToRoom(
      env,
      roomCode,
      new Request('https://room.internal/internal/init', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          manifest: body.manifest,
          teacherSecretDigest,
          createdAt,
          expiresAt,
          policy,
        }),
      }),
    );
    if (response.status === 409) continue;
    if (!response.ok) {
      return publicError(
        'service-unavailable',
        'The room service could not create a room.',
        503,
        true,
      );
    }
    return Response.json(
      {
        protocolVersion: ROOM_PROTOCOL_VERSION,
        roomCode,
        expiresAt,
        teacherSecret,
      },
      { status: 201, headers: { 'cache-control': 'no-store' } },
    );
  }
  return publicError(
    'service-unavailable',
    'The room service could not allocate a room code.',
    503,
    true,
  );
}

async function handleTicket(
  request: Request,
  env: Env,
  roomCode: string,
): Promise<Response> {
  const allowed = await consumeRateLimit(
    env.TICKET_ATTEMPTS,
    `${roomCode}:${requestSource(request)}`,
  );
  if (allowed === false) {
    return publicError(
      'rate-limited',
      'Too many join attempts were made. Please wait and try again.',
      429,
      true,
    );
  }
  if (allowed === null) {
    return publicError(
      'service-unavailable',
      'The room join safety limit is unavailable.',
      503,
      true,
    );
  }
  const decoded = await readJson(request);
  const body = decoded.ok ? parseRoomTicketRequest(decoded.value) : null;
  if (!body) {
    return publicError(
      'malformed-message',
      'The ticket request could not be read.',
      400,
    );
  }
  const response = await forwardToRoom(
    env,
    roomCode,
    new Request('https://room.internal/internal/tickets', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
  if (response.ok) return response;
  if (response.status === 401) {
    return publicError(
      'unauthorized',
      'The room credential is not valid.',
      401,
    );
  }
  if (response.status === 404) {
    return publicError('room-ended', 'This room does not exist.', 404);
  }
  if (response.status === 410) {
    return publicError('room-expired', 'This room has expired.', 410);
  }
  if (response.status === 409) {
    return publicError('room-full', 'This room is full.', 409);
  }
  if (response.status === 429) {
    return publicError(
      'rate-limited',
      'This room has too many pending connections.',
      429,
      true,
    );
  }
  return publicError(
    'service-unavailable',
    'The room service could not issue a ticket.',
    503,
    true,
  );
}

async function handleSocket(
  request: Request,
  env: Env,
  roomCode: string,
): Promise<Response> {
  if (!isUpgrade(request)) {
    return publicError(
      'malformed-message',
      'A WebSocket upgrade is required.',
      426,
    );
  }
  const incomingUrl = new URL(request.url);
  const ticket = incomingUrl.searchParams.get('ticket');
  if (
    !ticket ||
    [...incomingUrl.searchParams.keys()].some((key) => key !== 'ticket')
  ) {
    return publicError('unauthorized', 'The socket ticket is not valid.', 401);
  }
  const response = await forwardToRoom(
    env,
    roomCode,
    new Request(
      `https://room.internal/internal/socket?ticket=${encodeURIComponent(ticket)}`,
      { headers: { Upgrade: 'websocket' } },
    ),
  );
  if (response.status === 101) return response;
  if (response.status === 410) {
    return publicError('room-expired', 'This room has expired.', 410);
  }
  return publicError('unauthorized', 'The socket ticket is not valid.', 401);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const configResult = loadRoomServiceConfig(environmentRecord(env));
    if (!configResult.ok) {
      return publicError(
        'configuration-error',
        'The room service configuration is invalid.',
        503,
      );
    }
    const config = configResult.value;
    if (!config.enabled) {
      return publicError(
        'service-disabled',
        'The live room demonstration is disabled.',
        503,
      );
    }

    const origin = request.headers.get('Origin');
    if (!origin || !config.allowedOrigins.includes(origin)) {
      return publicError(
        'unauthorized',
        'This browser origin is not allowed.',
        403,
      );
    }
    if (request.method === 'OPTIONS') return preflight(origin);

    const url = new URL(request.url);
    let response: Response;
    if (url.pathname === '/v1/capabilities' && request.method === 'GET') {
      response = Response.json(
        roomCapabilitiesFromPolicy(policyFromConfig(config)),
      );
    } else if (url.pathname === '/v1/rooms' && request.method === 'POST') {
      response = await handleCreateRoom(request, env, config);
    } else {
      const ticketMatch = url.pathname.match(TICKET_PATH);
      const socketMatch = url.pathname.match(SOCKET_PATH);
      const roomMatch = url.pathname.match(ROOM_PATH);
      if (ticketMatch?.[1] && request.method === 'POST') {
        response = await handleTicket(request, env, ticketMatch[1]);
      } else if (socketMatch?.[1] && request.method === 'GET') {
        response = await handleSocket(request, env, socketMatch[1]);
      } else if (roomMatch) {
        response = publicError(
          'malformed-message',
          'The room route does not support this method.',
          405,
        );
      } else {
        response = publicError(
          'malformed-message',
          'The room route was not found.',
          404,
        );
      }
    }
    return addBrowserHeaders(response, origin);
  },
};

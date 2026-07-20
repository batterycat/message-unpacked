import {
  SELF,
  env,
  evictDurableObject,
  reset,
  runDurableObjectAlarm,
  runInDurableObject,
} from 'cloudflare:test';
import { afterEach, describe, expect, it } from 'vitest';

import {
  ROOM_PROTOCOL_VERSION,
  parseCreateRoomResponse,
  parseRoomCapabilities,
  parseRoomServerMessage,
  parseRoomTicketResponse,
  type CreateRoomResponse,
  type RoomServerMessage,
  type RoomTicketResponse,
} from '../src/domain/room/protocol';

const origin = 'https://classroom.example';
type SocketInbox = {
  messages: unknown[];
  waiter?: (message: unknown) => void;
};
const socketInboxes = new WeakMap<WebSocket, SocketInbox>();
const manifest = {
  protocolVersion: ROOM_PROTOCOL_VERSION,
  locale: 'zh-TW' as const,
  cases: [
    {
      id: 'classic.prize-message',
      contentVersion: '1.0.0',
      choiceIds: ['answer.scam', 'answer.unsure', 'answer.trust'],
    },
    {
      id: 'classic.account-alert',
      contentVersion: '1.0.0',
      choiceIds: ['answer.stop', 'answer.verify'],
    },
  ],
};

afterEach(async () => {
  await reset();
});

function browserRequest(path: string, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('Origin', origin);
  return new Request(`https://rooms.example${path}`, { ...init, headers });
}

async function createRoom(): Promise<CreateRoomResponse> {
  const response = await SELF.fetch(
    browserRequest('/v1/rooms', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        protocolVersion: ROOM_PROTOCOL_VERSION,
        manifest,
      }),
    }),
  );
  expect(response.status).toBe(201);
  const body = parseCreateRoomResponse(await response.json());
  expect(body).not.toBeNull();
  if (!body) throw new Error('Room creation response was invalid.');
  return body;
}

async function createTicket(
  room: CreateRoomResponse,
  request:
    | { role: 'teacher'; teacherSecret: string }
    | { role: 'student'; participantToken?: string },
): Promise<{ response: Response; body: RoomTicketResponse | null }> {
  const response = await SELF.fetch(
    browserRequest(`/v1/rooms/${room.roomCode}/tickets`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        protocolVersion: ROOM_PROTOCOL_VERSION,
        ...request,
      }),
    }),
  );
  const body = response.ok
    ? parseRoomTicketResponse(await response.clone().json())
    : null;
  return { response, body };
}

async function connect(roomCode: string, ticket: string): Promise<WebSocket> {
  const response = await SELF.fetch(
    browserRequest(
      `/v1/rooms/${roomCode}/socket?ticket=${encodeURIComponent(ticket)}`,
      { headers: { Upgrade: 'websocket' } },
    ),
  );
  expect(response.status).toBe(101);
  const socket = response.webSocket;
  expect(socket).not.toBeNull();
  if (!socket) throw new Error('WebSocket response did not include a socket.');
  const inbox: SocketInbox = { messages: [] };
  socketInboxes.set(socket, inbox);
  socket.addEventListener('message', (event) => {
    if (inbox.waiter) {
      const waiter = inbox.waiter;
      delete inbox.waiter;
      waiter(event.data);
    } else {
      inbox.messages.push(event.data);
    }
  });
  socket.accept();
  return socket;
}

async function nextMessage(socket: WebSocket): Promise<RoomServerMessage> {
  const inbox = socketInboxes.get(socket);
  if (!inbox) throw new Error('WebSocket inbox was not initialized.');
  const queued = inbox.messages.shift();
  const raw =
    queued ??
    (await new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Timed out waiting for room message.')),
        2_000,
      );
      inbox.waiter = (message) => {
        clearTimeout(timeout);
        resolve(message);
      };
    }));
  if (typeof raw !== 'string') throw new Error('Room frame was not text.');
  const message = parseRoomServerMessage(JSON.parse(raw) as unknown);
  if (!message) throw new Error(`Room frame was invalid: ${raw}`);
  return message;
}

async function waitForMessage(
  socket: WebSocket,
  predicate: (message: RoomServerMessage) => boolean,
): Promise<RoomServerMessage> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const message = await nextMessage(socket);
    if (predicate(message)) return message;
  }
  throw new Error('Expected room message did not arrive.');
}

function roomStub(roomCode: string) {
  const id = env.ROOM.idFromName(roomCode.replace('-', ''));
  return env.ROOM.get(id);
}

describe('room Worker HTTP boundary', () => {
  it('requires an exact origin and exposes effective free-demo capabilities', async () => {
    const denied = await SELF.fetch(
      new Request('https://rooms.example/v1/capabilities'),
    );
    expect(denied.status).toBe(403);

    const response = await SELF.fetch(browserRequest('/v1/capabilities'));
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe(origin);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(parseRoomCapabilities(await response.json())).toEqual({
      protocolVersion: ROOM_PROTOCOL_VERSION,
      maxParticipants: 60,
      maxCases: 10,
      maxChoicesPerCase: 6,
      roomLifetimeSeconds: 7_200,
      maxMessageBytes: 4_096,
    });
  });

  it('rate-limits room creation before allocating more Durable Objects', async () => {
    const responses = await Promise.all(
      Array.from({ length: 6 }, () =>
        SELF.fetch(
          browserRequest('/v1/rooms', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              protocolVersion: ROOM_PROTOCOL_VERSION,
              manifest,
            }),
          }),
        ),
      ),
    );
    expect(
      responses.filter((response) => response.status === 201),
    ).toHaveLength(5);
    expect(
      responses.filter((response) => response.status === 429),
    ).toHaveLength(1);
  });

  it('stores only digests and consumes each short-lived ticket once', async () => {
    const room = await createRoom();
    const teacherTicket = await createTicket(room, {
      role: 'teacher',
      teacherSecret: room.teacherSecret,
    });
    expect(teacherTicket.response.status).toBe(200);
    expect(teacherTicket.body?.role).toBe('teacher');

    const studentTicket = await createTicket(room, { role: 'student' });
    expect(studentTicket.response.status).toBe(200);
    expect(studentTicket.body?.role).toBe('student');
    const participantToken =
      studentTicket.body?.role === 'student'
        ? studentTicket.body.participantToken
        : undefined;
    expect(participantToken).toBeTruthy();

    const ticket = teacherTicket.body?.ticket;
    if (!ticket || !participantToken)
      throw new Error('Missing issued secrets.');
    const socket = await connect(room.roomCode, ticket);
    expect((await nextMessage(socket)).type).toBe('welcome');

    const replay = await SELF.fetch(
      browserRequest(
        `/v1/rooms/${room.roomCode}/socket?ticket=${encodeURIComponent(ticket)}`,
        { headers: { Upgrade: 'websocket' } },
      ),
    );
    expect(replay.status).toBe(401);

    const persisted = await runInDurableObject(
      roomStub(room.roomCode),
      (_instance, state) => ({
        meta: state.storage.sql.exec('SELECT * FROM room_meta').toArray(),
        participants: state.storage.sql
          .exec('SELECT * FROM participants')
          .toArray(),
        tickets: state.storage.sql
          .exec('SELECT * FROM socket_tickets')
          .toArray(),
      }),
    );
    const serialized = JSON.stringify(persisted);
    expect(serialized).not.toContain(room.teacherSecret);
    expect(serialized).not.toContain(participantToken);
    expect(serialized).not.toContain(ticket);
    socket.close();
  });

  it('rejects an invalid teacher secret and enforces participant capacity atomically', async () => {
    const room = await createRoom();
    const invalidTeacher = await createTicket(room, {
      role: 'teacher',
      teacherSecret: 'x'.repeat(43),
    });
    expect(invalidTeacher.response.status).toBe(401);
    await runInDurableObject(roomStub(room.roomCode), (_instance, state) => {
      state.storage.sql.exec(
        'UPDATE room_meta SET max_pending_connections = 100 WHERE singleton = 1',
      );
    });

    const joins = await Promise.all(
      Array.from({ length: 61 }, () => createTicket(room, { role: 'student' })),
    );
    expect(
      joins.filter(({ response }) => response.status === 200),
    ).toHaveLength(60);
    expect(
      joins.filter(({ response }) => response.status === 409),
    ).toHaveLength(1);
    const participantCount = await runInDurableObject(
      roomStub(room.roomCode),
      (_instance, state) =>
        state.storage.sql
          .exec<{ participant_count: number }>(
            'SELECT COUNT(*) AS participant_count FROM participants',
          )
          .one().participant_count,
    );
    expect(participantCount).toBe(60);
  });

  it('bounds unconsumed socket tickets per room', async () => {
    const room = await createRoom();
    const tickets = await Promise.all(
      Array.from({ length: 21 }, () =>
        createTicket(room, {
          role: 'teacher',
          teacherSecret: room.teacherSecret,
        }),
      ),
    );

    expect(
      tickets.filter(({ response }) => response.status === 200),
    ).toHaveLength(20);
    expect(
      tickets.filter(({ response }) => response.status === 429),
    ).toHaveLength(1);
  });
});

describe('room Worker WebSocket projections', () => {
  it('keeps open tallies hidden, supports answer changes, and reveals only to the teacher', async () => {
    const room = await createRoom();
    const teacherTicket = await createTicket(room, {
      role: 'teacher',
      teacherSecret: room.teacherSecret,
    });
    const studentTicket = await createTicket(room, { role: 'student' });
    if (!teacherTicket.body || !studentTicket.body) {
      throw new Error('Tickets were not issued.');
    }
    const teacher = await connect(room.roomCode, teacherTicket.body.ticket);
    const student = await connect(room.roomCode, studentTicket.body.ticket);
    await nextMessage(teacher);
    await nextMessage(student);

    teacher.send(
      JSON.stringify({
        protocolVersion: ROOM_PROTOCOL_VERSION,
        type: 'open-case',
      }),
    );
    const teacherOpen = await waitForMessage(
      teacher,
      (message) =>
        message.type === 'room-state' && message.projection.phase === 'open',
    );
    const studentOpen = await waitForMessage(
      student,
      (message) =>
        message.type === 'room-state' && message.projection.phase === 'open',
    );
    expect(JSON.stringify(teacherOpen)).not.toContain('"counts"');
    expect(JSON.stringify(studentOpen)).not.toContain('"counts"');
    expect(JSON.stringify(studentOpen)).not.toContain('participantCount');
    expect(JSON.stringify(studentOpen)).not.toContain('score');

    student.send(
      JSON.stringify({
        protocolVersion: ROOM_PROTOCOL_VERSION,
        type: 'answer',
        caseId: manifest.cases[0].id,
        choiceId: manifest.cases[0].choiceIds[0],
      }),
    );
    const firstAck = await waitForMessage(
      student,
      (message) => message.type === 'answer-ack',
    );
    expect(firstAck).toMatchObject({ type: 'answer-ack', outcome: 'accepted' });

    student.send(
      JSON.stringify({
        protocolVersion: ROOM_PROTOCOL_VERSION,
        type: 'answer',
        caseId: manifest.cases[0].id,
        choiceId: manifest.cases[0].choiceIds[1],
      }),
    );
    const changedAck = await waitForMessage(
      student,
      (message) =>
        message.type === 'answer-ack' && message.outcome === 'revised',
    );
    expect(changedAck).toMatchObject({
      type: 'answer-ack',
      outcome: 'revised',
    });

    const teacherAnswered = await waitForMessage(
      teacher,
      (message) =>
        message.type === 'room-state' &&
        message.projection.role === 'teacher' &&
        message.projection.phase === 'open' &&
        message.projection.answeredCount === 1 &&
        message.projection.revision === changedAck.revision,
    );
    expect(JSON.stringify(teacherAnswered)).not.toContain('"counts"');

    teacher.send(
      JSON.stringify({
        protocolVersion: ROOM_PROTOCOL_VERSION,
        type: 'reveal-current',
      }),
    );
    const teacherReveal = await waitForMessage(
      teacher,
      (message) =>
        message.type === 'room-state' &&
        message.projection.role === 'teacher' &&
        message.projection.phase === 'revealed',
    );
    const studentReveal = await waitForMessage(
      student,
      (message) =>
        message.type === 'room-state' &&
        message.projection.phase === 'revealed',
    );
    expect(teacherReveal).toMatchObject({
      projection: {
        counts: {
          [manifest.cases[0].choiceIds[0]]: 0,
          [manifest.cases[0].choiceIds[1]]: 1,
        },
      },
    });
    expect(JSON.stringify(studentReveal)).not.toContain('"counts"');

    const currentAnswers = await runInDurableObject(
      roomStub(room.roomCode),
      (_instance, state) =>
        state.storage.sql
          .exec<{ answer_count: number }>(
            'SELECT COUNT(*) AS answer_count FROM current_answers',
          )
          .one().answer_count,
    );
    expect(currentAnswers).toBe(0);
    teacher.close();
    student.close();
  });

  it('restores hibernated sockets and deletes active state when the alarm expires', async () => {
    const room = await createRoom();
    const teacherTicket = await createTicket(room, {
      role: 'teacher',
      teacherSecret: room.teacherSecret,
    });
    if (!teacherTicket.body) throw new Error('Teacher ticket was not issued.');
    const teacher = await connect(room.roomCode, teacherTicket.body.ticket);
    await nextMessage(teacher);

    const stub = roomStub(room.roomCode);
    await evictDurableObject(stub);
    teacher.send(
      JSON.stringify({
        protocolVersion: ROOM_PROTOCOL_VERSION,
        type: 'hello',
      }),
    );
    expect(
      await waitForMessage(teacher, (message) => message.type === 'room-state'),
    ).toMatchObject({
      type: 'room-state',
      projection: { role: 'teacher', phase: 'lobby' },
    });

    await runInDurableObject(stub, async (_instance, state) => {
      state.storage.sql.exec(
        'UPDATE room_meta SET expires_at = ? WHERE singleton = 1',
        Date.now() - 1,
      );
      await state.storage.setAlarm(Date.now() + 60_000);
    });
    expect(await runDurableObjectAlarm(stub)).toBe(true);

    const remaining = await runInDurableObject(
      stub,
      (_instance, state) =>
        state.storage.sql
          .exec<{ table_name: string }>(
            `SELECT name AS table_name FROM sqlite_master
             WHERE type = 'table' AND name = 'room_meta'`,
          )
          .toArray().length,
    );
    expect(remaining).toBe(0);
  });

  it('rejects oversized UTF-8 frames without changing room state', async () => {
    const room = await createRoom();
    const teacherTicket = await createTicket(room, {
      role: 'teacher',
      teacherSecret: room.teacherSecret,
    });
    if (!teacherTicket.body) throw new Error('Teacher ticket was not issued.');
    const teacher = await connect(room.roomCode, teacherTicket.body.ticket);
    await nextMessage(teacher);

    teacher.send('界'.repeat(1_366));
    expect(await nextMessage(teacher)).toMatchObject({
      type: 'error',
      code: 'malformed-message',
    });
    const state = await runInDurableObject(
      roomStub(room.roomCode),
      (_instance, durableState) =>
        durableState.storage.sql
          .exec<{ phase: string; revision: number }>(
            'SELECT phase, revision FROM room_meta WHERE singleton = 1',
          )
          .one(),
    );
    expect(state).toEqual({ phase: 'lobby', revision: 0 });
    teacher.close();
  });

  it('enforces the aggregate room message allowance across sockets', async () => {
    const room = await createRoom();
    const firstTicket = await createTicket(room, {
      role: 'teacher',
      teacherSecret: room.teacherSecret,
    });
    const secondTicket = await createTicket(room, {
      role: 'teacher',
      teacherSecret: room.teacherSecret,
    });
    if (!firstTicket.body || !secondTicket.body) {
      throw new Error('Teacher tickets were not issued.');
    }
    const first = await connect(room.roomCode, firstTicket.body.ticket);
    const second = await connect(room.roomCode, secondTicket.body.ticket);
    await nextMessage(first);
    await nextMessage(second);
    await runInDurableObject(roomStub(room.roomCode), (_instance, state) => {
      state.storage.sql.exec(
        'UPDATE room_meta SET room_messages_per_minute = 2 WHERE singleton = 1',
      );
    });

    const hello = JSON.stringify({
      protocolVersion: ROOM_PROTOCOL_VERSION,
      type: 'hello',
    });
    first.send(hello);
    expect(await nextMessage(first)).toMatchObject({ type: 'room-state' });
    second.send(hello);
    expect(await nextMessage(second)).toMatchObject({ type: 'room-state' });
    first.send(hello);
    expect(await nextMessage(first)).toMatchObject({
      type: 'error',
      code: 'rate-limited',
    });
    first.close();
    second.close();
  });

  it('deletes active storage when the teacher explicitly ends the room', async () => {
    const room = await createRoom();
    const teacherTicket = await createTicket(room, {
      role: 'teacher',
      teacherSecret: room.teacherSecret,
    });
    if (!teacherTicket.body) throw new Error('Teacher ticket was not issued.');
    const teacher = await connect(room.roomCode, teacherTicket.body.ticket);
    await nextMessage(teacher);
    teacher.send(
      JSON.stringify({
        protocolVersion: ROOM_PROTOCOL_VERSION,
        type: 'end-room',
      }),
    );
    expect(
      await waitForMessage(
        teacher,
        (message) =>
          message.type === 'room-state' && message.projection.phase === 'ended',
      ),
    ).toMatchObject({ projection: { phase: 'ended' } });

    const remaining = await runInDurableObject(
      roomStub(room.roomCode),
      (_instance, state) =>
        state.storage.sql
          .exec<{ table_name: string }>(
            `SELECT name AS table_name FROM sqlite_master
             WHERE type = 'table' AND name = 'room_meta'`,
          )
          .toArray().length,
    );
    expect(remaining).toBe(0);

    const endedRoom = await createTicket(room, {
      role: 'teacher',
      teacherSecret: room.teacherSecret,
    });
    expect(endedRoom.response.status).toBe(404);
  });
});

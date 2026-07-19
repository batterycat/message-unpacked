import {
  applyRoomMessage,
  createRoomProjection,
  parseRoomClientMessage,
  type RoomRole,
  type RoomServerMessage,
} from '../src/domain/room/protocol';

export interface RoomEnv {
  ROOM: DurableObjectNamespace;
  ALLOWED_ORIGIN?: string;
}

const roomPath = /^\/rooms\/([a-zA-Z0-9_-]{6,64})\/?$/;

function jsonResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function isUpgrade(request: Request) {
  return request.headers.get('Upgrade')?.toLowerCase() === 'websocket';
}

export class ClassroomRoom {
  private readonly sockets = new Map<WebSocket, RoomRole | null>();
  private readonly projection = createRoomProjection();
  private teacherSocket: WebSocket | null = null;

  constructor(state: DurableObjectState) {
    void state;
  }

  async fetch(request: Request) {
    if (request.method !== 'GET' || !isUpgrade(request)) {
      return jsonResponse('A WebSocket upgrade is required.', 426);
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    const socket = server as WebSocket & { accept?: () => void };
    socket.accept?.();
    this.sockets.set(server, null);

    server.addEventListener('message', (event) => {
      this.handleMessage(server, event.data);
    });
    server.addEventListener('close', () => {
      this.sockets.delete(server);
      if (this.teacherSocket === server) this.teacherSocket = null;
      this.broadcast({
        type: 'presence',
        participantCount: this.sockets.size,
      });
    });

    this.send(server, {
      type: 'welcome',
      phase: this.projection.phase,
      participantCount: this.sockets.size,
      role: 'student',
    });
    this.broadcast({ type: 'presence', participantCount: this.sockets.size });

    return new Response(null, { status: 101, webSocket: client });
  }

  private handleMessage(socket: WebSocket, rawMessage: unknown) {
    if (typeof rawMessage !== 'string') {
      this.sendError(socket, 'invalid-message', 'Messages must be JSON text.');
      return;
    }

    let decoded: unknown;
    try {
      decoded = JSON.parse(rawMessage);
    } catch {
      this.sendError(socket, 'invalid-json', 'Message JSON could not be read.');
      return;
    }

    const message = parseRoomClientMessage(decoded);
    if (!message) {
      this.sendError(
        socket,
        'invalid-message',
        'Message shape is not supported.',
      );
      return;
    }

    if (message.type === 'hello') {
      this.claimRole(socket, message.role);
      return;
    }

    const role = this.sockets.get(socket) ?? 'student';
    const result = applyRoomMessage(this.projection, message, role);
    Object.assign(this.projection, result.projection);
    for (const event of result.events) this.broadcast(event);
  }

  private claimRole(socket: WebSocket, requestedRole: RoomRole) {
    const currentRole = this.sockets.get(socket);
    if (currentRole !== null && currentRole !== undefined) {
      if (currentRole === requestedRole) return;
      this.sendError(
        socket,
        'role-already-claimed',
        'This connection already claimed a different role.',
      );
      return;
    }

    if (requestedRole === 'teacher' && this.teacherSocket !== null) {
      this.sendError(
        socket,
        'teacher-already-connected',
        'This room already has a teacher.',
      );
      return;
    }

    this.sockets.set(socket, requestedRole);
    if (requestedRole === 'teacher') this.teacherSocket = socket;
    this.send(socket, {
      type: 'welcome',
      phase: this.projection.phase,
      participantCount: this.sockets.size,
      role: requestedRole,
    });
  }

  private sendError(socket: WebSocket, code: string, message: string) {
    this.send(socket, { type: 'error', code, message });
  }

  private send(socket: WebSocket, message: RoomServerMessage) {
    try {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      }
    } catch {
      this.sockets.delete(socket);
    }
  }

  private broadcast(message: RoomServerMessage) {
    for (const socket of this.sockets.keys()) this.send(socket, message);
  }
}

export default {
  async fetch(request: Request, env: RoomEnv) {
    const origin = env.ALLOWED_ORIGIN;
    if (origin && request.headers.get('Origin') !== origin) {
      return jsonResponse('Origin is not allowed.', 403);
    }

    const match = new URL(request.url).pathname.match(roomPath);
    if (!match) return jsonResponse('Room route not found.', 404);

    const roomName = match[1];
    if (!roomName) return jsonResponse('Room name is required.', 400);
    const id = env.ROOM.idFromName(roomName);
    return env.ROOM.get(id).fetch(request);
  },
};

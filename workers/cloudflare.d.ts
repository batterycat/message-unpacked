interface DurableObjectStorage {
  get<T>(key: string): Promise<T | undefined>;
}

interface DurableObjectState {
  storage: DurableObjectStorage;
}

interface ResponseInit {
  webSocket?: WebSocket;
}

interface DurableObjectId {
  toString(): string;
}

interface DurableObjectStub {
  fetch(request: Request): Promise<Response>;
}

interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

interface WebSocketPairValue {
  0: WebSocket;
  1: WebSocket;
}

declare const WebSocketPair: {
  new (): WebSocketPairValue;
};

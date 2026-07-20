import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ScenarioCase } from '../../domain/cases/schema';
import { ROOM_PROTOCOL_VERSION } from '../../domain/room/protocol';
import { getCatalog } from '../../i18n/locale';
import { ClassroomClicker, resolveClickerCase } from './ClassroomClicker';
import { ClassroomHost } from './ClassroomHost';

const scenario = {
  id: 'case.example.zh-tw',
  schemaVersion: 1,
  contentVersion: '1.0.0',
  translationGroupId: 'case.example',
  locale: 'zh-TW',
  status: 'published',
  title: '測試案例',
  channel: 'chat',
  classification: 'fraud',
  provenance: { kind: 'classic-pattern', note: '測試資料' },
  sources: [],
  learning: {
    stages: ['7-9'],
    dimensions: ['prevention'],
    topicId: 'social-relationships',
    topic: '社群與交友',
    readingLevel: 'standard',
    difficulty: 'introductory',
    contexts: ['聊天'],
    skills: ['查證'],
    riskTypes: ['冒用'],
    sensitiveContent: [],
    trustedAdultRecommended: false,
  },
  messages: [
    {
      id: 'message.one',
      sender: '陌生人',
      body: '請提供驗證碼。',
      direction: 'incoming',
    },
  ],
  clues: [
    { id: 'clue.one', label: '要求驗證碼', explanation: '不能交給別人。' },
  ],
  choices: [
    {
      id: 'choice.trustworthy',
      label: '直接提供',
      classification: 'trustworthy',
      reasoning: '不安全',
      score: 0,
    },
    {
      id: 'choice.fraud',
      label: '拒絕並查證',
      classification: 'fraud',
      reasoning: '安全',
      score: 100,
    },
    {
      id: 'choice.verify',
      label: '先等等',
      classification: 'insufficient-evidence',
      reasoning: '仍需查證',
      score: 60,
    },
  ],
  recommendedActionIds: ['anti-fraud.online-report'],
  debrief: {
    headline: '不要交出驗證碼',
    explanation: '改用官方管道查證。',
    safeActions: ['停止回覆'],
  },
  review: { lastReviewedAt: '2026-07-20', maintenanceStatus: 'active' },
} as const satisfies ScenarioCase;

const secondScenario = {
  ...scenario,
  id: 'case.second.zh-tw',
  title: '第二個測試案例',
  translationGroupId: 'case.second',
  learning: {
    ...scenario.learning,
    topicId: 'gaming-accounts',
    topic: '遊戲與帳號',
  },
} as const satisfies ScenarioCase;

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
  window.history.replaceState(null, '', '/');
});

function endedRoomResponse(code: 'room-ended' | 'room-expired') {
  return Response.json(
    {
      protocolVersion: ROOM_PROTOCOL_VERSION,
      error: {
        code,
        message: code === 'room-ended' ? 'Room ended.' : 'Room expired.',
        retryable: false,
      },
    },
    { status: 404 },
  );
}

function unauthorizedRoomResponse() {
  return Response.json(
    {
      protocolVersion: ROOM_PROTOCOL_VERSION,
      error: {
        code: 'unauthorized',
        message: 'Invalid credential.',
        retryable: false,
      },
    },
    { status: 401 },
  );
}

describe('ClassroomHost', () => {
  it('loads adapter capabilities instead of hard-coding the selectable case limit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          protocolVersion: ROOM_PROTOCOL_VERSION,
          maxParticipants: 120,
          maxCases: 1,
          maxChoicesPerCase: 6,
          roomLifetimeSeconds: 10_800,
          maxMessageBytes: 4_096,
        }),
      ),
    );
    render(
      <ClassroomHost
        catalog={getCatalog('zh-TW')}
        joinPath="/zh-TW/classroom/join/"
        locale="zh-TW"
        roomServiceUrl="https://rooms.example"
        scenarios={[scenario]}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText('已選 1／最多 1 題')).toBeInTheDocument(),
    );
    expect(screen.getByRole('checkbox', { name: /測試案例/ })).toBeChecked();
    expect(screen.getByRole('button', { name: '建立短期教室' })).toBeEnabled();
  });

  it('uses duration-based recommendations that remain editable and reset on filter changes', async () => {
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
    render(
      <ClassroomHost
        catalog={getCatalog('zh-TW')}
        joinPath="/zh-TW/classroom/join/"
        locale="zh-TW"
        roomServiceUrl="https://rooms.example"
        scenarios={[scenario, secondScenario]}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText('已選 2／最多 10 題')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /第二個測試案例/ }));
    expect(screen.getByText('已選 1／最多 10 題')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('活動時間'), {
      target: { value: '20' },
    });

    expect(screen.getByText('已選 2／最多 10 題')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /第二個測試案例/ }),
    ).toBeChecked();
  });

  it('restores an unexpired room from the same tab without putting the teacher secret in the URL', async () => {
    const roomCode = 'ABCDE-12345';
    const teacherSecret = 't'.repeat(43);
    window.history.replaceState(null, '', `/#room=${roomCode}`);
    window.sessionStorage.setItem(
      `message-unpacked:classroom-host:${roomCode}`,
      JSON.stringify({
        teacherSecret,
        expiresAt: Date.now() + 60_000,
        cases: [{ id: scenario.id, contentVersion: scenario.contentVersion }],
      }),
    );
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({
            protocolVersion: ROOM_PROTOCOL_VERSION,
            maxParticipants: 60,
            maxCases: 10,
            maxChoicesPerCase: 6,
            roomLifetimeSeconds: 7_200,
            maxMessageBytes: 4_096,
          }),
        )
        .mockResolvedValueOnce(
          Response.json({
            protocolVersion: ROOM_PROTOCOL_VERSION,
            role: 'teacher',
            ticket: 'ticket-value',
            ticketExpiresAt: Date.now() + 30_000,
          }),
        ),
    );
    class TestWebSocket {
      static readonly OPEN = 1;
      readonly readyState = 0;
      addEventListener() {}
      close() {}
    }
    vi.stubGlobal('WebSocket', TestWebSocket);

    render(
      <ClassroomHost
        catalog={getCatalog('zh-TW')}
        joinPath="/zh-TW/classroom/join/"
        locale="zh-TW"
        roomServiceUrl="https://rooms.example"
        scenarios={[scenario]}
      />,
    );

    await waitFor(() => expect(screen.getByText(roomCode)).toBeInTheDocument());
    expect(window.location.hash).toBe(`#room=${roomCode}`);
    expect(window.location.href).not.toContain(teacherSecret);
  });

  it('refuses to restore a room when the local case content version has changed', async () => {
    const roomCode = 'ABCDE-12345';
    const storageKey = `message-unpacked:classroom-host:${roomCode}`;
    window.history.replaceState(null, '', `/#room=${roomCode}`);
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        teacherSecret: 't'.repeat(43),
        expiresAt: Date.now() + 60_000,
        cases: [{ id: scenario.id, contentVersion: '0.9.0' }],
      }),
    );
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

    render(
      <ClassroomHost
        catalog={getCatalog('zh-TW')}
        joinPath="/zh-TW/classroom/join/"
        locale="zh-TW"
        roomServiceUrl="https://rooms.example"
        scenarios={[scenario]}
      />,
    );

    expect(
      await screen.findByRole('heading', { name: '挑選本堂課的案例' }),
    ).toBeInTheDocument();
    expect(window.sessionStorage.getItem(storageKey)).toBeNull();
  });

  it('shows an ended room and removes the teacher credential when reconnect discovers termination', async () => {
    const roomCode = 'ABCDE-12345';
    const storageKey = `message-unpacked:classroom-host:${roomCode}`;
    window.history.replaceState(null, '', `/#room=${roomCode}`);
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        teacherSecret: 't'.repeat(43),
        expiresAt: Date.now() + 60_000,
        cases: [{ id: scenario.id, contentVersion: scenario.contentVersion }],
      }),
    );
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({
            protocolVersion: ROOM_PROTOCOL_VERSION,
            maxParticipants: 60,
            maxCases: 10,
            maxChoicesPerCase: 6,
            roomLifetimeSeconds: 7_200,
            maxMessageBytes: 4_096,
          }),
        )
        .mockResolvedValueOnce(endedRoomResponse('room-ended')),
    );

    render(
      <ClassroomHost
        catalog={getCatalog('zh-TW')}
        joinPath="/zh-TW/classroom/join/"
        locale="zh-TW"
        roomServiceUrl="https://rooms.example"
        scenarios={[scenario]}
      />,
    );

    expect(
      await screen.findByRole('heading', {
        name: getCatalog('zh-TW').classroomLive.roomEnded,
      }),
    ).toBeInTheDocument();
    expect(window.sessionStorage.getItem(storageKey)).toBeNull();
    expect(screen.queryByRole('button', { name: '結束教室' })).toBeNull();
  });

  it('removes a rejected restored teacher credential so the room can be recreated', async () => {
    const roomCode = 'ABCDE-12345';
    const storageKey = `message-unpacked:classroom-host:${roomCode}`;
    window.history.replaceState(null, '', `/#room=${roomCode}`);
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        teacherSecret: 't'.repeat(43),
        expiresAt: Date.now() + 60_000,
        cases: [{ id: scenario.id, contentVersion: scenario.contentVersion }],
      }),
    );
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({
            protocolVersion: ROOM_PROTOCOL_VERSION,
            maxParticipants: 60,
            maxCases: 10,
            maxChoicesPerCase: 6,
            roomLifetimeSeconds: 7_200,
            maxMessageBytes: 4_096,
          }),
        )
        .mockResolvedValueOnce(unauthorizedRoomResponse()),
    );

    render(
      <ClassroomHost
        catalog={getCatalog('zh-TW')}
        joinPath="/zh-TW/classroom/join/"
        locale="zh-TW"
        roomServiceUrl="https://rooms.example"
        scenarios={[scenario]}
      />,
    );

    expect(
      await screen.findByRole('heading', { name: '挑選本堂課的案例' }),
    ).toBeInTheDocument();
    expect(window.sessionStorage.getItem(storageKey)).toBeNull();
    expect(window.location.hash).toBe('');
  });
});

describe('ClassroomClicker', () => {
  it('renders only the server-authorized choices in their projected order', () => {
    expect(
      resolveClickerCase(
        [
          {
            id: scenario.id,
            contentVersion: scenario.contentVersion,
            choices: scenario.choices.map(({ id, label }) => ({ id, label })),
          },
        ],
        {
          role: 'student',
          phase: 'open',
          revision: 1,
          totalCaseCount: 1,
          currentCase: {
            id: scenario.id,
            contentVersion: scenario.contentVersion,
            position: 1,
            choiceIds: ['choice.verify', 'choice.fraud'],
          },
        },
      )?.choices.map(({ id }) => id),
    ).toEqual(['choice.verify', 'choice.fraud']);
  });

  it('asks only for a room code before joining and rejects an invalid value', () => {
    render(
      <ClassroomClicker
        cases={[
          {
            id: scenario.id,
            contentVersion: scenario.contentVersion,
            choices: scenario.choices.map(({ id, label }) => ({ id, label })),
          },
        ]}
        catalog={getCatalog('zh-TW')}
        roomServiceUrl="https://rooms.example"
      />,
    );

    expect(screen.queryByText('請提供驗證碼。')).toBeNull();
    expect(screen.queryByText('不要交出驗證碼')).toBeNull();
    fireEvent.change(screen.getByLabelText('教室代碼'), {
      target: { value: 'bad' },
    });
    fireEvent.click(screen.getByRole('button', { name: '加入教室' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      '請輸入 10 碼有效教室代碼。',
    );
  });

  it('shows an ended room instead of a service failure when joining a terminated room', async () => {
    const participantStorageKey =
      'message-unpacked:classroom-participant:ABCDE-12345';
    window.sessionStorage.setItem(participantStorageKey, 'participant-token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(endedRoomResponse('room-expired')),
    );
    render(
      <ClassroomClicker
        cases={[
          {
            id: scenario.id,
            contentVersion: scenario.contentVersion,
            choices: scenario.choices.map(({ id, label }) => ({ id, label })),
          },
        ]}
        catalog={getCatalog('zh-TW')}
        roomServiceUrl="https://rooms.example"
      />,
    );

    fireEvent.change(screen.getByLabelText('教室代碼'), {
      target: { value: 'ABCDE-12345' },
    });
    fireEvent.click(screen.getByRole('button', { name: '加入教室' }));

    expect(
      await screen.findByRole('heading', {
        name: getCatalog('zh-TW').classroomLive.roomEnded,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: getCatalog('zh-TW').classroomLive.serviceUnavailable,
      }),
    ).toBeNull();
    expect(window.sessionStorage.getItem(participantStorageKey)).toBeNull();
  });

  it('removes a rejected participant token before the student retries', async () => {
    const participantStorageKey =
      'message-unpacked:classroom-participant:ABCDE-12345';
    window.sessionStorage.setItem(participantStorageKey, 'participant-token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(unauthorizedRoomResponse()),
    );
    render(
      <ClassroomClicker
        cases={[
          {
            id: scenario.id,
            contentVersion: scenario.contentVersion,
            choices: scenario.choices.map(({ id, label }) => ({ id, label })),
          },
        ]}
        catalog={getCatalog('zh-TW')}
        roomServiceUrl="https://rooms.example"
      />,
    );

    fireEvent.change(screen.getByLabelText('教室代碼'), {
      target: { value: 'ABCDE-12345' },
    });
    fireEvent.click(screen.getByRole('button', { name: '加入教室' }));

    expect(
      await screen.findByRole('heading', {
        name: getCatalog('zh-TW').classroomLive.serviceUnavailable,
      }),
    ).toBeInTheDocument();
    expect(window.sessionStorage.getItem(participantStorageKey)).toBeNull();
  });

  it('clears an uncertain submission and restores the acknowledged choice after reconnect', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          Response.json({
            protocolVersion: ROOM_PROTOCOL_VERSION,
            role: 'student',
            ticket: 't'.repeat(32),
            ticketExpiresAt: Date.now() + 30_000,
            participantToken: 'p'.repeat(32),
          }),
        ),
      ),
    );

    type Listener = (event: { data?: string }) => void;
    class TestWebSocket {
      static readonly OPEN = 1;
      static instances: TestWebSocket[] = [];
      readyState = 0;
      private readonly listeners = new Map<string, Listener[]>();

      constructor() {
        TestWebSocket.instances.push(this);
      }

      addEventListener(type: string, listener: Listener) {
        const listeners = this.listeners.get(type) ?? [];
        listeners.push(listener);
        this.listeners.set(type, listeners);
      }

      emit(type: string, event: { data?: string } = {}) {
        for (const listener of this.listeners.get(type) ?? []) listener(event);
      }

      send() {}
      close() {}
    }
    vi.stubGlobal('WebSocket', TestWebSocket);

    render(
      <ClassroomClicker
        cases={[
          {
            id: scenario.id,
            contentVersion: scenario.contentVersion,
            choices: scenario.choices.map(({ id, label }) => ({ id, label })),
          },
        ]}
        catalog={getCatalog('zh-TW')}
        roomServiceUrl="https://rooms.example"
      />,
    );
    fireEvent.change(screen.getByLabelText('教室代碼'), {
      target: { value: 'ABCDE-12345' },
    });
    fireEvent.click(screen.getByRole('button', { name: '加入教室' }));
    await waitFor(() => expect(TestWebSocket.instances).toHaveLength(1));

    const firstSocket = TestWebSocket.instances[0];
    if (!firstSocket) throw new Error('First student socket was not created.');
    firstSocket.readyState = TestWebSocket.OPEN;
    act(() => {
      firstSocket.emit('open');
      firstSocket.emit('message', {
        data: JSON.stringify({
          protocolVersion: ROOM_PROTOCOL_VERSION,
          type: 'welcome',
          projection: {
            role: 'student',
            phase: 'open',
            revision: 1,
            totalCaseCount: 1,
            currentCase: {
              id: scenario.id,
              contentVersion: scenario.contentVersion,
              position: 1,
              choiceIds: scenario.choices.map(({ id }) => id),
            },
          },
        }),
      });
    });
    fireEvent.click(screen.getByRole('button', { name: /拒絕並查證/ }));
    expect(screen.getByRole('button', { name: /直接提供/ })).toBeDisabled();

    act(() => firstSocket.emit('close'));
    expect(
      screen.getByRole('heading', { name: '連線中斷，正在重新連接…' }),
    ).toBeInTheDocument();

    await waitFor(() => expect(TestWebSocket.instances).toHaveLength(2));
    const secondSocket = TestWebSocket.instances[1];
    if (!secondSocket)
      throw new Error('Reconnected student socket was not created.');
    secondSocket.readyState = TestWebSocket.OPEN;
    act(() => {
      secondSocket.emit('open');
      secondSocket.emit('message', {
        data: JSON.stringify({
          protocolVersion: ROOM_PROTOCOL_VERSION,
          type: 'welcome',
          projection: {
            role: 'student',
            phase: 'open',
            revision: 2,
            totalCaseCount: 1,
            currentCase: {
              id: scenario.id,
              contentVersion: scenario.contentVersion,
              position: 1,
              choiceIds: scenario.choices.map(({ id }) => id),
            },
            submittedChoiceId: 'choice.fraud',
          },
        }),
      });
    });

    expect(screen.getByRole('button', { name: /拒絕並查證/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /直接提供/ })).toBeEnabled();
    expect(screen.getByRole('status')).toHaveTextContent('答案已送出');
  });
});

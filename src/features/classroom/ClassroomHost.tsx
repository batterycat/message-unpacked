import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';

import {
  ArrowRightIcon,
  BroadcastIcon,
  CheckCircleIcon,
  ClipboardIcon,
  DoorOpenIcon,
  EyeIcon,
  UsersThreeIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { QRCodeSVG } from 'qrcode.react';

import {
  activityDurations,
  getTeacherLearningStagePolicy,
  recommendActivityCaseIds,
  type ActivityDuration,
} from '../../domain/activity/config';
import type { ScenarioCase } from '../../domain/cases/schema';
import {
  ROOM_PROTOCOL_VERSION,
  calculateClassScores,
  parseCreateRoomResponse,
  parseRoomServerMessage,
  type CreateRoomResponse,
  type RoomCapabilities,
  type TeacherRoomProjection,
} from '../../domain/room/protocol';
import type { Locale, MessageCatalog } from '../../i18n/catalogs';
import {
  RoomServiceError,
  createRoom,
  createRoomTicket,
  getRoomCapabilities,
  isRoomCredentialError,
  isRoomTerminatedError,
  localizeRoomErrorCode,
  localizeRoomServiceError,
  normalizeRoomCode,
  roomReconnectDelay,
  roomSocketUrl,
} from './transport';
import { CasePicker, scenarioChannelLabel } from './CasePicker';
import styles from './ClassroomLive.module.css';

type ClassroomHostProps = {
  catalog: MessageCatalog;
  joinPath: string;
  locale: Locale;
  roomServiceUrl: string;
  scenarios: ScenarioCase[];
};

type ConnectionState =
  'idle' | 'connecting' | 'ready' | 'reconnecting' | 'failed';

function interpolate(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function roomStorageKey(roomCode: string): string {
  return `message-unpacked:classroom-host:${roomCode}`;
}

function readStoredRoom(
  scenarios: ScenarioCase[],
  maximumCases: number,
): { caseIds: string[]; room: CreateRoomResponse } | null {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const roomCode = normalizeRoomCode(hash.get('room') ?? '');
  if (!roomCode) return null;
  const storageKey = roomStorageKey(roomCode);
  const raw = window.sessionStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as {
      cases?: unknown;
      expiresAt?: unknown;
      teacherSecret?: unknown;
    };
    const room = parseCreateRoomResponse({
      protocolVersion: ROOM_PROTOCOL_VERSION,
      roomCode,
      expiresAt: stored.expiresAt,
      teacherSecret: stored.teacherSecret,
    });
    const caseReferences = Array.isArray(stored.cases) ? stored.cases : [];
    const caseIds = caseReferences.flatMap((reference) => {
      if (
        typeof reference !== 'object' ||
        reference === null ||
        !('id' in reference) ||
        !('contentVersion' in reference) ||
        typeof reference.id !== 'string' ||
        typeof reference.contentVersion !== 'string'
      ) {
        return [];
      }
      return scenarios.some(
        (scenario) =>
          scenario.id === reference.id &&
          scenario.contentVersion === reference.contentVersion,
      )
        ? [reference.id]
        : [];
    });
    if (
      !room ||
      room.expiresAt <= Date.now() ||
      caseIds.length === 0 ||
      caseIds.length !== caseReferences.length ||
      new Set(caseIds).size !== caseIds.length ||
      caseIds.length > maximumCases
    ) {
      window.sessionStorage.removeItem(storageKey);
      return null;
    }
    return { caseIds, room };
  } catch {
    window.sessionStorage.removeItem(storageKey);
    return null;
  }
}

export function ClassroomHost({
  catalog,
  joinPath,
  locale,
  roomServiceUrl,
  scenarios,
}: ClassroomHostProps) {
  const copy = catalog.classroomLive;
  const stagePolicy = getTeacherLearningStagePolicy(locale);
  const [capabilities, setCapabilities] = useState<RoomCapabilities | null>(
    null,
  );
  const [stage, setStage] = useState<
    ScenarioCase['learning']['stages'][number]
  >(stagePolicy.defaultStage);
  const stageScenarios = useMemo(
    () =>
      scenarios.filter((scenario) => scenario.learning.stages.includes(stage)),
    [scenarios, stage],
  );
  const topics = useMemo(
    () =>
      [
        ...new Map(
          stageScenarios.map((scenario) => [
            scenario.learning.topicId,
            { id: scenario.learning.topicId, label: scenario.learning.topic },
          ]),
        ).values(),
      ].sort((left, right) => left.label.localeCompare(right.label, locale)),
    [locale, stageScenarios],
  );
  const [topicId, setTopicId] = useState<string>('');
  const effectiveTopicId = topics.some(({ id }) => id === topicId)
    ? topicId
    : (topics[0]?.id ?? '');
  const [durationMinutes, setDurationMinutes] = useState<ActivityDuration>(10);
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [room, setRoom] = useState<CreateRoomResponse | null>(null);
  const [projection, setProjection] = useState<TeacherRoomProjection | null>(
    null,
  );
  const [connection, setConnection] = useState<ConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [roomTerminated, setRoomTerminated] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const stoppedRef = useRef(false);
  const reconnectTimerRef = useRef<number | null>(null);

  const selectedScenarios = useMemo(
    () =>
      selectedIds.flatMap((id) => {
        const scenario = scenarios.find((candidate) => candidate.id === id);
        return scenario ? [scenario] : [];
      }),
    [scenarios, selectedIds],
  );

  function recommendationFor(
    nextStage: typeof stage,
    nextTopicId: string,
    nextDuration: ActivityDuration,
    maximumCases: number,
  ): string[] {
    if (!nextTopicId) return [];
    return recommendActivityCaseIds(
      scenarios,
      {
        durationMinutes: nextDuration,
        stage: nextStage,
        topicId: nextTopicId as ScenarioCase['learning']['topicId'],
      },
      maximumCases,
    );
  }

  function resetRecommendation(
    nextStage: typeof stage,
    nextTopicId: string,
    nextDuration: ActivityDuration,
    maximumCases: number,
  ) {
    const nextIds = recommendationFor(
      nextStage,
      nextTopicId,
      nextDuration,
      maximumCases,
    );
    setRecommendedIds(nextIds);
    setSelectedIds(nextIds);
  }

  const loadCapabilities = async () => {
    setError(null);
    try {
      const result = await getRoomCapabilities(roomServiceUrl);
      setCapabilities(result);
      const stored = readStoredRoom(scenarios, result.maxCases);
      if (stored) {
        const firstScenario = scenarios.find(
          (scenario) => scenario.id === stored.caseIds[0],
        );
        setSelectedIds(stored.caseIds);
        setRecommendedIds(stored.caseIds);
        if (firstScenario) {
          const firstStage = firstScenario.learning.stages[0];
          if (firstStage) setStage(firstStage);
          setTopicId(firstScenario.learning.topicId);
        }
        setRoom(stored.room);
        stoppedRef.current = false;
        await connectTeacher(stored.room);
        return;
      }
      const nextIds = recommendationFor(
        stage,
        effectiveTopicId,
        durationMinutes,
        result.maxCases,
      );
      setRecommendedIds(nextIds);
      setSelectedIds(nextIds);
    } catch (reason) {
      setCapabilities(null);
      setError(localizeRoomServiceError(reason, copy));
    }
  };

  const loadCapabilitiesEffect = useEffectEvent(loadCapabilities);

  useEffect(() => {
    const initialCheck = window.setTimeout(
      () => void loadCapabilitiesEffect(),
      0,
    );
    return () => {
      stoppedRef.current = true;
      window.clearTimeout(initialCheck);
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      socketRef.current?.close();
    };
  }, [roomServiceUrl]);

  async function connectTeacher(
    roomDetails: CreateRoomResponse,
    attempt = 0,
  ): Promise<void> {
    if (stoppedRef.current) return;
    setConnection(attempt === 0 ? 'connecting' : 'reconnecting');
    try {
      const ticket = await createRoomTicket(
        roomServiceUrl,
        roomDetails.roomCode,
        {
          protocolVersion: ROOM_PROTOCOL_VERSION,
          role: 'teacher',
          teacherSecret: roomDetails.teacherSecret,
        },
      );
      if (ticket.role !== 'teacher') {
        throw new RoomServiceError(
          'incompatible-protocol',
          copy.connectionFailed,
          false,
        );
      }
      if (stoppedRef.current) return;
      const socket = new WebSocket(
        roomSocketUrl(roomServiceUrl, roomDetails.roomCode, ticket.ticket),
      );
      socketRef.current = socket;
      let reconnectAttempt = attempt;
      socket.addEventListener('open', () => {
        reconnectAttempt = 0;
        setConnection('ready');
      });
      socket.addEventListener('message', (event) => {
        if (typeof event.data !== 'string') return;
        let decoded: unknown;
        try {
          decoded = JSON.parse(event.data) as unknown;
        } catch {
          return;
        }
        const message = parseRoomServerMessage(decoded);
        if (
          (message?.type === 'welcome' || message?.type === 'room-state') &&
          message.projection.role === 'teacher'
        ) {
          setError(null);
          setProjection(message.projection);
          if (message.projection.phase === 'ended') {
            stoppedRef.current = true;
            setRoomTerminated(true);
            window.sessionStorage.removeItem(
              roomStorageKey(roomDetails.roomCode),
            );
          }
        } else if (message?.type === 'error') {
          setError(localizeRoomErrorCode(message.code, copy));
        }
      });
      socket.addEventListener('close', () => {
        if (stoppedRef.current) return;
        if (reconnectAttempt >= 3) {
          setConnection('failed');
          return;
        }
        setConnection('reconnecting');
        reconnectTimerRef.current = window.setTimeout(
          () => void connectTeacher(roomDetails, reconnectAttempt + 1),
          roomReconnectDelay(reconnectAttempt),
        );
      });
      socket.addEventListener('error', () => socket.close());
    } catch (reason) {
      if (isRoomTerminatedError(reason)) {
        stoppedRef.current = true;
        setRoomTerminated(true);
        window.sessionStorage.removeItem(roomStorageKey(roomDetails.roomCode));
        return;
      }
      if (isRoomCredentialError(reason)) {
        stoppedRef.current = true;
        window.sessionStorage.removeItem(roomStorageKey(roomDetails.roomCode));
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}`,
        );
        setRoom(null);
        setProjection(null);
        setConnection('idle');
        setError(localizeRoomServiceError(reason, copy));
        return;
      }
      if (
        attempt < 3 &&
        reason instanceof RoomServiceError &&
        reason.retryable
      ) {
        reconnectTimerRef.current = window.setTimeout(
          () => void connectTeacher(roomDetails, attempt + 1),
          roomReconnectDelay(attempt),
        );
        return;
      }
      setConnection('failed');
      setError(localizeRoomServiceError(reason, copy));
    }
  }

  const handleCreateRoom = async () => {
    if (!capabilities || selectedScenarios.length === 0) return;
    setCreating(true);
    setError(null);
    stoppedRef.current = false;
    setRoomTerminated(false);
    try {
      const result = await createRoom(roomServiceUrl, {
        protocolVersion: ROOM_PROTOCOL_VERSION,
        manifest: {
          protocolVersion: ROOM_PROTOCOL_VERSION,
          locale,
          cases: selectedScenarios.map((scenario) => ({
            id: scenario.id,
            contentVersion: scenario.contentVersion,
            choiceIds: scenario.choices.map((choice) => choice.id),
          })),
        },
      });
      setRoom(result);
      window.sessionStorage.setItem(
        roomStorageKey(result.roomCode),
        JSON.stringify({
          teacherSecret: result.teacherSecret,
          expiresAt: result.expiresAt,
          cases: selectedScenarios.map(({ id, contentVersion }) => ({
            id,
            contentVersion,
          })),
        }),
      );
      window.history.replaceState(null, '', `#room=${result.roomCode}`);
      await connectTeacher(result);
    } catch (reason) {
      setError(localizeRoomServiceError(reason, copy));
    } finally {
      setCreating(false);
    }
  };

  const joinUrl = useMemo(() => {
    if (!room || typeof window === 'undefined') return '';
    const url = new URL(joinPath, window.location.href);
    url.searchParams.set('room', room.roomCode);
    return url.toString();
  }, [joinPath, room]);

  const currentScenario = useMemo(() => {
    const currentCaseReference =
      projection?.phase === 'open' || projection?.phase === 'revealed'
        ? projection.currentCase
        : null;
    return currentCaseReference
      ? (selectedScenarios.find(
          (scenario) =>
            scenario.id === currentCaseReference.id &&
            scenario.contentVersion === currentCaseReference.contentVersion,
        ) ?? null)
      : null;
  }, [projection, selectedScenarios]);

  const sendCommand = (
    type: 'open-case' | 'reveal-current' | 'show-summary' | 'end-room',
  ) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(
      JSON.stringify({ protocolVersion: ROOM_PROTOCOL_VERSION, type }),
    );
  };

  if (!capabilities && !error) {
    return <div className={styles.notice}>{copy.checkingService}</div>;
  }
  if (!capabilities) {
    return (
      <div className={styles.notice} data-tone="warning">
        <WarningCircleIcon aria-hidden="true" weight="fill" />
        <div>
          <h2>{copy.serviceUnavailable}</h2>
          <p>{error ?? copy.serviceUnavailableDescription}</p>
          <button type="button" onClick={() => void loadCapabilities()}>
            {copy.retry}
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <section className={styles.setup} aria-labelledby="classroom-setup-title">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="classroom-setup-title">{copy.setupHeading}</h2>
            <p>{copy.setupDescription}</p>
          </div>
        </div>
        <div className={styles.setupFilters}>
          <label>
            <span>{catalog.teacherSetup.stage}</span>
            <select
              value={stage}
              onChange={(event) => {
                const nextStage = event.target.value as typeof stage;
                const firstScenario = scenarios.find((scenario) =>
                  scenario.learning.stages.includes(nextStage),
                );
                setStage(nextStage);
                setTopicId(firstScenario?.learning.topicId ?? '');
                resetRecommendation(
                  nextStage,
                  firstScenario?.learning.topicId ?? '',
                  durationMinutes,
                  capabilities.maxCases,
                );
              }}
            >
              {stagePolicy.options.map((option) => (
                <option key={option} value={option}>
                  {catalog.teacherSetup.stageOptions[option]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{catalog.teacherSetup.topic}</span>
            <select
              value={effectiveTopicId}
              onChange={(event) => {
                const nextTopic = event.target.value;
                setTopicId(nextTopic);
                resetRecommendation(
                  stage,
                  nextTopic,
                  durationMinutes,
                  capabilities.maxCases,
                );
              }}
            >
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{catalog.teacherSetup.duration}</span>
            <select
              value={durationMinutes}
              onChange={(event) => {
                const nextDuration = Number(
                  event.target.value,
                ) as ActivityDuration;
                setDurationMinutes(nextDuration);
                resetRecommendation(
                  stage,
                  effectiveTopicId,
                  nextDuration,
                  capabilities.maxCases,
                );
              }}
            >
              {activityDurations.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {interpolate(catalog.teacherSetup.durationOption, {
                    minutes,
                  })}
                </option>
              ))}
            </select>
          </label>
        </div>
        <CasePicker
          catalog={catalog}
          durationMinutes={durationMinutes}
          maximumCases={capabilities.maxCases}
          recommendedIds={recommendedIds}
          scenarios={stageScenarios}
          selectedIds={selectedIds}
          onToggle={(caseId) =>
            setSelectedIds((current) =>
              current.includes(caseId)
                ? current.filter((id) => id !== caseId)
                : [...current, caseId],
            )
          }
        />
        {error && <p className={styles.inlineError}>{error}</p>}
        <button
          className={styles.primaryButton}
          type="button"
          disabled={selectedIds.length === 0 || creating}
          onClick={() => void handleCreateRoom()}
        >
          <DoorOpenIcon aria-hidden="true" weight="bold" />
          {creating ? copy.creatingRoom : copy.createRoom}
        </button>
        <p className={styles.demoReminder}>{copy.demoReminder}</p>
      </section>
    );
  }

  const participantCount = projection?.participantCount ?? 0;
  const isRoomEnded = roomTerminated || projection?.phase === 'ended';
  return (
    <section className={styles.hostRoom}>
      <aside className={styles.roomSidebar}>
        <div className={styles.roomCode}>
          <span>{copy.roomCode}</span>
          <strong>{room.roomCode}</strong>
        </div>
        {joinUrl && (
          <div className={styles.qrPanel}>
            <QRCodeSVG
              value={joinUrl}
              size={184}
              level="M"
              role="img"
              aria-label={copy.joinQrLabel}
            />
            <p>{copy.joinInstructions}</p>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(joinUrl);
                setCopied(true);
              }}
            >
              <ClipboardIcon aria-hidden="true" weight="bold" />
              {copied ? copy.copied : copy.copyJoinLink}
            </button>
          </div>
        )}
        <div className={styles.presence}>
          <UsersThreeIcon aria-hidden="true" weight="fill" />
          <strong>
            {interpolate(copy.participants, { count: participantCount })}
          </strong>
          {projection?.phase === 'open' && (
            <span>
              {interpolate(copy.answered, {
                answered: projection.answeredCount,
                participants: participantCount,
              })}
            </span>
          )}
        </div>
        {connection === 'reconnecting' && (
          <p role="status">{copy.reconnecting}</p>
        )}
        {connection === 'failed' && (
          <p className={styles.inlineError}>{copy.connectionFailed}</p>
        )}
        {error && connection !== 'failed' && (
          <p className={styles.inlineError} role="alert">
            {error}
          </p>
        )}
        {!isRoomEnded && (
          <button
            className={styles.endButton}
            type="button"
            disabled={connection !== 'ready'}
            onClick={() => sendCommand('end-room')}
          >
            {copy.endRoom}
          </button>
        )}
      </aside>

      <div className={styles.projector}>
        {!isRoomEnded && (!projection || projection.phase === 'lobby') && (
          <div className={styles.waitingPanel} role="status">
            <BroadcastIcon aria-hidden="true" weight="duotone" />
            <h2>{copy.waitingToStart}</h2>
            <button
              className={styles.primaryButton}
              type="button"
              disabled={connection !== 'ready'}
              onClick={() => sendCommand('open-case')}
            >
              {copy.openFirstCase}
              <ArrowRightIcon aria-hidden="true" weight="bold" />
            </button>
          </div>
        )}

        {(projection?.phase === 'open' || projection?.phase === 'revealed') &&
          currentScenario && (
            <>
              <header className={styles.projectorHeader}>
                <div>
                  <p>{copy.projectedCase}</p>
                  <h2>{currentScenario.title}</h2>
                </div>
                <strong>
                  {interpolate(copy.questionProgress, {
                    current: projection.currentCase.position,
                    total: projection.totalCaseCount,
                  })}
                </strong>
              </header>
              <div className={styles.projectorGrid}>
                <section className={styles.messagePanel}>
                  <span>
                    {scenarioChannelLabel(catalog, currentScenario.channel)}
                  </span>
                  {currentScenario.messages.map((message) => (
                    <article key={message.id}>
                      <header>
                        <strong>{message.sender}</strong>
                        {message.timestamp && <time>{message.timestamp}</time>}
                      </header>
                      <p>{message.body}</p>
                    </article>
                  ))}
                </section>
                <section className={styles.choicePanel}>
                  <h3>{catalog.demo.choose}</h3>
                  {currentScenario.choices.map((choice, index) => {
                    const count =
                      projection.phase === 'revealed'
                        ? (projection.counts[choice.id] ?? 0)
                        : null;
                    const percentage =
                      count !== null && projection.answeredCount > 0
                        ? (count / projection.answeredCount) * 100
                        : 0;
                    return (
                      <div className={styles.projectedChoice} key={choice.id}>
                        <b>{String.fromCharCode(65 + index)}</b>
                        <span>{choice.label}</span>
                        {count !== null && (
                          <>
                            <strong>
                              {interpolate(copy.responses, { count })}
                            </strong>
                            <i style={{ width: `${percentage}%` }} />
                          </>
                        )}
                      </div>
                    );
                  })}
                </section>
              </div>

              {projection.phase === 'open' ? (
                <button
                  className={styles.primaryButton}
                  type="button"
                  disabled={connection !== 'ready'}
                  onClick={() => sendCommand('reveal-current')}
                >
                  <EyeIcon aria-hidden="true" weight="bold" />
                  {copy.revealCurrent}
                </button>
              ) : (
                <RevealPanel
                  catalog={catalog}
                  projection={projection}
                  scenario={currentScenario}
                >
                  <button
                    className={styles.primaryButton}
                    type="button"
                    disabled={connection !== 'ready'}
                    onClick={() =>
                      sendCommand(
                        projection.currentCase.position ===
                          projection.totalCaseCount
                          ? 'show-summary'
                          : 'open-case',
                      )
                    }
                  >
                    {projection.currentCase.position ===
                    projection.totalCaseCount
                      ? copy.showSummary
                      : copy.nextCase}
                    <ArrowRightIcon aria-hidden="true" weight="bold" />
                  </button>
                </RevealPanel>
              )}
            </>
          )}

        {projection?.phase === 'summary' && (
          <SummaryPanel
            catalog={catalog}
            projection={projection}
            scenarios={selectedScenarios}
          />
        )}
        {isRoomEnded && (
          <div className={styles.waitingPanel} role="status">
            <CheckCircleIcon aria-hidden="true" weight="fill" />
            <h2>{copy.roomEnded}</h2>
          </div>
        )}
      </div>
    </section>
  );
}

function RevealPanel({
  catalog,
  children,
  projection,
  scenario,
}: {
  catalog: MessageCatalog;
  children: React.ReactNode;
  projection: Extract<TeacherRoomProjection, { phase: 'revealed' }>;
  scenario: ScenarioCase;
}) {
  const result = calculateClassScores([
    {
      caseId: scenario.id,
      choiceScores: Object.fromEntries(
        scenario.choices.map((choice) => [choice.id, choice.score]),
      ),
      counts: projection.counts,
    },
  ]).cases[0];
  return (
    <section className={styles.debriefPanel}>
      <div>
        <p>{catalog.classroomLive.classDistribution}</p>
        <h3>{scenario.debrief.headline}</h3>
        <p>{scenario.debrief.explanation}</p>
        <ul>
          {scenario.debrief.safeActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </div>
      <strong>
        {result?.meanScore === null || result?.meanScore === undefined
          ? catalog.classroomLive.noResponses
          : interpolate(catalog.classroomLive.caseMean, {
              score: Math.round(result.meanScore),
            })}
      </strong>
      {children}
    </section>
  );
}

function SummaryPanel({
  catalog,
  projection,
  scenarios,
}: {
  catalog: MessageCatalog;
  projection: Extract<TeacherRoomProjection, { phase: 'summary' }>;
  scenarios: ScenarioCase[];
}) {
  const results = calculateClassScores(
    projection.results.flatMap((result) => {
      const scenario = scenarios.find(({ id }) => id === result.caseId);
      return scenario
        ? [
            {
              caseId: result.caseId,
              choiceScores: Object.fromEntries(
                scenario.choices.map((choice) => [choice.id, choice.score]),
              ),
              counts: result.counts,
            },
          ]
        : [];
    }),
  );
  return (
    <section className={styles.summaryPanel}>
      <CheckCircleIcon aria-hidden="true" weight="fill" />
      <h2>{catalog.classroomLive.summaryHeading}</h2>
      <p>{catalog.classroomLive.overallMean}</p>
      <strong>
        {results.overallMeanScore === null
          ? '—'
          : `${Math.round(results.overallMeanScore)} / 100`}
      </strong>
      <ol>
        {results.cases.map((result) => {
          const scenario = scenarios.find(({ id }) => id === result.caseId);
          return (
            <li key={result.caseId}>
              <span>{scenario?.title ?? result.caseId}</span>
              <b>
                {result.meanScore === null
                  ? '—'
                  : `${Math.round(result.meanScore)} / 100`}
              </b>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  ArrowRightIcon,
  CheckCircleIcon,
  DeviceMobileIcon,
  HourglassIcon,
  ShieldCheckIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';

import {
  ROOM_PROTOCOL_VERSION,
  parseRoomServerMessage,
  type StudentRoomProjection,
} from '../../domain/room/protocol';
import type { MessageCatalog } from '../../i18n/catalogs';
import {
  RoomServiceError,
  createRoomTicket,
  isRoomCredentialError,
  isRoomTerminatedError,
  localizeRoomErrorCode,
  localizeRoomServiceError,
  normalizeRoomCode,
  roomReconnectDelay,
  roomSocketUrl,
} from './transport';
import styles from './ClassroomLive.module.css';

export type ClickerCase = {
  id: string;
  contentVersion: string;
  choices: { id: string; label: string }[];
};

type ClassroomClickerProps = {
  cases: ClickerCase[];
  catalog: MessageCatalog;
  roomServiceUrl: string;
};

type JoinState = 'form' | 'joining' | 'ready' | 'reconnecting' | 'failed';

export function resolveClickerCase(
  cases: readonly ClickerCase[],
  projection: Extract<StudentRoomProjection, { phase: 'open' }>,
): ClickerCase | null {
  const candidate = cases.find(
    (entry) =>
      entry.id === projection.currentCase.id &&
      entry.contentVersion === projection.currentCase.contentVersion,
  );
  if (!candidate) return null;

  const choices = projection.currentCase.choiceIds.flatMap((choiceId) => {
    const choice = candidate.choices.find((entry) => entry.id === choiceId);
    return choice ? [choice] : [];
  });
  return choices.length === projection.currentCase.choiceIds.length
    ? { ...candidate, choices }
    : null;
}

function interpolate(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function participantStorageKey(roomCode: string): string {
  return `message-unpacked:classroom-participant:${roomCode}`;
}

export function ClassroomClicker({
  cases,
  catalog,
  roomServiceUrl,
}: ClassroomClickerProps) {
  const copy = catalog.classroomLive;
  const [roomInput, setRoomInput] = useState(() => {
    if (typeof window === 'undefined') return '';
    return (
      normalizeRoomCode(
        new URLSearchParams(window.location.search).get('room') ?? '',
      ) ?? ''
    );
  });
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [joinState, setJoinState] = useState<JoinState>('form');
  const [projection, setProjection] = useState<StudentRoomProjection | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [submittingChoiceId, setSubmittingChoiceId] = useState<string | null>(
    null,
  );
  const [answerStatus, setAnswerStatus] = useState<string | null>(null);
  const [roomTerminated, setRoomTerminated] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const submittingChoiceRef = useRef<string | null>(null);
  const stoppedRef = useRef(false);
  const reconnectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stoppedRef.current = true;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      socketRef.current?.close();
    };
  }, []);

  const connectStudent = async (
    normalizedCode: string,
    attempt = 0,
  ): Promise<void> => {
    if (stoppedRef.current) return;
    setJoinState(attempt === 0 ? 'joining' : 'reconnecting');
    try {
      const storedToken = window.sessionStorage.getItem(
        participantStorageKey(normalizedCode),
      );
      const ticket = await createRoomTicket(roomServiceUrl, normalizedCode, {
        protocolVersion: ROOM_PROTOCOL_VERSION,
        role: 'student',
        ...(storedToken ? { participantToken: storedToken } : {}),
      });
      if (ticket.role !== 'student') {
        throw new RoomServiceError(
          'incompatible-protocol',
          copy.connectionFailed,
          false,
        );
      }
      if (ticket.participantToken) {
        window.sessionStorage.setItem(
          participantStorageKey(normalizedCode),
          ticket.participantToken,
        );
      }

      if (stoppedRef.current) return;

      const socket = new WebSocket(
        roomSocketUrl(roomServiceUrl, normalizedCode, ticket.ticket),
      );
      socketRef.current = socket;
      let reconnectAttempt = attempt;
      socket.addEventListener('open', () => {
        reconnectAttempt = 0;
        setJoinState('ready');
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
          message.projection.role === 'student'
        ) {
          setError(null);
          setProjection(message.projection);
          if (
            message.type === 'welcome' &&
            message.projection.phase === 'open'
          ) {
            submittingChoiceRef.current = null;
            setSubmittingChoiceId(null);
            if (message.projection.submittedChoiceId) {
              setAnswerStatus(copy.submitted);
            }
          }
          if (message.projection.phase !== 'open') {
            setSubmittingChoiceId(null);
            setAnswerStatus(null);
          }
          if (message.projection.phase === 'ended') {
            stoppedRef.current = true;
            setRoomTerminated(true);
            window.sessionStorage.removeItem(
              participantStorageKey(normalizedCode),
            );
          }
        } else if (message?.type === 'answer-ack') {
          submittingChoiceRef.current = null;
          setSubmittingChoiceId(null);
          setError(null);
          setAnswerStatus(
            message.outcome === 'revised' ? copy.changed : copy.submitted,
          );
        } else if (message?.type === 'error') {
          submittingChoiceRef.current = null;
          setSubmittingChoiceId(null);
          setError(localizeRoomErrorCode(message.code, copy));
        }
      });
      socket.addEventListener('close', () => {
        if (stoppedRef.current) return;
        if (submittingChoiceRef.current !== null) {
          submittingChoiceRef.current = null;
          setSubmittingChoiceId(null);
          setAnswerStatus(copy.deliveryUncertain);
        }
        if (reconnectAttempt >= 3) {
          setJoinState('failed');
          return;
        }
        setJoinState('reconnecting');
        reconnectTimerRef.current = window.setTimeout(
          () => void connectStudent(normalizedCode, reconnectAttempt + 1),
          roomReconnectDelay(reconnectAttempt),
        );
      });
      socket.addEventListener('error', () => socket.close());
    } catch (reason) {
      if (isRoomTerminatedError(reason)) {
        stoppedRef.current = true;
        setRoomTerminated(true);
        window.sessionStorage.removeItem(participantStorageKey(normalizedCode));
        return;
      }
      if (isRoomCredentialError(reason)) {
        window.sessionStorage.removeItem(participantStorageKey(normalizedCode));
      }
      if (
        attempt < 3 &&
        reason instanceof RoomServiceError &&
        reason.retryable
      ) {
        reconnectTimerRef.current = window.setTimeout(
          () => void connectStudent(normalizedCode, attempt + 1),
          roomReconnectDelay(attempt),
        );
        return;
      }
      setJoinState('failed');
      setError(localizeRoomServiceError(reason, copy));
    }
  };

  const handleJoin = () => {
    const normalized = normalizeRoomCode(roomInput);
    if (!normalized) {
      setError(copy.invalidCode);
      return;
    }
    setRoomCode(normalized);
    setError(null);
    stoppedRef.current = false;
    setRoomTerminated(false);
    const url = new URL(window.location.href);
    url.searchParams.set('room', normalized);
    window.history.replaceState(null, '', url);
    void connectStudent(normalized);
  };

  const currentCase = useMemo(() => {
    if (projection?.phase !== 'open') return null;
    return resolveClickerCase(cases, projection);
  }, [cases, projection]);

  if (joinState === 'form') {
    return (
      <section className={styles.clicker} aria-labelledby="clicker-join-title">
        <DeviceMobileIcon aria-hidden="true" weight="duotone" />
        <h2 id="clicker-join-title">{catalog.classroomShell.joinHeading}</h2>
        <label>
          <span>{copy.joinCodeLabel}</span>
          <input
            value={roomInput}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            placeholder={copy.joinCodePlaceholder}
            onChange={(event) => setRoomInput(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleJoin();
            }}
          />
        </label>
        {error && (
          <p className={styles.inlineError} role="alert">
            {error}
          </p>
        )}
        <button
          className={styles.primaryButton}
          type="button"
          onClick={handleJoin}
        >
          {copy.joinButton}
          <ArrowRightIcon aria-hidden="true" weight="bold" />
        </button>
        <p className={styles.privacyReminder}>
          <ShieldCheckIcon aria-hidden="true" weight="duotone" />
          {copy.privacyReminder}
        </p>
      </section>
    );
  }

  if (roomTerminated) {
    return (
      <section className={styles.clicker} role="status">
        <CheckCircleIcon aria-hidden="true" weight="fill" />
        <p className={styles.clickerCode}>{roomCode}</p>
        <h2>{copy.roomEnded}</h2>
      </section>
    );
  }

  if (joinState === 'joining' || joinState === 'reconnecting') {
    return (
      <section className={styles.clicker} role="status">
        <HourglassIcon aria-hidden="true" weight="duotone" />
        <h2>{joinState === 'joining' ? copy.joining : copy.reconnecting}</h2>
        <p>{roomCode}</p>
        {joinState === 'reconnecting' && answerStatus && <p>{answerStatus}</p>}
      </section>
    );
  }

  if (joinState === 'failed') {
    return (
      <section className={styles.clicker} role="alert">
        <WarningCircleIcon aria-hidden="true" weight="fill" />
        <h2>{copy.serviceUnavailable}</h2>
        <p>{error ?? copy.connectionFailed}</p>
        <button
          className={styles.primaryButton}
          type="button"
          onClick={() => {
            setJoinState('form');
            setProjection(null);
          }}
        >
          {copy.retry}
        </button>
      </section>
    );
  }

  if (!projection || projection.phase === 'lobby') {
    return (
      <section className={styles.clicker} role="status">
        <CheckCircleIcon aria-hidden="true" weight="fill" />
        <p className={styles.clickerCode}>{roomCode}</p>
        <h2>{copy.waitingForTeacher}</h2>
      </section>
    );
  }

  if (projection.phase === 'open') {
    if (!currentCase) {
      return (
        <section className={styles.clicker} role="alert">
          <WarningCircleIcon aria-hidden="true" weight="fill" />
          <h2>{copy.staleActivity}</h2>
        </section>
      );
    }
    return (
      <section className={styles.clicker}>
        <p className={styles.clickerCode}>{roomCode}</p>
        <strong className={styles.clickerProgress}>
          {interpolate(copy.studentQuestion, {
            current: projection.currentCase.position,
            total: projection.totalCaseCount,
          })}
        </strong>
        <h2>{copy.chooseAnswer}</h2>
        <div className={styles.clickerChoices}>
          {currentCase.choices.map((choice, index) => {
            const selected = projection.submittedChoiceId === choice.id;
            return (
              <button
                key={choice.id}
                type="button"
                aria-pressed={selected}
                disabled={submittingChoiceId !== null}
                onClick={() => {
                  if (socketRef.current?.readyState !== WebSocket.OPEN) return;
                  submittingChoiceRef.current = choice.id;
                  setSubmittingChoiceId(choice.id);
                  setAnswerStatus(null);
                  setError(null);
                  socketRef.current.send(
                    JSON.stringify({
                      protocolVersion: ROOM_PROTOCOL_VERSION,
                      type: 'answer',
                      caseId: currentCase.id,
                      choiceId: choice.id,
                    }),
                  );
                }}
              >
                <b>{String.fromCharCode(65 + index)}</b>
                <span>{choice.label}</span>
                {selected && (
                  <CheckCircleIcon aria-hidden="true" weight="fill" />
                )}
              </button>
            );
          })}
        </div>
        <p className={styles.answerStatus} role="status">
          {submittingChoiceId ? copy.submitting : answerStatus}
        </p>
        {error && (
          <p className={styles.inlineError} role="alert">
            {error}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className={styles.clicker} role="status">
      <CheckCircleIcon aria-hidden="true" weight="fill" />
      <p className={styles.clickerCode}>{roomCode}</p>
      <h2>
        {projection.phase === 'revealed'
          ? copy.waitingForReveal
          : projection.phase === 'summary'
            ? copy.activityComplete
            : copy.roomEnded}
      </h2>
    </section>
  );
}

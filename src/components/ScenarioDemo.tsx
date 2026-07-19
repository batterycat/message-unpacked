import { useMemo, useReducer, useState, useSyncExternalStore } from 'react';

import { useMachine } from '@xstate/react';
import {
  ArrowCounterClockwiseIcon,
  ArrowRightIcon,
  ArrowSquareOutIcon,
  BookOpenTextIcon,
  CalendarBlankIcon,
  CaretDownIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CircleIcon,
  GraduationCapIcon,
  EyeIcon,
  InfoIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react';

import type { ScenarioCase } from '../domain/cases/schema';
import {
  parseActivityConfig,
  type ParsedActivityConfig,
} from '../domain/activity/config';
import type { ResponseResource } from '../domain/resources/schema';
import {
  getScoreBand,
  summarizeSession,
  type SessionAttempt,
} from '../domain/session/result';
import type { Locale, MessageCatalog } from '../i18n/catalogs';
import { localePath } from '../i18n/locale';
import { scenarioMachine } from '../domain/scenario/machine';
import styles from './ScenarioDemo.module.css';

type ScenarioDemoProps = {
  catalog: MessageCatalog;
  locale: Locale;
  resources: ResponseResource[];
  scenarios: ScenarioCase[];
  switchToChineseHref?: string;
  teacherSetupHref?: string;
};

type ScenarioCardProps = ScenarioDemoProps & {
  isLast: boolean;
  onComplete: (score: number) => void;
  projectorMode: boolean;
  scenario: ScenarioCase;
  position: number;
};

type SessionState = {
  attempts: SessionAttempt[];
  completed: boolean;
  position: number;
};

type SessionAction =
  | { type: 'COMPLETE_CASE'; attempt: SessionAttempt; isLast: boolean }
  | { type: 'RESTART_ACTIVITY' };

const provenanceKey = {
  documented: 'documented',
  composite: 'composite',
  'classic-pattern': 'classicPattern',
  fictional: 'fictional',
} as const;

const channelKey = {
  sms: 'channelSms',
  chat: 'channelChat',
  email: 'channelEmail',
} as const;

const impactQualifierKey = {
  reported: 'reported',
  estimated: 'estimated',
  'at-least': 'atLeast',
  'up-to': 'upTo',
  aggregate: 'aggregate',
} as const;

function subscribeToLocation(callback: () => void) {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}

function getLocationSearch() {
  return window.location.search;
}

function getServerLocationSearch() {
  return '';
}

function formatFinancialLoss(
  impact: NonNullable<ScenarioCase['impact']>['financialLoss'],
  locale: Locale,
) {
  if (!impact) return null;
  if (impact.currency === 'TWD' && locale === 'zh-TW') {
    return `NT$${new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
    }).format(impact.amount)}`;
  }
  const currency = impact.currency === 'OTHER' ? undefined : impact.currency;
  return new Intl.NumberFormat(locale, {
    style: currency ? 'currency' : 'decimal',
    currency,
    maximumFractionDigits: 0,
  }).format(impact.amount);
}

function ScenarioCard({
  catalog,
  isLast,
  locale,
  onComplete,
  position,
  projectorMode,
  resources,
  scenario,
  scenarios,
}: ScenarioCardProps) {
  const [showClues, setShowClues] = useState(false);
  const [projectorChoiceId, setProjectorChoiceId] = useState<string | null>(
    null,
  );
  const [snapshot, send] = useMachine(scenarioMachine);
  const isDebrief = snapshot.matches('debrief');
  const selectedChoice = scenario.choices.find(
    (choice) => choice.id === snapshot.context.selectedChoiceId,
  );
  const relevantResources = resources.filter((resource) =>
    scenario.recommendedActionIds.includes(resource.id),
  );
  const financialLoss = formatFinancialLoss(
    scenario.impact?.financialLoss,
    locale,
  );
  const qualifiedFinancialLoss =
    financialLoss && scenario.impact?.financialLoss
      ? `${
          catalog.demo.impactQualifiers[
            impactQualifierKey[scenario.impact.financialLoss.qualifier]
          ]
        } ${financialLoss}`
      : null;
  const qualifiedVictimCount = scenario.impact?.victimCount
    ? `${
        catalog.demo.impactQualifiers[
          impactQualifierKey[scenario.impact.victimCount.qualifier]
        ]
      } ${catalog.demo.people.replace(
        '{count}',
        new Intl.NumberFormat(locale).format(scenario.impact.victimCount.count),
      )}`
    : null;
  const questionScore = selectedChoice?.score ?? 0;
  const questionScoreBand = getScoreBand(questionScore);

  return (
    <article className={styles.experience} aria-labelledby="scenario-title">
      <div className={styles.stageHeader}>
        <div>
          <p className={styles.eyebrow}>{catalog.demo.eyebrow}</p>
          <h2 id="scenario-title">{catalog.demo.heading}</h2>
          <p className={styles.instructions}>{catalog.demo.instructions}</p>
        </div>
        <div className={styles.stageStatus}>
          {projectorMode && (
            <span className={styles.projectorBadge}>
              <UsersThreeIcon aria-hidden="true" weight="fill" />
              {catalog.demo.projectorMode}
            </span>
          )}
          <div className={styles.progress} aria-label={catalog.demo.progress}>
            <span>{String(position + 1).padStart(2, '0')}</span>
            <span aria-hidden="true">／</span>
            <span>{String(scenarios.length).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      <div className={styles.caseGrid}>
        <div className={styles.exercisePanel}>
          <section className={styles.messagePanel} aria-label={scenario.title}>
            <div className={styles.messageChrome}>
              <span className={styles.channel}>
                {catalog.demo[channelKey[scenario.channel]]}
              </span>
              <span>{scenario.title}</span>
            </div>
            <div className={styles.messages} data-testid="scenario-messages">
              {scenario.messages.map((message) => (
                <div
                  className={styles.message}
                  data-testid="scenario-message"
                  key={message.id}
                >
                  <div className={styles.senderLine}>
                    <strong>
                      {scenario.channel === 'email' &&
                        `${catalog.demo.sender}：`}
                      {message.sender}
                    </strong>
                    {message.timestamp && <time>{message.timestamp}</time>}
                  </div>
                  <p>{message.body}</p>
                </div>
              ))}
            </div>
            <div className={styles.clueArea}>
              <button
                className={styles.textButton}
                type="button"
                aria-expanded={showClues}
                onClick={() => setShowClues((value) => !value)}
              >
                {showClues ? catalog.demo.hideClues : catalog.demo.revealClues}
                <CaretDownIcon aria-hidden="true" weight="bold" />
              </button>
              {showClues && (
                <div className={styles.clues}>
                  <h3>{catalog.demo.clueHeading}</h3>
                  <ul>
                    {scenario.clues.map((clue) => (
                      <li key={clue.id}>
                        <InfoIcon aria-hidden="true" weight="fill" />
                        <span>
                          <strong>{clue.label}</strong>
                          <span>{clue.explanation}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          <section className={styles.decisionPanel} aria-live="polite">
            {!isDebrief ? (
              <>
                {projectorMode && (
                  <div className={styles.projectorGuide}>
                    <UsersThreeIcon aria-hidden="true" weight="duotone" />
                    <div>
                      <strong>{catalog.demo.projectorDiscussionTitle}</strong>
                      <span>{catalog.demo.projectorDiscussionDescription}</span>
                    </div>
                  </div>
                )}
                <p className={styles.panelLabel}>{catalog.demo.choose}</p>
                <div className={styles.choices}>
                  {scenario.choices.map((choice, index) => (
                    <button
                      key={choice.id}
                      className={`${styles.choice} ${
                        projectorMode && projectorChoiceId === choice.id
                          ? styles.choiceSelected
                          : ''
                      }`}
                      type="button"
                      aria-pressed={
                        projectorMode
                          ? projectorChoiceId === choice.id
                          : undefined
                      }
                      onClick={() => {
                        if (projectorMode) {
                          setProjectorChoiceId(choice.id);
                          return;
                        }
                        send({ type: 'ANSWER', choiceId: choice.id });
                      }}
                    >
                      {projectorMode && projectorChoiceId === choice.id ? (
                        <CheckCircleIcon aria-hidden="true" weight="fill" />
                      ) : (
                        <CircleIcon aria-hidden="true" weight="bold" />
                      )}
                      <span>
                        <b>{String.fromCharCode(65 + index)}.</b> {choice.label}
                      </span>
                    </button>
                  ))}
                </div>
                {projectorMode && (
                  <button
                    className={styles.revealButton}
                    disabled={!projectorChoiceId}
                    type="button"
                    onClick={() => {
                      if (!projectorChoiceId) return;
                      send({ type: 'ANSWER', choiceId: projectorChoiceId });
                    }}
                  >
                    <EyeIcon aria-hidden="true" weight="bold" />
                    {catalog.demo.revealDebrief}
                  </button>
                )}
              </>
            ) : (
              <div className={styles.debrief}>
                <div className={styles.resultTopline}>
                  <span>
                    <CheckCircleIcon aria-hidden="true" weight="fill" />
                    {catalog.demo.resultLabel}
                  </span>
                </div>
                <div className={styles.questionScore}>
                  <span>
                    {projectorMode
                      ? catalog.demo.projectorScore
                      : catalog.demo.score}
                  </span>
                  <strong>{questionScore}</strong>
                  <span>／100</span>
                  <small>{catalog.demo.scoreFeedback[questionScoreBand]}</small>
                </div>
                <p className={styles.provenance}>
                  {catalog.demo.provenance}・
                  {
                    catalog.demo.provenanceKinds[
                      provenanceKey[scenario.provenance.kind]
                    ]
                  }
                </p>
                <h3>{scenario.debrief.headline}</h3>
                <p className={styles.reasoning}>{selectedChoice?.reasoning}</p>
                <p>{scenario.debrief.explanation}</p>
                <h4>{catalog.demo.actions}</h4>
                <ul className={styles.safeActions}>
                  {scenario.debrief.safeActions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>

                <div className={styles.debriefButtons}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => {
                      setProjectorChoiceId(null);
                      send({ type: 'RESTART' });
                    }}
                  >
                    <ArrowCounterClockwiseIcon
                      aria-hidden="true"
                      weight="bold"
                    />
                    {catalog.demo.restart}
                  </button>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    disabled={!selectedChoice}
                    onClick={() => onComplete(questionScore)}
                  >
                    {isLast ? catalog.demo.viewResults : catalog.demo.next}
                    <ArrowRightIcon aria-hidden="true" weight="bold" />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className={styles.supportPanel} aria-labelledby="support-title">
          {isDebrief && scenario.impact ? (
            <section className={styles.impactCard}>
              <p className={styles.realCaseLabel}>
                <BookOpenTextIcon aria-hidden="true" weight="fill" />
                {catalog.demo.realCase}
              </p>
              <h3>{scenario.title}</h3>
              <dl>
                <div>
                  <dt>
                    <CalendarBlankIcon aria-hidden="true" />
                    {catalog.demo.eventPeriod}
                  </dt>
                  <dd>
                    {scenario.impact.period ?? catalog.demo.unknownImpact}
                  </dd>
                </div>
                <div>
                  <dt>
                    <MapPinIcon aria-hidden="true" />
                    {catalog.demo.eventLocation}
                  </dt>
                  <dd>
                    {scenario.impact.location ?? catalog.demo.unknownImpact}
                  </dd>
                </div>
                <div>
                  <dt>{catalog.demo.victimCount}</dt>
                  <dd>{qualifiedVictimCount ?? catalog.demo.unknownImpact}</dd>
                </div>
                <div>
                  <dt>{catalog.demo.maximumLoss}</dt>
                  <dd className={styles.loss}>
                    {qualifiedFinancialLoss ?? catalog.demo.unknownImpact}
                  </dd>
                  {scenario.impact.financialLoss?.note && (
                    <small>{scenario.impact.financialLoss.note}</small>
                  )}
                </div>
              </dl>
              <h4>{catalog.demo.eventSummary}</h4>
              <p>{scenario.impact.eventSummary}</p>
              {scenario.impact.nonFinancialImpact && (
                <>
                  <h4>{catalog.demo.nonFinancialImpact}</h4>
                  <p>{scenario.impact.nonFinancialImpact}</p>
                </>
              )}
              <div className={styles.sourceList}>
                <h4>{catalog.demo.sourceLinks}</h4>
                {scenario.sources.map((source) => (
                  <a
                    key={source.id}
                    href={source.canonicalUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {source.publisher}
                    <ArrowSquareOutIcon aria-hidden="true" />
                  </a>
                ))}
                <p className={styles.sourceReview}>
                  {catalog.demo.verified}：{scenario.review.lastReviewedAt}
                </p>
              </div>
            </section>
          ) : (
            <section className={styles.helpIntro}>
              <ShieldCheckIcon aria-hidden="true" weight="duotone" />
              <div>
                <h3 id="support-title">{catalog.demo.helpTitle}</h3>
                <p>{catalog.demo.helpDescription}</p>
              </div>
            </section>
          )}

          <div className={styles.helpResources}>
            {relevantResources.length > 0 ? (
              relevantResources.map((resource) => (
                <section className={styles.helpResource} key={resource.id}>
                  <strong>{resource.officialName}</strong>
                  <p>{resource.guidance}</p>
                  <div className={styles.resourceLinks}>
                    {resource.phone && (
                      <a href={`tel:${resource.phone}`}>
                        <PhoneIcon aria-hidden="true" weight="fill" />
                        {resource.phone}
                      </a>
                    )}
                    {resource.canonicalUrl && (
                      <a
                        href={resource.canonicalUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {catalog.demo.officialSite}
                        <ArrowSquareOutIcon aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </section>
              ))
            ) : (
              <p className={styles.helpPending}>{catalog.demo.helpPending}</p>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}

const initialSessionState: SessionState = {
  attempts: [],
  completed: false,
  position: 0,
};

function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case 'COMPLETE_CASE': {
      if (state.completed) return state;
      const attempts = [...state.attempts, action.attempt];
      return action.isLast
        ? { attempts, completed: true, position: state.position }
        : { attempts, completed: false, position: state.position + 1 };
    }
    case 'RESTART_ACTIVITY':
      return initialSessionState;
  }
}

function SessionResults({
  attempts,
  catalog,
  onRestart,
  projectorMode,
  teacherSetupHref,
}: {
  attempts: readonly SessionAttempt[];
  catalog: MessageCatalog;
  onRestart: () => void;
  projectorMode: boolean;
  teacherSetupHref: string;
}) {
  const summary = summarizeSession(attempts);
  const resultCopy = projectorMode
    ? catalog.demo.projectorResults
    : catalog.demo.results;
  const band = projectorMode
    ? {
        heading: catalog.demo.projectorResults.feedbackHeading,
        description: catalog.demo.projectorResults.feedbackDescription,
      }
    : catalog.demo.results.bands[summary.scoreBand];

  return (
    <section
      className={styles.results}
      aria-labelledby="session-results-title"
      aria-live="polite"
    >
      <header className={styles.resultsHeader}>
        <div>
          <p className={styles.eyebrow}>{resultCopy.eyebrow}</p>
          <h2 id="session-results-title">{resultCopy.heading}</h2>
          <p>{resultCopy.description}</p>
        </div>
        <div className={styles.totalScore}>
          <span>{resultCopy.totalScore}</span>
          <strong>{summary.totalScore}</strong>
          <span>／{summary.maximumScore}</span>
        </div>
      </header>

      <div className={styles.resultsOverview}>
        <article className={styles.bandFeedback}>
          <CheckCircleIcon aria-hidden="true" weight="fill" />
          <div>
            <h3>{band.heading}</h3>
            <p>{band.description}</p>
          </div>
        </article>
        <dl className={styles.resultMetrics}>
          <div>
            <dt>{resultCopy.averageScore}</dt>
            <dd>{summary.averageScore}／100</dd>
          </div>
          <div>
            <dt>{catalog.demo.results.progress}</dt>
            <dd>
              {catalog.demo.results.completedCount.replace(
                '{count}',
                String(summary.completedCount),
              )}
            </dd>
          </div>
        </dl>
      </div>

      <section className={styles.breakdown} aria-labelledby="breakdown-title">
        <h3 id="breakdown-title">
          <ChartBarIcon aria-hidden="true" weight="duotone" />
          {resultCopy.breakdown}
        </h3>
        <ol>
          {summary.attempts.map((attempt, index) => (
            <li key={attempt.scenarioId}>
              <span className={styles.caseNumber}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>{attempt.title}</span>
              <strong>{attempt.score}／100</strong>
            </li>
          ))}
        </ol>
      </section>

      <div className={styles.resultsActions}>
        <button type="button" onClick={onRestart}>
          <ArrowCounterClockwiseIcon aria-hidden="true" weight="bold" />
          {catalog.demo.results.restart}
        </button>
        <a href={teacherSetupHref}>
          <GraduationCapIcon aria-hidden="true" weight="bold" />
          {catalog.demo.results.newActivity}
        </a>
      </div>
    </section>
  );
}

function ScenarioSession({
  projectorMode,
  ...props
}: ScenarioDemoProps & { projectorMode: boolean }) {
  const [session, dispatch] = useReducer(sessionReducer, initialSessionState);

  if (session.completed) {
    return (
      <SessionResults
        attempts={session.attempts}
        catalog={props.catalog}
        onRestart={() => dispatch({ type: 'RESTART_ACTIVITY' })}
        projectorMode={projectorMode}
        teacherSetupHref={props.teacherSetupHref ?? './'}
      />
    );
  }

  const scenario = props.scenarios[session.position];
  if (!scenario) return null;
  const isLast = session.position === props.scenarios.length - 1;

  return (
    <ScenarioCard
      {...props}
      isLast={isLast}
      key={scenario.id}
      scenario={scenario}
      position={session.position}
      projectorMode={projectorMode}
      onComplete={(score) =>
        dispatch({
          type: 'COMPLETE_CASE',
          attempt: {
            scenarioId: scenario.id,
            title: scenario.title,
            score,
          },
          isLast,
        })
      }
    />
  );
}

export function ScenarioDemo(props: ScenarioDemoProps) {
  const locationSearch = useSyncExternalStore(
    subscribeToLocation,
    getLocationSearch,
    getServerLocationSearch,
  );
  const activity: ParsedActivityConfig = useMemo(
    () =>
      parseActivityConfig(
        new URLSearchParams(locationSearch),
        props.scenarios.map((scenario) => scenario.id),
      ),
    [locationSearch, props.scenarios],
  );

  const activityScenarios = useMemo(() => {
    if (activity.status !== 'valid') return props.scenarios;
    const scenariosById = new Map(
      props.scenarios.map((scenario) => [scenario.id, scenario]),
    );
    return activity.config.caseIds.flatMap((caseId) => {
      const scenario = scenariosById.get(caseId);
      return scenario ? [scenario] : [];
    });
  }, [activity, props.scenarios]);

  if (activity.status === 'invalid') {
    return (
      <section
        className={styles.empty}
        aria-labelledby="invalid-activity-title"
      >
        <p className={styles.eyebrow}>{props.catalog.demo.eyebrow}</p>
        <h2 id="invalid-activity-title">
          {props.catalog.demo.invalidActivityTitle}
        </h2>
        <p>{props.catalog.demo.invalidActivityDescription}</p>
        <a className={styles.primaryLink} href="./#demo">
          {props.catalog.demo.returnToAllCases}
        </a>
      </section>
    );
  }

  if (activityScenarios.length === 0) {
    return (
      <section className={styles.empty} aria-labelledby="empty-title">
        <p className={styles.eyebrow}>{props.catalog.demo.eyebrow}</p>
        <h2 id="empty-title">{props.catalog.demo.emptyTitle}</h2>
        <p>{props.catalog.demo.emptyDescription}</p>
        <a
          className={styles.primaryLink}
          href={props.switchToChineseHref ?? `${localePath('zh-TW')}#demo`}
        >
          {props.catalog.demo.switchToChinese}
        </a>
      </section>
    );
  }

  const projectorMode =
    activity.status === 'valid' && activity.config.mode === 'projector';
  const sessionKey =
    activity.status === 'valid'
      ? activity.config.caseIds.join('|')
      : activityScenarios.map((scenario) => scenario.id).join('|');

  return (
    <ScenarioSession
      {...props}
      key={sessionKey}
      scenarios={activityScenarios}
      projectorMode={projectorMode}
    />
  );
}

import { useMemo, useState } from 'react';

import {
  ArrowSquareOutIcon,
  CheckCircleIcon,
  ClockIcon,
  CopyIcon,
  GraduationCapIcon,
  LinkIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react';
import { QRCodeSVG } from 'qrcode.react';

import {
  activityDurations,
  buildActivityUrl,
  createActivityConfigFromCaseIds,
  maximumStaticActivityCases,
  recommendActivityCaseIds,
  type ActivityDuration,
  type ActivityMode,
  type LearningStage,
} from '../domain/activity/config';
import { learningStages, type ScenarioCase } from '../domain/cases/schema';
import {
  CasePicker,
  type CasePickerScenario,
} from '../features/classroom/CasePicker';
import type { Locale, MessageCatalog } from '../i18n/catalogs';
import styles from './TeacherConfigurator.module.css';

type TeacherConfiguratorProps = {
  activityPath?: string;
  catalog: MessageCatalog;
  locale: Locale;
  scenarios: readonly CasePickerScenario[];
};

function interpolate(
  template: string,
  values: Record<string, string | number>,
) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    template,
  );
}

export function TeacherConfigurator({
  activityPath = 'activity/',
  catalog,
  locale,
  scenarios,
}: TeacherConfiguratorProps) {
  const [stage, setStage] = useState<LearningStage>('7-9');
  const availableScenarios = useMemo(
    () =>
      scenarios.filter((scenario) => scenario.learning.stages.includes(stage)),
    [scenarios, stage],
  );
  const topics = useMemo(
    () =>
      [
        ...new Map(
          availableScenarios.map((scenario) => [
            scenario.learning.topicId,
            {
              id: scenario.learning.topicId,
              label: scenario.learning.topic,
            },
          ]),
        ).values(),
      ].sort((left, right) => left.label.localeCompare(right.label, locale)),
    [availableScenarios, locale],
  );
  const [topicId, setTopicId] = useState(topics[0]?.id ?? '');
  const [durationMinutes, setDurationMinutes] = useState<ActivityDuration>(10);
  const [mode, setMode] = useState<ActivityMode>('self-paced');
  const effectiveTopicId = topics.some(({ id }) => id === topicId)
    ? topicId
    : (topics[0]?.id ?? '');
  const initialRecommendedIds = effectiveTopicId
    ? recommendActivityCaseIds(scenarios, {
        durationMinutes,
        stage,
        topicId: effectiveTopicId as ScenarioCase['learning']['topicId'],
      })
    : [];
  const [recommendedIds, setRecommendedIds] = useState<string[]>(
    initialRecommendedIds,
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialRecommendedIds,
  );
  const [activityUrl, setActivityUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const unavailable = availableScenarios.length === 0 || topics.length === 0;

  function resetRecommendation(
    nextStage: LearningStage,
    nextTopicId: string,
    nextDuration: ActivityDuration,
  ) {
    if (!nextTopicId) {
      setRecommendedIds([]);
      setSelectedIds([]);
      return;
    }
    const nextIds = recommendActivityCaseIds(scenarios, {
      durationMinutes: nextDuration,
      stage: nextStage,
      topicId: nextTopicId as ScenarioCase['learning']['topicId'],
    });
    setRecommendedIds(nextIds);
    setSelectedIds(nextIds);
    setActivityUrl(null);
    setCopied(false);
  }

  function createLink(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (unavailable || !effectiveTopicId || selectedIds.length === 0) return;

    const config = createActivityConfigFromCaseIds(
      scenarios,
      {
        durationMinutes,
        locale,
        mode,
        stage,
        topicId: effectiveTopicId as ScenarioCase['learning']['topicId'],
      },
      selectedIds,
    );
    const baseUrl = new URL(activityPath, window.location.href);
    setActivityUrl(buildActivityUrl(baseUrl.toString(), config));
    setCopied(false);
  }

  async function copyLink() {
    if (!activityUrl || !navigator.clipboard) return;
    await navigator.clipboard.writeText(activityUrl);
    setCopied(true);
  }

  return (
    <section
      className={styles.configurator}
      aria-labelledby="teacher-setup-title"
    >
      {unavailable ? (
        <p className={styles.unavailable}>{catalog.teacherSetup.unavailable}</p>
      ) : (
        <form className={styles.form} onSubmit={createLink}>
          <h2 id="teacher-setup-title" className={styles.setupTitle}>
            {catalog.teacherSetup.heading}
          </h2>
          <label>
            <span>{catalog.teacherSetup.stage}</span>
            <select
              value={stage}
              onChange={(event) => {
                const nextStage = event.target.value as LearningStage;
                const nextTopics = [
                  ...new Map(
                    scenarios
                      .filter((scenario) =>
                        scenario.learning.stages.includes(nextStage),
                      )
                      .map((scenario) => [
                        scenario.learning.topicId,
                        scenario.learning.topic,
                      ]),
                  ).entries(),
                ].sort((left, right) =>
                  left[1].localeCompare(right[1], locale),
                );
                const nextTopicId = nextTopics[0]?.[0] ?? '';
                setStage(nextStage);
                setTopicId(nextTopicId);
                resetRecommendation(nextStage, nextTopicId, durationMinutes);
              }}
            >
              {learningStages.map((option) => (
                <option value={option} key={option}>
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
                const nextTopicId = event.target.value;
                setTopicId(nextTopicId);
                resetRecommendation(stage, nextTopicId, durationMinutes);
              }}
            >
              {topics.map((option) => (
                <option value={option.id} key={option.id}>
                  {option.label}
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
                resetRecommendation(stage, effectiveTopicId, nextDuration);
              }}
            >
              {activityDurations.map((minutes) => (
                <option value={minutes} key={minutes}>
                  {interpolate(catalog.teacherSetup.durationOption, {
                    minutes,
                  })}
                </option>
              ))}
            </select>
          </label>

          <fieldset className={styles.modeFieldset}>
            <legend>{catalog.teacherSetup.mode}</legend>
            <label>
              <input
                type="radio"
                name="activity-mode"
                value="self-paced"
                checked={mode === 'self-paced'}
                onChange={() => {
                  setMode('self-paced');
                  setActivityUrl(null);
                  setCopied(false);
                }}
              />
              <GraduationCapIcon aria-hidden="true" weight="duotone" />
              <span>{catalog.teacherSetup.selfPaced}</span>
            </label>
            <label>
              <input
                type="radio"
                name="activity-mode"
                value="projector"
                checked={mode === 'projector'}
                onChange={() => {
                  setMode('projector');
                  setActivityUrl(null);
                  setCopied(false);
                }}
              />
              <UsersThreeIcon aria-hidden="true" weight="duotone" />
              <span>{catalog.teacherSetup.projector}</span>
            </label>
          </fieldset>

          <CasePicker
            catalog={catalog}
            durationMinutes={durationMinutes}
            maximumCases={maximumStaticActivityCases}
            recommendedIds={recommendedIds}
            scenarios={availableScenarios}
            selectedIds={selectedIds}
            onToggle={(caseId) => {
              setSelectedIds((current) =>
                current.includes(caseId)
                  ? current.filter((id) => id !== caseId)
                  : [...current, caseId],
              );
              setActivityUrl(null);
              setCopied(false);
            }}
          />

          <button
            className={styles.createButton}
            type="submit"
            disabled={selectedIds.length === 0}
          >
            <LinkIcon aria-hidden="true" weight="bold" />
            {catalog.teacherSetup.create}
          </button>
        </form>
      )}

      {activityUrl && (
        <aside className={styles.result} aria-live="polite">
          <>
            <CheckCircleIcon aria-hidden="true" weight="fill" />
            <div>
              <h3>{catalog.teacherSetup.ready}</h3>
              <p>
                <ClockIcon aria-hidden="true" />
                {interpolate(catalog.teacherSetup.selectedCount, {
                  count: selectedIds.length,
                })}
              </p>
              <div className={styles.qrBlock}>
                <QRCodeSVG
                  className={styles.qrCode}
                  value={activityUrl}
                  level="M"
                  marginSize={4}
                  size={180}
                  title={catalog.teacherSetup.qrLabel}
                />
                <div>
                  <strong>{catalog.teacherSetup.qrHeading}</strong>
                  <span>{catalog.teacherSetup.qrDescription}</span>
                </div>
              </div>
              <div className={styles.resultActions}>
                <a href={activityUrl}>
                  {catalog.teacherSetup.launch}
                  <ArrowSquareOutIcon aria-hidden="true" />
                </a>
                <button type="button" onClick={copyLink}>
                  <CopyIcon aria-hidden="true" />
                  {copied
                    ? catalog.teacherSetup.copied
                    : catalog.teacherSetup.copy}
                </button>
              </div>
            </div>
          </>
        </aside>
      )}
    </section>
  );
}

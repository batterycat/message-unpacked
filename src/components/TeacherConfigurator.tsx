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
  createActivityConfig,
  type ActivityCaseCandidate,
  type ActivityDuration,
  type ActivityMode,
  type LearningStage,
} from '../domain/activity/config';
import { learningStages } from '../domain/cases/schema';
import type { Locale, MessageCatalog } from '../i18n/catalogs';
import styles from './TeacherConfigurator.module.css';

type TeacherConfiguratorProps = {
  activityPath?: string;
  catalog: MessageCatalog;
  locale: Locale;
  scenarios: ActivityCaseCandidate[];
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
        ...new Set(
          availableScenarios.map((scenario) => scenario.learning.topic),
        ),
      ]
        .filter((topic) => topic.length > 0)
        .sort((left, right) => left.localeCompare(right, locale)),
    [availableScenarios, locale],
  );
  const [topic, setTopic] = useState(topics[0] ?? '');
  const [durationMinutes, setDurationMinutes] = useState<ActivityDuration>(10);
  const [mode, setMode] = useState<ActivityMode>('self-paced');
  const [activityUrl, setActivityUrl] = useState<string | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const unavailable = availableScenarios.length === 0 || topics.length === 0;
  const selectedTopic = topics.includes(topic) ? topic : (topics[0] ?? '');

  function createLink(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (unavailable) return;

    const config = createActivityConfig(availableScenarios, {
      durationMinutes,
      locale,
      mode,
      stage,
      topic: selectedTopic,
    });
    const baseUrl = new URL(activityPath, window.location.href);
    setActivityUrl(buildActivityUrl(baseUrl.toString(), config));
    setSelectedCount(config.caseIds.length);
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
      <div className={styles.intro}>
        <p className={styles.eyebrow}>{catalog.teacherSetup.eyebrow}</p>
        <h2 id="teacher-setup-title">{catalog.teacherSetup.heading}</h2>
        <p>{catalog.teacherSetup.description}</p>
        <div className={styles.privacyNote}>
          <UsersThreeIcon aria-hidden="true" weight="duotone" />
          <span>{catalog.hero.note}</span>
        </div>
      </div>

      {unavailable ? (
        <p className={styles.unavailable}>{catalog.teacherSetup.unavailable}</p>
      ) : (
        <form className={styles.form} onSubmit={createLink}>
          <label>
            <span>{catalog.teacherSetup.stage}</span>
            <select
              value={stage}
              onChange={(event) => {
                setStage(event.target.value as LearningStage);
                setActivityUrl(null);
                setSelectedCount(0);
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
              value={selectedTopic}
              onChange={(event) => setTopic(event.target.value)}
            >
              {topics.map((option) => (
                <option value={option} key={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>{catalog.teacherSetup.duration}</span>
            <select
              value={durationMinutes}
              onChange={(event) =>
                setDurationMinutes(
                  Number(event.target.value) as ActivityDuration,
                )
              }
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

          <fieldset>
            <legend>{catalog.teacherSetup.mode}</legend>
            <label>
              <input
                type="radio"
                name="activity-mode"
                value="self-paced"
                checked={mode === 'self-paced'}
                onChange={() => setMode('self-paced')}
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
                onChange={() => setMode('projector')}
              />
              <UsersThreeIcon aria-hidden="true" weight="duotone" />
              <span>{catalog.teacherSetup.projector}</span>
            </label>
          </fieldset>

          <button className={styles.createButton} type="submit">
            <LinkIcon aria-hidden="true" weight="bold" />
            {catalog.teacherSetup.create}
          </button>
        </form>
      )}

      <aside className={styles.result} aria-live="polite">
        {activityUrl ? (
          <>
            <CheckCircleIcon aria-hidden="true" weight="fill" />
            <div>
              <h3>{catalog.teacherSetup.ready}</h3>
              <p>
                <ClockIcon aria-hidden="true" />
                {interpolate(catalog.teacherSetup.selectedCount, {
                  count: selectedCount,
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
        ) : (
          <>
            <GraduationCapIcon aria-hidden="true" weight="duotone" />
            <p>{catalog.modes.teacherDescription}</p>
          </>
        )}
      </aside>
    </section>
  );
}

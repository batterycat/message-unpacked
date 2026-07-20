import type { ActivityCaseCandidate } from '../../domain/activity/config';
import type { ScenarioCase } from '../../domain/cases/schema';
import type { MessageCatalog } from '../../i18n/catalogs';
import styles from './CasePicker.module.css';

type CasePickerProps = {
  catalog: MessageCatalog;
  durationMinutes: number;
  maximumCases: number;
  onToggle: (caseId: string) => void;
  recommendedIds: readonly string[];
  scenarios: readonly CasePickerScenario[];
  selectedIds: readonly string[];
};

export type CasePickerScenario = ActivityCaseCandidate &
  Pick<ScenarioCase, 'channel' | 'title'>;

function interpolate(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function scenarioChannelLabel(
  catalog: MessageCatalog,
  channel: ScenarioCase['channel'],
): string {
  return catalog.demo[
    channel === 'sms'
      ? 'channelSms'
      : channel === 'chat'
        ? 'channelChat'
        : 'channelEmail'
  ];
}

export function CasePicker({
  catalog,
  durationMinutes,
  maximumCases,
  onToggle,
  recommendedIds,
  scenarios,
  selectedIds,
}: CasePickerProps) {
  const copy = catalog.caseSelection;
  const limitReached = selectedIds.length >= maximumCases;
  const statusId = useId();
  const recommendedScenarios = recommendedIds.flatMap((caseId) => {
    const scenario = scenarios.find(({ id }) => id === caseId);
    return scenario ? [scenario] : [];
  });
  const orderedScenarios = [
    ...recommendedScenarios,
    ...scenarios.filter(({ id }) => !recommendedIds.includes(id)),
  ];

  return (
    <fieldset className={styles.picker} aria-describedby={statusId}>
      <legend>{copy.heading}</legend>
      <div className={styles.introduction}>
        <p>{copy.description}</p>
        <div className={styles.counts} id={statusId} aria-live="polite">
          <strong>
            {interpolate(copy.selectedCount, {
              count: selectedIds.length,
              maximum: maximumCases,
            })}
          </strong>
          <span>
            {interpolate(copy.recommendedCount, {
              count: recommendedIds.length,
              minutes: durationMinutes,
            })}
          </span>
        </div>
      </div>

      <div className={styles.options}>
        {orderedScenarios.map((scenario) => {
          const checked = selectedIds.includes(scenario.id);
          const recommended = recommendedIds.includes(scenario.id);
          return (
            <label key={scenario.id}>
              <input
                type="checkbox"
                checked={checked}
                disabled={!checked && limitReached}
                onChange={() => onToggle(scenario.id)}
              />
              <span>
                <strong>{scenario.title}</strong>
                <small>
                  {scenario.learning.topic}・
                  {scenarioChannelLabel(catalog, scenario.channel)}
                </small>
              </span>
              {recommended && <b>{copy.recommendedBadge}</b>}
            </label>
          );
        })}
      </div>

      {selectedIds.length === 0 && (
        <p className={styles.feedback} data-tone="warning">
          {copy.empty}
        </p>
      )}
      {limitReached && <p className={styles.feedback}>{copy.limitReached}</p>}
    </fieldset>
  );
}
import { useId } from 'react';

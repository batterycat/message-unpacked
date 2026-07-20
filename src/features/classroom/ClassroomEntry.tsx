import {
  ArrowRightIcon,
  BroadcastIcon,
  CheckCircleIcon,
  DeviceMobileIcon,
  PresentationChartIcon,
  ShieldCheckIcon,
  StudentIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';

import type { MessageCatalog } from '../../i18n/catalogs';
import styles from './ClassroomEntry.module.css';

type ClassroomEntryProps = {
  catalog: MessageCatalog;
  hasReviewedCases: boolean;
  hostPath: string;
  isServiceConfigured: boolean;
  joinPath: string;
  switchLocaleHostPath: string;
};

export function ClassroomEntry({
  catalog,
  hasReviewedCases,
  hostPath,
  isServiceConfigured,
  joinPath,
  switchLocaleHostPath,
}: ClassroomEntryProps) {
  const copy = catalog.classroomEntry;
  const canStart = hasReviewedCases && isServiceConfigured;

  return (
    <section className={styles.entry} aria-labelledby="classroom-entry-title">
      <div className={styles.introduction}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h2 id="classroom-entry-title">{copy.heading}</h2>
        <p className={styles.description}>{copy.description}</p>

        <div className={styles.featureGrid}>
          <article>
            <PresentationChartIcon aria-hidden="true" weight="duotone" />
            <h3>{copy.projectorHeading}</h3>
            <p>{copy.projectorDescription}</p>
          </article>
          <article>
            <DeviceMobileIcon aria-hidden="true" weight="duotone" />
            <h3>{copy.clickerHeading}</h3>
            <p>{copy.clickerDescription}</p>
          </article>
          <article>
            <BroadcastIcon aria-hidden="true" weight="duotone" />
            <h3>{copy.revealHeading}</h3>
            <p>{copy.revealDescription}</p>
          </article>
        </div>
      </div>

      <aside className={styles.actionPanel}>
        {!hasReviewedCases ? (
          <>
            <div className={styles.status} data-tone="warning">
              <WarningCircleIcon aria-hidden="true" weight="fill" />
              <div>
                <strong>{copy.localeUnavailableLabel}</strong>
                <p>{copy.localeUnavailableDescription}</p>
              </div>
            </div>
            <a className={styles.primaryAction} href={switchLocaleHostPath}>
              {copy.switchToChinese}
              <ArrowRightIcon aria-hidden="true" weight="bold" />
            </a>
          </>
        ) : (
          <>
            <div
              className={styles.status}
              data-tone={isServiceConfigured ? 'ready' : 'warning'}
            >
              {isServiceConfigured ? (
                <CheckCircleIcon aria-hidden="true" weight="fill" />
              ) : (
                <WarningCircleIcon aria-hidden="true" weight="fill" />
              )}
              <div>
                <strong>
                  {isServiceConfigured
                    ? copy.configuredLabel
                    : copy.unconfiguredLabel}
                </strong>
                <p>
                  {isServiceConfigured
                    ? copy.configuredDescription
                    : copy.unconfiguredDescription}
                </p>
              </div>
            </div>

            <div className={styles.actions}>
              {canStart ? (
                <a className={styles.primaryAction} href={hostPath}>
                  <PresentationChartIcon aria-hidden="true" weight="bold" />
                  {copy.startHosting}
                </a>
              ) : (
                <button className={styles.primaryAction} type="button" disabled>
                  <PresentationChartIcon aria-hidden="true" weight="bold" />
                  {copy.startHosting}
                </button>
              )}
              {canStart && (
                <a className={styles.secondaryAction} href={joinPath}>
                  <StudentIcon aria-hidden="true" weight="bold" />
                  {copy.joinRoom}
                </a>
              )}
            </div>
          </>
        )}

        <div className={styles.notes}>
          <p>
            <ShieldCheckIcon aria-hidden="true" weight="duotone" />
            <span>{copy.privacyNote}</span>
          </p>
          <p>
            <BroadcastIcon aria-hidden="true" weight="duotone" />
            <span>{copy.demoNotice}</span>
          </p>
          {!canStart && hasReviewedCases && (
            <p className={styles.staticFallback}>
              <CheckCircleIcon aria-hidden="true" weight="fill" />
              <span>{copy.staticFallback}</span>
            </p>
          )}
        </div>
      </aside>
    </section>
  );
}

import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircleIcon,
  GraduationCapIcon,
  LinkIcon,
  PresentationChartIcon,
  ShieldCheckIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';

import type { MessageCatalog } from '../../i18n/catalogs';
import styles from './ClassroomEntry.module.css';

type StaticActivityEntryProps = {
  catalog: MessageCatalog;
  hasReviewedCases: boolean;
  setupPath: string;
  switchLocaleSetupPath: string;
};

export function StaticActivityEntry({
  catalog,
  hasReviewedCases,
  setupPath,
  switchLocaleSetupPath,
}: StaticActivityEntryProps) {
  const copy = catalog.staticActivityEntry;

  return (
    <section className={styles.entry} aria-labelledby="static-entry-title">
      <div className={styles.introduction}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h2 id="static-entry-title">{copy.heading}</h2>
        <p className={styles.description}>{copy.description}</p>

        <div className={styles.featureGrid}>
          <article>
            <LinkIcon aria-hidden="true" weight="duotone" />
            <h3>{copy.shareHeading}</h3>
            <p>{copy.shareDescription}</p>
          </article>
          <article>
            <GraduationCapIcon aria-hidden="true" weight="duotone" />
            <h3>{copy.selfPacedHeading}</h3>
            <p>{copy.selfPacedDescription}</p>
          </article>
          <article>
            <PresentationChartIcon aria-hidden="true" weight="duotone" />
            <h3>{copy.projectorHeading}</h3>
            <p>{copy.projectorDescription}</p>
          </article>
        </div>
      </div>

      <aside className={styles.actionPanel}>
        <div
          className={styles.status}
          data-tone={hasReviewedCases ? 'ready' : 'warning'}
        >
          {hasReviewedCases ? (
            <CheckCircleIcon aria-hidden="true" weight="fill" />
          ) : (
            <WarningCircleIcon aria-hidden="true" weight="fill" />
          )}
          <div>
            <strong>
              {hasReviewedCases ? copy.readyLabel : copy.localeUnavailableLabel}
            </strong>
            <p>
              {hasReviewedCases
                ? copy.readyDescription
                : copy.localeUnavailableDescription}
            </p>
          </div>
        </div>

        <a
          className={styles.primaryAction}
          href={hasReviewedCases ? setupPath : switchLocaleSetupPath}
        >
          <BookOpenIcon aria-hidden="true" weight="bold" />
          {hasReviewedCases ? copy.startSetup : copy.switchToChinese}
          <ArrowRightIcon aria-hidden="true" weight="bold" />
        </a>

        <div className={styles.notes}>
          <p>
            <ShieldCheckIcon aria-hidden="true" weight="duotone" />
            <span>{copy.privacyNote}</span>
          </p>
          <p>
            <CheckCircleIcon aria-hidden="true" weight="duotone" />
            <span>{copy.availabilityNote}</span>
          </p>
        </div>
      </aside>
    </section>
  );
}

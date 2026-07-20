import {
  ArrowSquareOutIcon,
  BookOpenTextIcon,
  CalendarBlankIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from '@phosphor-icons/react';

import type { ScenarioCase } from '../../domain/cases/schema';
import type { ResponseResource } from '../../domain/resources/schema';
import type { Locale, MessageCatalog } from '../../i18n/catalogs';
import styles from './ScenarioSupportPanel.module.css';

const impactQualifierKey = {
  reported: 'reported',
  estimated: 'estimated',
  'at-least': 'atLeast',
  'up-to': 'upTo',
  aggregate: 'aggregate',
} as const;

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

type ScenarioSupportPanelProps = {
  catalog: MessageCatalog;
  locale: Locale;
  resources: ResponseResource[];
  scenario: ScenarioCase;
};

export function ScenarioSupportPanel({
  catalog,
  locale,
  resources,
  scenario,
}: ScenarioSupportPanelProps) {
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
  const titleId = `support-title-${scenario.id}`;

  return (
    <aside className={styles.supportPanel} aria-labelledby={titleId}>
      {scenario.impact && (
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
              <dd>{scenario.impact.period ?? catalog.demo.unknownImpact}</dd>
            </div>
            <div>
              <dt>
                <MapPinIcon aria-hidden="true" />
                {catalog.demo.eventLocation}
              </dt>
              <dd>{scenario.impact.location ?? catalog.demo.unknownImpact}</dd>
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
      )}

      <section className={styles.helpIntro}>
        <ShieldCheckIcon aria-hidden="true" weight="duotone" />
        <div>
          <h3 id={titleId}>{catalog.demo.helpTitle}</h3>
          <p>{catalog.demo.helpDescription}</p>
        </div>
      </section>

      <div className={styles.helpResources}>
        {relevantResources.length > 0 ? (
          relevantResources.map((resource) => (
            <section className={styles.helpResource} key={resource.id}>
              <strong>{resource.officialName}</strong>
              <p>{resource.guidance}</p>
              <div className={styles.resourceLinks}>
                {resource.phone && (
                  <span className={styles.resourcePhone}>
                    <PhoneIcon aria-hidden="true" weight="fill" />
                    {resource.phone}
                  </span>
                )}
                {resource.canonicalUrl && (
                  <a
                    href={resource.canonicalUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${catalog.demo.officialSite}：${resource.officialName}`}
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
  );
}

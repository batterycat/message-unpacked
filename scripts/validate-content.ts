import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { parse } from 'yaml';
import type { ZodError } from 'zod';

import {
  caseSchema,
  defaultRecommendedActionIds,
  type ScenarioCase,
} from '../src/domain/cases/schema';
import type { TopicId } from '../src/domain/cases/topics';
import {
  responseResourceSchema,
  type ResponseResourceRegistry,
} from '../src/domain/resources/schema';

async function yamlFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return yamlFiles(entryPath);
      return entry.isFile() && /\.ya?ml$/i.test(entry.name) ? [entryPath] : [];
    }),
  );
  return nestedFiles.flat().sort();
}

function describeZodError(filePath: string, error: ZodError): string {
  return error.issues
    .map((issue) => {
      const field = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      return `${filePath}:${field}: ${issue.message}`;
    })
    .join('\n');
}

async function parseYamlFile(filePath: string): Promise<unknown> {
  const source = await readFile(filePath, 'utf8');
  return parse(source);
}

/**
 * Editorial rules from docs/CONTENT_AUTHORING.md that the schema cannot express.
 * These encode decisions that drifted before: classification thresholds, score
 * bands, the sensitive-content vocabulary, and the trusted-adult flag.
 */
const SCORE_BANDS = new Set([0, 15, 20, 40, 60, 100]);

const SENSITIVE_CONTENT_VOCABULARY = new Set([
  '金錢損失',
  '金融資料',
  '要求對大人保密',
  '人身安全疑慮',
  '恐懼訴求',
  '兒少受詐',
]);

/**
 * Matches guidance that hands the situation *to* an adult, rather than merely
 * mentioning one. "Ask your teacher to confirm the school notice" is a
 * verification channel and must not trip this rule.
 */
const TRUSTED_ADULT_PATTERN =
  /可信任的大人|找大人|問大人|告訴大人|拿給家[人長]|請家[人長]|交給家[人長]|告知家[人長]|家長協助/;

const TARGET_CLASSIFICATION_RATIOS = {
  fraud: 0.6,
  'insufficient-evidence': 0.2,
  trustworthy: 0.2,
} as const;
const CLASSIFICATION_RATIO_TOLERANCE = 0.08;

const RED_FLAG_PATTERNS: Array<[string, RegExp]> = [
  [
    '秘密或驗證碼要求',
    /(?:密碼|驗證碼|OTP|回復碼|恢復碼|點數卡|禮物卡|卡號).{0,20}(?:給|傳|回傳|提供|拍|截圖|輸入|填寫|交)/i,
  ],
  [
    '要求對大人保密',
    /(?:不能|不要|別|不可以|不可).{0,8}(?:告訴|告知).{0,8}(?:大人|家長|媽媽|爸爸|老師)/,
  ],
  [
    '阻止使用官方管道',
    /(?:不要|別|不可).{0,8}(?:回到|使用|聯絡).{0,12}(?:平台|官方|客服)/,
  ],
  ['遠端控制或螢幕分享', /(?:安裝|下載).{0,15}遠端|遠端工具|螢幕分享|共享螢幕/],
  [
    '可疑連結索取金融資料',
    /https?:\/\/\S+.{0,40}(?:網銀|銀行帳號|信用卡|卡號)|(?:網銀|銀行帳號|信用卡|卡號).{0,40}https?:\/\//,
  ],
];

const LEGAL_CONTENT_PATTERN =
  /法律|少年|刑事|洗錢|幫助詐欺|警示帳戶|報案|受理案件|證據|契約|勞動/;

function redFlagsForScenario(scenario: ScenarioCase): string[] {
  const messageText = scenario.messages
    .map((message) => message.body)
    .join(' ');
  const flags = RED_FLAG_PATTERNS.flatMap(([label, pattern]) =>
    pattern.test(messageText) ? [label] : [],
  );
  const hasGuarantee = /保證|一定|抽中|錄取|獲利|體驗金/.test(messageText);
  const hasPaymentRequest =
    /支付|付款|匯款|轉帳(?!號)|轉到|轉入|轉出|保證金|入金|費用|押金/.test(
      messageText,
    );
  if (hasGuarantee && hasPaymentRequest) flags.push('保證或獎勵搭配先付款');
  return flags;
}

function checkEditorialRules(scenario: ScenarioCase, errors: string[]): void {
  if (
    JSON.stringify(scenario.recommendedActionIds) !==
    JSON.stringify(defaultRecommendedActionIds)
  ) {
    errors.push(
      `${scenario.id}: recommendedActionIds must remain [${defaultRecommendedActionIds.join(', ')}]`,
    );
  }

  for (const choice of scenario.choices) {
    if (!SCORE_BANDS.has(choice.score)) {
      errors.push(
        `${scenario.id}: choice ${choice.id} scores ${choice.score}, which is not one of the bands ${[...SCORE_BANDS].join('/')}`,
      );
    }
  }

  const topChoice = scenario.choices.reduce((best, choice) =>
    choice.score > best.score ? choice : best,
  );
  if (topChoice.score !== 100) {
    errors.push(`${scenario.id}: no choice scores 100`);
  }
  if (topChoice.classification !== scenario.classification) {
    errors.push(
      `${scenario.id}: case is ${scenario.classification} but its highest-scoring choice is ${topChoice.classification}`,
    );
  }

  const redFlags = redFlagsForScenario(scenario);
  if (redFlags.length > 0 && scenario.classification !== 'fraud') {
    errors.push(
      `${scenario.id}: red flags (${redFlags.join('、')}) require classification fraud`,
    );
  }

  // The vocabulary and the trusted-adult wording are zh-TW specific.
  if (scenario.locale !== 'zh-TW') return;

  for (const tag of scenario.learning.sensitiveContent) {
    if (!SENSITIVE_CONTENT_VOCABULARY.has(tag)) {
      errors.push(
        `${scenario.id}: sensitiveContent "${tag}" is outside the controlled vocabulary`,
      );
    }
  }

  if (
    scenario.learning.sensitiveContent.includes('要求對大人保密') &&
    !scenario.learning.trustedAdultRecommended
  ) {
    errors.push(
      `${scenario.id}: secrecy from adults requires trustedAdultRecommended true`,
    );
  }

  const guidance = [
    scenario.debrief.explanation,
    ...scenario.debrief.safeActions,
  ].join(' ');
  if (
    !scenario.learning.trustedAdultRecommended &&
    TRUSTED_ADULT_PATTERN.test(guidance)
  ) {
    errors.push(
      `${scenario.id}: debrief directs the reader to a trusted adult but trustedAdultRecommended is false`,
    );
  }

  if (
    scenario.learning.dimensions.includes('law') &&
    !LEGAL_CONTENT_PATTERN.test(guidance)
  ) {
    errors.push(
      `${scenario.id}: law dimension requires legal, procedural, or employment content in debrief`,
    );
  }
}

function checkPublishedCoverage(cases: ScenarioCase[], errors: string[]): void {
  const published = cases.filter(
    (scenario) =>
      scenario.status === 'published' && scenario.locale === 'zh-TW',
  );
  if (published.length === 0) return;

  const classificationCounts = Object.fromEntries(
    Object.keys(TARGET_CLASSIFICATION_RATIOS).map((classification) => [
      classification,
      published.filter((scenario) => scenario.classification === classification)
        .length,
    ]),
  ) as Record<keyof typeof TARGET_CLASSIFICATION_RATIOS, number>;
  for (const [classification, target] of Object.entries(
    TARGET_CLASSIFICATION_RATIOS,
  ) as Array<[keyof typeof TARGET_CLASSIFICATION_RATIOS, number]>) {
    const actual = classificationCounts[classification] / published.length;
    if (Math.abs(actual - target) > CLASSIFICATION_RATIO_TOLERANCE) {
      errors.push(
        `zh-TW published classification ratio for ${classification} is ${(actual * 100).toFixed(1)}%; expected about ${(target * 100).toFixed(0)}% ± ${CLASSIFICATION_RATIO_TOLERANCE * 100}%`,
      );
    }
  }

  const topics = new Map<TopicId, ScenarioCase[]>();
  for (const scenario of published) {
    const current = topics.get(scenario.learning.topicId) ?? [];
    current.push(scenario);
    topics.set(scenario.learning.topicId, current);
  }
  for (const [topicId, topicCases] of topics) {
    if (
      !topicCases.some((scenario) => scenario.classification === 'trustworthy')
    ) {
      errors.push(
        `zh-TW topic ${topicId} must include at least one trustworthy case`,
      );
    }
  }
}

async function main() {
  const projectRoot = process.cwd();
  const resourceDirectory = path.join(projectRoot, 'content', 'resources');
  const caseDirectory = path.join(projectRoot, 'content', 'cases');

  const registries = new Map<string, ResponseResourceRegistry>();
  const errors: string[] = [];

  for (const filePath of await yamlFiles(resourceDirectory)) {
    const result = responseResourceSchema.safeParse(
      await parseYamlFile(filePath),
    );
    if (!result.success) {
      errors.push(
        describeZodError(path.relative(projectRoot, filePath), result.error),
      );
      continue;
    }
    if (registries.has(result.data.locale)) {
      errors.push(
        `${path.relative(projectRoot, filePath)}: duplicate locale registry`,
      );
    }
    const resourceIds = result.data.resources.map((resource) => resource.id);
    if (new Set(resourceIds).size !== resourceIds.length) {
      errors.push(
        `${path.relative(projectRoot, filePath)}: duplicate response resource ID`,
      );
    }
    registries.set(result.data.locale, result.data);
  }

  const referenceRegistry = [...registries.values()][0];
  if (referenceRegistry) {
    const referenceIds = referenceRegistry.resources
      .map((resource) => resource.id)
      .sort()
      .join('|');
    for (const registry of registries.values()) {
      const localizedIds = registry.resources
        .map((resource) => resource.id)
        .sort()
        .join('|');
      if (localizedIds !== referenceIds) {
        errors.push(
          `content/resources/${registry.locale}.yaml: response-resource IDs do not match other locales`,
        );
      }
    }
  }

  const cases: ScenarioCase[] = [];
  const caseIds = new Set<string>();
  const localizedTranslationGroups = new Set<string>();
  for (const filePath of await yamlFiles(caseDirectory)) {
    const result = caseSchema.safeParse(await parseYamlFile(filePath));
    if (!result.success) {
      errors.push(
        describeZodError(path.relative(projectRoot, filePath), result.error),
      );
      continue;
    }
    if (caseIds.has(result.data.id)) {
      errors.push(
        `${path.relative(projectRoot, filePath)}: duplicate case ID ${result.data.id}`,
      );
    }
    caseIds.add(result.data.id);
    const localizedGroup = `${result.data.translationGroupId}:${result.data.locale}`;
    if (localizedTranslationGroups.has(localizedGroup)) {
      errors.push(
        `${path.relative(projectRoot, filePath)}: duplicate translation group for ${result.data.locale}`,
      );
    }
    localizedTranslationGroups.add(localizedGroup);
    checkEditorialRules(result.data, errors);
    cases.push(result.data);
  }

  checkPublishedCoverage(cases, errors);

  for (const scenario of cases) {
    const registry = registries.get(scenario.locale);
    if (!registry) {
      errors.push(
        `${scenario.id}: missing response-resource registry for ${scenario.locale}`,
      );
      continue;
    }
    const availableActionIds = new Set(
      registry.resources.map((resource) => resource.id),
    );
    for (const actionId of scenario.recommendedActionIds) {
      if (!availableActionIds.has(actionId)) {
        errors.push(
          `${scenario.id}: recommended action ${actionId} is missing from ${scenario.locale}`,
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Content validation failed:\n${errors.join('\n')}`);
  }

  const published = cases.filter((scenario) => scenario.status === 'published');
  const languageCounts = Object.fromEntries(
    [...registries.keys()].map((locale) => [
      locale,
      published.filter((scenario) => scenario.locale === locale).length,
    ]),
  );
  console.log(
    `Validated ${cases.length} case files and ${registries.size} resource registries.`,
  );
  console.log(`Published case coverage: ${JSON.stringify(languageCounts)}`);
  reportCellCoverage(published);
}

/**
 * Reports how far each topic-stage cell is from the target in
 * docs/CONTENT_AUTHORING.md (2 fraud, 1 insufficient-evidence, 1 trustworthy).
 *
 * Informational, not an error: stages are filled deliberately rather than all
 * at once, and a half-filled cell is a plan, not a defect. It prints so that
 * gaps stay visible instead of being discovered by a teacher mid-lesson.
 */
function reportCellCoverage(published: ScenarioCase[]): void {
  const TARGET = { fraud: 2, 'insufficient-evidence': 1, trustworthy: 1 };

  const started = new Map<string, ScenarioCase[]>();
  for (const scenario of published) {
    for (const stage of scenario.learning.stages) {
      const key = `${scenario.locale} ${scenario.learning.topicId} ${stage}`;
      started.set(key, [...(started.get(key) ?? []), scenario]);
    }
  }

  const incomplete: string[] = [];
  for (const [key, group] of [...started].sort()) {
    const missing = Object.entries(TARGET)
      .map(([classification, want]) => {
        const have = group.filter(
          (s) => s.classification === classification,
        ).length;
        return have < want ? `${want - have} ${classification}` : null;
      })
      .filter((entry): entry is string => entry !== null);
    if (missing.length > 0)
      incomplete.push(`  ${key}: needs ${missing.join(', ')}`);
  }

  if (incomplete.length === 0) {
    console.log(`Cell coverage: all ${started.size} started cells complete.`);
    return;
  }
  console.log(
    `Cell coverage: ${started.size - incomplete.length}/${started.size} started cells complete.`,
  );
  for (const line of incomplete) console.log(line);
}

await main();

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { parse } from 'yaml';
import type { ZodError } from 'zod';

import { caseSchema, type ScenarioCase } from '../src/domain/cases/schema';
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
    cases.push(result.data);
  }

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
}

await main();

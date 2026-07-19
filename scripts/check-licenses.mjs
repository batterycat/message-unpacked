import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const reviewedLicenseIds = new Set([
  '0BSD',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'CC-BY-3.0',
  'CC-BY-4.0',
  'CC0-1.0',
  'ISC',
  'LGPL-3.0-or-later',
  'MIT',
  'MIT-0',
  'MPL-2.0',
  'Python-2.0',
  'BlueOak-1.0.0',
  'Unlicense',
]);

function licenseText(value) {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object' && typeof value.type === 'string') {
    return value.type.trim();
  }
  return '';
}

function identifiers(expression) {
  const operators = new Set(['AND', 'OR', 'WITH']);
  return (expression.match(/[A-Za-z0-9][A-Za-z0-9.-]*/g) ?? []).filter(
    (token) => !operators.has(token),
  );
}

async function packageDirectories(nodeModulesDirectory) {
  const entries = await readdir(nodeModulesDirectory, { withFileTypes: true });
  const directories = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const entryPath = path.join(nodeModulesDirectory, entry.name);
    if (!entry.name.startsWith('@')) {
      directories.push(entryPath);
      continue;
    }
    const scopedEntries = await readdir(entryPath, { withFileTypes: true });
    directories.push(
      ...scopedEntries
        .filter((scopedEntry) => scopedEntry.isDirectory())
        .map((scopedEntry) => path.join(entryPath, scopedEntry.name)),
    );
  }
  return directories;
}

async function inventory() {
  const virtualStore = path.join(process.cwd(), 'node_modules', '.pnpm');
  const storeEntries = await readdir(virtualStore, { withFileTypes: true });
  const packages = new Map();

  for (const entry of storeEntries) {
    if (!entry.isDirectory()) continue;
    const nodeModulesDirectory = path.join(
      virtualStore,
      entry.name,
      'node_modules',
    );
    let directories;
    try {
      directories = await packageDirectories(nodeModulesDirectory);
    } catch (error) {
      if (error && error.code === 'ENOENT') continue;
      throw error;
    }

    for (const directory of directories) {
      try {
        const manifest = JSON.parse(
          await readFile(path.join(directory, 'package.json'), 'utf8'),
        );
        if (!manifest.name || !manifest.version) continue;
        const key = `${manifest.name}@${manifest.version}`;
        packages.set(key, {
          name: manifest.name,
          version: manifest.version,
          license: licenseText(manifest.license ?? manifest.licenses),
        });
      } catch (error) {
        if (error && error.code === 'ENOENT') continue;
        throw error;
      }
    }
  }

  return [...packages.values()].sort((left, right) =>
    `${left.name}@${left.version}`.localeCompare(
      `${right.name}@${right.version}`,
    ),
  );
}

const packages = await inventory();
const findings = packages.filter((dependency) => {
  const ids = identifiers(dependency.license);
  return ids.length === 0 || ids.some((id) => !reviewedLicenseIds.has(id));
});
const counts = Object.groupBy(
  packages,
  (dependency) => dependency.license || 'UNKNOWN',
);

console.log(`Reviewed ${packages.length} installed package versions.`);
for (const [license, members] of Object.entries(counts).sort()) {
  console.log(`${license}: ${members.length}`);
}

if (findings.length > 0) {
  console.error('\nUnreviewed or unknown license expressions:');
  for (const finding of findings) {
    console.error(
      `- ${finding.name}@${finding.version}: ${finding.license || 'UNKNOWN'}`,
    );
  }
  if (process.argv.includes('--check')) process.exitCode = 1;
}

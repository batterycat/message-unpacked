import { readFile, readdir } from 'node:fs/promises';
import { relative, sep } from 'node:path';

const distDirectory = new URL('../dist/', import.meta.url);
const expectedBase = normalizeBase(process.argv[2] ?? '/');

function normalizeBase(value) {
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash.endsWith('/')
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

async function findHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = new URL(entry.name, directory);
      if (entry.isDirectory())
        return findHtmlFiles(new URL(`${entry.name}/`, directory));
      return entry.isFile() && entry.name.endsWith('.html') ? [path] : [];
    }),
  );
  return files.flat();
}

const htmlFiles = await findHtmlFiles(distDirectory);
const violations = [];
const attributePattern = /(?:href|src|component-url|renderer-url)="([^"]+)"/g;
const refreshPattern = /http-equiv="refresh" content="\d+;url=([^"]+)"/g;

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const displayPath = relative(distDirectory.pathname, file.pathname)
    .split(sep)
    .join('/');

  for (const match of html.matchAll(attributePattern)) {
    const value = match[1];
    if (
      value.startsWith('/') &&
      !value.startsWith('//') &&
      !value.startsWith(expectedBase)
    ) {
      violations.push(`${displayPath}: ${value}`);
    }
  }

  for (const match of html.matchAll(refreshPattern)) {
    const value = match[1];
    if (value.startsWith('/') && !value.startsWith(expectedBase)) {
      violations.push(`${displayPath}: redirect ${value}`);
    }
  }

  if (html.includes('http://localhost')) {
    violations.push(`${displayPath}: contains a localhost public URL`);
  }
}

if (htmlFiles.length !== 7) {
  violations.push(`Expected 7 static HTML pages, found ${htmlFiles.length}.`);
}

if (violations.length > 0) {
  throw new Error(
    `Static build is not compatible with base path ${expectedBase}:\n${violations.join('\n')}`,
  );
}

console.log(
  `Verified ${htmlFiles.length} static HTML pages under base path ${expectedBase}.`,
);

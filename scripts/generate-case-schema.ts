import { readFile, writeFile } from 'node:fs/promises';

import { z } from 'zod';

import { caseSchema } from '../src/domain/cases/schema';

const outputUrl = new URL('../content/case.schema.json', import.meta.url);
const checkOnly = process.argv.includes('--check');
const zodSchema = z.toJSONSchema(caseSchema, { target: 'draft-2020-12' });
const schemaDocument = {
  ...zodSchema,
  $id: 'urn:message-unpacked:schema:case:1',
  title: 'Message, Unpacked. case',
  description:
    'Authoring schema for a version 1 Message, Unpacked. teaching case.',
};
const serialized = `${JSON.stringify(schemaDocument, null, 2)}\n`;

if (checkOnly) {
  const current = await readFile(outputUrl, 'utf8').catch(() => '');
  if (current !== serialized) {
    throw new Error(
      'content/case.schema.json is out of date. Run pnpm schema:generate.',
    );
  }
  console.log('Case JSON Schema is up to date.');
} else {
  await writeFile(outputUrl, serialized);
  console.log('Generated content/case.schema.json.');
}

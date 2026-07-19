import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parse } from 'yaml';

import type { Locale } from '../../i18n/catalogs';
import {
  responseResourceSchema,
  type ResponseResourceRegistry,
} from './schema';

export async function loadResponseRegistry(
  locale: Locale,
  rootDirectory = process.cwd(),
): Promise<ResponseResourceRegistry> {
  const filePath = path.join(
    rootDirectory,
    'content',
    'resources',
    `${locale}.yaml`,
  );
  const source = await readFile(filePath, 'utf8');
  return responseResourceSchema.parse(parse(source));
}

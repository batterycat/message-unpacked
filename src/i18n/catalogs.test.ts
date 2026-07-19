import { describe, expect, it } from 'vitest';

import { catalogs, locales } from './catalogs';

function leafPaths(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof entry === 'string'
      ? [path]
      : leafPaths(entry as object, path);
  });
}

describe('interface catalogs', () => {
  it('provides the same complete key set for every supported locale', () => {
    const reference = leafPaths(catalogs['zh-TW']);
    for (const locale of locales) {
      expect(leafPaths(catalogs[locale])).toEqual(reference);
    }
  });

  it('does not publish Chinese case copy as an English placeholder', () => {
    expect(catalogs.en.demo.emptyDescription).toContain('Traditional Chinese');
  });
});
